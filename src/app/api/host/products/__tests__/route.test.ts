/**
 * Host products endpoint must expose enough hotel metadata for the shared
 * PromotionForm to scope a promotion to a room type: `isHotel` (derived from
 * the product type) and a lean `roomTypes` list (id + name). Non-hotel products
 * report `isHotel: false` with an empty room-type list. It must also never be
 * served from a stale HTTP cache, since the per-host list changes on
 * create/edit/delete (root cause of TRI-1009). Prisma is not touched here — the
 * service layer is mocked at the boundary (node env).
 */

const authMock = jest.fn()
jest.mock('@/lib/auth', () => ({
  auth: (...a: unknown[]) => authMock(...a),
}))

const findAllProductByHostIdPaginatedMock = jest.fn()
jest.mock('@/lib/services/product.service', () => ({
  findAllProductByHostIdPaginated: (...a: unknown[]) => findAllProductByHostIdPaginatedMock(...a),
}))

import { NextRequest } from 'next/server'
import { GET } from '../route'

function makeRequest(query: Record<string, string> = {}): NextRequest {
  const params = new URLSearchParams({ page: '1', limit: '20', ...query })
  return new NextRequest(`http://localhost/api/host/products?${params}`)
}

beforeEach(() => {
  jest.clearAllMocks()
  authMock.mockResolvedValue({ user: { id: 'host1' } })
})

describe('GET /api/host/products (hotel promotion scoping)', () => {
  it('returns isHotel + roomTypes for a hotel product', async () => {
    findAllProductByHostIdPaginatedMock.mockResolvedValue({
      products: [
        {
          id: 'p1',
          name: 'Hotel Beau Rivage',
          basePrice: '100',
          type: { id: 't1', name: 'Hotel', isHotelType: true },
          roomTypes: [
            { id: 'rt1', name: 'Suite' },
            { id: 'rt2', name: 'Double' },
          ],
        },
      ],
      pagination: { totalPages: 1, total: 1, hasNext: false, hasPrev: false },
    })

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.products).toHaveLength(1)
    expect(body.products[0].isHotel).toBe(true)
    expect(body.products[0].roomTypes).toEqual([
      { id: 'rt1', name: 'Suite' },
      { id: 'rt2', name: 'Double' },
    ])
  })

  it('reports isHotel false and an empty roomTypes list for a non-hotel product', async () => {
    findAllProductByHostIdPaginatedMock.mockResolvedValue({
      products: [
        {
          id: 'p2',
          name: 'Villa Soleil',
          basePrice: '200',
          type: { id: 't2', name: 'Villa', isHotelType: false },
          roomTypes: [],
        },
      ],
      pagination: { totalPages: 1, total: 1, hasNext: false, hasPrev: false },
    })

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.products[0].isHotel).toBe(false)
    expect(body.products[0].roomTypes).toEqual([])
  })
})

describe('GET /api/host/products (cache + auth)', () => {
  it('does not cache the per-host products list so new listings appear immediately', async () => {
    authMock.mockResolvedValue({ user: { id: 'host-1' } })
    findAllProductByHostIdPaginatedMock.mockResolvedValue({
      products: [],
      pagination: { totalPages: 0, total: 0, hasNext: false, hasPrev: false },
    })

    const res = await GET(makeRequest({ page: '1', limit: '20' }))

    expect(res.status).toBe(200)

    const cacheControl = res.headers.get('Cache-Control') ?? ''
    // The list is user-specific and changes on create/edit/delete: it must never be
    // served from a stale HTTP cache (root cause of TRI-1009).
    expect(cacheControl).not.toMatch(/max-age=[1-9]/)
    expect(cacheControl).not.toMatch(/stale-while-revalidate/)
    expect(cacheControl).toMatch(/no-store|max-age=0/)
  })

  it('returns 401 when the request is unauthenticated', async () => {
    authMock.mockResolvedValue(null)

    const res = await GET(makeRequest())

    expect(res.status).toBe(401)
    expect(findAllProductByHostIdPaginatedMock).not.toHaveBeenCalled()
  })
})
