/**
 * Amount-authority and access-control tests for the create-checkout-session
 * route. Complements route.test.ts (which covers hotel vs legacy pricing).
 *
 * The point of these tests: the server is the sole authority on the charged
 * amount and on who may pay — the client can never tamper with either.
 */

const authMock = jest.fn()
jest.mock('@/lib/auth', () => ({ auth: () => authMock() }))

const createCheckoutSessionMock = jest.fn()
jest.mock('@/lib/services/stripe', () => ({
  StripeService: { createCheckoutSession: (...a: unknown[]) => createCheckoutSessionMock(...a) },
}))

const calculateCompleteBookingPriceMock = jest.fn()
const calculateHotelBookingPriceMock = jest.fn()
jest.mock('@/lib/services/booking-pricing.service', () => ({
  calculateCompleteBookingPrice: (...a: unknown[]) => calculateCompleteBookingPriceMock(...a),
  calculateHotelBookingPrice: (...a: unknown[]) => calculateHotelBookingPriceMock(...a),
}))

const productFindUniqueMock = jest.fn()
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: { product: { findUnique: (...a: unknown[]) => productFindUniqueMock(...a) } },
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}))

import { POST } from '../route'

function makeRequest(metadataOverrides: Record<string, string> = {}) {
  const metadata = {
    productId: 'p1',
    userId: 'u1',
    userEmail: 'u@u.com',
    productName: 'Hotel',
    arrivingDate: '2026-08-01',
    leavingDate: '2026-08-03',
    peopleNumber: '2',
    firstName: 'A',
    lastName: 'B',
    phone: '123',
    specialRequests: '',
    selectedExtras: '[]',
    ...metadataOverrides,
  }
  return new Request('http://localhost/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productName: 'Hotel', metadata }),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  authMock.mockResolvedValue({ user: { id: 'u1' } })
  productFindUniqueMock.mockResolvedValue({ ownerId: 'o1', roomTypes: [] })
  createCheckoutSessionMock.mockResolvedValue({ success: true, url: 'http://stripe/session' })
  calculateCompleteBookingPriceMock.mockResolvedValue({ totalAmount: 250 })
})

describe('access control', () => {
  it('returns 401 when unauthenticated', async () => {
    authMock.mockResolvedValue(null)
    const res = await POST(makeRequest())
    expect(res.status).toBe(401)
    expect(createCheckoutSessionMock).not.toHaveBeenCalled()
  })

  it('returns 403 when the metadata userId does not match the session user', async () => {
    authMock.mockResolvedValue({ user: { id: 'someone-else' } })
    const res = await POST(makeRequest())
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error.code).toBe('AUTH_002')
    expect(createCheckoutSessionMock).not.toHaveBeenCalled()
  })
})

describe('input validation', () => {
  it('returns 400 when the leaving date is not after the arriving date', async () => {
    const res = await POST(makeRequest({ arrivingDate: '2026-08-03', leavingDate: '2026-08-01' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('VAL_002')
  })

  it('returns 404 when the product does not exist', async () => {
    productFindUniqueMock.mockResolvedValue(null)
    const res = await POST(makeRequest())
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error.code).toBe('VAL_003')
  })
})

describe('amount authority', () => {
  it('charges the server-computed amount and stamps it into metadata.prices', async () => {
    calculateCompleteBookingPriceMock.mockResolvedValue({ totalAmount: 312.7 })

    const res = await POST(makeRequest())

    expect(res.status).toBe(200)
    const arg = createCheckoutSessionMock.mock.calls[0][0]
    // Math.round applied server-side (312.7 => 313)
    expect(arg.amount).toBe(313)
    expect(arg.metadata.prices).toBe('313')
  })

  it('ignores any client-supplied price in the metadata', async () => {
    calculateCompleteBookingPriceMock.mockResolvedValue({ totalAmount: 250 })

    // Client tries to inject a cheaper price of 1.
    const res = await POST(makeRequest({ prices: '1' } as Record<string, string>))

    expect(res.status).toBe(200)
    const arg = createCheckoutSessionMock.mock.calls[0][0]
    expect(arg.amount).toBe(250)
    expect(arg.metadata.prices).toBe('250') // server value wins, not '1'
  })

  it('rejects a booking whose server-computed amount is not positive', async () => {
    calculateCompleteBookingPriceMock.mockResolvedValue({ totalAmount: 0 })

    const res = await POST(makeRequest())

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('VAL_005')
    expect(createCheckoutSessionMock).not.toHaveBeenCalled()
  })

  it('propagates a 500 when Stripe session creation fails', async () => {
    createCheckoutSessionMock.mockResolvedValue({ success: false, error: 'stripe down' })

    const res = await POST(makeRequest())

    expect(res.status).toBe(500)
  })
})
