import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { availabilityCacheService } from '@/lib/cache/redis-cache.service'
import {
  buildOverlapWhereClause,
  buildRoomTypeOverlapWhere,
  buildBlockedDateOverlapWhere,
  normalizeDates,
} from './rent-overlap.utils'
import { BookingConflictError } from '@/lib/errors/booking.errors'
import { logger } from '@/lib/logger'

// ============================================
// PER-ROOM-TYPE AVAILABILITY (hotel multi-room)
// ============================================

/**
 * Availability of a single room type for a requested period.
 *
 * `availableQuantity = blockedRanges.length ? 0 : max(totalQuantity - bookedQuantity, 0)`.
 * A single overlapping {@link RoomTypeBlockedDate} makes the whole type unavailable.
 */
export interface RoomTypeAvailability {
  roomTypeId: string
  totalQuantity: number
  /** Sum of overlapping `RentRoomType.quantity` (RESERVED + WAITING). */
  bookedQuantity: number
  availableQuantity: number
  /** True iff `availableQuantity >= requestedQuantity`. */
  available: boolean
  /** Blocked ranges overlapping the requested period (non-empty ⇒ type closed). */
  blockedRanges: Array<{ startDate: Date; endDate: Date }>
}

/** A requested room type + quantity, used for multi-type selections and the guard. */
export interface RequestedRoomTypeLine {
  roomTypeId: string
  quantity: number
}

export interface RoomTypesAvailabilityResult {
  available: boolean
  message?: string
  perType: RoomTypeAvailability[]
}

/**
 * Minimal Prisma surface needed to resolve per-type availability. Both the
 * top-level `prisma` client and a `$transaction` client satisfy this, so the
 * exact same availability math runs standalone AND inside the booking guard.
 */
type AvailabilityDbClient = Pick<
  Prisma.TransactionClient,
  'roomType' | 'rentRoomType' | 'roomTypeBlockedDate'
>

const BLOCKED_MESSAGE = 'Cette chambre est bloquée sur cette période'
const NO_ROOM_MESSAGE = 'Aucune chambre disponible pour cette période'

/**
 * Shared availability resolver. Runs the per-type quantity math against any
 * Prisma client (standalone or transactional) so the guard and the read paths
 * stay byte-for-byte consistent.
 *
 * @param {AvailabilityDbClient} db - Prisma client or transaction client
 * @param {string} roomTypeId - Room type identifier
 * @param {Date} arrivalDate - Requested arrival date
 * @param {Date} leavingDate - Requested leaving date
 * @param {number} [requestedQuantity=1] - Rooms requested of this type
 * @returns {Promise<RoomTypeAvailability>} Per-type availability
 */
async function resolveRoomTypeAvailability(
  db: AvailabilityDbClient,
  roomTypeId: string,
  arrivalDate: Date,
  leavingDate: Date,
  requestedQuantity = 1
): Promise<RoomTypeAvailability> {
  const { normalizedArrival, normalizedLeaving, dayAfterArrival } = normalizeDates(
    arrivalDate,
    leavingDate
  )

  const roomType = await db.roomType.findUnique({
    where: { id: roomTypeId },
    select: { quantity: true },
  })

  if (!roomType) {
    return {
      roomTypeId,
      totalQuantity: 0,
      bookedQuantity: 0,
      availableQuantity: 0,
      available: false,
      blockedRanges: [],
    }
  }

  const [bookedAgg, blocked] = await Promise.all([
    db.rentRoomType.aggregate({
      _sum: { quantity: true },
      where: buildRoomTypeOverlapWhere(
        roomTypeId,
        normalizedArrival,
        normalizedLeaving,
        dayAfterArrival
      ),
    }),
    db.roomTypeBlockedDate.findMany({
      where: buildBlockedDateOverlapWhere(roomTypeId, normalizedArrival, normalizedLeaving),
      select: { startDate: true, endDate: true },
    }),
  ])

  const bookedQuantity = bookedAgg._sum.quantity ?? 0
  const blockedRanges = blocked.map(b => ({ startDate: b.startDate, endDate: b.endDate }))
  const isBlocked = blockedRanges.length > 0
  const availableQuantity = isBlocked ? 0 : Math.max(roomType.quantity - bookedQuantity, 0)

  return {
    roomTypeId,
    totalQuantity: roomType.quantity,
    bookedQuantity,
    availableQuantity,
    available: availableQuantity >= requestedQuantity,
    blockedRanges,
  }
}

