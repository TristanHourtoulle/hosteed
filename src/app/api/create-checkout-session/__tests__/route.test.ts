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
  productFindUniqueMock.mockResolvedValue({
    ownerId: 'o1',
    roomTypes: [{ id: 'rt-1' }, { id: 'rt-2' }],
  })
  createCheckoutSessionMock.mockResolvedValue({ success: true, url: 'http://stripe/session' })
  calculateCompleteBookingPriceMock.mockResolvedValue({ totalAmount: 250 })
  calculateHotelBookingPriceMock.mockResolvedValue({ totalAmount: 1180 })
})

describe('POST /api/create-checkout-session', () => {
  it('computes the Stripe amount as the sum of room-type lines for a hotel booking', async () => {
    const res = await POST(
      makeRequest({ roomTypeLines: JSON.stringify([{ roomTypeId: 'rt-1', quantity: 1 }]) })
    )

    expect(res.status).toBe(200)
    expect(calculateHotelBookingPriceMock).toHaveBeenCalledTimes(1)
    expect(calculateCompleteBookingPriceMock).not.toHaveBeenCalled()
    const arg = createCheckoutSessionMock.mock.calls[0][0]
    expect(arg.amount).toBe(1180)
    expect(arg.metadata.prices).toBe('1180')
    expect(arg.metadata.roomTypeLines).toBe(JSON.stringify([{ roomTypeId: 'rt-1', quantity: 1 }]))
  })

  it('rejects when the selected room lines are all invalid (tampered ids)', async () => {
    const res = await POST(
      makeRequest({ roomTypeLines: JSON.stringify([{ roomTypeId: 'not-in-product', quantity: 1 }]) })
    )

    expect(res.status).toBe(400)
    expect(createCheckoutSessionMock).not.toHaveBeenCalled()
  })

  it('keeps the legacy single-product pricing when roomTypeLines is absent', async () => {
    const res = await POST(makeRequest())

    expect(res.status).toBe(200)
    expect(calculateCompleteBookingPriceMock).toHaveBeenCalledTimes(1)
    expect(calculateHotelBookingPriceMock).not.toHaveBeenCalled()
    const arg = createCheckoutSessionMock.mock.calls[0][0]
    expect(arg.amount).toBe(250)
    expect(arg.metadata.roomTypeLines).toBeUndefined()
  })
})
