/**
 * Unit tests for user-statistics.service.ts. Prisma is mocked at the boundary.
 */
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    userRating: { findMany: jest.fn(), findUnique: jest.fn() },
    rent: { count: jest.fn(), findUnique: jest.fn() },
    user: { update: jest.fn() },
  },
}))

import prisma from '@/lib/prisma'
import {
  updateUserStatistics,
  calculateUserStatistics,
  getUserRatings,
  canUserRate,
} from '../user-statistics.service'

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = prisma as any

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => jest.restoreAllMocks())

describe('calculateUserStatistics', () => {
  it('computes the average of approved ratings and completed trips', async () => {
    db.userRating.findMany.mockResolvedValue([{ rating: 4 }, { rating: 5 }, { rating: 3 }])
    db.rent.count.mockResolvedValue(7)

    const stats = await calculateUserStatistics('u1')

    expect(stats.averageRating).toBe(4)
    expect(stats.totalRatings).toBe(3)
    expect(stats.totalTrips).toBe(7)
    expect(db.rent.count).toHaveBeenCalledWith({
      where: { userId: 'u1', status: 'CHECKOUT' },
    })
  })

  it('returns a null average when there are no ratings', async () => {
    db.userRating.findMany.mockResolvedValue([])
    db.rent.count.mockResolvedValue(0)

    const stats = await calculateUserStatistics('u1')

    expect(stats.averageRating).toBeNull()
    expect(stats.totalRatings).toBe(0)
    expect(stats.totalTrips).toBe(0)
  })

  it('re-throws on database error', async () => {
    db.userRating.findMany.mockRejectedValue(new Error('db down'))

    await expect(calculateUserStatistics('u1')).rejects.toThrow('db down')
  })
})

describe('updateUserStatistics', () => {
  it('persists the computed statistics and returns them', async () => {
    db.userRating.findMany.mockResolvedValue([{ rating: 2 }, { rating: 4 }])
    db.rent.count.mockResolvedValue(3)
    db.user.update.mockResolvedValue({})

    const stats = await updateUserStatistics('u1')

    expect(stats).toEqual({ averageRating: 3, totalRatings: 2, totalTrips: 3 })
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { averageRating: 3, totalRatings: 2, totalTrips: 3 },
    })
  })

  it('re-throws when the update fails', async () => {
    db.userRating.findMany.mockResolvedValue([])
    db.rent.count.mockResolvedValue(0)
    db.user.update.mockRejectedValue(new Error('update failed'))

    await expect(updateUserStatistics('u1')).rejects.toThrow('update failed')
  })
})

describe('getUserRatings', () => {
  it('returns approved ratings received, honoring the limit', async () => {
    const ratings = [{ id: 'r1' }, { id: 'r2' }]
    db.userRating.findMany.mockResolvedValue(ratings)

    const result = await getUserRatings('u1', 5)

    expect(result).toBe(ratings)
    expect(db.userRating.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ratedId: 'u1', approved: true },
        take: 5,
      })
    )
  })

  it('re-throws on error', async () => {
    db.userRating.findMany.mockRejectedValue(new Error('x'))
    await expect(getUserRatings('u1')).rejects.toThrow('x')
  })
})

describe('canUserRate', () => {
  it('refuses when the rent is not checked out', async () => {
    db.rent.findUnique.mockResolvedValue({
      status: 'CHECKIN',
      product: { ownerId: 'host' },
      user: { id: 'guest' },
    })

    const result = await canUserRate('host', 'rent1', 'guest', 'HOST_TO_GUEST')

    expect(result.canRate).toBe(false)
    expect(result.reason).toMatch(/terminée/)
  })

  it('refuses when the requester is not authorized for the relationship', async () => {
    db.rent.findUnique.mockResolvedValue({
      status: 'CHECKOUT',
      product: { ownerId: 'host' },
      user: { id: 'guest' },
    })

    // Someone else pretending to be the host
    const result = await canUserRate('intruder', 'rent1', 'guest', 'HOST_TO_GUEST')

    expect(result.canRate).toBe(false)
    expect(result.reason).toMatch(/autorisation/)
  })

  it('refuses when a rating already exists', async () => {
    db.rent.findUnique.mockResolvedValue({
      status: 'CHECKOUT',
      product: { ownerId: 'host' },
      user: { id: 'guest' },
    })
    db.userRating.findUnique.mockResolvedValue({ id: 'existing' })

    const result = await canUserRate('host', 'rent1', 'guest', 'HOST_TO_GUEST')

    expect(result.canRate).toBe(false)
    expect(result.reason).toMatch(/déjà noté/)
  })

  it('allows a valid HOST_TO_GUEST rating', async () => {
    db.rent.findUnique.mockResolvedValue({
      status: 'CHECKOUT',
      product: { ownerId: 'host' },
      user: { id: 'guest' },
    })
    db.userRating.findUnique.mockResolvedValue(null)

    const result = await canUserRate('host', 'rent1', 'guest', 'HOST_TO_GUEST')

    expect(result).toEqual({ canRate: true, reason: null })
  })

  it('allows a valid GUEST_TO_HOST rating', async () => {
    db.rent.findUnique.mockResolvedValue({
      status: 'CHECKOUT',
      product: { ownerId: 'host' },
      user: { id: 'guest' },
    })
    db.userRating.findUnique.mockResolvedValue(null)

    const result = await canUserRate('guest', 'rent1', 'host', 'GUEST_TO_HOST')

    expect(result.canRate).toBe(true)
  })

  it('returns a graceful failure object on database error (never throws)', async () => {
    db.rent.findUnique.mockRejectedValue(new Error('db error'))

    const result = await canUserRate('host', 'rent1', 'guest', 'HOST_TO_GUEST')

    expect(result.canRate).toBe(false)
    expect(result.reason).toMatch(/Erreur/)
  })
})
