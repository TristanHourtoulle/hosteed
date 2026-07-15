/**
 * Lifecycle transitions for a reservation (approve / cancel / status / reject /
 * confirm). Prisma, Stripe, email and cache are all mocked at the boundary — no
 * real DB or network. Focus: correct status writes, Stripe capture/refund calls,
 * availability-cache invalidation, and error propagation semantics (some paths
 * throw, others swallow into a `{ success: false }` result).
 */
const prismaMock = {
  rent: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  rentRejection: {
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
}

jest.mock('@/lib/prisma', () => ({ __esModule: true, default: prismaMock }))

const capturePaymentIntentMock = jest.fn()
const refundPaymentIntentMock = jest.fn()
jest.mock('@/lib/services/stripe', () => ({
  StripeService: {
    capturePaymentIntent: (...a: unknown[]) => capturePaymentIntentMock(...a),
    RefundPaymentIntent: (...a: unknown[]) => refundPaymentIntentMock(...a),
  },
}))

const sendTemplatedMailMock = jest.fn()
jest.mock('@/lib/services/sendTemplatedMail', () => ({
  sendTemplatedMail: (...a: unknown[]) => sendTemplatedMailMock(...a),
}))

jest.mock('@/lib/services/user.service', () => ({
  findAllUserByRoles: jest.fn().mockResolvedValue([]),
}))

const invalidateAvailabilityMock = jest.fn().mockResolvedValue(undefined)
jest.mock('@/lib/cache/redis-cache.service', () => ({
  availabilityCacheService: {
    invalidateAvailability: (...a: unknown[]) => invalidateAvailabilityMock(...a),
  },
}))

const invalidateProductCacheMock = jest.fn().mockResolvedValue(undefined)
jest.mock('@/lib/cache/invalidation', () => ({
  invalidateProductCache: (...a: unknown[]) => invalidateProductCacheMock(...a),
}))

const sendGuestRejectionNotificationMock = jest.fn().mockResolvedValue(undefined)
const notifyAdminOfRejectionMock = jest.fn().mockResolvedValue(undefined)
jest.mock('../rent-notifications.service', () => ({
  sendGuestRejectionNotification: (...a: unknown[]) => sendGuestRejectionNotificationMock(...a),
  notifyAdminOfRejection: (...a: unknown[]) => notifyAdminOfRejectionMock(...a),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))

import { RentStatus } from '@prisma/client'
import {
  confirmRentByHost,
  approveRent,
  cancelRent,
  changeRentStatus,
  rejectRentRequest,
} from '../rent-lifecycle.service'

const A = new Date('2026-08-01T00:00:00.000Z')
const L = new Date('2026-08-05T00:00:00.000Z')

/** A fully-populated rent as returned by the deep `include` queries. */
function rentFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'rent-1',
    productId: 'prod-1',
    userId: 'guest-1',
    stripeId: 'pi_123',
    arrivingDate: A,
    leavingDate: L,
    prices: BigInt(400),
    status: RentStatus.WAITING,
    payment: 'NOT_PAID',
    user: { email: 'guest@test.com', name: 'Guest' },
    product: {
      name: 'Nice Room',
      address: '1 rue',
      arriving: '14:00',
      leaving: '11:00',
      phone: '0600',
      completeAddress: '1 rue, city',
      proximityLandmarks: ['metro'],
      type: { name: 'Hotel' },
      owner: { id: 'owner-1', name: 'Owner', email: 'owner@test.com' },
    },
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  capturePaymentIntentMock.mockResolvedValue({ success: true })
  refundPaymentIntentMock.mockResolvedValue({ success: true })
  sendTemplatedMailMock.mockResolvedValue(undefined)
})

