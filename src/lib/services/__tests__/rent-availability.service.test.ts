import { makePrismaMock } from './helpers/prisma-mock'
import { BookingConflictError } from '@/lib/errors/booking.errors'

const prismaMock = makePrismaMock()

jest.mock('@/lib/prisma', () => ({ __esModule: true, default: prismaMock }))
jest.mock('@/lib/cache/redis-cache.service', () => ({
  availabilityCacheService: {
    getCachedAvailability: jest.fn().mockResolvedValue(null),
    cacheAvailability: jest.fn().mockResolvedValue(undefined),
    invalidateAvailability: jest.fn().mockResolvedValue(undefined),
  },
}))
jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))

import {
  checkRoomTypeAvailable,
  getHotelRoomTypeAvailability,
  assertRoomTypesAvailableInTx,
  checkRentIsAvailable,
} from '../rent-availability.service'

const A = new Date('2026-08-01T00:00:00.000Z')
const L = new Date('2026-08-05T00:00:00.000Z')

beforeEach(() => {
  jest.clearAllMocks()
})

// ------------------------------------------------------------------
// checkRoomTypeAvailable — single type math (Task 3)
// ------------------------------------------------------------------
describe('checkRoomTypeAvailable', () => {
  it('returns full availability when nothing booked or blocked', async () => {
    prismaMock.roomType.findUnique.mockResolvedValue({ quantity: 2 })
    prismaMock.rentRoomType.aggregate.mockResolvedValue({ _sum: { quantity: null } })
    prismaMock.roomTypeBlockedDate.findMany.mockResolvedValue([])

    const r = await checkRoomTypeAvailable('rt-1', A, L)

    expect(r).toEqual({ available: true, availableQuantity: 2, message: undefined })
  })

  it('subtracts overlapping booked quantity', async () => {
    prismaMock.roomType.findUnique.mockResolvedValue({ quantity: 2 })
    prismaMock.rentRoomType.aggregate.mockResolvedValue({ _sum: { quantity: 2 } })
    prismaMock.roomTypeBlockedDate.findMany.mockResolvedValue([])

    const r = await checkRoomTypeAvailable('rt-1', A, L)

    expect(r.availableQuantity).toBe(0)
    expect(r.available).toBe(false)
    expect(r.message).toBe('Aucune chambre disponible pour cette période')
  })

  it('a blocked date range makes the whole type unavailable', async () => {
    prismaMock.roomType.findUnique.mockResolvedValue({ quantity: 5 })
    prismaMock.rentRoomType.aggregate.mockResolvedValue({ _sum: { quantity: 0 } })
    prismaMock.roomTypeBlockedDate.findMany.mockResolvedValue([{ startDate: A, endDate: L }])

    const r = await checkRoomTypeAvailable('rt-1', A, L)

    expect(r.availableQuantity).toBe(0)
    expect(r.available).toBe(false)
    expect(r.message).toBe('Cette chambre est bloquée sur cette période')
  })

  it('requestedQuantity > availableQuantity → not available', async () => {
    prismaMock.roomType.findUnique.mockResolvedValue({ quantity: 2 })
    prismaMock.rentRoomType.aggregate.mockResolvedValue({ _sum: { quantity: 1 } })
    prismaMock.roomTypeBlockedDate.findMany.mockResolvedValue([])

    const r = await checkRoomTypeAvailable('rt-1', A, L, 2)

    expect(r.availableQuantity).toBe(1)
    expect(r.available).toBe(false)
  })

  it('unknown room type → zeroed, unavailable', async () => {
    prismaMock.roomType.findUnique.mockResolvedValue(null)

    const r = await checkRoomTypeAvailable('missing', A, L)

    expect(r).toEqual({
      available: false,
      availableQuantity: 0,
      message: 'Aucune chambre disponible pour cette période',
    })
  })
})

