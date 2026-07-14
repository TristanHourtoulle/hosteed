/**
 * Unit tests for user.service.ts (USERS/AUTH domain).
 *
 * All boundaries are mocked: Prisma, bcryptjs, jsonwebtoken and the email
 * service. No real database or network access. Tests assert CURRENT behavior.
 */
import { UserRole } from '@prisma/client'

// --- Boundary mocks (hoisted) ------------------------------------------------
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    },
    product: { count: jest.fn() },
    rent: { count: jest.fn(), findMany: jest.fn() },
  },
}))

jest.mock('bcryptjs', () => ({
  hash: jest.fn(async () => 'hashed-password'),
  compare: jest.fn(),
}))

jest.mock('jsonwebtoken', () => {
  const actual = jest.requireActual('jsonwebtoken')
  return {
    __esModule: true,
    default: {
      ...actual,
      sign: jest.fn(() => 'signed-token'),
      verify: jest.fn(),
      decode: jest.fn(),
    },
  }
})

jest.mock('@/lib/services/email', () => ({
  emailService: {
    sendVerificationEmail: jest.fn(async () => ({ success: true, messageId: 'm1' })),
    sendPasswordReset: jest.fn(async () => ({ success: true, messageId: 'm2' })),
  },
}))

import prisma from '@/lib/prisma'
import { hash, compare } from 'bcryptjs'
import jwt from 'jsonwebtoken'
// Real error constructors (the service checks `instanceof jwt.TokenExpiredError`,
// and the mocked default spreads the actual module, so these match).
const { TokenExpiredError, JsonWebTokenError } = jest.requireActual('jsonwebtoken')
import { emailService } from '@/lib/services/email'
import {
  findAllUser,
  findAllUserPaginated,
  findUserById,
  findUserByEmail,
  findAllUserByRoles,
  verifyPassword,
  createUser,
  updateUser,
  sendEmailVerification,
  validateEmail,
  sendResetEmail,
  resetPassword,
  updateUserRole,
  getUserDeletionInfo,
  deleteUser,
} from '../user.service'

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = prisma as any
const mockHash = hash as jest.Mock
const mockCompare = compare as jest.Mock
const mockJwt = jwt as unknown as {
  sign: jest.Mock
  verify: jest.Mock
  decode: jest.Mock
}

beforeAll(() => {
  process.env.EMAIL_VERIF_TOKEN = 'email-verif-secret'
  process.env.RESET_PASSWORD_SECRET = 'reset-secret'
  process.env.NEXTAUTH_URL = 'https://example.test'
})

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(console, 'warn').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('findAllUserPaginated', () => {
  it('returns users and pagination metadata with lightweight includes by default', async () => {
    db.user.findMany.mockResolvedValue([{ id: 'u1' }, { id: 'u2' }])
    db.user.count.mockResolvedValue(25)

    const result = await findAllUserPaginated({ page: 2, limit: 10 })

    expect(result).not.toBeNull()
    expect(result!.users).toHaveLength(2)
    expect(result!.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 25,
      totalPages: 3,
      hasNext: true,
      hasPrev: true,
    })
    // skip = (page - 1) * limit
    expect(db.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 })
    )
  })

  it('filters by role when provided', async () => {
    db.user.findMany.mockResolvedValue([])
    db.user.count.mockResolvedValue(0)

    await findAllUserPaginated({ role: UserRole.ADMIN })

    expect(db.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { roles: UserRole.ADMIN } })
    )
  })

  it('returns null and logs when the query throws', async () => {
    db.user.findMany.mockRejectedValue(new Error('db down'))
    db.user.count.mockResolvedValue(0)

    const result = await findAllUserPaginated()

    expect(result).toBeNull()
  })
})

describe('findAllUser (legacy wrapper)', () => {
  it('delegates to paginated version and returns the users array', async () => {
    db.user.findMany.mockResolvedValue([{ id: 'u1' }])
    db.user.count.mockResolvedValue(1)

    const users = await findAllUser()

    expect(users).toEqual([{ id: 'u1' }])
    expect(db.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 })
    )
  })

  it('returns null when the paginated query fails', async () => {
    db.user.findMany.mockRejectedValue(new Error('boom'))
    db.user.count.mockResolvedValue(0)

    expect(await findAllUser()).toBeNull()
  })
})

describe('findUserById', () => {
  it('rejects an invalid id', async () => {
    await expect(findUserById('' as string)).rejects.toThrow('utilisateur')
  })

  it('returns null when the user does not exist', async () => {
    db.user.findUnique.mockResolvedValue(null)

    expect(await findUserById('missing')).toBeNull()
  })

  it('returns the user when found', async () => {
    const user = { id: 'u1', email: 'a@b.c' }
    db.user.findUnique.mockResolvedValue(user)

    expect(await findUserById('u1')).toBe(user)
  })

  it('wraps database errors with context', async () => {
    db.user.findUnique.mockRejectedValue(new Error('connection reset'))

    await expect(findUserById('u1')).rejects.toThrow('connection reset')
  })
})

