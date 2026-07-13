import { makePrismaMock } from './helpers/prisma-mock'
import { BookingValidationError } from '@/lib/errors/booking.errors'

const prismaMock = makePrismaMock()
jest.mock('@/lib/prisma', () => ({ __esModule: true, default: prismaMock }))
jest.mock('@/lib/cache/redis-cache.service', () => ({
  availabilityCacheService: {
    invalidateAvailability: jest.fn().mockResolvedValue(undefined),
  },
}))
jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))

import { availabilityCacheService } from '@/lib/cache/redis-cache.service'
import {
  createRoomTypeBlockedDate,
  listRoomTypeBlockedDates,
  deleteRoomTypeBlockedDate,
  assertRoomTypeOwnedBy,
} from '../room-type-blocked-date.service'

const invalidateAvailability = availabilityCacheService.invalidateAvailability as jest.Mock

const A = new Date('2026-08-01T00:00:00.000Z')
const L = new Date('2026-08-05T00:00:00.000Z')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('createRoomTypeBlockedDate', () => {
  it('creates a valid blocked range', async () => {
    const created = { id: 'b1', roomTypeId: 'rt-1', startDate: A, endDate: L }
    prismaMock.roomTypeBlockedDate.create.mockResolvedValue(created)

    const result = await createRoomTypeBlockedDate({ roomTypeId: 'rt-1', startDate: A, endDate: L })

    expect(result).toBe(created)
    expect(prismaMock.roomTypeBlockedDate.create).toHaveBeenCalledWith({
      data: { roomTypeId: 'rt-1', startDate: A, endDate: L },
    })
  })

  it('throws when startDate >= endDate', async () => {
    await expect(
      createRoomTypeBlockedDate({ roomTypeId: 'rt-1', startDate: L, endDate: A })
    ).rejects.toBeInstanceOf(BookingValidationError)
    expect(prismaMock.roomTypeBlockedDate.create).not.toHaveBeenCalled()
  })
})

describe('listRoomTypeBlockedDates', () => {
  it('lists ranges ordered by startDate', async () => {
    prismaMock.roomTypeBlockedDate.findMany.mockResolvedValue([])

    await listRoomTypeBlockedDates('rt-1')

    expect(prismaMock.roomTypeBlockedDate.findMany).toHaveBeenCalledWith({
      where: { roomTypeId: 'rt-1' },
      orderBy: { startDate: 'asc' },
    })
  })
})

describe('deleteRoomTypeBlockedDate', () => {
  it('deletes by id', async () => {
    prismaMock.roomTypeBlockedDate.delete.mockResolvedValue({})

    await deleteRoomTypeBlockedDate('b1')

    expect(prismaMock.roomTypeBlockedDate.delete).toHaveBeenCalledWith({ where: { id: 'b1' } })
  })
})

describe('cache invalidation on calendar mutations', () => {
  it('invalidates the parent product availability cache after creating a blocked range', async () => {
    prismaMock.roomTypeBlockedDate.create.mockResolvedValue({
      id: 'b1',
      roomTypeId: 'rt-1',
      startDate: A,
      endDate: L,
    })
    prismaMock.roomType.findUnique.mockResolvedValue({ productId: 'prod-1' })

    await createRoomTypeBlockedDate({ roomTypeId: 'rt-1', startDate: A, endDate: L })

    expect(invalidateAvailability).toHaveBeenCalledTimes(1)
    expect(invalidateAvailability).toHaveBeenCalledWith('prod-1')
  })

  it('invalidates the parent product availability cache after deleting a blocked range', async () => {
    prismaMock.roomTypeBlockedDate.delete.mockResolvedValue({
      id: 'b1',
      roomTypeId: 'rt-1',
      startDate: A,
      endDate: L,
    })
    prismaMock.roomType.findUnique.mockResolvedValue({ productId: 'prod-1' })

    await deleteRoomTypeBlockedDate('b1')

    expect(invalidateAvailability).toHaveBeenCalledTimes(1)
    expect(invalidateAvailability).toHaveBeenCalledWith('prod-1')
  })

  it('scopes invalidation to the affected product only', async () => {
    prismaMock.roomTypeBlockedDate.create.mockResolvedValue({
      id: 'b2',
      roomTypeId: 'rt-9',
      startDate: A,
      endDate: L,
    })
    prismaMock.roomType.findUnique.mockResolvedValue({ productId: 'prod-9' })

    await createRoomTypeBlockedDate({ roomTypeId: 'rt-9', startDate: A, endDate: L })

    expect(invalidateAvailability).toHaveBeenCalledWith('prod-9')
    expect(invalidateAvailability).not.toHaveBeenCalledWith('prod-1')
  })

  it('does not throw when the room type cannot be resolved (no product to invalidate)', async () => {
    prismaMock.roomTypeBlockedDate.create.mockResolvedValue({
      id: 'b3',
      roomTypeId: 'rt-missing',
      startDate: A,
      endDate: L,
    })
    prismaMock.roomType.findUnique.mockResolvedValue(null)

    await expect(
      createRoomTypeBlockedDate({ roomTypeId: 'rt-missing', startDate: A, endDate: L })
    ).resolves.toMatchObject({ id: 'b3' })
    expect(invalidateAvailability).not.toHaveBeenCalled()
  })

  it('never lets a cache failure bubble out of the mutation', async () => {
    prismaMock.roomTypeBlockedDate.delete.mockResolvedValue({
      id: 'b4',
      roomTypeId: 'rt-1',
      startDate: A,
      endDate: L,
    })
    prismaMock.roomType.findUnique.mockResolvedValue({ productId: 'prod-1' })
    invalidateAvailability.mockRejectedValueOnce(new Error('redis down'))

    await expect(deleteRoomTypeBlockedDate('b4')).resolves.toBeUndefined()
  })
})

describe('assertRoomTypeOwnedBy', () => {
  it('resolves when the user owns the parent product', async () => {
    prismaMock.roomType.findUnique.mockResolvedValue({ product: { ownerId: 'user-1' } })

    await expect(assertRoomTypeOwnedBy('rt-1', 'user-1')).resolves.toBeUndefined()
  })

  it('throws for a different owner', async () => {
    prismaMock.roomType.findUnique.mockResolvedValue({ product: { ownerId: 'other' } })

    await expect(assertRoomTypeOwnedBy('rt-1', 'user-1')).rejects.toBeInstanceOf(
      BookingValidationError
    )
  })

  it('throws for an unknown room type', async () => {
    prismaMock.roomType.findUnique.mockResolvedValue(null)

    await expect(assertRoomTypeOwnedBy('missing', 'user-1')).rejects.toBeInstanceOf(
      BookingValidationError
    )
  })
})
