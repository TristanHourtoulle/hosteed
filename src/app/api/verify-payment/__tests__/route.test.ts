/**
 * Tests for the verify-payment route.
 *
 * Auth, Stripe SDK, prisma and createRent are mocked at the boundary.
 */

const authMock = jest.fn()
jest.mock('@/lib/auth', () => ({ auth: () => authMock() }))

const mockSessionsRetrieve = jest.fn()
const mockSessionsList = jest.fn()
const mockPaymentIntentsRetrieve = jest.fn()

jest.mock('stripe', () =>
  jest.fn().mockImplementation(() => ({
    checkout: { sessions: { retrieve: mockSessionsRetrieve, list: mockSessionsList } },
    paymentIntents: { retrieve: mockPaymentIntentsRetrieve },
  }))
)

const rentFindFirstMock = jest.fn()
const rentUpdateMock = jest.fn()
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    rent: {
      findFirst: (...a: unknown[]) => rentFindFirstMock(...a),
      update: (...a: unknown[]) => rentUpdateMock(...a),
    },
  },
}))

const createRentMock = jest.fn()
jest.mock('@/lib/services/rents.service', () => ({
  createRent: (...a: unknown[]) => createRentMock(...a),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}))

import { BookingConflictError } from '@/lib/errors/booking.errors'
import { POST } from '../route'

beforeAll(() => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_dummy'
})

beforeEach(() => {
  jest.clearAllMocks()
  authMock.mockResolvedValue({ user: { id: 'user-1' } })
})

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/verify-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('auth and validation', () => {
  it('returns 401 when unauthenticated', async () => {
    authMock.mockResolvedValue(null)
    const res = await POST(makeRequest({ sessionId: 'cs_1' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when neither sessionId nor paymentIntent is provided', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('VAL_001')
  })
})

describe('payment retrieval', () => {
  it('returns 404 when no payment intent can be resolved', async () => {
    mockSessionsRetrieve.mockResolvedValue({ id: 'cs_1', payment_intent: null, metadata: {} })
    const res = await POST(makeRequest({ sessionId: 'cs_1' }))
    expect(res.status).toBe(404)
  })

  it('returns 400 when the payment intent is in a non-payable state', async () => {
    mockSessionsRetrieve.mockResolvedValue({ id: 'cs_1', payment_intent: 'pi_1', metadata: {} })
    mockPaymentIntentsRetrieve.mockResolvedValue({ id: 'pi_1', status: 'canceled' })

    const res = await POST(makeRequest({ sessionId: 'cs_1' }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Paiement non validé')
  })

  it('returns the reservation for an existing paid rent owned by the caller', async () => {
    mockSessionsRetrieve.mockResolvedValue({ id: 'cs_1', payment_intent: 'pi_1', metadata: {} })
    mockPaymentIntentsRetrieve.mockResolvedValue({ id: 'pi_1', status: 'succeeded' })
    rentFindFirstMock.mockResolvedValue({
      id: 'rent-1',
      userId: 'user-1',
      arrivingDate: new Date('2026-08-01T00:00:00.000Z'),
      leavingDate: new Date('2026-08-05T00:00:00.000Z'),
      prices: '450',
      product: { name: 'Villa' },
    })

    const res = await POST(makeRequest({ sessionId: 'cs_1' }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.reservation).toMatchObject({
      id: 'rent-1',
      productName: 'Villa',
      totalPrice: 450,
    })
    expect(createRentMock).not.toHaveBeenCalled()
  })

  it('returns 403 when the rent belongs to another user', async () => {
    mockPaymentIntentsRetrieve.mockResolvedValue({ id: 'pi_1', status: 'succeeded' })
    mockSessionsList.mockResolvedValue({ data: [] })
    rentFindFirstMock.mockResolvedValue({
      id: 'rent-1',
      userId: 'someone-else',
      arrivingDate: new Date('2026-08-01'),
      leavingDate: new Date('2026-08-05'),
      prices: '450',
      product: { name: 'Villa' },
    })

    const res = await POST(makeRequest({ paymentIntent: 'pi_1' }))

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error.code).toBe('AUTH_002')
  })
})

describe('lazy rent creation from session metadata', () => {
  it('creates the rent from metadata when none exists yet', async () => {
    mockSessionsRetrieve.mockResolvedValue({
      id: 'cs_1',
      payment_intent: 'pi_1',
      metadata: {
        productId: 'prod-1',
        userId: 'user-1',
        arrivingDate: '2026-08-01',
        leavingDate: '2026-08-05',
        peopleNumber: '2',
        prices: '450',
        selectedExtras: '[]',
      },
    })
    mockPaymentIntentsRetrieve.mockResolvedValue({ id: 'pi_1', status: 'succeeded' })
    rentFindFirstMock.mockResolvedValue(null)
    createRentMock.mockResolvedValue({ id: 'rent-new' })
    rentUpdateMock.mockResolvedValue({
      id: 'rent-new',
      userId: 'user-1',
      arrivingDate: new Date('2026-08-01T00:00:00.000Z'),
      leavingDate: new Date('2026-08-05T00:00:00.000Z'),
      prices: '450',
      product: { name: 'Villa' },
    })

    const res = await POST(makeRequest({ sessionId: 'cs_1' }))

    expect(res.status).toBe(200)
    expect(createRentMock).toHaveBeenCalledTimes(1)
    const arg = createRentMock.mock.calls[0][0]
    expect(arg.stripeId).toBe('pi_1')
    // Server-authored amount from metadata.
    expect(arg.prices).toBe(450)
    // succeeded => rent moved to RESERVED / CLIENT_PAID
    expect(rentUpdateMock.mock.calls[0][0].data.status).toBe('RESERVED')
    expect(rentUpdateMock.mock.calls[0][0].data.payment).toBe('CLIENT_PAID')
  })

  it('returns 409 when rent creation conflicts on dates', async () => {
    mockSessionsRetrieve.mockResolvedValue({
      id: 'cs_1',
      payment_intent: 'pi_1',
      metadata: {
        productId: 'prod-1',
        userId: 'user-1',
        arrivingDate: '2026-08-01',
        leavingDate: '2026-08-05',
        peopleNumber: '2',
        prices: '450',
      },
    })
    mockPaymentIntentsRetrieve.mockResolvedValue({ id: 'pi_1', status: 'requires_capture' })
    rentFindFirstMock.mockResolvedValue(null)
    createRentMock.mockRejectedValue(new BookingConflictError('dates taken'))

    const res = await POST(makeRequest({ sessionId: 'cs_1' }))

    expect(res.status).toBe(409)
  })

  it('returns 404 when no rent exists and metadata is insufficient to create one', async () => {
    mockSessionsRetrieve.mockResolvedValue({
      id: 'cs_1',
      payment_intent: 'pi_1',
      metadata: { productId: 'prod-1' }, // incomplete
    })
    mockPaymentIntentsRetrieve.mockResolvedValue({ id: 'pi_1', status: 'succeeded' })
    rentFindFirstMock.mockResolvedValue(null)

    const res = await POST(makeRequest({ sessionId: 'cs_1' }))

    expect(res.status).toBe(404)
    expect(createRentMock).not.toHaveBeenCalled()
  })
})
