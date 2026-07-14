/**
 * The admin products list is an authenticated, per-admin response that changes
 * on validate/reject/edit. It must never be served from a shared/CDN cache
 * (cache-leak/poisoning) nor from a stale browser cache after a mutation
 * (TRI-1014). Prisma and auth are mocked at the boundary (node env).
 */

const authMock = jest.fn()
jest.mock('@/lib/auth', () => ({
  auth: (...a: unknown[]) => authMock(...a),
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

import { NextRequest } from 'next/server'
import { GET } from '../route'

function makeRequest(): NextRequest {
  return new NextRequest('http://localhost/api/admin/products?page=1&limit=20')
}

beforeEach(() => {
  jest.clearAllMocks()
  authMock.mockResolvedValue({ user: { roles: 'ADMIN' } })
  findManyMock.mockResolvedValue([])
  countMock.mockResolvedValue(0)
})

describe('GET /api/admin/products (cache)', () => {
  it('serves the admin list as private/no-store, never publicly cacheable', async () => {
    const res = await GET(makeRequest())

    expect(res.status).toBe(200)

    const cacheControl = res.headers.get('Cache-Control') ?? ''
    expect(cacheControl).toContain('private')
    expect(cacheControl).toContain('no-store')
    expect(cacheControl).not.toContain('public')
    expect(cacheControl).not.toMatch(/max-age=[1-9]/)
    expect(cacheControl).not.toMatch(/stale-while-revalidate/)
  })

  it('returns 403 for a non-admin session', async () => {
    authMock.mockResolvedValue({ user: { roles: 'USER' } })

    const res = await GET(makeRequest())

    expect(res.status).toBe(403)
    expect(findManyMock).not.toHaveBeenCalled()
  })

  it('allows a HOST_MANAGER session', async () => {
    authMock.mockResolvedValue({ user: { roles: 'HOST_MANAGER' } })

    const res = await GET(makeRequest())

    expect(res.status).toBe(200)
    expect(findManyMock).toHaveBeenCalled()
  })

  it('returns 403 when there is no session at all', async () => {
    authMock.mockResolvedValue(null)

    const res = await GET(makeRequest())

    expect(res.status).toBe(403)
  })
})

describe('GET /api/admin/products (response shape)', () => {
  it('converts BigInt room, derives counts and hotel flag, and shapes pagination', async () => {
    findManyMock.mockResolvedValue([
      {
        id: 'p1',
        name: 'Villa',
        room: BigInt(4),
        type: { id: 't1', name: 'Hotel', isHotelType: true },
        _count: { equipments: 3, servicesList: 2 },
      },
    ])
    countMock.mockResolvedValue(21)

    const res = await GET(new NextRequest('http://localhost/api/admin/products?page=1&limit=20'))
    const body = await res.json()

    expect(body.products[0].room).toBe(4)
    expect(body.products[0].equipmentCount).toBe(3)
    expect(body.products[0].serviceCount).toBe(2)
    expect(body.products[0].typeName).toBe('Hotel')
    expect(body.products[0].isHotel).toBe(true)
    expect(body.pagination).toEqual({
      currentPage: 1,
      totalPages: 2,
      itemsPerPage: 20,
      totalItems: 21,
      hasNext: true,
      hasPrev: false,
    })
  })

  it('applies a case-insensitive server-side search across name/description/address', async () => {
    await GET(new NextRequest('http://localhost/api/admin/products?search=beach'))

    const where = findManyMock.mock.calls[0][0].where
    expect(where.OR).toEqual([
      { name: { contains: 'beach', mode: 'insensitive' } },
      { description: { contains: 'beach', mode: 'insensitive' } },
      { address: { contains: 'beach', mode: 'insensitive' } },
    ])
  })

  it('caps the limit at 50', async () => {
    await GET(new NextRequest('http://localhost/api/admin/products?limit=999'))
    expect(findManyMock.mock.calls[0][0].take).toBe(50)
  })
})