describe('findUserByEmail', () => {
  it('returns the user by email', async () => {
    const user = { id: 'u1', email: 'a@b.c' }
    db.user.findUnique.mockResolvedValue(user)

    expect(await findUserByEmail('a@b.c')).toBe(user)
    expect(db.user.findUnique).toHaveBeenCalledWith({ where: { email: 'a@b.c' } })
  })

  it('returns null on error instead of throwing', async () => {
    db.user.findUnique.mockRejectedValue(new Error('x'))

    expect(await findUserByEmail('a@b.c')).toBeNull()
  })
})

describe('findAllUserByRoles', () => {
  it('builds an `in` clause for an array of roles', async () => {
    db.user.findMany.mockResolvedValue([])

    await findAllUserByRoles([UserRole.ADMIN, UserRole.HOST])

    expect(db.user.findMany).toHaveBeenCalledWith({
      where: { roles: { in: [UserRole.ADMIN, UserRole.HOST] } },
    })
  })

  it('uses a direct match for a single role', async () => {
    db.user.findMany.mockResolvedValue([])

    await findAllUserByRoles(UserRole.HOST)

    expect(db.user.findMany).toHaveBeenCalledWith({ where: { roles: UserRole.HOST } })
  })

  it('returns null on error', async () => {
    db.user.findMany.mockRejectedValue(new Error('x'))
    expect(await findAllUserByRoles(UserRole.USER)).toBeNull()
  })
})

describe('verifyPassword', () => {
  it('returns true when bcrypt.compare resolves true', async () => {
    mockCompare.mockResolvedValue(true)
    expect(await verifyPassword('plain', 'hash')).toBe(true)
    expect(mockCompare).toHaveBeenCalledWith('plain', 'hash')
  })

  it('returns false when bcrypt.compare resolves false', async () => {
    mockCompare.mockResolvedValue(false)
    expect(await verifyPassword('plain', 'hash')).toBe(false)
  })

  it('returns false (never throws) when bcrypt rejects', async () => {
    mockCompare.mockRejectedValue(new Error('bcrypt error'))
    expect(await verifyPassword('plain', 'hash')).toBe(false)
  })
})

describe('createUser', () => {
  it('hashes the password and sends a verification email by default', async () => {
    db.user.create.mockResolvedValue({ id: 'u1', email: 'a@b.c', name: 'A', lastname: 'B' })
    db.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.c', name: 'A' })

    const user = await createUser({ email: 'a@b.c', password: 'secret123' })

    expect(mockHash).toHaveBeenCalledWith('secret123', 10)
    expect(db.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ password: 'hashed-password' }),
      })
    )
    // emailVerified must NOT be pre-set when email flow is enabled
    const createArg = db.user.create.mock.calls[0][0]
    expect(createArg.data.emailVerified).toBeUndefined()
    expect(emailService.sendVerificationEmail).toHaveBeenCalled()
    expect(user).toEqual({ id: 'u1', email: 'a@b.c', name: 'A', lastname: 'B' })
  })

  it('pre-verifies email and skips sending when disableEmail=true', async () => {
    db.user.create.mockResolvedValue({ id: 'u2', email: 'c@d.e', name: null, lastname: null })

    await createUser({ email: 'c@d.e', password: 'secret123' }, true)

    const createArg = db.user.create.mock.calls[0][0]
    expect(createArg.data.emailVerified).toBeInstanceOf(Date)
    expect(emailService.sendVerificationEmail).not.toHaveBeenCalled()
  })

  it('returns null when creation fails (e.g. duplicate email)', async () => {
    db.user.create.mockRejectedValue(new Error('Unique constraint failed on the fields: (`email`)'))

    const user = await createUser({ email: 'dup@b.c', password: 'secret123' })

    expect(user).toBeNull()
    expect(emailService.sendVerificationEmail).not.toHaveBeenCalled()
  })
})

describe('updateUser', () => {
  it('re-hashes the password when a new one is provided', async () => {
    db.user.update.mockResolvedValue({ id: 'u1' })

    await updateUser('u1', { password: 'newsecret', name: 'New' })

    expect(mockHash).toHaveBeenCalledWith('newsecret', 10)
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: expect.objectContaining({ password: 'hashed-password', name: 'New' }),
      })
    )
  })

  it('does not hash when no password is provided', async () => {
    db.user.update.mockResolvedValue({ id: 'u1' })

    await updateUser('u1', { name: 'Only Name' })

    expect(mockHash).not.toHaveBeenCalled()
  })

  it('returns null on error', async () => {
    db.user.update.mockRejectedValue(new Error('x'))
    expect(await updateUser('u1', { name: 'X' })).toBeNull()
  })
})

