/**
 * Yearly admin stats. Prisma is mocked at the boundary (node env). We verify the
 * count filters (approved products, waiting products, current-year paid rents)
 * and the null-on-error behavior.
 */

const productCount = jest.fn()
const userCount = jest.fn()
const rentCount = jest.fn()

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    user: { count: (...a: unknown[]) => userCount(...a) },
    product: { count: (...a: unknown[]) => productCount(...a) },
    rent: { count: (...a: unknown[]) => rentCount(...a) },
  },
}))

import { getAdminStatsYearly } from '../stats.service'

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

describe('getAdminStatsYearly', () => {
  it('aggregates users, approved products, waiting products and paid rents', async () => {
    userCount.mockResolvedValue(42)
    // product.count is called twice: approved, then waiting.
    productCount.mockResolvedValueOnce(10).mockResolvedValueOnce(3)
    rentCount.mockResolvedValue(7)

    const result = await getAdminStatsYearly()

    expect(result).toEqual({ users: 42, product: 10, productWaiting: 3, rent: 7 })
  })

  it('filters approved products by ProductValidation.Approve', async () => {
    userCount.mockResolvedValue(0)
    productCount.mockResolvedValue(0)
    rentCount.mockResolvedValue(0)

    await getAdminStatsYearly()

    expect(productCount.mock.calls[0][0]).toEqual({ where: { validate: 'Approve' } })
  })

  it('counts waiting products as RecheckRequest OR NotVerified', async () => {
    userCount.mockResolvedValue(0)
    productCount.mockResolvedValue(0)
    rentCount.mockResolvedValue(0)

    await getAdminStatsYearly()

    const waitingWhere = productCount.mock.calls[1][0].where
    expect(waitingWhere.OR).toEqual([
      { validate: 'RecheckRequest' },
      { validate: 'NotVerified' },
    ])
  })

  it('restricts rent count to CLIENT_PAID within the current year', async () => {
    userCount.mockResolvedValue(0)
    productCount.mockResolvedValue(0)
    rentCount.mockResolvedValue(0)
    const currentYear = new Date().getFullYear()

    await getAdminStatsYearly()

    const and = rentCount.mock.calls[0][0].where.AND
    expect(and).toContainEqual({ payment: 'CLIENT_PAID' })
    const arriving = and.find((c: Record<string, unknown>) => 'arrivingDate' in c)
    expect((arriving.arrivingDate.gte as Date).getFullYear()).toBe(currentYear)
  })

  it('returns null when a count query throws', async () => {
    userCount.mockRejectedValue(new Error('db down'))
    expect(await getAdminStatsYearly()).toBeNull()
  })
})
