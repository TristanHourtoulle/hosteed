/**
 * A host creating a promotion for one of their hotels must be able to scope it
 * to a room type: the POST /api/promotions handler forwards `roomTypeId` to the
 * service so it is persisted. Prisma and the service are mocked (node env).
 */

const authMock = jest.fn()
jest.mock('@/lib/auth', () => ({ auth: () => authMock() }))

const createPromotionMock = jest.fn()
const getPromotionsByHostMock = jest.fn()
jest.mock('@/lib/services/promotion.service', () => ({
  createPromotion: (...a: unknown[]) => createPromotionMock(...a),
  getPromotionsByHost: (...a: unknown[]) => getPromotionsByHostMock(...a),
}))

const productFindUnique = jest.fn()
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: { product: { findUnique: (...a: unknown[]) => productFindUnique(...a) } },
}))

import { POST } from '../route'

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/promotions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const validBody = {
  productId: 'p1',
  discountPercentage: 10,
  startDate: '2035-06-01',
  endDate: '2035-06-10',
}

beforeEach(() => {
  jest.clearAllMocks()
  authMock.mockResolvedValue({ user: { id: 'host1', roles: 'HOST' } })
  productFindUnique.mockResolvedValue({ ownerId: 'host1' })
  createPromotionMock.mockResolvedValue({ promotion: { id: 'promo1' } })
})

describe('POST /api/promotions roomType scoping', () => {
  it('persists roomTypeId when the host scopes a promotion to a room type', async () => {
    const res = await POST(makeRequest({ ...validBody, roomTypeId: 'rt1' }))

    expect(res.status).toBe(201)
    expect(createPromotionMock).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 'p1', roomTypeId: 'rt1', createdById: 'host1' })
    )
  })

  it('defaults roomTypeId to null for an establishment-wide promotion', async () => {
    const res = await POST(makeRequest(validBody))

    expect(res.status).toBe(201)
    expect(createPromotionMock).toHaveBeenCalledWith(
      expect.objectContaining({ roomTypeId: null })
    )
  })

  it('rejects a non-string roomTypeId', async () => {
    const res = await POST(makeRequest({ ...validBody, roomTypeId: 123 }))

    expect(res.status).toBe(400)
    expect(createPromotionMock).not.toHaveBeenCalled()
  })
})
