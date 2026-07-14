/**
 * createRent — parameter validation, pre-transaction availability guard, the
 * P2034 serialization-abort retry (TRI-125), the legacy establishment guards
 * (multi-room count + single-unit), extras persistence, and non-fatal cache
 * invalidation. Complements `createRent.roomTypes.test.ts` (hotel persistence)
 * and `rents.guard.test.ts` (real per-type guard). All boundaries mocked.
 */
import { makePrismaMock } from './helpers/prisma-mock'
import { Prisma } from '@prisma/client'
import { BookingConflictError, BookingValidationError } from '@/lib/errors/booking.errors'

const prismaMock = makePrismaMock()
jest.mock('@/lib/prisma', () => ({ __esModule: true, default: prismaMock }))

const checkRentIsAvailableMock = jest.fn()
jest.mock('../rent-availability.service', () => {
  const actual = jest.requireActual('../rent-availability.service')
  return {
    ...actual,
    checkRentIsAvailable: (...a: unknown[]) => checkRentIsAvailableMock(...a),
    assertRoomTypesAvailableInTx: jest.fn().mockResolvedValue(undefined),
  }
})

const calculateCompleteBookingPriceMock = jest.fn()
const calculateHotelBookingPriceMock = jest.fn()
jest.mock('../booking-pricing.service', () => ({
  calculateCompleteBookingPrice: (...a: unknown[]) => calculateCompleteBookingPriceMock(...a),
  calculateHotelBookingPrice: (...a: unknown[]) => calculateHotelBookingPriceMock(...a),
}))

