import { RentStatus, Prisma } from '@prisma/client'

/**
 * Reservation statuses that occupy inventory and therefore block a concurrent
 * booking of the same room/unit (overbooking-critical, TRI-1002 / TRI-125):
 *
 * - `WAITING`  — pending host approval, still holds the slot.
 * - `RESERVED` — confirmed upcoming stay.
 * - `CHECKIN`  — guest is physically in the room right now.
 *
 * `CHECKOUT` is intentionally excluded: the guest has departed, so the room is
 * free (an early checkout releases it immediately, and a completed stay lies in
 * the past and cannot overlap a future request). `CANCEL` never blocks.
 *
 * Mirrors `ACTIVE_RENT_STATUSES` (user.service) and the product deletion guard.
 */
export const BLOCKING_RENT_STATUSES = [
  RentStatus.RESERVED,
  RentStatus.WAITING,
  RentStatus.CHECKIN,
] as const

/**
 * Build a Prisma WHERE clause to detect overlapping reservations.
 * Implements hotel night semantics: checkout day is free (uses dayAfterArrival
 * to avoid false positives when an existing checkout time like 11:00 > normalized midnight).
 *
 * RESERVED, WAITING and CHECKIN bookings all block availability to prevent
 * overbooking (host approval window + guests currently staying).
 *
 * @param {string} productId - Product identifier
 * @param {Date} normalizedArrival - Arrival date normalized to UTC midnight
 * @param {Date} normalizedLeaving - Leaving date normalized to UTC midnight
 * @param {Date} dayAfterArrival - Day after arrival (for hotel night semantics)
 * @returns {Prisma.RentWhereInput} Prisma where clause for overlap detection
 */
export function buildOverlapWhereClause(
  productId: string,
  normalizedArrival: Date,
  normalizedLeaving: Date,
  dayAfterArrival: Date
): Prisma.RentWhereInput {
  return {
    productId,
    status: { in: [...BLOCKING_RENT_STATUSES] },
    OR: [
      // Reservation starts during the requested period
      {
        arrivingDate: {
          gte: normalizedArrival,
          lt: normalizedLeaving,
        },
      },
      // Reservation ends during the requested period (checkout day is free)
      {
        leavingDate: {
          gte: dayAfterArrival,
          lt: normalizedLeaving,
        },
      },
      // Reservation spans the entire requested period
      {
        arrivingDate: { lt: normalizedArrival },
        leavingDate: { gt: normalizedLeaving },
      },
    ],
  }
}

/**
 * Build a Prisma WHERE clause to detect overlapping `RentRoomType` lines for a
 * single room type. Reuses the same hotel-night semantics as
 * {@link buildOverlapWhereClause} (checkout day is free) but scopes the overlap
 * to the parent `Rent` of a specific `roomTypeId` so per-type availability can
 * be computed by summing overlapping `RentRoomType.quantity`.
 *
 * RESERVED, WAITING and CHECKIN bookings all block availability (host approval
 * window + guests currently staying), mirroring the establishment-level query.
 *
 * @param {string} roomTypeId - Room type identifier
 * @param {Date} normalizedArrival - Arrival date normalized to UTC midnight
 * @param {Date} normalizedLeaving - Leaving date normalized to UTC midnight
 * @param {Date} dayAfterArrival - Day after arrival (for hotel night semantics)
 * @returns {Prisma.RentRoomTypeWhereInput} Prisma where clause for per-type overlap detection
 */
export function buildRoomTypeOverlapWhere(
  roomTypeId: string,
  normalizedArrival: Date,
  normalizedLeaving: Date,
  dayAfterArrival: Date
): Prisma.RentRoomTypeWhereInput {
  return {
    roomTypeId,
    rent: {
      status: { in: [...BLOCKING_RENT_STATUSES] },
      OR: [
        // Reservation starts during the requested period
        {
          arrivingDate: {
            gte: normalizedArrival,
            lt: normalizedLeaving,
          },
        },
        // Reservation ends during the requested period (checkout day is free)
        {
          leavingDate: {
            gte: dayAfterArrival,
            lt: normalizedLeaving,
          },
        },
        // Reservation spans the entire requested period
        {
          arrivingDate: { lt: normalizedArrival },
          leavingDate: { gt: normalizedLeaving },
        },
      ],
    },
  }
}

/**
 * Build a Prisma WHERE clause to detect a `RoomTypeBlockedDate` range overlapping
 * the requested period. Uses the standard half-open interval overlap test:
 * two ranges [aStart, aEnd) and [bStart, bEnd) overlap iff
 * `aStart < bEnd && aEnd > bStart`.
 *
 * A single overlapping blocked range makes the entire room type unavailable for
 * that period (host closed the type), mirroring `unAvailableProduct` semantics.
 *
 * @param {string} roomTypeId - Room type identifier
 * @param {Date} normalizedArrival - Requested arrival date normalized to UTC midnight
 * @param {Date} normalizedLeaving - Requested leaving date normalized to UTC midnight
 * @returns {Prisma.RoomTypeBlockedDateWhereInput} Prisma where clause for blocked-date overlap
 */
export function buildBlockedDateOverlapWhere(
  roomTypeId: string,
  normalizedArrival: Date,
  normalizedLeaving: Date
): Prisma.RoomTypeBlockedDateWhereInput {
  return {
    roomTypeId,
    // ranges overlap iff blockedStart < requestedEnd AND blockedEnd > requestedStart
    startDate: { lt: normalizedLeaving },
    endDate: { gt: normalizedArrival },
  }
}

/**
 * Normalize a date to UTC midnight and compute the day-after-arrival
 * for hotel night semantics.
 *
 * @param {Date} arrivalDate - Raw arrival date
 * @param {Date} leavingDate - Raw leaving date
 * @returns {{ normalizedArrival: Date, normalizedLeaving: Date, dayAfterArrival: Date }}
 */
export function normalizeDates(arrivalDate: Date, leavingDate: Date) {
  const normalizedArrival = new Date(arrivalDate)
  normalizedArrival.setUTCHours(0, 0, 0, 0)

  const normalizedLeaving = new Date(leavingDate)
  normalizedLeaving.setUTCHours(0, 0, 0, 0)

  const dayAfterArrival = new Date(normalizedArrival)
  dayAfterArrival.setUTCDate(dayAfterArrival.getUTCDate() + 1)

  return { normalizedArrival, normalizedLeaving, dayAfterArrival }
}
