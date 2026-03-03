import { RentStatus, Prisma } from '@prisma/client'

/**
 * Build a Prisma WHERE clause to detect overlapping reservations.
 * Implements hotel night semantics: checkout day is free (uses dayAfterArrival
 * to avoid false positives when an existing checkout time like 11:00 > normalized midnight).
 *
 * Both RESERVED and WAITING bookings block availability to prevent overbooking
 * during the host approval window.
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
    status: { in: [RentStatus.RESERVED, RentStatus.WAITING] as const },
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
