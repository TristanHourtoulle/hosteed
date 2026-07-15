/**
 * POST/PUT /api/admin/users — admin-only user creation and role updates.
 * Complements route.test.ts (which covers the GET cache header + auth gating).
 * Prisma, auth and bcrypt are mocked at the boundary (node env).
 */

const authMock = jest.fn()
jest.mock('@/lib/auth', () => ({ auth: (...a: unknown[]) => authMock(...a) }))

const user = {
  findMany: jest.fn(),
  count: jest.fn(),
  findUnique: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
}
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({ user })),
}))

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}))

import { NextRequest } from 'next/server'
import { POST, PUT } from '../route'

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  authMock.mockResolvedValue({ user: { id: 'admin1', roles: 'ADMIN' } })
})

describe('POST /api/admin/users', () => {
  const validBody = {
    email: 'new@x.com',
    name: 'New User',
    password: 'secret1',
    role: 'HOST',
  }

  it('returns 401 when unauthenticated', async () => {
    authMock.mockResolvedValue(null)
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(401)
  })

  it('returns 403 for a non-admin/non-host-manager', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', roles: 'HOST' } })
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(403)
  })

  it('returns 400 for an invalid role', async () => {
    const res = await POST(makeRequest({ ...validBody, role: 'ADMIN' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for a too-short password', async () => {
    const res = await POST(makeRequest({ ...validBody, password: '123' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when the email already exists', async () => {
    user.findUnique.mockResolvedValue({ id: 'existing' })
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/existe déjà/)
  })

  it('hashes the password and creates a verified user', async () => {
    user.findUnique.mockResolvedValue(null)
    user.create.mockResolvedValue({ id: 'new1', email: 'new@x.com', roles: 'HOST' })

    const res = await POST(makeRequest(validBody))

    expect(res.status).toBe(200)
    const data = user.create.mock.calls[0][0].data
    expect(data.password).toBe('hashed-password')
    expect(data.roles).toBe('HOST')
    expect(data.emailVerified).toBeInstanceOf(Date)
  })
})

describe('PUT /api/admin/users', () => {
  function makePut(body: Record<string, unknown>): NextRequest {
    return new NextRequest('http://localhost/api/admin/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  it('returns 401 when unauthenticated', async () => {
    authMock.mockResolvedValue(null)
    const res = await PUT(makePut({ userId: 'u2', role: 'HOST_VERIFIED' }))
    expect(res.status).toBe(401)
  })

  it('returns 403 for a non-admin', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', roles: 'HOST' } })
    const res = await PUT(makePut({ userId: 'u2', role: 'HOST_VERIFIED' }))
    expect(res.status).toBe(403)
  })

  it('returns 400 for an invalid target role', async () => {
    const res = await PUT(makePut({ userId: 'u2', role: 'ADMIN' }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when the target user does not exist', async () => {
    user.findUnique.mockResolvedValue(null)
    const res = await PUT(makePut({ userId: 'missing', role: 'HOST_VERIFIED' }))
    expect(res.status).toBe(404)
  })

  it('prevents an admin from changing their own role', async () => {
    user.findUnique.mockResolvedValue({ id: 'admin1' })
    const res = await PUT(makePut({ userId: 'admin1', role: 'HOST_VERIFIED' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/votre propre rôle/)
  })

  it('updates the role for another user', async () => {
    user.findUnique.mockResolvedValue({ id: 'u2' })
    user.update.mockResolvedValue({ id: 'u2', roles: 'HOST_VERIFIED' })

    const res = await PUT(makePut({ userId: 'u2', role: 'HOST_VERIFIED' }))

    expect(res.status).toBe(200)
    expect(user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'u2' }, data: { roles: 'HOST_VERIFIED' } })
    )
  })
})
