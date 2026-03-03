import prisma from '@/lib/prisma'
import { availabilityCacheService } from '@/lib/cache/redis-cache.service'
import { buildOverlapWhereClause, normalizeDates } from './rent-overlap.utils'
import { logger } from '@/lib/logger'

/**
 * Check product availability between two dates.
 * Both RESERVED and WAITING bookings block availability to prevent overbooking.
 * Results are cached in Redis with a 5-minute TTL for performance.
 *
 * Implements hotel night semantics: checkout day is considered free.
 * For multi-room products (hotels), counts concurrent bookings against available rooms.
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

    // Check if this is a hotel with multiple rooms
    const productInfo = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        availableRooms: true,
        hotel: {
          select: { id: true },
        },
      },
    })

    const overlapWhere = buildOverlapWhereClause(
      productId,
      normalizedArrival,
      normalizedLeaving,
      dayAfterArrival
    )

    // Hotel mode: count concurrent bookings vs available rooms
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
        logger.warn({ productId, error: cacheError }, 'Failed to cache single unit availability')
      }

      if (existingRent) {
        return {
          available: false,
          message: 'Il existe déjà une réservation sur cette période',
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
