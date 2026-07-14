/**
 * Route handler tests for PUT /api/admin/users/[id]/role.
 * Auth, user.service and the email service are mocked. No real DB/network.
 */
jest.mock('@/lib/auth', () => ({ auth: jest.fn() }))
jest.mock('@/lib/services/user.service', () => ({ updateUserRole: jest.fn() }))
jest.mock('@/lib/services/email', () => ({
  emailService: { sendRoleUpdate: jest.fn(async () => ({ success: true })) },
}))

import { auth } from '@/lib/auth'
import { updateUserRole } from '@/lib/services/user.service'
import { emailService } from '@/lib/services/email'
import { PUT } from '../route'

/* eslint-disable @typescript-eslint/no-explicit-any */
const mockAuth = auth as unknown as jest.Mock
const mockUpdateRole = updateUserRole as jest.Mock

function makeRequest(body: unknown): any {
  return { url: 'https://x.test', json: async () => body }
}
function params(id: string) {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => jest.restoreAllMocks())

describe('PUT /api/admin/users/[id]/role', () => {
  it('returns 403 for a non-admin (only ADMIN, not HOST_MANAGER)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'hm1', roles: 'HOST_MANAGER' } })
    const res = await PUT(makeRequest({ role: 'HOST' }), params('u2'))
    expect(res.status).toBe(403)
  })

  it('returns 400 for an invalid role value', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin1', roles: 'ADMIN' } })
    const res = await PUT(makeRequest({ role: 'SUPERADMIN' }), params('u2'))
    expect(res.status).toBe(400)
    expect(mockUpdateRole).not.toHaveBeenCalled()
  })

  it('forbids changing your own role (400)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin1', roles: 'ADMIN' } })
    const res = await PUT(makeRequest({ role: 'USER' }), params('admin1'))
    expect(res.status).toBe(400)
    expect(mockUpdateRole).not.toHaveBeenCalled()
  })

  it('returns 500 when the service fails to update', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin1', roles: 'ADMIN' } })
    mockUpdateRole.mockResolvedValue(null)
    const res = await PUT(makeRequest({ role: 'HOST' }), params('u2'))
    expect(res.status).toBe(500)
  })

  it('updates the role and notifies the user by email', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin1', roles: 'ADMIN' } })
    mockUpdateRole.mockResolvedValue({ id: 'u2', email: 'a@b.c', name: 'Bob', roles: 'HOST' })
    const res = await PUT(makeRequest({ role: 'HOST' }), params('u2'))
    expect(res.status).toBe(200)
    expect(mockUpdateRole).toHaveBeenCalledWith('u2', 'HOST')
    expect(emailService.sendRoleUpdate).toHaveBeenCalledWith(
      'a@b.c',
      'Bob',
      expect.objectContaining({ label: 'Hôte' })
    )
  })

  it('still succeeds (200) when the notification email fails', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin1', roles: 'ADMIN' } })
    mockUpdateRole.mockResolvedValue({ id: 'u2', email: 'a@b.c', name: 'Bob', roles: 'ADMIN' })
    ;(emailService.sendRoleUpdate as jest.Mock).mockRejectedValue(new Error('brevo down'))
    const res = await PUT(makeRequest({ role: 'ADMIN' }), params('u2'))
    expect(res.status).toBe(200)
  })
})