/**
 * Availability of ONE room type for a date range and requested quantity.
 * Canonical signature consumed by the guest booking flow (Lot 4).
 *
 * @param {string} roomTypeId - Room type identifier
 * @param {Date} arrival - Requested arrival date
 * @param {Date} leaving - Requested leaving date
 * @param {number} [requestedQuantity=1] - Rooms requested of this type
 * @returns {Promise<{ available: boolean; availableQuantity: number; message?: string }>}
 */
export async function checkRoomTypeAvailable(
  roomTypeId: string,
  arrival: Date,
  leaving: Date,
  requestedQuantity = 1
): Promise<{ available: boolean; availableQuantity: number; message?: string }> {
  const result = await resolveRoomTypeAvailability(
    prisma,
    roomTypeId,
    arrival,
    leaving,
    requestedQuantity
  )

  return {
    available: result.available,
    availableQuantity: result.availableQuantity,
    message: result.available
      ? undefined
      : result.blockedRanges.length > 0
        ? BLOCKED_MESSAGE
        : NO_ROOM_MESSAGE,
  }
}

/**
 * Availability of ALL room types of a hotel product (guest detail page).
 * When either bound is null (no dates selected yet) each type is reported as
 * fully available since no overlap math is possible.
 *
 * @param {string} productId - Product (establishment) identifier
 * @param {Date | null} arrival - Requested arrival date, or null if not chosen
 * @param {Date | null} leaving - Requested leaving date, or null if not chosen
 * @returns {Promise<RoomTypeAvailability[]>} Per-type availability
 */
export async function getHotelRoomTypeAvailability(
  productId: string,
  arrival: Date | null,
  leaving: Date | null
): Promise<RoomTypeAvailability[]> {
  const types = await prisma.roomType.findMany({
    where: { productId },
    select: { id: true, quantity: true },
    orderBy: { position: 'asc' },
  })

  if (!arrival || !leaving) {
    return types.map(t => ({
      roomTypeId: t.id,
      totalQuantity: t.quantity,
      bookedQuantity: 0,
      availableQuantity: t.quantity,
      available: t.quantity > 0,
      blockedRanges: [],
    }))
  }

  return Promise.all(
    types.map(t => resolveRoomTypeAvailability(prisma, t.id, arrival, leaving, 1))
  )
}

/**
 * Validate a multi-type selection against a given client (standalone or tx).
 * Available iff EVERY line is satisfiable.
 *
 * @param {AvailabilityDbClient} db - Prisma client or transaction client
 * @param {RequestedRoomTypeLine[]} lines - Requested room types + quantities
 * @param {Date} arrival - Requested arrival date
 * @param {Date} leaving - Requested leaving date
 * @returns {Promise<RoomTypesAvailabilityResult>}
 */
async function resolveRoomTypesAvailability(
  db: AvailabilityDbClient,
  lines: RequestedRoomTypeLine[],
  arrival: Date,
  leaving: Date
): Promise<RoomTypesAvailabilityResult> {
  const perType: RoomTypeAvailability[] = []
  for (const line of lines) {
    perType.push(
      await resolveRoomTypeAvailability(db, line.roomTypeId, arrival, leaving, line.quantity)
    )
  }

  const failing = perType.find(t => !t.available)
  if (!failing) {
    return { available: true, perType }
  }

  return {
    available: false,
    message: failing.blockedRanges.length > 0 ? BLOCKED_MESSAGE : NO_ROOM_MESSAGE,
    perType,
  }
}