// ------------------------------------------------------------------
// confirmRentByHost
// ------------------------------------------------------------------
describe('confirmRentByHost', () => {
  it('marks the rent accepted + confirmed and mails the guest', async () => {
    prismaMock.rent.findFirst.mockResolvedValue(rentFixture())
    prismaMock.rent.update.mockResolvedValue({})

    const result = await confirmRentByHost('rent-1')

    expect(prismaMock.rent.update).toHaveBeenCalledWith({
      where: { id: 'rent-1' },
      data: { accepted: true, confirmed: true },
    })
    expect(sendTemplatedMailMock).toHaveBeenCalledWith(
      'guest@test.com',
      expect.any(String),
      'confirmation-reservation.html',
      expect.objectContaining({ listing_title: 'Nice Room' })
    )
    expect(result).toEqual({ success: true, message: expect.any(String) })
  })

  it('returns a failure result (does not throw) when the rent is missing', async () => {
    prismaMock.rent.findFirst.mockResolvedValue(null)

    const result = await confirmRentByHost('missing')

    expect(result.success).toBe(false)
    expect(result).toHaveProperty('error')
    expect(prismaMock.rent.update).not.toHaveBeenCalled()
  })
})

// ------------------------------------------------------------------
// approveRent
// ------------------------------------------------------------------
describe('approveRent', () => {
  it('captures the Stripe payment, sets RESERVED/CLIENT_PAID and invalidates cache', async () => {
    prismaMock.rent.findFirst.mockResolvedValue(rentFixture())
    prismaMock.rent.update.mockResolvedValue({})

    const result = await approveRent('rent-1')

    expect(capturePaymentIntentMock).toHaveBeenCalledWith('pi_123')
    expect(prismaMock.rent.update).toHaveBeenCalledWith({
      where: { id: 'rent-1' },
      data: { status: 'RESERVED', payment: 'CLIENT_PAID', accepted: true, confirmed: true },
    })
    expect(invalidateAvailabilityMock).toHaveBeenCalledWith('prod-1')
    expect(invalidateProductCacheMock).toHaveBeenCalledWith('prod-1')
    expect(result).toEqual({ success: true })
  })

  it('throws when the rent is missing a stripeId', async () => {
    prismaMock.rent.findFirst.mockResolvedValue(rentFixture({ stripeId: null }))

    await expect(approveRent('rent-1')).rejects.toThrow(/not found|missing/)
    expect(capturePaymentIntentMock).not.toHaveBeenCalled()
  })

  it('throws when the rent does not exist', async () => {
    prismaMock.rent.findFirst.mockResolvedValue(null)

    await expect(approveRent('missing')).rejects.toThrow()
    expect(prismaMock.rent.update).not.toHaveBeenCalled()
  })
})

// ------------------------------------------------------------------
// cancelRent
// ------------------------------------------------------------------
describe('cancelRent', () => {
  it('refunds Stripe, sets CANCEL, invalidates cache and mails the guest', async () => {
    prismaMock.rent.findUnique.mockResolvedValue(rentFixture())
    prismaMock.rent.update.mockResolvedValue({})

    await cancelRent('rent-1')

    expect(refundPaymentIntentMock).toHaveBeenCalledWith('pi_123')
    expect(prismaMock.rent.update).toHaveBeenCalledWith({
      where: { id: 'rent-1' },
      data: { status: 'CANCEL' },
    })
    expect(invalidateAvailabilityMock).toHaveBeenCalledWith('prod-1')
    expect(sendTemplatedMailMock).toHaveBeenCalledWith(
      'guest@test.com',
      expect.any(String),
      'annulation.html',
      expect.any(Object)
    )
  })

  it('skips the Stripe refund + status update when there is no stripeId, but still mails', async () => {
    prismaMock.rent.findUnique.mockResolvedValue(rentFixture({ stripeId: null }))

    await cancelRent('rent-1')

    expect(refundPaymentIntentMock).not.toHaveBeenCalled()
    expect(prismaMock.rent.update).not.toHaveBeenCalled()
    expect(sendTemplatedMailMock).toHaveBeenCalledWith(
      'guest@test.com',
      expect.any(String),
      'annulation.html',
      expect.any(Object)
    )
  })

  it('returns an error object when the Stripe refund fails', async () => {
    prismaMock.rent.findUnique.mockResolvedValue(rentFixture())
    refundPaymentIntentMock.mockResolvedValue(null)

    const result = await cancelRent('rent-1')

    expect(result).toEqual({ error: expect.any(String) })
    expect(prismaMock.rent.update).not.toHaveBeenCalled()
  })

  it('returns an error object when the rent is missing', async () => {
    prismaMock.rent.findUnique.mockResolvedValue(null)

    const result = await cancelRent('missing')

    expect(result).toEqual({ error: expect.any(String) })
  })
})