describe('sendEmailVerification', () => {
  it('signs a token, persists it and sends the email for an eligible user', async () => {
    db.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.c',
      name: 'Alice',
      emailOptOut: false,
      emailBounced: false,
    })
    db.user.update.mockResolvedValue({})

    await sendEmailVerification('u1')

    expect(mockJwt.sign).toHaveBeenCalled()
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { emailToken: 'signed-token' } })
    )
    expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
      'a@b.c',
      'Alice',
      expect.stringContaining('/checkEmail/signed-token')
    )
  })

  it('skips sending when the user has opted out', async () => {
    db.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.c',
      name: 'Alice',
      emailOptOut: true,
      emailBounced: false,
    })

    await sendEmailVerification('u1')

    expect(db.user.update).not.toHaveBeenCalled()
    expect(emailService.sendVerificationEmail).not.toHaveBeenCalled()
  })

  it('swallows errors when the user is not found (never throws)', async () => {
    db.user.findUnique.mockResolvedValue(null)

    await expect(sendEmailVerification('missing')).resolves.toBeUndefined()
    expect(emailService.sendVerificationEmail).not.toHaveBeenCalled()
  })
})

describe('validateEmail', () => {
  it('marks the email verified and clears the token on success', async () => {
    mockJwt.verify.mockReturnValue({ email: 'a@b.c' })
    db.user.findFirst.mockResolvedValue({ id: 'u1', email: 'a@b.c' })
    db.user.update.mockResolvedValue({})

    const result = await validateEmail('valid-token')

    expect(result).toBe(true)
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: expect.objectContaining({ emailToken: null, emailVerified: expect.any(Date) }),
      })
    )
  })

  it('returns false when the token/user pair is not found', async () => {
    mockJwt.verify.mockReturnValue({ email: 'a@b.c' })
    db.user.findFirst.mockResolvedValue(null)

    expect(await validateEmail('token')).toBe(false)
    expect(db.user.update).not.toHaveBeenCalled()
  })

  it('resends a verification email and returns false on an expired token', async () => {
    mockJwt.verify.mockImplementation(() => {
      throw new TokenExpiredError('jwt expired', new Date())
    })
    mockJwt.decode.mockReturnValue({ email: 'a@b.c' })
    // First findUnique for the expired-branch lookup, then sendEmailVerification's own lookup
    db.user.findUnique
      .mockResolvedValueOnce({ id: 'u1', email: 'a@b.c' })
      .mockResolvedValueOnce({
        id: 'u1',
        email: 'a@b.c',
        name: 'Alice',
        emailOptOut: false,
        emailBounced: false,
      })
    db.user.update.mockResolvedValue({})

    const result = await validateEmail('expired-token')

    expect(result).toBe(false)
    expect(emailService.sendVerificationEmail).toHaveBeenCalled()
  })
})

describe('sendResetEmail', () => {
  it('signs, persists a reset token and sends the reset email', async () => {
    db.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.c',
      name: 'Alice',
      emailOptOut: false,
      emailBounced: false,
    })
    db.user.update.mockResolvedValue({})

    await sendResetEmail('a@b.c')

    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { resetToken: 'signed-token' } })
    )
    expect(emailService.sendPasswordReset).toHaveBeenCalledWith(
      'a@b.c',
      'Alice',
      expect.stringContaining('/forgetPassword/signed-token')
    )
  })

  it('skips sending when the email bounced', async () => {
    db.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.c',
      name: 'Alice',
      emailOptOut: false,
      emailBounced: true,
    })

    await sendResetEmail('a@b.c')

    expect(emailService.sendPasswordReset).not.toHaveBeenCalled()
  })

  it('does not throw when the user is unknown', async () => {
    db.user.findUnique.mockResolvedValue(null)

    await expect(sendResetEmail('missing@b.c')).resolves.toBeUndefined()
    expect(emailService.sendPasswordReset).not.toHaveBeenCalled()
  })
})

