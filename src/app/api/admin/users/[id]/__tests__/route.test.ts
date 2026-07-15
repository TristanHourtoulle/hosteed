/**
 * Route handler tests for /api/admin/users/[id] (GET info, DELETE, PATCH verify).
 * Auth, user.service and Prisma are mocked at the boundary. No real DB.
 */
jest.mock('@/lib/auth', () => ({ auth: jest.fn() }))
jest.mock('@/lib/services/user.service', () => ({
  deleteUser: jest.fn(),
  getUserDeletionInfo: jest.fn(),
}))
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: { user: { update: jest.fn() } },
}))

import { auth } from '@/lib/auth'
import { deleteUser, getUserDeletionInfo } from '@/lib/services/user.service'
import prisma from '@/lib/prisma'
import { GET, DELETE, PATCH } from '../route'

/* eslint-disable @typescript-eslint/no-explicit-any */
const mockAuth = auth as unknown as jest.Mock
const mockDeleteUser = deleteUser as jest.Mock
const mockGetInfo = getUserDeletionInfo as jest.Mock
const db = prisma as any

function makeRequest(): any {
  return { url: 'https://x.test/api/admin/users/u2' }
}
function params(id: string) {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => jest.restoreAllMocks())

describe('GET /api/admin/users/[id]', () => {
  it('returns 403 for a non-admin/non-host-manager', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', roles: 'USER' } })
    const res = await GET(makeRequest(), params('u2'))
    expect(res.status).toBe(403)
  })

  it('returns 404 when the user is not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin1', roles: 'ADMIN' } })
    mockGetInfo.mockResolvedValue(null)
    const res = await GET(makeRequest(), params('ghost'))
    expect(res.status).toBe(404)
  })

  it('returns the deletion info for an admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin1', roles: 'ADMIN' } })
    mockGetInfo.mockResolvedValue({ user: { id: 'u2' }, hasActiveReservations: false })
    const res = await GET(makeRequest(), params('u2'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.user.id).toBe('u2')
  })
})

describe('DELETE /api/admin/users/[id]', () => {
  it('returns 403 when the caller is not ADMIN (HOST_MANAGER is not enough)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'hm1', roles: 'HOST_MANAGER' } })
    const res = await DELETE(makeRequest(), params('u2'))
    expect(res.status).toBe(403)
    expect(mockDeleteUser).not.toHaveBeenCalled()
  })

  it('forbids deleting your own account (400)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin1', roles: 'ADMIN' } })
    const res = await DELETE(makeRequest(), params('admin1'))
    expect(res.status).toBe(400)
    expect(mockDeleteUser).not.toHaveBeenCalled()
  })

  it('returns 404 when the user does not exist', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin1', roles: 'ADMIN' } })
    mockDeleteUser.mockResolvedValue({ success: false, reason: 'NOT_FOUND' })
    const res = await DELETE(makeRequest(), params('ghost'))
    expect(res.status).toBe(404)
  })

  it('returns 409 with the blocking reservations when the user has active rents', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin1', roles: 'ADMIN' } })
    mockDeleteUser.mockResolvedValue({
      success: false,
      reason: 'ACTIVE_RESERVATIONS',
      activeRentsAsGuest: [{ id: 'r1' }],
      activeRentsAsHost: [],
    })
    const res = await DELETE(makeRequest(), params('u2'))
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.activeRentsAsGuest).toHaveLength(1)
  })

  it('deletes the user on success', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin1', roles: 'ADMIN' } })
    mockDeleteUser.mockResolvedValue({ success: true })
    const res = await DELETE(makeRequest(), params('u2'))
    expect(res.status).toBe(200)
    expect(mockDeleteUser).toHaveBeenCalledWith('u2')
  })
})

describe('PATCH /api/admin/users/[id] (verify email)', () => {
  it('returns 403 for a non-admin/non-host-manager', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', roles: 'USER' } })
    const res = await PATCH(makeRequest(), params('u2'))
    expect(res.status).toBe(403)
  })

  it('marks the email verified', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin1', roles: 'ADMIN' } })
    db.user.update.mockResolvedValue({ id: 'u2', email: 'a@b.c', emailVerified: new Date() })
    const res = await PATCH(makeRequest(), params('u2'))
    expect(res.status).toBe(200)
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u2' },
        data: expect.objectContaining({ emailVerified: expect.any(Date) }),
      })
    )
  })
})
