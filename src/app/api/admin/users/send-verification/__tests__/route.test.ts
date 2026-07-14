/**
 * Route handler tests for POST /api/admin/users/send-verification.
 * Auth, Prisma and user.service.sendEmailVerification are mocked. No real network.
 */
jest.mock('@/lib/auth', () => ({ auth: jest.fn() }))
jest.mock('@/lib/services/user.service', () => ({ sendEmailVerification: jest.fn() }))
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: { user: { findMany: jest.fn(), findFirst: jest.fn() } },
}))

import { auth } from '@/lib/auth'
import { sendEmailVerification } from '@/lib/services/user.service'
import prisma from '@/lib/prisma'
import { POST } from '../route'

/* eslint-disable @typescript-eslint/no-explicit-any */
const mockAuth = auth as unknown as jest.Mock
const mockSend = sendEmailVerification as jest.Mock
const db = prisma as any

function makeRequest(body: unknown): any {
  return { url: 'https://x.test', json: async () => body }
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => jest.restoreAllMocks())

describe('POST /api/admin/users/send-verification', () => {
  it('returns 403 for a non-admin caller', async () => {
    mockAuth.mockResolvedValue({ user: { roles: 'HOST_MANAGER' } })
    const res = await POST(makeRequest({ mode: 'all' }))
    expect(res.status).toBe(403)
  })

  it('returns 404 when no unverified users match', async () => {
    mockAuth.mockResolvedValue({ user: { roles: 'ADMIN' } })
    db.user.findMany.mockResolvedValue([])
    const res = await POST(makeRequest({ mode: 'all' }))
    expect(res.status).toBe(404)
  })

  it('sends verification emails to all unverified users and reports the summary', async () => {
    mockAuth.mockResolvedValue({ user: { roles: 'ADMIN' } })
    db.user.findMany.mockResolvedValue([
      { id: 'u1', email: 'a@b.c', name: 'A' },
      { id: 'u2', email: 'c@d.e', name: 'B' },
    ])
    mockSend.mockResolvedValue(undefined)

    const res = await POST(makeRequest({ mode: 'all' }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.summary).toEqual({ total: 2, success: 2, failures: 0 })
    expect(mockSend).toHaveBeenCalledTimes(2)
  })

  it('records per-user failures without failing the whole request', async () => {
    mockAuth.mockResolvedValue({ user: { roles: 'ADMIN' } })
    db.user.findFirst.mockResolvedValue({ id: 'u1', email: 'a@b.c', name: 'A' })
    mockSend.mockRejectedValue(new Error('send failed'))

    const res = await POST(makeRequest({ mode: 'single', userIds: ['u1'] }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.summary).toEqual({ total: 1, success: 0, failures: 1 })
    expect(body.results[0].success).toBe(false)
  })

  it('queries selected unverified users for mode=selected', async () => {
    mockAuth.mockResolvedValue({ user: { roles: 'ADMIN' } })
    db.user.findMany.mockResolvedValue([{ id: 'u1', email: 'a@b.c', name: 'A' }])
    mockSend.mockResolvedValue(undefined)

    await POST(makeRequest({ mode: 'selected', userIds: ['u1', 'u2'] }))

    expect(db.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ emailVerified: null, id: { in: ['u1', 'u2'] } }),
      })
    )
  })
})
