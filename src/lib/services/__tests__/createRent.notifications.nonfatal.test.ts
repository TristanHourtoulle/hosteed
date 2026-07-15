/**
 * createRent — post-commit notification emails are NON-FATAL (TRI-1022).
 *
 * The Rent (+ RentRoomType) rows are persisted inside the booking transaction.
 * The owner and guest confirmation emails are sent AFTER that transaction
 * commits. If the email provider (Brevo) throws — 401, timeout, 5xx — those
 * failures MUST NOT propagate out of `createRent`: rejecting after a successful
 * commit would report the booking as failed to the Stripe webhook/caller and
 * risk a retry → double booking/charge.
 *
 * This test drives `createRent` down the single-unit path with every boundary
 * mocked, forces `sendTemplatedMail` to reject for BOTH the owner and guest
 * sends, and asserts the created rent is still returned (failures are only
 * logged). All boundaries mocked — no DB required.
 */
import { makePrismaMock } from './helpers/prisma-mock'

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

const sendTemplatedMailMock = jest.fn()
jest.mock('@/lib/services/sendTemplatedMail', () => ({
  sendTemplatedMail: (...a: unknown[]) => sendTemplatedMailMock(...a),
}))
jest.mock('@/lib/services/user.service', () => ({
  findAllUserByRoles: jest.fn().mockResolvedValue([]),
}))
jest.mock('@/lib/cache/redis-cache.service', () => ({
  availabilityCacheService: {
    invalidateAvailability: jest.fn().mockResolvedValue(undefined),
  },
}))
jest.mock('@/lib/cache/invalidation', () => ({
  invalidateProductCache: jest.fn().mockResolvedValue(undefined),
}))
const loggerWarnMock = jest.fn()
jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), debug: jest.fn(), warn: (...a: unknown[]) => loggerWarnMock(...a), error: jest.fn() },
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
  extrasTotal: 0,
  extrasDetails: [],
  clientCommission: 0,
  hostCommission: 0,
  platformAmount: 0,
  hostAmount: 400,
  totalAmount: 400,
  summary: {},
}

/** A fully-populated createdRent so the owner + guest send branches are reached. */
function makeTx() {
  const tx = makePrismaMock()
  tx.product.findUnique.mockResolvedValue({ availableRooms: 1 })
  tx.rent.findFirst.mockResolvedValue(null)
  tx.rent.create.mockResolvedValue({
    id: 'rent-1',
    productId: 'p1',
    arrivingDate: A,
    leavingDate: L,
    product: {
      name: 'Villa',
      address: '1 Main St',
      completeAddress: '1 Main St, City',
      proximityLandmarks: ['Beach'],
      arriving: '14:00',
      leaving: '11:00',
      phone: '+261000000',
      type: { name: 'Hotel' },
      owner: { email: 'owner@example.com', name: 'Owner' },
    },
    user: { email: 'guest@example.com', name: 'Guest' },
    options: [],
    extras: [],
  })
  return tx
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
    prices: 400,
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  prismaMock.user.findUnique.mockResolvedValue({ id: 'u1' })
  prismaMock.product.findFirst.mockResolvedValue({ id: 'p1', autoAccept: false })
  // Shared by the pre-tx settings lookup AND the post-tx notification `request`
  // lookup; truthy so the notification block proceeds to the sends.
  prismaMock.product.findUnique.mockResolvedValue({
    autoAccept: false,
    ownerId: 'o1',
    type: { name: 'Hotel' },
    owner: { id: 'o1', name: 'Owner', email: 'owner@example.com' },
  })
  checkRentIsAvailableMock.mockResolvedValue({ available: true })
  calculateCompleteBookingPriceMock.mockResolvedValue(SINGLE_PRICING)

  const tx = makeTx()
  prismaMock.$transaction.mockImplementation(async (cb: (c: unknown) => unknown) => cb(tx))
})

describe('createRent — post-commit emails are non-fatal', () => {
  it('still resolves with the created rent when the owner + guest emails both reject', async () => {
    sendTemplatedMailMock.mockRejectedValue(new Error('Brevo 401 Unauthorized'))

    const rent = await createRent(baseParams())

    // The booking result is returned regardless of email outcome.
    expect(rent.id).toBe('rent-1')
    // Both post-commit sends were attempted (owner + guest).
    expect(sendTemplatedMailMock).toHaveBeenCalledTimes(2)
    expect(sendTemplatedMailMock.mock.calls[0][0]).toBe('owner@example.com')
    expect(sendTemplatedMailMock.mock.calls[1][0]).toBe('guest@example.com')
    // Each failure is logged, not thrown.
    expect(loggerWarnMock).toHaveBeenCalled()
  })

  it('resolves normally when the emails succeed (success path unchanged)', async () => {
    sendTemplatedMailMock.mockResolvedValue({ success: true })

    const rent = await createRent(baseParams())

    expect(rent.id).toBe('rent-1')
    expect(sendTemplatedMailMock).toHaveBeenCalledTimes(2)
  })
})
