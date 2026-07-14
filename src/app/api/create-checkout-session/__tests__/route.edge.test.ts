/**
 * create-checkout-session — auth/authorization and validation edge cases.
 * Complements `route.test.ts` (pricing/room-line happy paths). All boundaries
 * (auth, Stripe, pricing, prisma) mocked. Asserts the server never trusts the
 * client: auth gate, user match, product existence, date + amount validation.
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

jest.mock('@/lib/logger', () => ({ logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() } }))

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

describe('POST /api/create-checkout-session — guards', () => {
  it('401 when unauthenticated', async () => {
    authMock.mockResolvedValue(null)

    const res = await POST(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error.code).toBe('AUTH_001')
  })

  it('403 when the metadata userId does not match the session', async () => {
    const res = await POST(makeRequest({ userId: 'someone-else' }))
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.error.code).toBe('AUTH_002')
    expect(createCheckoutSessionMock).not.toHaveBeenCalled()
  })

  it('400 (VAL_001) when the payload fails schema validation', async () => {
    const bad = new Request('http://localhost/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName: '', metadata: {} }),
    })

    const res = await POST(bad)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error.code).toBe('VAL_001')
  })

  it('400 (VAL_002) when leaving date is not after arriving date', async () => {
    const res = await POST(
      makeRequest({ arrivingDate: '2026-08-05', leavingDate: '2026-08-01' })
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error.code).toBe('VAL_002')
  })

  it('404 when the product does not exist', async () => {
    productFindUniqueMock.mockResolvedValue(null)

    const res = await POST(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error.code).toBe('VAL_003')
  })

  it('400 (VAL_004) when a hotel selection has only invalid room lines', async () => {
    productFindUniqueMock.mockResolvedValue({
      ownerId: 'o1',
      roomTypes: [{ id: 'rt-1', capacity: 2 }],
    })

    const res = await POST(
      makeRequest({ roomTypeLines: JSON.stringify([{ roomTypeId: 'nope', quantity: 1 }]) })
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error.code).toBe('VAL_004')
  })

  it('400 (VAL_005) when the server-computed amount is not positive', async () => {
    calculateCompleteBookingPriceMock.mockResolvedValue({ totalAmount: 0 })

    const res = await POST(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error.code).toBe('VAL_005')
    expect(createCheckoutSessionMock).not.toHaveBeenCalled()
  })

  it('500 when Stripe session creation fails', async () => {
    createCheckoutSessionMock.mockResolvedValue({ success: false, error: 'stripe error' })

    const res = await POST(makeRequest())

    expect(res.status).toBe(500)
  })
})