// ------------------------------------------------------------------
// getHotelRoomTypeAvailability (Task 4)
// ------------------------------------------------------------------
describe('getHotelRoomTypeAvailability', () => {
  it('reports every type as fully available when no dates are selected', async () => {
    prismaMock.roomType.findMany.mockResolvedValue([
      { id: 'rt-1', quantity: 2 },
      { id: 'rt-2', quantity: 4 },
    ])

    const r = await getHotelRoomTypeAvailability('p-hotel', null, null)

    expect(r).toEqual([
      {
        roomTypeId: 'rt-1',
        totalQuantity: 2,
        bookedQuantity: 0,
        availableQuantity: 2,
        available: true,
        blockedRanges: [],
      },
      {
        roomTypeId: 'rt-2',
        totalQuantity: 4,
        bookedQuantity: 0,
        availableQuantity: 4,
        available: true,
        blockedRanges: [],
      },
    ])
    // No date math ⇒ no per-type DB reads.
    expect(prismaMock.rentRoomType.aggregate).not.toHaveBeenCalled()
  })

  it('resolves per-type availability for a date range', async () => {
    prismaMock.roomType.findMany.mockResolvedValue([
      { id: 'rt-1', quantity: 2 },
      { id: 'rt-2', quantity: 1 },
    ])
    prismaMock.roomType.findUnique
      .mockResolvedValueOnce({ quantity: 2 }) // rt-1
      .mockResolvedValueOnce({ quantity: 1 }) // rt-2
    prismaMock.rentRoomType.aggregate
      .mockResolvedValueOnce({ _sum: { quantity: 0 } }) // rt-1 free
      .mockResolvedValueOnce({ _sum: { quantity: 1 } }) // rt-2 full
    prismaMock.roomTypeBlockedDate.findMany.mockResolvedValue([])

    const r = await getHotelRoomTypeAvailability('p-hotel', A, L)

    expect(r).toHaveLength(2)
    expect(r[0]).toMatchObject({ roomTypeId: 'rt-1', availableQuantity: 2, available: true })
    expect(r[1]).toMatchObject({ roomTypeId: 'rt-2', availableQuantity: 0, available: false })
  })
})

// ------------------------------------------------------------------
// assertRoomTypesAvailableInTx — guard (Task 5)
// ------------------------------------------------------------------
describe('assertRoomTypesAvailableInTx', () => {
  it('throws BookingConflictError when a line is over capacity', async () => {
    const tx = makePrismaMock()
    tx.roomType.findUnique.mockResolvedValue({ quantity: 1 })
    tx.rentRoomType.aggregate.mockResolvedValue({ _sum: { quantity: 1 } })
    tx.roomTypeBlockedDate.findMany.mockResolvedValue([])

    await expect(
      assertRoomTypesAvailableInTx(
        tx as never,
        [{ roomTypeId: 'rt-1', quantity: 1 }],
        A,
        L
      )
    ).rejects.toBeInstanceOf(BookingConflictError)
  })

  it('throws a blocked-specific message when the type is blocked', async () => {
    const tx = makePrismaMock()
    tx.roomType.findUnique.mockResolvedValue({ quantity: 3 })
    tx.rentRoomType.aggregate.mockResolvedValue({ _sum: { quantity: 0 } })
    tx.roomTypeBlockedDate.findMany.mockResolvedValue([{ startDate: A, endDate: L }])

    await expect(
      assertRoomTypesAvailableInTx(tx as never, [{ roomTypeId: 'rt-1', quantity: 1 }], A, L)
    ).rejects.toThrow('Cette chambre est bloquée sur cette période')
  })

  it('resolves when all lines fit', async () => {
    const tx = makePrismaMock()
    tx.roomType.findUnique.mockResolvedValue({ quantity: 3 })
    tx.rentRoomType.aggregate.mockResolvedValue({ _sum: { quantity: 1 } })
    tx.roomTypeBlockedDate.findMany.mockResolvedValue([])

    await expect(
      assertRoomTypesAvailableInTx(tx as never, [{ roomTypeId: 'rt-1', quantity: 2 }], A, L)
    ).resolves.toBeUndefined()
  })

  it('rejects when at least one of several lines is unsatisfiable', async () => {
    const tx = makePrismaMock()
    tx.roomType.findUnique
      .mockResolvedValueOnce({ quantity: 2 }) // rt-1 ok
      .mockResolvedValueOnce({ quantity: 1 }) // rt-2 full
    tx.rentRoomType.aggregate
      .mockResolvedValueOnce({ _sum: { quantity: 0 } })
      .mockResolvedValueOnce({ _sum: { quantity: 1 } })
    tx.roomTypeBlockedDate.findMany.mockResolvedValue([])

    await expect(
      assertRoomTypesAvailableInTx(
        tx as never,
        [
          { roomTypeId: 'rt-1', quantity: 1 },
          { roomTypeId: 'rt-2', quantity: 1 },
        ],
        A,
        L
      )
    ).rejects.toBeInstanceOf(BookingConflictError)
  })
})

