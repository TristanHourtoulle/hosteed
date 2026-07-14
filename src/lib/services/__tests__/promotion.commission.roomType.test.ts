/**
 * Per-room-type promotions must have their commission validated against the
 * room type's own base price, not the establishment (product) base price.
 * Prisma is mocked at the boundary (node env).
 */

const productFindUnique = jest.fn()
const roomTypeFindUnique = jest.fn()

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    product: { findUnique: (...a: unknown[]) => productFindUnique(...a) },
    roomType: { findUnique: (...a: unknown[]) => roomTypeFindUnique(...a) },
  },
}))

import { validatePromotionCommission } from '../promotion.service'

// 10% platform rate, no fixed fees. Break-even needs discountedPrice >= 10€.
const commission = {
  hostCommissionRate: 10,
  clientCommissionRate: 0,
  hostCommissionFixed: 0,
  clientCommissionFixed: 0,
}

beforeEach(() => {
  jest.clearAllMocks()
  productFindUnique.mockResolvedValue({
    basePrice: '1000',
    type: { commission },
  })
})

describe('validatePromotionCommission with roomTypeId', () => {
  it('uses the room type base price for the max-discount ceiling', async () => {
    roomTypeFindUnique.mockResolvedValue({ basePrice: '50' })

    const result = await validatePromotionCommission('p1', 85, 'rt1')

    // On a 50€ room, break-even is at 10€ → max 80% discount, and 85% is invalid.
    expect(result.maxAllowedPercentage).toBe(80)
    expect(result.isValid).toBe(false)
    expect(roomTypeFindUnique).toHaveBeenCalled()
  })

  it('uses the establishment base price when no roomTypeId is given', async () => {
    const result = await validatePromotionCommission('p1', 85)

    // On a 1000€ product, an 85% discount still nets 150€ → valid, max 99%.
    expect(result.maxAllowedPercentage).toBe(99)
    expect(result.isValid).toBe(true)
    expect(roomTypeFindUnique).not.toHaveBeenCalled()
  })

  it('falls back to the establishment base price if the room type is missing', async () => {
    roomTypeFindUnique.mockResolvedValue(null)

    const result = await validatePromotionCommission('p1', 85, 'rt-missing')

    expect(result.maxAllowedPercentage).toBe(99)
    expect(result.isValid).toBe(true)
  })
})
