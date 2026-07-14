/**
 * The admin reservations list is an authenticated, per-admin response that
 * changes on booking status transitions. It must never be served from a
 * shared/CDN cache (cache-leak/poisoning) nor from a stale browser cache after
 * a mutation (TRI-1014). Prisma, auth and logger are mocked at the boundary
 * (node env).
 */

const authMock = jest.fn()
jest.mock('@/lib/auth', () => ({
  auth: (...a: unknown[]) => authMock(...a),
}))

const rentFindManyMock = jest.fn()
const rentCountMock = jest.fn()
const rentGroupByMock = jest.fn()
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    rent: {
      findMany: (...a: unknown[]) => rentFindManyMock(...a),
      count: (...a: unknown[]) => rentCountMock(...a),
      groupBy: (...a: unknown[]) => rentGroupByMock(...a),
    },
  },
}))

jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}))

import { NextRequest } from 'next/server'
import { GET } from '../route'

function makeRequest(): NextRequest {
  return new NextRequest('http://localhost/api/admin/reservations?page=1&limit=20')
}

beforeEach(() => {
  jest.clearAllMocks()
  authMock.mockResolvedValue({ user: { roles: 'ADMIN' } })
  rentFindManyMock.mockResolvedValue([])
  rentCountMock.mockResolvedValue(0)
  rentGroupByMock.mockResolvedValue([])
})

describe('GET /api/admin/reservations (cache)', () => {
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
    expect(rentFindManyMock).not.toHaveBeenCalled()
  })
})
