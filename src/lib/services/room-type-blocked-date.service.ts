'use server'

import prisma from '@/lib/prisma'
import { RoomTypeBlockedDate } from '@prisma/client'
import { BookingValidationError } from '@/lib/errors/booking.errors'
import { availabilityCacheService } from '@/lib/cache/redis-cache.service'
import { logger } from '@/lib/logger'

/**
 * Host calendar CRUD for {@link RoomTypeBlockedDate}. A blocked range closes an
 * entire room type for the overlapping period (per-type availability = 0),
 * mirroring the establishment-level `unAvailableProduct` semantics.
 */
export interface CreateBlockedDateInput {
  roomTypeId: string
  startDate: Date
  endDate: Date
}

/**
 * Invalidate the establishment-level availability cache for the product that
 * owns `roomTypeId`.
 *
 * A blocked-date mutation changes per-type availability, which in turn changes
 * the `anyAvailable` boolean cached at the product level by
 * {@link checkRentIsAvailable} (`availability:{productId}:*`, TTL 5 min). Per-type
 * reads bypass the cache and stay fresh, but the product-level entry would
 * otherwise return a stale value until its TTL expires. Non-blocking: cache
 * failures are logged, never surfaced to the calendar mutation.
 *
 * @param {string} roomTypeId - Mutated room type identifier
 * @returns {Promise<void>}
 */
async function invalidateProductAvailabilityForRoomType(roomTypeId: string): Promise<void> {
  try {
    const roomType = await prisma.roomType.findUnique({
      where: { id: roomTypeId },
      select: { productId: true },
    })

    if (roomType?.productId) {
      await availabilityCacheService.invalidateAvailability(roomType.productId)
    }
  } catch (cacheError) {
    logger.warn(
      { roomTypeId, error: cacheError },
      'Failed to invalidate availability cache after blocked-date mutation'
    )
  }
}

/**
 * Create a blocked-date range for a room type.
 *
 * @param {CreateBlockedDateInput} input - Room type + range to block
 * @returns {Promise<RoomTypeBlockedDate>} The created blocked range
 * @throws {BookingValidationError} When `startDate >= endDate`
 */
export async function createRoomTypeBlockedDate(
  input: CreateBlockedDateInput
): Promise<RoomTypeBlockedDate> {
  if (input.startDate >= input.endDate) {
    throw new BookingValidationError('endDate must be after startDate')
  }

  const created = await prisma.roomTypeBlockedDate.create({
    data: {
      roomTypeId: input.roomTypeId,
      startDate: input.startDate,
      endDate: input.endDate,
    },
  })

  await invalidateProductAvailabilityForRoomType(created.roomTypeId)

  return created
}

/**
 * List all blocked-date ranges of a room type, ordered by start date.
 *
 * @param {string} roomTypeId - Room type identifier
 * @returns {Promise<RoomTypeBlockedDate[]>} Blocked ranges (ascending by startDate)
 */
export async function listRoomTypeBlockedDates(roomTypeId: string): Promise<RoomTypeBlockedDate[]> {
  return prisma.roomTypeBlockedDate.findMany({
    where: { roomTypeId },
    orderBy: { startDate: 'asc' },
  })
}

/**
 * Delete a blocked-date range by id.
 *
 * @param {string} id - Blocked-date range identifier
 * @returns {Promise<void>}
 */
export async function deleteRoomTypeBlockedDate(id: string): Promise<void> {
  const deleted = await prisma.roomTypeBlockedDate.delete({ where: { id } })

  await invalidateProductAvailabilityForRoomType(deleted.roomTypeId)
}

/**
 * Ownership guard: verifies the room type's parent product belongs to `userId`
 * before a host can mutate its calendar. Throws otherwise.
 *
 * @param {string} roomTypeId - Room type identifier
 * @param {string} userId - Acting user's identifier
 * @returns {Promise<void>} Resolves if authorized; throws otherwise
 * @throws {BookingValidationError} When the room type is unknown or not owned by the user
 */
export async function assertRoomTypeOwnedBy(roomTypeId: string, userId: string): Promise<void> {
  const roomType = await prisma.roomType.findUnique({
    where: { id: roomTypeId },
    select: { product: { select: { ownerId: true } } },
  })

  if (!roomType || roomType.product.ownerId !== userId) {
    throw new BookingValidationError('Not authorized for this room type')
  }
}
