import { Prisma } from '@prisma/client'
import { makePrismaMock } from './helpers/prisma-mock'
import { BookingConflictError } from '@/lib/errors/booking.errors'

const prismaMock = makePrismaMock()
jest.mock('@/lib/prisma', () => ({ __esModule: true, default: prismaMock }))

// Keep the REAL assertRoomTypesAvailableInTx (it drives the per-type guard);
// only stub the pre-transaction establishment availability probe.
const checkRentIsAvailableMock = jest.fn()
jest.mock('../rent-availability.service', () => {
  const actual = jest.requireActual('../rent-availability.service')
  return { ...actual, checkRentIsAvailable: checkRentIsAvailableMock }
})

const calculateCompleteBookingPriceMock = jest.fn()
jest.mock('../booking-pricing.service', () => ({
  calculateCompleteBookingPrice: (...args: unknown[]) => calculateCompleteBookingPriceMock(...args),
}))

jest.mock('@/lib/services/sendTemplatedMail', () => ({ sendTemplatedMail: jest.fn() }))
jest.mock('@/lib/services/user.service', () => ({
  findAllUserByRoles: jest.fn().mockResolvedValue([]),
}))
jest.mock('@/lib/cache/redis-cache.service', () => ({
  availabilityCacheService: { invalidateAvailability: jest.fn().mockResolvedValue(undefined) },
}))
jest.mock('@/lib/cache/invalidation', () => ({
  invalidateProductCache: jest.fn().mockResolvedValue(undefined),
}))
jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))

import { createRent } from '../rents.service'

const A = new Date('2026-08-01T00:00:00.000Z')
const L = new Date('2026-08-05T00:00:00.000Z')

const PRICING = {
  basePricing: {
    averageNightlyPrice: 100,
    numberOfNights: 4,
    subtotal: 400,
    totalSavings: 0,
    promotionApplied: false,
    specialPriceApplied: false,
    dailyBreakdown: [],
  },
  extrasTotal: 0,
  extrasDetails: [],
  clientCommission: 0,
  hostCommission: 0,
  platformAmount: 0,
  hostAmount: 400,
  totalAmount: 400,
  summary: {},
}

function baseParams(overrides: Record<string, unknown> = {}) {
  return {
    productId: 'p1',
    userId: 'u1',
    arrivingDate: A,
    leavingDate: L,
    peopleNumber: 2,
    options: [],
    stripeId: 's1',
    prices: 400,
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  prismaMock.user.findUnique.mockResolvedValue({ id: 'u1' })
  prismaMock.product.findFirst.mockResolvedValue({ id: 'p1' })
  prismaMock.product.findUnique.mockResolvedValue({ autoAccept: false, ownerId: 'o1' })
  checkRentIsAvailableMock.mockResolvedValue({ available: true })
  calculateCompleteBookingPriceMock.mockResolvedValue(PRICING)
})

describe('createRent transactional guard (TRI-125)', () => {
  it('hotel booking rejects when a selected room type is over capacity (in-tx)', async () => {
    const tx = makePrismaMock()
    tx.roomType.findUnique.mockResolvedValue({ quantity: 1 })
    tx.rentRoomType.aggregate.mockResolvedValue({ _sum: { quantity: 1 } }) // full
    tx.roomTypeBlockedDate.findMany.mockResolvedValue([])
    prismaMock.$transaction.mockImplementation(async (cb: (client: unknown) => unknown) => cb(tx))

    await expect(
      createRent(baseParams({ selectedRoomTypes: [{ roomTypeId: 'rt-1', quantity: 1 }] }))
    ).rejects.toBeInstanceOf(BookingConflictError)

    expect(tx.rent.create).not.toHaveBeenCalled()
  })

  it('non-hotel booking keeps the legacy single-unit guard', async () => {
    const tx = makePrismaMock()
    tx.product.findUnique.mockResolvedValue({ availableRooms: 1 })
    tx.rent.findFirst.mockResolvedValue({ id: 'existing' }) // conflict
    prismaMock.$transaction.mockImplementation(async (cb: (client: unknown) => unknown) => cb(tx))

    await expect(createRent(baseParams())).rejects.toThrow(
      'Il existe déjà une réservation sur cette période'
    )
    // Per-type guard must NOT run for a non-hotel booking.
    expect(tx.rentRoomType.aggregate).not.toHaveBeenCalled()
  })

  it('retries only on a P2034 serialization abort (bounded to 3 attempts)', async () => {
    const p2034 = new Prisma.PrismaClientKnownRequestError('write conflict', {
      code: 'P2034',
      clientVersion: 'test',
    })
    prismaMock.$transaction.mockRejectedValue(p2034)

    await expect(
      createRent(baseParams({ selectedRoomTypes: [{ roomTypeId: 'rt-1', quantity: 1 }] }))
    ).rejects.toBe(p2034)

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(3)
  })

  it('never retries a genuine BookingConflictError', async () => {
    prismaMock.$transaction.mockRejectedValue(new BookingConflictError('over capacity'))

    await expect(
      createRent(baseParams({ selectedRoomTypes: [{ roomTypeId: 'rt-1', quantity: 1 }] }))
    ).rejects.toBeInstanceOf(BookingConflictError)

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1)
  })
})