describe('resetPassword', () => {
  it('hashes the new password, clears the reset token and returns true', async () => {
    mockJwt.verify.mockReturnValue({ id: 'u1' })
    db.user.findFirst.mockResolvedValue({ id: 'u1', resetToken: 'token' })
    db.user.update.mockResolvedValue({})

    const result = await resetPassword('token', 'brand-new-pass')

    expect(result).toBe(true)
    expect(mockHash).toHaveBeenCalledWith('brand-new-pass', 10)
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: { password: 'hashed-password', resetToken: null },
      })
    )
  })

  it('throws "Token invalide" when the decoded payload has no id', async () => {
    mockJwt.verify.mockReturnValue({})

    await expect(resetPassword('token', 'x')).rejects.toThrow('Token invalide')
  })

  it('throws when the token/user pair does not match', async () => {
    mockJwt.verify.mockReturnValue({ id: 'u1' })
    db.user.findFirst.mockResolvedValue(null)

    await expect(resetPassword('token', 'x')).rejects.toThrow(
      'Token invalide ou utilisateur non trouvé'
    )
  })

  it('maps an expired token to a friendly message', async () => {
    mockJwt.verify.mockImplementation(() => {
      throw new TokenExpiredError('jwt expired', new Date())
    })

    await expect(resetPassword('token', 'x')).rejects.toThrow(
      'Le lien de réinitialisation a expiré'
    )
  })

  it('maps a malformed token to "Token invalide"', async () => {
    mockJwt.verify.mockImplementation(() => {
      throw new JsonWebTokenError('invalid signature')
    })

    await expect(resetPassword('token', 'x')).rejects.toThrow('Token invalide')
  })
})

describe('updateUserRole', () => {
  it('updates the role and returns the projected user', async () => {
    const updated = { id: 'u1', email: 'a@b.c', roles: UserRole.HOST }
    db.user.update.mockResolvedValue(updated)

    const result = await updateUserRole('u1', UserRole.HOST)

    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'u1' }, data: { roles: UserRole.HOST } })
    )
    expect(result).toBe(updated)
  })

  it('returns null on error', async () => {
    db.user.update.mockRejectedValue(new Error('x'))
    expect(await updateUserRole('u1', UserRole.HOST)).toBeNull()
  })
})

describe('getUserDeletionInfo', () => {
  it('returns null when the user does not exist', async () => {
    db.user.findUnique.mockResolvedValue(null)
    db.product.count.mockResolvedValue(0)
    db.rent.count.mockResolvedValue(0)
    db.rent.findMany.mockResolvedValue([])

    expect(await getUserDeletionInfo('missing')).toBeNull()
  })

  it('flags active reservations when the user has active rents as guest', async () => {
    db.user.findUnique.mockResolvedValue({ id: 'u1', name: 'A', lastname: 'B', email: 'a@b.c' })
    db.product.count.mockResolvedValue(2)
    db.rent.count.mockResolvedValue(5)
    db.rent.findMany
      .mockResolvedValueOnce([{ id: 'r1', status: 'RESERVED' }]) // as guest
      .mockResolvedValueOnce([]) // as host

    const info = await getUserDeletionInfo('u1')

    expect(info).not.toBeNull()
    expect(info!.hasActiveReservations).toBe(true)
    expect(info!.ownedProductCount).toBe(2)
    expect(info!.rentCount).toBe(5)
  })

  it('reports no active reservations when both lists are empty', async () => {
    db.user.findUnique.mockResolvedValue({ id: 'u1', name: 'A', lastname: 'B', email: 'a@b.c' })
    db.product.count.mockResolvedValue(0)
    db.rent.count.mockResolvedValue(0)
    db.rent.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([])

    const info = await getUserDeletionInfo('u1')

    expect(info!.hasActiveReservations).toBe(false)
  })
})

describe('deleteUser', () => {
  it('returns NOT_FOUND when the user does not exist', async () => {
    db.user.findUnique.mockResolvedValue(null)
    db.product.count.mockResolvedValue(0)
    db.rent.count.mockResolvedValue(0)
    db.rent.findMany.mockResolvedValue([])

    const result = await deleteUser('missing')

    expect(result).toEqual({ success: false, reason: 'NOT_FOUND' })
    expect(db.user.delete).not.toHaveBeenCalled()
  })

  it('refuses deletion when there are active reservations', async () => {
    db.user.findUnique.mockResolvedValue({ id: 'u1', name: 'A', lastname: 'B', email: 'a@b.c' })
    db.product.count.mockResolvedValue(0)
    db.rent.count.mockResolvedValue(1)
    db.rent.findMany
      .mockResolvedValueOnce([{ id: 'r1', status: 'CHECKIN' }])
      .mockResolvedValueOnce([])

    const result = await deleteUser('u1')

    expect(result.success).toBe(false)
    expect((result as { reason: string }).reason).toBe('ACTIVE_RESERVATIONS')
    expect(db.user.delete).not.toHaveBeenCalled()
  })

  it('deletes the user when there are no active reservations', async () => {
    db.user.findUnique.mockResolvedValue({ id: 'u1', name: 'A', lastname: 'B', email: 'a@b.c' })
    db.product.count.mockResolvedValue(0)
    db.rent.count.mockResolvedValue(0)
    db.rent.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([])
    db.user.delete.mockResolvedValue({})

    const result = await deleteUser('u1')

    expect(result).toEqual({ success: true })
    expect(db.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } })
  })
})
