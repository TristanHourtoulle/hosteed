/**
 * Characterization tests for GET /api/products/search.
 * Boundaries mocked: Prisma, the Redis product cache, the geo-distance helper,
 * and the city-aliases service. The route's contract under test is the
 * cache-hit fast path, the DB fallback, the response shape ({ products,
 * pagination, filters, meta }) and its CDN cache headers.
 */
const getCachedProductSearch = jest.fn()
const cacheProductSearch = jest.fn()
jest.mock('@/lib/cache/redis-cache.service', () => ({
  productCacheService: {
    getCachedProductSearch: (...a: unknown[]) => getCachedProductSearch(...a),
    cacheProductSearch: (...a: unknown[]) => cacheProductSearch(...a),
  },
}))

const findManyMock = jest.fn()
const countMock = jest.fn()
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    product: {
      findMany: (...a: unknown[]) => findManyMock(...a),
      count: (...a: unknown[]) => countMock(...a),
    },
  },
}))

const filterProductsByRadius = jest.fn()
jest.mock('@/lib/utils/geoDistance', () => ({
  filterProductsByRadius: (...a: unknown[]) => filterProductsByRadius(...a),
}))

jest.mock('@/lib/services/city-aliases.service', () => ({
  cityAliasesService: {
    extractCityFromLocation: (loc: string) => loc,
    getAliases: (city: string) => [city.toLowerCase()],
  },
}))

import { NextRequest } from 'next/server'
import { GET } from '../route'

function makeRequest(qs = ''): NextRequest {
  return new NextRequest(`http://localhost/api/products/search${qs}`)
}

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

beforeEach(() => {
  jest.clearAllMocks()
  getCachedProductSearch.mockResolvedValue(null)
  cacheProductSearch.mockResolvedValue(undefined)
  findManyMock.mockResolvedValue([])
  countMock.mockResolvedValue(0)
  filterProductsByRadius.mockImplementation((products: unknown[]) => products)
})

describe('GET /api/products/search — cache hit', () => {
  it('returns the cached payload with HIT headers and short-lived public cache', async () => {
    getCachedProductSearch.mockResolvedValue({
      products: [{ id: 'c1' }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
    })

    const res = await GET(makeRequest('?search=beach'))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.products).toEqual([{ id: 'c1' }])
    expect(body.meta.cached).toBe(true)
    expect(res.headers.get('X-Cache')).toBe('HIT')
    expect(res.headers.get('Cache-Control')).toBe(
      'public, s-maxage=300, stale-while-revalidate=600'
    )
    // No DB access on a cache hit.
    expect(findManyMock).not.toHaveBeenCalled()
  })
})

describe('GET /api/products/search — cache miss', () => {
  it('queries the DB, caches the result and returns MISS headers', async () => {
    findManyMock.mockResolvedValue([
      { id: 'p1', name: 'Villa', basePrice: '100', latitude: 1, longitude: 2 },
    ])
    countMock.mockResolvedValue(1)

    const res = await GET(makeRequest('?search=beach'))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.products).toHaveLength(1)
    expect(body.meta.cached).toBe(false)
    expect(res.headers.get('X-Cache')).toBe('MISS')
    expect(res.headers.get('Cache-Control')).toBe(
      'public, s-maxage=300, stale-while-revalidate=600'
    )
    expect(cacheProductSearch).toHaveBeenCalledTimes(1)
  })

  it('scopes the DB query to Approve/ModificationPending non-draft products', async () => {
    await GET(makeRequest())

    const where = findManyMock.mock.calls[0][0].where
    expect(where.isDraft).toBe(false)
    expect(where.validate.in).toEqual(['Approve', 'ModificationPending'])
  })

  it('converts BigInt product fields to numbers in the response', async () => {
    findManyMock.mockResolvedValue([
      {
        id: 'p1',
        name: 'Villa',
        basePrice: '100',
        latitude: 1,
        longitude: 2,
        room: BigInt(3),
        maxPeople: BigInt(6),
      },
    ])
    countMock.mockResolvedValue(1)

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(body.products[0].room).toBe(3)
    expect(body.products[0].maxPeople).toBe(6)
  })

  it('applies client-side price filtering (basePrice is a string column)', async () => {
    findManyMock.mockResolvedValue([
      { id: 'cheap', name: 'A', basePrice: '50', latitude: 1, longitude: 2 },
      { id: 'pricey', name: 'B', basePrice: '500', latitude: 1, longitude: 2 },
    ])
    countMock.mockResolvedValue(2)

    const res = await GET(makeRequest('?maxPrice=100'))
    const body = await res.json()

    expect(body.products.map((p: { id: string }) => p.id)).toEqual(['cheap'])
    // Total reflects the post-filter count when price filtering is active.
    expect(body.pagination.total).toBe(1)
  })

  it('does not fail the request if caching the result throws', async () => {
    cacheProductSearch.mockRejectedValue(new Error('redis down'))
    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
  })

  it('returns 500 when the DB query throws', async () => {
    findManyMock.mockRejectedValue(new Error('db boom'))
    const res = await GET(makeRequest())
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Internal server error')
  })
})
