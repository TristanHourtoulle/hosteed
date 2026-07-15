/**
 * GET /api/admin/reservations — query validation, BigInt serialization and the
 * status aggregation. Complements route.test.ts (which covers the cache header
 * and auth gating). Prisma, auth and logger are mocked at the boundary (node env).
 */

const authMock = jest.fn()
jest.mock('@/lib/auth', () => ({ auth: (...a: unknown[]) => authMock(...a) }))

const rent = { findMany: jest.fn(), count: jest.fn(), groupBy: jest.fn() }
jest.mock('@/lib/prisma', () => ({ __esModule: true, default: { rent } }))

jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}))

import { NextRequest } from 'next/server'
import { GET } from '../route'

function makeRequest(query = '?page=1&limit=20'): NextRequest {
  return new NextRequest(`http://localhost/api/admin/reservations${query}`)
}

beforeEach(() => {
  jest.clearAllMocks()
  authMock.mockResolvedValue({ user: { roles: 'ADMIN' } })
  rent.findMany.mockResolvedValue([])
  rent.count.mockResolvedValue(0)
  rent.groupBy.mockResolvedValue([])
})

describe('GET /api/admin/reservations query handling', () => {
  it('returns 400 for a non-positive page', async () => {
    const res = await GET(makeRequest('?page=0'))
    expect(res.status).toBe(400)
    expect(rent.findMany).not.toHaveBeenCalled()
  })

  it('returns 400 when limit exceeds the max of 50', async () => {
    const res = await GET(makeRequest('?limit=100'))
    expect(res.status).toBe(400)
  })

  it('serializes BigInt numberPeople to a number and aggregates status counts', async () => {
    rent.findMany.mockResolvedValue([{ id: 'r1', numberPeople: BigInt(3), status: 'RESERVED' }])
    rent.count.mockResolvedValue(1)
    rent.groupBy.mockResolvedValue([
      { status: 'RESERVED', _count: { status: 1 } },
      { status: 'CANCEL', _count: { status: 2 } },
    ])

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(body.reservations[0].numberPeople).toBe(3)
    expect(body.stats.RESERVED).toBe(1)
    expect(body.stats.CANCEL).toBe(2)
    expect(body.stats.total).toBe(3)
  })

  it('maps a null numberPeople to null', async () => {
    rent.findMany.mockResolvedValue([{ id: 'r1', numberPeople: null, status: 'WAITING' }])
    rent.count.mockResolvedValue(1)

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(body.reservations[0].numberPeople).toBeNull()
  })

  it('adds a search OR clause when a search term is present', async () => {
    await GET(makeRequest('?search=paris'))
    const where = rent.findMany.mock.calls[0][0].where
    expect(Array.isArray(where.OR)).toBe(true)
  })

  it('filters by status when provided', async () => {
    await GET(makeRequest('?status=RESERVED'))
    const where = rent.findMany.mock.calls[0][0].where
    expect(where.status).toBe('RESERVED')
  })

  it('returns 500 when the query throws', async () => {
    rent.findMany.mockRejectedValue(new Error('db down'))
    const res = await GET(makeRequest())
    expect(res.status).toBe(500)
  })
})
