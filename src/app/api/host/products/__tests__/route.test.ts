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
  const params = new URLSearchParams(query)
  return new NextRequest(`http://localhost/api/host/products?${params}`)
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('GET /api/host/products', () => {
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