jest.mock('@/lib/services/sendTemplatedMail', () => ({ sendTemplatedMail: jest.fn() }))
jest.mock('@/lib/services/user.service', () => ({
  findAllUserByRoles: jest.fn().mockResolvedValue([]),
}))
const invalidateAvailabilityMock = jest.fn().mockResolvedValue(undefined)
jest.mock('@/lib/cache/redis-cache.service', () => ({
  availabilityCacheService: {
    invalidateAvailability: (...a: unknown[]) => invalidateAvailabilityMock(...a),
  },
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

const SINGLE_PRICING = {
  basePricing: {
    averageNightlyPrice: 100,
    numberOfNights: 4,
    subtotal: 400,
    totalSavings: 0,
    promotionApplied: false,
    specialPriceApplied: false,
    dailyBreakdown: [],
  },
  extrasTotal: 50,
  extrasDetails: [{ extraId: 'e1', name: 'Breakfast', quantity: 1, pricePerUnit: 50, total: 50 }],
  clientCommission: 0,
  hostCommission: 0,
  platformAmount: 0,
  hostAmount: 400,
  totalAmount: 450,
  summary: {},
}

function baseParams(overrides: Record<string, unknown> = {}) {
  return {
    productId: 'p1',
    userId: 'u1',
    arrivingDate: A,
    leavingDate: L,
    peopleNumber: 2,
    options: [] as string[],
    stripeId: 's1',
    prices: 450,
    ...overrides,
  }
}

/** Wire a transaction client whose rent.create short-circuits notifications. */
function makeTx() {
  const tx = makePrismaMock()
  tx.rent.create.mockResolvedValue({
    id: 'rent-1',
    productId: 'p1',
    product: { type: { name: 'Hotel' }, owner: null },
    user: { email: 'u@u.com', name: 'User' },
    options: [],
  })
  return tx
}

beforeEach(() => {
  jest.clearAllMocks()
  prismaMock.user.findUnique.mockResolvedValue({ id: 'u1' })
  prismaMock.product.findFirst.mockResolvedValue({ id: 'p1', autoAccept: false })
  prismaMock.product.findUnique.mockResolvedValue({ autoAccept: false, ownerId: 'o1' })
  checkRentIsAvailableMock.mockResolvedValue({ available: true })
  calculateCompleteBookingPriceMock.mockResolvedValue(SINGLE_PRICING)
})

// ------------------------------------------------------------------
// Parameter validation (pre-DB)
// ------------------------------------------------------------------
describe('createRent — parameter validation', () => {
  it('throws BookingValidationError when a required param is missing', async () => {
    await expect(createRent(baseParams({ prices: 0 }))).rejects.toBeInstanceOf(
      BookingValidationError
    )
    // Guard fires before any DB access.
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled()
  })

  it('throws BookingValidationError when the user is not found', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)

    await expect(createRent(baseParams())).rejects.toThrow(/User not found/)
  })

  it('throws BookingValidationError when the product is not found', async () => {
    prismaMock.product.findFirst.mockResolvedValue(null)

    await expect(createRent(baseParams())).rejects.toThrow(/Product not found/)
  })
})

// ------------------------------------------------------------------
// Pre-transaction availability guard
// ------------------------------------------------------------------
describe('createRent — pre-transaction availability', () => {
  it('throws BookingConflictError when the product is unavailable', async () => {
    checkRentIsAvailableMock.mockResolvedValue({ available: false, message: 'busy' })

    await expect(createRent(baseParams())).rejects.toBeInstanceOf(BookingConflictError)
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
  })
})

// ------------------------------------------------------------------
// Legacy establishment guards inside the transaction
// ------------------------------------------------------------------
describe('createRent — legacy establishment guards', () => {
  it('single-unit: throws when an overlapping rent exists', async () => {
    const tx = makeTx()
    tx.product.findUnique.mockResolvedValue({ availableRooms: 1 })
    tx.rent.findFirst.mockResolvedValue({ id: 'existing' })
    prismaMock.$transaction.mockImplementation(async (cb: (c: unknown) => unknown) => cb(tx))

    await expect(createRent(baseParams())).rejects.toBeInstanceOf(BookingConflictError)
    expect(tx.rent.create).not.toHaveBeenCalled()
  })

  it('multi-room: throws when concurrent bookings reach availableRooms', async () => {
    const tx = makeTx()
    tx.product.findUnique.mockResolvedValue({ availableRooms: 2 })
    tx.rent.count.mockResolvedValue(2) // fully booked
    prismaMock.$transaction.mockImplementation(async (cb: (c: unknown) => unknown) => cb(tx))

    await expect(createRent(baseParams())).rejects.toThrow(
      /Aucune chambre disponible/
    )
    expect(tx.rent.create).not.toHaveBeenCalled()
  })

  it('multi-room: creates when under capacity', async () => {
    const tx = makeTx()
    tx.product.findUnique.mockResolvedValue({ availableRooms: 3 })
    tx.rent.count.mockResolvedValue(1) // room to spare
    prismaMock.$transaction.mockImplementation(async (cb: (c: unknown) => unknown) => cb(tx))

    const rent = await createRent(baseParams())

    expect(rent.id).toBe('rent-1')
    expect(tx.rent.create).toHaveBeenCalledTimes(1)
  })
})

// ------------------------------------------------------------------
// Extras persistence
// ------------------------------------------------------------------
describe('createRent — extras persistence', () => {
  it('creates one RentExtra row per matched selected extra', async () => {
    const tx = makeTx()
    tx.product.findUnique.mockResolvedValue({ availableRooms: 1 })
    tx.rent.findFirst.mockResolvedValue(null)
    prismaMock.$transaction.mockImplementation(async (cb: (c: unknown) => unknown) => cb(tx))

    await createRent(baseParams({ selectedExtras: [{ extraId: 'e1', quantity: 1 }] }))

    expect(tx.rentExtra.create).toHaveBeenCalledTimes(1)
    expect(tx.rentExtra.create.mock.calls[0][0].data).toEqual({
      rentId: 'rent-1',
      extraId: 'e1',
      quantity: 1,
      totalPrice: 50,
    })
  })

  it('skips a selected extra with no matching pricing detail', async () => {
    const tx = makeTx()
    tx.product.findUnique.mockResolvedValue({ availableRooms: 1 })
    tx.rent.findFirst.mockResolvedValue(null)
    prismaMock.$transaction.mockImplementation(async (cb: (c: unknown) => unknown) => cb(tx))

    await createRent(baseParams({ selectedExtras: [{ extraId: 'unknown', quantity: 1 }] }))

    expect(tx.rentExtra.create).not.toHaveBeenCalled()
  })
})

// ------------------------------------------------------------------
// P2034 serialization-abort retry (TRI-125)
// ------------------------------------------------------------------
describe('createRent — P2034 retry', () => {
  function p2034(): Prisma.PrismaClientKnownRequestError {
    return new Prisma.PrismaClientKnownRequestError('write conflict', {
      code: 'P2034',
      clientVersion: 'test',
    })
  }

  it('retries the transaction on P2034 and eventually succeeds', async () => {
    const tx = makeTx()
    tx.product.findUnique.mockResolvedValue({ availableRooms: 1 })
    tx.rent.findFirst.mockResolvedValue(null)

    prismaMock.$transaction
      .mockRejectedValueOnce(p2034())
      .mockImplementationOnce(async (cb: (c: unknown) => unknown) => cb(tx))

    const rent = await createRent(baseParams())

    expect(rent.id).toBe('rent-1')
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(2)
  })

  it('gives up after MAX_ATTEMPTS and re-throws the P2034 error', async () => {
    prismaMock.$transaction.mockRejectedValue(p2034())

    await expect(createRent(baseParams())).rejects.toBeInstanceOf(
      Prisma.PrismaClientKnownRequestError
    )
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(3)
  })

  it('does NOT retry a BookingConflictError (genuine overbooking)', async () => {
    prismaMock.$transaction.mockRejectedValue(new BookingConflictError('over capacity'))

    await expect(createRent(baseParams())).rejects.toBeInstanceOf(BookingConflictError)
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1)
  })
})

// ------------------------------------------------------------------
// Non-fatal cache invalidation
// ------------------------------------------------------------------
describe('createRent — cache invalidation is non-fatal', () => {
  it('still returns the created rent when cache invalidation throws', async () => {
    const tx = makeTx()
    tx.product.findUnique.mockResolvedValue({ availableRooms: 1 })
    tx.rent.findFirst.mockResolvedValue(null)
    prismaMock.$transaction.mockImplementation(async (cb: (c: unknown) => unknown) => cb(tx))
    invalidateAvailabilityMock.mockRejectedValueOnce(new Error('redis down'))

    const rent = await createRent(baseParams())

    expect(rent.id).toBe('rent-1')
  })
})
