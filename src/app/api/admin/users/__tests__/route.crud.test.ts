/**
 * Route handler tests for /api/admin/users covering POST (create) and PUT
 * (update role), plus extended GET cases (pagination, search, limit cap, 500).
 * The existing route.test.ts covers the GET cache/403 baseline; this file adds
 * the mutation paths. Auth, PrismaClient and bcryptjs are mocked. No real DB.
 */
jest.mock('@/lib/auth', () => ({ auth: jest.fn() }))

const mockUser = {
  findMany: jest.fn(),
  count: jest.fn(),
  findUnique: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
}

jest.mock('@prisma/client', () => {
  const actual = jest.requireActual('@prisma/client')
  return {
    ...actual,
    PrismaClient: jest.fn(() => ({ user: mockUser })),
  }
})

jest.mock('bcryptjs', () => ({
  __esModule: true,
  default: { hash: jest.fn(async () => 'hashed-password') },
  hash: jest.fn(async () => 'hashed-password'),
}))

import { auth } from '@/lib/auth'
import { GET, POST, PUT } from '../route'

/* eslint-disable @typescript-eslint/no-explicit-any */
const mockAuth = auth as unknown as jest.Mock

function makeRequest(url: string, body?: unknown): any {
  return { url, json: async () => body }
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => jest.restoreAllMocks())

describe('GET /api/admin/users (extended)', () => {
  it('translates search + role into the where clause', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin1', roles: 'ADMIN' } })
    mockUser.findMany.mockResolvedValue([{ id: 'u1' }])
    mockUser.count.mockResolvedValue(1)

    const res = await GET(
      makeRequest('https://x.test/api/admin/users?page=1&limit=20&search=al&role=HOST')
    )

    expect(res.status).toBe(200)
    const findArg = mockUser.findMany.mock.calls[0][0]
    expect(findArg.where.roles).toBe('HOST')
    expect(findArg.where.OR).toBeDefined()
    const body = await res.json()
    expect(body.pagination.totalItems).toBe(1)
  })

  it('caps the page size at 50', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin1', roles: 'ADMIN' } })
    mockUser.findMany.mockResolvedValue([])
    mockUser.count.mockResolvedValue(0)

    await GET(makeRequest('https://x.test/api/admin/users?limit=999'))

    expect(mockUser.findMany.mock.calls[0][0].take).toBe(50)
  })

  it('allows HOST_MANAGER to read the list', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'hm1', roles: 'HOST_MANAGER' } })
    mockUser.findMany.mockResolvedValue([])
    mockUser.count.mockResolvedValue(0)

    const res = await GET(makeRequest('https://x.test/api/admin/users'))

    expect(res.status).toBe(200)
  })

  it('returns 500 when the query throws', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin1', roles: 'ADMIN' } })
    mockUser.findMany.mockRejectedValue(new Error('db down'))
    mockUser.count.mockResolvedValue(0)

    const res = await GET(makeRequest('https://x.test/api/admin/users'))

    expect(res.status).toBe(500)
  })
})

describe('POST /api/admin/users', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await POST(makeRequest('https://x.test', {}))
    expect(res.status).toBe(401)
  })

  it('returns 403 when the caller is not admin/host-manager', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', roles: 'USER' } })
    const res = await POST(
      makeRequest('https://x.test', {
        email: 'new@example.com',
        name: 'New User',
        password: 'secret123',
        role: 'HOST',
      })
    )
    expect(res.status).toBe(403)
  })

  it('returns 400 on schema validation failure (invalid email/short pw/bad role)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin1', roles: 'ADMIN' } })
    const res = await POST(
      makeRequest('https://x.test', {
        email: 'not-an-email',
        name: 'X',
        password: '123',
        role: 'ADMIN',
      })
    )
    expect(res.status).toBe(400)
    expect(mockUser.create).not.toHaveBeenCalled()
  })

  it('returns 400 when the email already exists', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin1', roles: 'ADMIN' } })
    mockUser.findUnique.mockResolvedValue({ id: 'existing' })
    const res = await POST(
      makeRequest('https://x.test', {
        email: 'dup@example.com',
        name: 'Dup User',
        password: 'secret123',
        role: 'HOST',
      })
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/existe déjà/)
  })

  it('creates a hashed, auto-verified user for a valid request', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin1', roles: 'HOST_MANAGER' } })
    mockUser.findUnique.mockResolvedValue(null)
    mockUser.create.mockResolvedValue({
      id: 'new1',
      email: 'new@example.com',
      name: 'New User',
      roles: 'HOST',
      createdAt: new Date(),
    })

    const res = await POST(
      makeRequest('https://x.test', {
        email: 'new@example.com',
        name: 'New User',
        password: 'secret123',
        role: 'HOST',
      })
    )

    expect(res.status).toBe(200)
    const createArg = mockUser.create.mock.calls[0][0]
    expect(createArg.data.password).toBe('hashed-password')
    expect(createArg.data.emailVerified).toBeInstanceOf(Date)
    expect(createArg.data.roles).toBe('HOST')
  })
})

describe('PUT /api/admin/users (update role)', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await PUT(makeRequest('https://x.test', { userId: 'u2', role: 'HOST' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for an invalid target role', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin1', roles: 'ADMIN' } })
    const res = await PUT(makeRequest('https://x.test', { userId: 'u2', role: 'ADMIN' }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when the target user does not exist', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin1', roles: 'ADMIN' } })
    mockUser.findUnique.mockResolvedValue(null)
    const res = await PUT(makeRequest('https://x.test', { userId: 'ghost', role: 'HOST' }))
    expect(res.status).toBe(404)
  })

  it('forbids changing your own role (400)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin1', roles: 'ADMIN' } })
    mockUser.findUnique.mockResolvedValue({ id: 'admin1' })
    const res = await PUT(makeRequest('https://x.test', { userId: 'admin1', role: 'HOST' }))
    expect(res.status).toBe(400)
    expect(mockUser.update).not.toHaveBeenCalled()
  })

  it('updates the role for a valid request', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin1', roles: 'ADMIN' } })
    mockUser.findUnique.mockResolvedValue({ id: 'u2' })
    mockUser.update.mockResolvedValue({ id: 'u2', roles: 'HOST_VERIFIED' })
    const res = await PUT(makeRequest('https://x.test', { userId: 'u2', role: 'HOST_VERIFIED' }))
    expect(res.status).toBe(200)
    expect(mockUser.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'u2' }, data: { roles: 'HOST_VERIFIED' } })
    )
  })
})
