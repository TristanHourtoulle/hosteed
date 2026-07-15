/**
 * Characterization tests for GET /api/products/paginated.
 * The service layer is mocked at the boundary; the route's job is param
 * validation, response shaping, and CDN cache headers.
 */
const findAllProductsForPublic = jest.fn()
jest.mock('@/lib/services/product.service', () => ({
  findAllProductsForPublic: (...a: unknown[]) => findAllProductsForPublic(...a),
}))

import { NextRequest } from 'next/server'
import { GET } from '../route'

function makeRequest(qs = ''): NextRequest {
  return new NextRequest(`http://localhost/api/products/paginated${qs}`)
}

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

beforeEach(() => {
  jest.clearAllMocks()
  findAllProductsForPublic.mockResolvedValue({
    products: [{ id: 'p1' }],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
  })
})

describe('GET /api/products/paginated', () => {
  it('returns products with a public CDN cache header on success', async () => {
    const res = await GET(makeRequest('?page=1&limit=20'))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.products).toHaveLength(1)
    expect(res.headers.get('Cache-Control')).toBe(
      'public, s-maxage=120, stale-while-revalidate=300'
    )
  })

  it('passes parsed pagination + includeSpecialPrices flags to the service', async () => {
    await GET(makeRequest('?page=2&limit=10&includeSpecialPrices=true'))

    expect(findAllProductsForPublic).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      includeSpecialPrices: true,
    })
  })

  it('caps the limit at 50', async () => {
    await GET(makeRequest('?limit=500'))
    expect(findAllProductsForPublic.mock.calls[0][0].limit).toBe(50)
  })

  it('rejects page < 1 with 400', async () => {
    const res = await GET(makeRequest('?page=0'))
    expect(res.status).toBe(400)
    expect(findAllProductsForPublic).not.toHaveBeenCalled()
  })

  it('returns 500 when the service returns null', async () => {
    findAllProductsForPublic.mockResolvedValue(null)
    const res = await GET(makeRequest())
    expect(res.status).toBe(500)
  })

  it('returns 500 when the service throws', async () => {
    findAllProductsForPublic.mockRejectedValue(new Error('boom'))
    const res = await GET(makeRequest())
    expect(res.status).toBe(500)
  })
})
