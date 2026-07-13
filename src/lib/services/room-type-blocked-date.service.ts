'use server'

import prisma from '@/lib/prisma'
import { RoomTypeBlockedDate } from '@prisma/client'
import { BookingValidationError } from '@/lib/errors/booking.errors'

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

  return prisma.roomTypeBlockedDate.create({
    data: {
      roomTypeId: input.roomTypeId,
      startDate: input.startDate,
      endDate: input.endDate,
    },
  })
}

/**
 * List all blocked-date ranges of a room type, ordered by start date.
 *
 * @param {string} roomTypeId - Room type identifier
 * @returns {Promise<RoomTypeBlockedDate[]>} Blocked ranges (ascending by startDate)
 */
export async function listRoomTypeBlockedDates(
  roomTypeId: string
): Promise<RoomTypeBlockedDate[]> {
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
  await prisma.roomTypeBlockedDate.delete({ where: { id } })
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
export async function assertRoomTypeOwnedBy(
  roomTypeId: string,
  userId: string
): Promise<void> {
  const roomType = await prisma.roomType.findUnique({
    where: { id: roomTypeId },
    select: { product: { select: { ownerId: true } } },
  })

  if (!roomType || roomType.product.ownerId !== userId) {
    throw new BookingValidationError('Not authorized for this room type')
  }
}
