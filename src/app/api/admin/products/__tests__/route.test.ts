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
})