/**
 * Definitive in-transaction guard (overbooking-critical, TRI-125). Counts
 * `RentRoomType.quantity` per `roomTypeId` inside the caller's Serializable
 * transaction and throws {@link BookingConflictError} if any line cannot be
 * satisfied. Canonical signature consumed by the booking flow (Lot 4).
 *
 * @param {Prisma.TransactionClient} tx - Active transaction client
 * @param {RequestedRoomTypeLine[]} lines - Requested room types + quantities
 * @param {Date} arrival - Requested arrival date
 * @param {Date} leaving - Requested leaving date
 * @returns {Promise<void>} Resolves if every line fits; throws otherwise
 * @throws {BookingConflictError} When any requested line is over capacity or blocked
 */
export async function assertRoomTypesAvailableInTx(
  tx: Prisma.TransactionClient,
  lines: RequestedRoomTypeLine[],
  arrival: Date,
  leaving: Date
): Promise<void> {
  const { available, perType } = await resolveRoomTypesAvailability(tx, lines, arrival, leaving)

  if (!available) {
    const blocked = perType.find(t => !t.available)
    throw new BookingConflictError(
      blocked && blocked.blockedRanges.length > 0 ? BLOCKED_MESSAGE : NO_ROOM_MESSAGE
    )
  }
}

// ============================================
// ESTABLISHMENT-LEVEL AVAILABILITY
// ============================================

/**
 * Check product availability between two dates.
 * Both RESERVED and WAITING bookings block availability to prevent overbooking.
 * Results are cached in Redis with a 5-minute TTL for performance.
 *
 * Hotel products with configured room types delegate to per-type availability
 * (available iff ANY room type has free capacity). Non-hotel products keep the
 * unchanged single-unit / legacy multi-room behavior.
 *
 * @param {string} productId - Product identifier
 * @param {Date} arrivalDate - Booking start date
 * @param {Date} leavingDate - Booking end date
 * @returns {Promise<{ available: boolean; message?: string }>} Availability check result
 */
