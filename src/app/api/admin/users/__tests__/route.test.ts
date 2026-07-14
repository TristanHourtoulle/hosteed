/**
 * The admin users list is an authenticated, per-admin response that changes on
 * create/role-update. It must never be served from a shared/CDN cache
 * (cache-leak/poisoning) nor from a stale browser cache after a mutation
 * (TRI-1014). Prisma and auth are mocked at the boundary (node env).
 */

const authMock = jest.fn()
jest.mock('@/lib/auth', () => ({
  auth: (...a: unknown[]) => authMock(...a),
}))

const userFindManyMock = jest.fn()
const userCountMock = jest.fn()
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findMany: (...a: unknown[]) => userFindManyMock(...a),
      count: (...a: unknown[]) => userCountMock(...a),
    },
  })),
}))

import { NextRequest } from 'next/server'
import { GET } from '../route'

function makeRequest(): NextRequest {
  return new NextRequest('http://localhost/api/admin/users?page=1&limit=20')
}

beforeEach(() => {
  jest.clearAllMocks()
  authMock.mockResolvedValue({ user: { roles: 'ADMIN' } })
  userFindManyMock.mockResolvedValue([])
  userCountMock.mockResolvedValue(0)
})

describe('GET /api/admin/users (cache)', () => {
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
    expect(userFindManyMock).not.toHaveBeenCalled()
  })
})