// ------------------------------------------------------------------
// checkRentIsAvailable — hotel delegation + legacy paths (Task 6)
// ------------------------------------------------------------------
describe('checkRentIsAvailable', () => {
  it('hotel product available when at least one room type has space', async () => {
    prismaMock.product.findUnique.mockResolvedValue({
      availableRooms: 3,
      type: { isHotelType: true },
      roomTypes: [{ id: 'rt-1' }, { id: 'rt-2' }],
    })
    prismaMock.roomType.findMany.mockResolvedValue([
      { id: 'rt-1', quantity: 1 },
      { id: 'rt-2', quantity: 1 },
    ])
    prismaMock.roomType.findUnique
      .mockResolvedValueOnce({ quantity: 1 }) // rt-1
      .mockResolvedValueOnce({ quantity: 1 }) // rt-2
    prismaMock.rentRoomType.aggregate
      .mockResolvedValueOnce({ _sum: { quantity: 1 } }) // rt-1 full
      .mockResolvedValueOnce({ _sum: { quantity: 0 } }) // rt-2 free
    prismaMock.roomTypeBlockedDate.findMany.mockResolvedValue([])
    prismaMock.unAvailableProduct.findFirst.mockResolvedValue(null)

    const r = await checkRentIsAvailable('p-hotel', A, L)

    expect(r.available).toBe(true)
  })

  it('hotel product unavailable when all room types are full', async () => {
    prismaMock.product.findUnique.mockResolvedValue({
      availableRooms: 2,
      type: { isHotelType: true },
      roomTypes: [{ id: 'rt-1' }, { id: 'rt-2' }],
    })
    prismaMock.roomType.findMany.mockResolvedValue([
      { id: 'rt-1', quantity: 1 },
      { id: 'rt-2', quantity: 1 },
    ])
    prismaMock.roomType.findUnique
      .mockResolvedValueOnce({ quantity: 1 })
      .mockResolvedValueOnce({ quantity: 1 })
    prismaMock.rentRoomType.aggregate
      .mockResolvedValueOnce({ _sum: { quantity: 1 } })
      .mockResolvedValueOnce({ _sum: { quantity: 1 } })
    prismaMock.roomTypeBlockedDate.findMany.mockResolvedValue([])

    const r = await checkRentIsAvailable('p-hotel', A, L)

    expect(r).toEqual({
      available: false,
      message: 'Aucune chambre disponible pour cette période',
    })
  })

  it('non-hotel product keeps single-unit behavior (any overlap blocks)', async () => {
    prismaMock.product.findUnique.mockResolvedValue({
      availableRooms: null,
      type: { isHotelType: false },
      roomTypes: [],
    })
    prismaMock.rent.findFirst.mockResolvedValue({ id: 'r1' })

    const r = await checkRentIsAvailable('p-single', A, L)

    expect(r).toEqual({
      available: false,
      message: 'Il existe déjà une réservation sur cette période',
    })
  })

  it('legacy multi-room (availableRooms>1, no roomTypes) keeps count-based behavior', async () => {
    prismaMock.product.findUnique.mockResolvedValue({
      availableRooms: 2,
      type: { isHotelType: true },
      roomTypes: [], // not migrated to room types yet
    })
    prismaMock.rent.findMany.mockResolvedValue([{ id: 'r1' }, { id: 'r2' }]) // 2 booked, 2 rooms
    prismaMock.unAvailableProduct.findFirst.mockResolvedValue(null)

    const r = await checkRentIsAvailable('p-legacy', A, L)

    expect(r).toEqual({
      available: false,
      message: 'Aucune chambre disponible pour cette période',
    })
    // Confirms the legacy count path ran, not the per-type path.
    expect(prismaMock.rentRoomType.aggregate).not.toHaveBeenCalled()
  })
})