export async function checkRentIsAvailable(
  productId: string,
  arrivalDate: Date,
  leavingDate: Date
): Promise<{ available: boolean; message?: string }> {
  try {
    const { normalizedArrival, normalizedLeaving, dayAfterArrival } = normalizeDates(
      arrivalDate,
      leavingDate
    )

    logger.info(
      {
        productId,
        arrivalDate: normalizedArrival.toISOString().split('T')[0],
        leavingDate: normalizedLeaving.toISOString().split('T')[0],
      },
      'Checking rent availability'
    )

    // Check cache first for performance (90% faster)
    const cachedAvailability = await availabilityCacheService.getCachedAvailability(
      productId,
      normalizedArrival,
      normalizedLeaving
    )

    if (cachedAvailability) {
      logger.debug({ productId, cachedAvailability }, 'Cache hit for availability check')
      return {
        available: cachedAvailability.isAvailable,
        message: cachedAvailability.isAvailable
          ? undefined
          : 'Property not available for selected dates',
      }
    }

    logger.debug({ productId }, 'Cache miss, checking database')

    // Determine whether this product is a hotel with configured room types.
    const productInfo = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        availableRooms: true,
        type: { select: { isHotelType: true } },
        roomTypes: { select: { id: true } },
      },
    })

    const isHotel =
      Boolean(productInfo?.type?.isHotelType) && (productInfo?.roomTypes?.length ?? 0) > 0

    if (isHotel) {
      // Hotel per-type mode: available iff ANY room type has free capacity.
      const perType = await getHotelRoomTypeAvailability(
        productId,
        normalizedArrival,
        normalizedLeaving
      )
      const anyAvailable = perType.some(t => t.available)

      try {
        await availabilityCacheService.cacheAvailability(
          productId,
          normalizedArrival,
          normalizedLeaving,
          anyAvailable,
          {
            hotelRoomTypes: true,
            perType: perType.map(t => ({
              roomTypeId: t.roomTypeId,
              availableQuantity: t.availableQuantity,
            })),
          }
        )
      } catch (cacheError) {
        logger.warn(
          { productId, error: cacheError },
          'Failed to cache hotel room-type availability'
        )
      }

      if (!anyAvailable) {
        return {
          available: false,
          message: NO_ROOM_MESSAGE,
        }
      }
    } else {
      const overlapWhere = buildOverlapWhereClause(
        productId,
        normalizedArrival,
        normalizedLeaving,
        dayAfterArrival
      )

      // Legacy multi-room mode: count concurrent bookings vs available rooms.
      if (productInfo?.availableRooms && productInfo.availableRooms > 1) {
        const existingRents = await prisma.rent.findMany({
          where: overlapWhere,
        })

        const bookedRooms = existingRents.length
        const availableRooms = productInfo.availableRooms - bookedRooms
        const isHotelAvailable = availableRooms > 0

        try {
          await availabilityCacheService.cacheAvailability(
            productId,
            normalizedArrival,
            normalizedLeaving,
            isHotelAvailable,
            {
              hotelRooms: true,
              totalRooms: productInfo.availableRooms,
              bookedRooms,
              availableRooms,
            }
          )
        } catch (cacheError) {
          logger.warn({ productId, error: cacheError }, 'Failed to cache hotel availability')
        }

        if (availableRooms <= 0) {
          return {
            available: false,
            message: 'Aucune chambre disponible pour cette période',
          }
        }
      } else {
        // Single unit mode: any overlap blocks
        const existingRent = await prisma.rent.findFirst({
          where: overlapWhere,
        })

        const isSingleUnitAvailable = !existingRent

        try {
          await availabilityCacheService.cacheAvailability(
            productId,
            normalizedArrival,
            normalizedLeaving,
            isSingleUnitAvailable,
            {
              singleUnit: true,
              hasConflictingRent: !!existingRent,
            }
          )
        } catch (cacheError) {
          logger.warn(
            { productId, error: cacheError },
            'Failed to cache single unit availability'
          )
        }

        if (existingRent) {
          return {
            available: false,
            message: 'Il existe déjà une réservation sur cette période',
          }
        }
      }
    }

    // Check unavailability blocks
    const existingUnavailable = await prisma.unAvailableProduct.findFirst({
      where: {
        productId,
        OR: [
          {
            startDate: {
              gte: normalizedArrival,
              lt: normalizedLeaving,
            },
          },
          {
            endDate: {
              gt: normalizedArrival,
              lt: normalizedLeaving,
            },
          },
          {
            startDate: { lt: normalizedArrival },
            endDate: { gt: normalizedLeaving },
          },
        ],
      },
    })

    const isAvailable = !existingUnavailable
    const result = isAvailable
      ? { available: true }
      : {
          available: false,
          message: 'Le produit est indisponible sur cette période',
        }

    logger.info({ productId, isAvailable }, 'Availability check complete')

    // Cache the result
    try {
      await availabilityCacheService.cacheAvailability(
        productId,
        normalizedArrival,
        normalizedLeaving,
        isAvailable,
        {
          checkedAt: Date.now(),
          hasUnavailableBlock: !!existingUnavailable,
        }
      )
    } catch (cacheError) {
      logger.warn({ productId, error: cacheError }, 'Failed to cache availability result')
    }

    return result
  } catch (error) {
    // Re-throw unexpected errors (DB outage, Prisma failures) so callers can
    // distinguish infrastructure failures from genuine "unavailable" results.
    logger.error({ productId, error }, 'Unexpected error checking rent availability')
    throw error
  }
}
