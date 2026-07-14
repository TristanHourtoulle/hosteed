/**
 * Unit tests for the Credentials `authorize` callback in auth.config.ts.
 *
 * This is the security-critical login path: it must reject unverified emails,
 * unknown users and wrong passwords, and only return a user on full success.
 * user.service (findUserByEmail / verifyPassword), Prisma and Stripe are mocked.
 */
// next-auth ships ESM providers that ts-jest does not transform; stub them.
// Credentials passes its config straight through so `authorize` is reachable.
jest.mock('next-auth/providers/google', () => ({
  __esModule: true,
  default: () => ({ id: 'google' }),
}))
jest.mock('next-auth/providers/credentials', () => ({
  __esModule: true,
  default: (config: unknown) => config,
}))

jest.mock('@/lib/services/user.service', () => ({
  findUserByEmail: jest.fn(),
  verifyPassword: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: { user: { update: jest.fn() } },
}))

jest.mock('@/lib/stripe', () => ({
  stripe: { customers: { create: jest.fn() } },
}))

import authConfig from '@/lib/auth.config'
import { findUserByEmail, verifyPassword } from '@/lib/services/user.service'
import { UserRole } from '@prisma/client'

/* eslint-disable @typescript-eslint/no-explicit-any */
const mockFindUserByEmail = findUserByEmail as jest.Mock
const mockVerifyPassword = verifyPassword as jest.Mock

// The Credentials provider is the second entry (index 1) after Google.
function getAuthorize() {
  const provider = (authConfig.providers as any[]).find(
    p => typeof p.authorize === 'function' || (p.options && p.options.authorize)
  )
  const authorize = provider?.authorize ?? provider?.options?.authorize
  if (!authorize) throw new Error('Credentials authorize callback not found')
  return authorize as (credentials: unknown) => Promise<unknown>
}

const verifiedUser = {
  id: 'u1',
  email: 'alice@example.com',
  name: 'Alice',
  lastname: 'Doe',
  emailVerified: new Date('2024-01-01'),
  image: null,
  password: 'hashed',
  roles: UserRole.USER,
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => jest.restoreAllMocks())

describe('Credentials authorize', () => {
  it('returns null when email or password is missing', async () => {
    const authorize = getAuthorize()

    expect(await authorize({ email: '', password: '' })).toBeNull()
    expect(await authorize({ email: 'alice@example.com' })).toBeNull()
    expect(mockFindUserByEmail).not.toHaveBeenCalled()
  })

  it('throws "Email not verified" when the user has no emailVerified date', async () => {
    mockFindUserByEmail.mockResolvedValue({ ...verifiedUser, emailVerified: null })

    const authorize = getAuthorize()

    await expect(
      authorize({ email: 'alice@example.com', password: 'secret123' })
    ).rejects.toThrow('Email not verified')
    // Password is never checked for an unverified account
    expect(mockVerifyPassword).not.toHaveBeenCalled()
  })

  it('returns null for an unknown user (passes the verified check because user is null)', async () => {
    mockFindUserByEmail.mockResolvedValue(null)

    const authorize = getAuthorize()

    expect(await authorize({ email: 'ghost@example.com', password: 'secret123' })).toBeNull()
    expect(mockVerifyPassword).not.toHaveBeenCalled()
  })

  it('returns null when the password is incorrect', async () => {
    mockFindUserByEmail.mockResolvedValue(verifiedUser)
    mockVerifyPassword.mockResolvedValue(false)

    const authorize = getAuthorize()

    expect(await authorize({ email: 'alice@example.com', password: 'wrongpass' })).toBeNull()
    expect(mockVerifyPassword).toHaveBeenCalledWith('wrongpass', 'hashed')
  })

  it('returns null when the user has no stored password', async () => {
    mockFindUserByEmail.mockResolvedValue({ ...verifiedUser, password: null })

    const authorize = getAuthorize()

    expect(await authorize({ email: 'alice@example.com', password: 'secret123' })).toBeNull()
    expect(mockVerifyPassword).not.toHaveBeenCalled()
  })

  it('returns the user object on a successful login', async () => {
    mockFindUserByEmail.mockResolvedValue(verifiedUser)
    mockVerifyPassword.mockResolvedValue(true)

    const authorize = getAuthorize()

    const result = (await authorize({ email: 'alice@example.com', password: 'secret123' })) as any

    expect(result).toMatchObject({
      id: 'u1',
      email: 'alice@example.com',
      name: 'Alice',
      lastName: 'Doe',
      roles: UserRole.USER,
    })
  })

  it('returns null when credentials fail schema validation (short password)', async () => {
    // Email is verified so we get past the first check, then zod parseAsync rejects.
    mockFindUserByEmail.mockResolvedValue(verifiedUser)

    const authorize = getAuthorize()

    // 3-char password fails signInSchema (min 6) -> caught -> null
    expect(await authorize({ email: 'alice@example.com', password: '123' })).toBeNull()
  })
})
