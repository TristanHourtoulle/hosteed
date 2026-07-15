/**
 * POST/GET /api/promotions route handler. Auth, prisma and the promotion service
 * are mocked at the boundary (node env). Covers auth/role gating, ownership
 * checks, the 409 overlap path, and the admin-vs-host GET branch.
 */

const authMock = jest.fn()
jest.mock('@/lib/auth', () => ({ auth: () => authMock() }))

const createPromotion = jest.fn()
const getPromotionsByHost = jest.fn()
jest.mock('@/lib/services/promotion.service', () => ({
  createPromotion: (...a: unknown[]) => createPromotion(...a),
  getPromotionsByHost: (...a: unknown[]) => getPromotionsByHost(...a),
}))

const productFindUnique = jest.fn()
const productPromotionFindMany = jest.fn()
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    product: { findUnique: (...a: unknown[]) => productFindUnique(...a) },
    productPromotion: { findMany: (...a: unknown[]) => productPromotionFindMany(...a) },
  },
}))

import { POST, GET } from '../route'

function makePost(body: Record<string, unknown>) {
  return new Request('http://localhost/api/promotions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as never
}

const validBody = {
  productId: 'p1',
  discountPercentage: 10,
  startDate: '2026-01-01',
  endDate: '2026-01-10',
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

describe('POST /api/promotions', () => {
  it('returns 401 when unauthenticated', async () => {
    authMock.mockResolvedValue(null)
    const res = await POST(makePost(validBody))
    expect(res.status).toBe(401)
  })

  it('returns 403 for a disallowed role', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', roles: 'USER' } })
    const res = await POST(makePost(validBody))
    expect(res.status).toBe(403)
  })

  it('returns 400 when required fields are missing', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', roles: 'HOST' } })
    const res = await POST(makePost({ productId: 'p1' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for an invalid roomTypeId type', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', roles: 'HOST' } })
    productFindUnique.mockResolvedValue({ ownerId: 'u1' })
    const res = await POST(makePost({ ...validBody, roomTypeId: 123 }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('roomTypeId invalide')
  })

  it('returns 404 when a host targets a non-existent product', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', roles: 'HOST' } })
    productFindUnique.mockResolvedValue(null)
    const res = await POST(makePost(validBody))
    expect(res.status).toBe(404)
  })

  it('returns 403 when a host targets a product they do not own', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', roles: 'HOST' } })
    productFindUnique.mockResolvedValue({ ownerId: 'someone-else' })
    const res = await POST(makePost(validBody))
    expect(res.status).toBe(403)
  })

  it('returns 409 with overlapping promotions when an overlap is detected', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', roles: 'ADMIN' } })
    createPromotion.mockResolvedValue({
      hasOverlap: true,
      overlappingPromotions: [{ id: 'o1' }],
    })

    const res = await POST(makePost(validBody))

    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.requiresConfirmation).toBe(true)
    expect(body.overlappingPromotions).toEqual([{ id: 'o1' }])
  })

  it('creates the promotion (201) for an admin without an ownership check', async () => {
    authMock.mockResolvedValue({ user: { id: 'admin1', roles: 'ADMIN' } })
    createPromotion.mockResolvedValue({ promotion: { id: 'promo1' } })

    const res = await POST(makePost(validBody))

    expect(res.status).toBe(201)
    expect(productFindUnique).not.toHaveBeenCalled()
    const data = createPromotion.mock.calls[0][0]
    expect(data.roomTypeId).toBeNull()
    expect(data.createdById).toBe('admin1')
  })

  it('returns 500 when the service throws', async () => {
    authMock.mockResolvedValue({ user: { id: 'admin1', roles: 'ADMIN' } })
    createPromotion.mockRejectedValue(new Error('boom'))
    const res = await POST(makePost(validBody))
    expect(res.status).toBe(500)
  })
})

describe('GET /api/promotions', () => {
  it('returns 401 when unauthenticated', async () => {
    authMock.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns all promotions for an admin', async () => {
    authMock.mockResolvedValue({ user: { id: 'admin1', roles: 'ADMIN' } })
    productPromotionFindMany.mockResolvedValue([{ id: 'all1' }])

    const res = await GET()

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([{ id: 'all1' }])
    expect(getPromotionsByHost).not.toHaveBeenCalled()
  })

  it("returns only the host's promotions for a host", async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', roles: 'HOST' } })
    getPromotionsByHost.mockResolvedValue([{ id: 'host1' }])

    const res = await GET()

    expect(await res.json()).toEqual([{ id: 'host1' }])
    expect(getPromotionsByHost).toHaveBeenCalledWith('u1')
  })
})
