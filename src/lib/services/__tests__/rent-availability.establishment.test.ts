/**
 * Establishment-level `checkRentIsAvailable`: Redis cache hit/miss, the
 * unAvailableProduct maintenance-block guard, cache-write side effects, and
 * infrastructure-error propagation. Complements `rent-availability.service.test.ts`
 * (per-type + hotel/legacy branch selection). Prisma + Redis mocked at boundary.
 */
import { makePrismaMock } from './helpers/prisma-mock'

const prismaMock = makePrismaMock()
jest.mock('@/lib/prisma', () => ({ __esModule: true, default: prismaMock }))

const getCachedAvailabilityMock = jest.fn()
const cacheAvailabilityMock = jest.fn()
jest.mock('@/lib/cache/redis-cache.service', () => ({
  availabilityCacheService: {
    getCachedAvailability: (...a: unknown[]) => getCachedAvailabilityMock(...a),
    cacheAvailability: (...a: unknown[]) => cacheAvailabilityMock(...a),
    invalidateAvailability: jest.fn().mockResolvedValue(undefined),
  },
}))
jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))

import { checkRentIsAvailable } from '../rent-availability.service'

const A = new Date('2026-08-01T00:00:00.000Z')
const L = new Date('2026-08-05T00:00:00.000Z')

beforeEach(() => {
  jest.clearAllMocks()
  getCachedAvailabilityMock.mockResolvedValue(null)
  cacheAvailabilityMock.mockResolvedValue(undefined)
})

describe('checkRentIsAvailable — Redis cache short-circuit', () => {
  it('returns the cached available result without touching the database', async () => {
    getCachedAvailabilityMock.mockResolvedValue({ isAvailable: true })

    const r = await checkRentIsAvailable('p1', A, L)

    expect(r).toEqual({ available: true, message: undefined })
    expect(prismaMock.product.findUnique).not.toHaveBeenCalled()
  })

  it('returns the cached unavailable result with a message', async () => {
    getCachedAvailabilityMock.mockResolvedValue({ isAvailable: false })

    const r = await checkRentIsAvailable('p1', A, L)

    expect(r.available).toBe(false)
    expect(r.message).toBeTruthy()
    expect(prismaMock.product.findUnique).not.toHaveBeenCalled()
  })
})

describe('checkRentIsAvailable — single-unit path', () => {
  it('is available and writes the result to cache when nothing conflicts', async () => {
    prismaMock.product.findUnique.mockResolvedValue({
      availableRooms: null,
      type: { isHotelType: false },
      roomTypes: [],
    })
    prismaMock.rent.findFirst.mockResolvedValue(null)
    prismaMock.unAvailableProduct.findFirst.mockResolvedValue(null)

    const r = await checkRentIsAvailable('p-single', A, L)

    expect(r).toEqual({ available: true })
    // Both the single-unit branch and the final result get cached.
    expect(cacheAvailabilityMock).toHaveBeenCalled()
  })

  it('is unavailable when a maintenance block overlaps the period', async () => {
    prismaMock.product.findUnique.mockResolvedValue({
      availableRooms: null,
      type: { isHotelType: false },
      roomTypes: [],
    })
    prismaMock.rent.findFirst.mockResolvedValue(null)
    prismaMock.unAvailableProduct.findFirst.mockResolvedValue({ id: 'block-1' })

    const r = await checkRentIsAvailable('p-single', A, L)

    expect(r).toEqual({
      available: false,
      message: 'Le produit est indisponible sur cette période',
    })
  })
})

describe('checkRentIsAvailable — legacy multi-room path', () => {
  it('is available when free rooms remain and no block overlaps', async () => {
    prismaMock.product.findUnique.mockResolvedValue({
      availableRooms: 3,
      type: { isHotelType: false },
      roomTypes: [],
    })
    prismaMock.rent.findMany.mockResolvedValue([{ id: 'r1' }]) // 1 booked of 3
    prismaMock.unAvailableProduct.findFirst.mockResolvedValue(null)

    const r = await checkRentIsAvailable('p-legacy', A, L)

    expect(r).toEqual({ available: true })
  })
})

describe('checkRentIsAvailable — error propagation', () => {
  it('re-throws unexpected DB errors instead of returning unavailable', async () => {
    prismaMock.product.findUnique.mockRejectedValue(new Error('db outage'))

    await expect(checkRentIsAvailable('p1', A, L)).rejects.toThrow('db outage')
  })
})