// ------------------------------------------------------------------
// changeRentStatus
// ------------------------------------------------------------------
describe('changeRentStatus', () => {
  it('updates the status and invalidates availability caches', async () => {
    prismaMock.rent.findUnique.mockResolvedValue(rentFixture())
    prismaMock.rent.update.mockResolvedValue({})

    await changeRentStatus('rent-1', RentStatus.CHECKIN)

    expect(prismaMock.rent.update).toHaveBeenCalledWith({
      where: { id: 'rent-1' },
      data: { status: RentStatus.CHECKIN },
    })
    expect(invalidateAvailabilityMock).toHaveBeenCalledWith('prod-1')
    // No review email for a non-CHECKOUT transition.
    expect(sendTemplatedMailMock).not.toHaveBeenCalled()
  })

  it('sends the review-request email on CHECKOUT', async () => {
    prismaMock.rent.findUnique.mockResolvedValue(rentFixture())
    prismaMock.rent.update.mockResolvedValue({})

    await changeRentStatus('rent-1', RentStatus.CHECKOUT)

    expect(sendTemplatedMailMock).toHaveBeenCalledWith(
      'guest@test.com',
      expect.any(String),
      'review-request.html',
      expect.objectContaining({ rentId: 'rent-1' })
    )
  })

  it('throws when the rent does not exist', async () => {
    prismaMock.rent.findUnique.mockResolvedValue(null)

    await expect(changeRentStatus('missing', RentStatus.CANCEL)).rejects.toThrow()
    expect(prismaMock.rent.update).not.toHaveBeenCalled()
  })
})

// ------------------------------------------------------------------
// rejectRentRequest
// ------------------------------------------------------------------
describe('rejectRentRequest', () => {
  it('rejects a WAITING request: CANCEL status, rejection record, notifications', async () => {
    prismaMock.rent.findFirst.mockResolvedValue(
      rentFixture({ product: { ...rentFixture().product, owner: { id: 'owner-1' } } })
    )
    prismaMock.rent.update.mockResolvedValue({ id: 'rent-1', status: RentStatus.CANCEL })
    prismaMock.rentRejection.create.mockResolvedValue({ id: 'rej-1' })

    const result = await rejectRentRequest('rent-1', 'owner-1', 'reason', 'message')

    expect(prismaMock.rent.update).toHaveBeenCalledWith({
      where: { id: 'rent-1' },
      data: { status: RentStatus.CANCEL },
    })
    expect(prismaMock.rentRejection.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        rentId: 'rent-1',
        hostId: 'owner-1',
        reason: 'reason',
        message: 'message',
        guestId: 'guest-1',
      }),
    })
    expect(invalidateAvailabilityMock).toHaveBeenCalledWith('prod-1')
    expect(sendGuestRejectionNotificationMock).toHaveBeenCalledTimes(1)
    expect(notifyAdminOfRejectionMock).toHaveBeenCalledTimes(1)
    expect(result.success).toBe(true)
    expect(result.rejection).toEqual({ id: 'rej-1' })
  })

  it('returns an authorization failure when no matching WAITING rent is found', async () => {
    prismaMock.rent.findFirst.mockResolvedValue(null)

    const result = await rejectRentRequest('rent-1', 'not-owner', 'reason', 'message')

    expect(result.success).toBe(false)
    expect(result).toHaveProperty('error')
    expect(prismaMock.rent.update).not.toHaveBeenCalled()
    expect(prismaMock.rentRejection.create).not.toHaveBeenCalled()
  })

  it('returns a failure result when persistence throws', async () => {
    prismaMock.rent.findFirst.mockResolvedValue(
      rentFixture({ product: { ...rentFixture().product, owner: { id: 'owner-1' } } })
    )
    prismaMock.rent.update.mockRejectedValue(new Error('db down'))

    const result = await rejectRentRequest('rent-1', 'owner-1', 'reason', 'message')

    expect(result.success).toBe(false)
    expect(result).toHaveProperty('error')
  })
})
