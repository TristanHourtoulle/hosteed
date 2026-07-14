/**
 * Read-optimized rent queries. Prisma is mocked at the boundary; these tests
 * assert the query shape (filters/relations) and the statistics aggregation
 * rather than any DB behavior. Errors must propagate (re-thrown, not swallowed).
 */
const prismaMock = {
  rent: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
  },
}

jest.mock('@/lib/prisma', () => ({ __esModule: true, default: prismaMock }))

import {
  findAllRentsByUserIdWithProducts,
  findRentByIdWithFullDetails,
  getBulkRentsWithProducts,
  getUserRentStatistics,
} from '../rents-optimized.service'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('findAllRentsByUserIdWithProducts', () => {
  it('queries by userId, newest first, and returns the rows', async () => {
    const rows = [{ id: 'r1' }, { id: 'r2' }]
    prismaMock.rent.findMany.mockResolvedValue(rows)

    const result = await findAllRentsByUserIdWithProducts('u1')

    expect(result).toBe(rows)
    const arg = prismaMock.rent.findMany.mock.calls[0][0]
    expect(arg.where).toEqual({ userId: 'u1' })
    expect(arg.orderBy).toEqual({ arrivingDate: 'desc' })
  })

  it('re-throws on database error', async () => {
    prismaMock.rent.findMany.mockRejectedValue(new Error('db down'))

    await expect(findAllRentsByUserIdWithProducts('u1')).rejects.toThrow('db down')
  })
})

describe('findRentByIdWithFullDetails', () => {
  it('fetches a single rent by id with full relations', async () => {
    prismaMock.rent.findUnique.mockResolvedValue({ id: 'r1' })

    const result = await findRentByIdWithFullDetails('r1')

    expect(result).toEqual({ id: 'r1' })
    expect(prismaMock.rent.findUnique.mock.calls[0][0].where).toEqual({ id: 'r1' })
  })

  it('returns null when the rent is not found', async () => {
    prismaMock.rent.findUnique.mockResolvedValue(null)

    expect(await findRentByIdWithFullDetails('missing')).toBeNull()
  })
})

describe('getBulkRentsWithProducts', () => {
  it('queries with an `in` filter over the requested ids', async () => {
    prismaMock.rent.findMany.mockResolvedValue([{ id: 'r1' }, { id: 'r2' }])

    const result = await getBulkRentsWithProducts(['r1', 'r2'])

    expect(result).toHaveLength(2)
    expect(prismaMock.rent.findMany.mock.calls[0][0].where).toEqual({ id: { in: ['r1', 'r2'] } })
  })

  it('handles an empty id list', async () => {
    prismaMock.rent.findMany.mockResolvedValue([])

    expect(await getBulkRentsWithProducts([])).toEqual([])
    expect(prismaMock.rent.findMany.mock.calls[0][0].where).toEqual({ id: { in: [] } })
  })
})

describe('getUserRentStatistics', () => {
  it('aggregates the four status counts in parallel', async () => {
    // Order of the Promise.all: total, active(CHECKIN), completed(CHECKOUT), upcoming(RESERVED)
    prismaMock.rent.count
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(2) // active
      .mockResolvedValueOnce(5) // completed
      .mockResolvedValueOnce(3) // upcoming

    const stats = await getUserRentStatistics('u1')

    expect(stats).toEqual({
      totalRents: 10,
      activeRents: 2,
      completedRents: 5,
      upcomingRents: 3,
      totalSpent: 0,
    })
    expect(prismaMock.rent.count).toHaveBeenCalledTimes(4)
  })

  it('re-throws when a count query fails', async () => {
    prismaMock.rent.count.mockRejectedValue(new Error('db down'))

    await expect(getUserRentStatistics('u1')).rejects.toThrow('db down')
  })
})
