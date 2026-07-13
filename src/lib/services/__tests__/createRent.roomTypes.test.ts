import { makePrismaMock } from './helpers/prisma-mock'
import { BookingConflictError } from '@/lib/errors/booking.errors'

const prismaMock = makePrismaMock()
jest.mock('@/lib/prisma', () => ({ __esModule: true, default: prismaMock }))

const checkRentIsAvailableMock = jest.fn()
const assertRoomTypesAvailableInTxMock = jest.fn()
jest.mock('../rent-availability.service', () => {
  const actual = jest.requireActual('../rent-availability.service')
  return {
    ...actual,
    checkRentIsAvailable: checkRentIsAvailableMock,
    assertRoomTypesAvailableInTx: (...args: unknown[]) => assertRoomTypesAvailableInTxMock(...args),
  }
})

const calculateCompleteBookingPriceMock = jest.fn()
const calculateHotelBookingPriceMock = jest.fn()
jest.mock('../booking-pricing.service', () => ({
  calculateCompleteBookingPrice: (...args: unknown[]) => calculateCompleteBookingPriceMock(...args),
  calculateHotelBookingPrice: (...args: unknown[]) => calculateHotelBookingPriceMock(...args),
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
const L = new Date('2026-08-03T00:00:00.000Z')

const HOTEL_PRICING = {
  lines: [
    { roomTypeId: 'rt-1', quantity: 1, unitPrice: '100', unitPricing: {}, lineSubtotal: 200 },
    { roomTypeId: 'rt-2', quantity: 2, unitPrice: '150', unitPricing: {}, lineSubtotal: 600 },
  ],
  subtotal: 800,
  extrasTotal: 0,
  extrasDetails: [],
  totalSavings: 0,
  clientCommission: 80,
  hostCommission: 40,
  platformAmount: 120,
  hostAmount: 760,
  totalAmount: 1180,
  summary: {
    numberOfNights: 2,
    subtotal: 800,
    totalSavings: 0,
    extrasTotal: 0,
    clientCommission: 80,
    totalAmount: 1180,
    promotionApplied: false,
    specialPriceApplied: false,
  },
}

const SINGLE_PRICING = {
  basePricing: {
    averageNightlyPrice: 100,
    numberOfNights: 2,
    subtotal: 200,
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
  hostAmount: 200,
  totalAmount: 200,
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
    prices: 1180,
    ...overrides,
  }
}

/** Wire a fresh transaction client that runs the createRent callback. */
function wireTransaction() {
  const tx = makePrismaMock()
  // `product.owner: null` short-circuits the post-transaction notification
  // block (out of scope here) right after the rent + lines are persisted.
  tx.rent.create.mockResolvedValue({
    id: 'rent-1',
    productId: 'p1',
    arrivingDate: A,
    leavingDate: L,
    product: { type: { name: 'Hotel' }, owner: null },
    user: { email: 'u@u.com', name: 'User' },
    options: [],
  })
  tx.rentRoomType.createMany.mockResolvedValue({ count: 2 })
  prismaMock.$transaction.mockImplementation(async (cb: (client: unknown) => unknown) => cb(tx))
  return tx
}

beforeEach(() => {
  jest.clearAllMocks()
  prismaMock.user.findUnique.mockResolvedValue({ id: 'u1' })
  prismaMock.product.findFirst.mockResolvedValue({ id: 'p1', autoAccept: false })
  prismaMock.product.findUnique.mockResolvedValue({ autoAccept: false, ownerId: 'o1' })
  checkRentIsAvailableMock.mockResolvedValue({ available: true })
  assertRoomTypesAvailableInTxMock.mockResolvedValue(undefined)
  calculateHotelBookingPriceMock.mockResolvedValue(HOTEL_PRICING)
  calculateCompleteBookingPriceMock.mockResolvedValue(SINGLE_PRICING)
})

describe('createRent — hotel RentRoomType persistence (Lot 4)', () => {
  it('creates a Rent with one RentRoomType line per selected room type', async () => {
    const tx = wireTransaction()

    await createRent(
      baseParams({
        selectedRoomTypes: [
          { roomTypeId: 'rt-1', quantity: 1 },
          { roomTypeId: 'rt-2', quantity: 2 },
        ],
      })
    )

    expect(tx.rentRoomType.createMany).toHaveBeenCalledTimes(1)
    const createManyArg = tx.rentRoomType.createMany.mock.calls[0][0]
    expect(createManyArg.data).toEqual([
      { rentId: 'rent-1', roomTypeId: 'rt-1', quantity: 1, unitPrice: '100' },
      { rentId: 'rent-1', roomTypeId: 'rt-2', quantity: 2, unitPrice: '150' },
    ])
  })

  it('sets Rent.totalAmount to the sum of the room-type lines', async () => {
    const tx = wireTransaction()

    await createRent(
      baseParams({
        selectedRoomTypes: [
          { roomTypeId: 'rt-1', quantity: 1 },
          { roomTypeId: 'rt-2', quantity: 2 },
        ],
      })
    )

    const rentData = tx.rent.create.mock.calls[0][0].data
    expect(rentData.totalAmount).toBe(1180)
    expect(rentData.prices).toBe(BigInt(1180))
    expect(rentData.subtotal).toBe(800)
    expect(calculateHotelBookingPriceMock).toHaveBeenCalledTimes(1)
    expect(calculateCompleteBookingPriceMock).not.toHaveBeenCalled()
  })

  it('throws BookingConflictError when a room type is over-booked in the transaction', async () => {
    const tx = wireTransaction()
    assertRoomTypesAvailableInTxMock.mockRejectedValue(new BookingConflictError('over capacity'))

    await expect(
      createRent(
        baseParams({
          selectedRoomTypes: [
            { roomTypeId: 'rt-1', quantity: 1 },
            { roomTypeId: 'rt-2', quantity: 2 },
          ],
        })
      )
    ).rejects.toBeInstanceOf(BookingConflictError)

    expect(tx.rent.create).not.toHaveBeenCalled()
    expect(tx.rentRoomType.createMany).not.toHaveBeenCalled()
  })

  it('leaves the non-hotel single-unit path unchanged when roomTypeLines is undefined', async () => {
    const tx = wireTransaction()
    tx.product.findUnique.mockResolvedValue({ availableRooms: 1 })
    tx.rent.findFirst.mockResolvedValue(null)

    await createRent(baseParams({ prices: 200 }))

    expect(calculateCompleteBookingPriceMock).toHaveBeenCalledTimes(1)
    expect(calculateHotelBookingPriceMock).not.toHaveBeenCalled()
    expect(tx.rentRoomType.createMany).not.toHaveBeenCalled()
    expect(assertRoomTypesAvailableInTxMock).not.toHaveBeenCalled()
  })
})
