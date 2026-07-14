/**
 * Extended coverage for promotion.service beyond the existing roomType suites
 * (promotion.roomType.test.ts, promotion.commission.roomType.test.ts). Focuses
 * on: commission-validation edge cases, create/update/cancel/confirm flows, the
 * pricing-priority engine (calculateFinalPrice), and host pricing settings.
 * Prisma + cache invalidation are mocked at the boundary (node env).
 */

const productPromotion = {
  create: jest.fn(),
  findMany: jest.fn(),
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
}
const productFindUnique = jest.fn()
const roomTypeFindUnique = jest.fn()
const specialPricesFindMany = jest.fn()
const hostPricingFindUnique = jest.fn()
const hostPricingCreate = jest.fn()
const hostPricingUpsert = jest.fn()
const invalidateProductCache = jest.fn()

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    productPromotion,
    product: { findUnique: (...a: unknown[]) => productFindUnique(...a) },
    roomType: { findUnique: (...a: unknown[]) => roomTypeFindUnique(...a) },
    specialPrices: { findMany: (...a: unknown[]) => specialPricesFindMany(...a) },
    hostPricingSettings: {
      findUnique: (...a: unknown[]) => hostPricingFindUnique(...a),
      create: (...a: unknown[]) => hostPricingCreate(...a),
      upsert: (...a: unknown[]) => hostPricingUpsert(...a),
    },
    $transaction: (fn: (tx: unknown) => unknown) => fn({ productPromotion }),
  },
}))

jest.mock('@/lib/cache/invalidation', () => ({
  invalidateProductCache: (...a: unknown[]) => invalidateProductCache(...a),
}))

import {
  createPromotion,
  updatePromotion,
  cancelPromotion,
  confirmPromotionWithOverlap,
  getActivePromotionForProduct,
  getPromotionsForProducts,
  getProductsWithActivePromotions,
  validatePromotionCommission,
  getHostPricingSettings,
  updateHostPricingSettings,
  calculateFinalPrice,
} from '../promotion.service'

const start = new Date('2026-01-01')
const end = new Date('2026-01-10')

beforeEach(() => {
  jest.clearAllMocks()
  productPromotion.findMany.mockResolvedValue([])
  productPromotion.create.mockResolvedValue({ id: 'promo1', productId: 'p1' })
  productFindUnique.mockResolvedValue({ basePrice: '100', type: { commission: null } })
})

describe('validatePromotionCommission edge cases', () => {
  it('allows any discount (max 99%) when the type has no commission', async () => {
    productFindUnique.mockResolvedValue({ basePrice: '100', type: { commission: null } })
    const result = await validatePromotionCommission('p1', 90)
    expect(result).toEqual({ isValid: true, maxAllowedPercentage: 99 })
  })

  it('throws when the product is not found', async () => {
    productFindUnique.mockResolvedValue(null)
    await expect(validatePromotionCommission('missing', 10)).rejects.toThrow('Produit non trouvé')
  })

  it('with only fixed fees >= 1 and no rate, allows up to 99%', async () => {
    productFindUnique.mockResolvedValue({
      basePrice: '100',
      type: {
        commission: {
          hostCommissionRate: 0,
          clientCommissionRate: 0,
          hostCommissionFixed: 2,
          clientCommissionFixed: 0,
        },
      },
    })
    const result = await validatePromotionCommission('p1', 50)
    // platformRevenue = fixed 2 >= 1 → valid; totalRate 0 & totalFixed>=1 → max 99
    expect(result.maxAllowedPercentage).toBe(99)
    expect(result.isValid).toBe(true)
  })

  it('with only fixed fees < 1 and no rate, max discount is 0 and revenue too low', async () => {
    productFindUnique.mockResolvedValue({
      basePrice: '100',
      type: {
        commission: {
          hostCommissionRate: 0,
          clientCommissionRate: 0,
          hostCommissionFixed: 0.5,
          clientCommissionFixed: 0,
        },
      },
    })
    const result = await validatePromotionCommission('p1', 10)
    expect(result.maxAllowedPercentage).toBe(0)
    expect(result.isValid).toBe(false)
  })

  it('computes the max-discount ceiling from rate + base price', async () => {
    productFindUnique.mockResolvedValue({
      basePrice: '100',
      type: {
        commission: {
          hostCommissionRate: 10, // 10% (rate interpreted as percentage here)
          clientCommissionRate: 0,
          hostCommissionFixed: 0,
          clientCommissionFixed: 0,
        },
      },
    })
    // break-even needs discountedPrice >= 10 → 100*(1-d) >= 10 → d <= 90%
    const result = await validatePromotionCommission('p1', 95)
    expect(result.maxAllowedPercentage).toBe(90)
    expect(result.isValid).toBe(false)
  })
})

describe('createPromotion flows', () => {
  it('returns hasOverlap without creating when an overlap exists', async () => {
    productPromotion.findMany.mockResolvedValue([{ id: 'other' }])

    const result = await createPromotion({
      productId: 'p1',
      discountPercentage: 10,
      startDate: start,
      endDate: end,
      createdById: 'admin1',
    })

    expect(result.hasOverlap).toBe(true)
    expect(result.overlappingPromotions).toEqual([{ id: 'other' }])
    expect(productPromotion.create).not.toHaveBeenCalled()
  })

  it('throws when the discount would make the platform lose money', async () => {
    productFindUnique.mockResolvedValue({
      basePrice: '100',
      type: {
        commission: {
          hostCommissionRate: 1,
          clientCommissionRate: 0,
          hostCommissionFixed: 0,
          clientCommissionFixed: 0,
        },
      },
    })
    // 99% discount → discountedPrice 1 → revenue 0.01 < 1 → invalid
    await expect(
      createPromotion({
        productId: 'p1',
        discountPercentage: 99,
        startDate: start,
        endDate: end,
        createdById: 'admin1',
      })
    ).rejects.toThrow(/Réduction trop importante/)
    expect(productPromotion.create).not.toHaveBeenCalled()
  })

  it('creates the promotion and invalidates the product cache on success', async () => {
    const result = await createPromotion({
      productId: 'p1',
      discountPercentage: 10,
      startDate: start,
      endDate: end,
      createdById: 'admin1',
    })

    expect(result.promotion).toEqual({ id: 'promo1', productId: 'p1' })
    expect(invalidateProductCache).toHaveBeenCalledWith('p1')
  })
})

describe('updatePromotion', () => {
  it('throws when the new dates overlap another promotion', async () => {
    productPromotion.findUnique.mockResolvedValue({
      id: 'promo1',
      productId: 'p1',
      startDate: start,
      endDate: end,
      roomTypeId: null,
    })
    productPromotion.findMany.mockResolvedValue([{ id: 'other' }])

    await expect(updatePromotion('promo1', { startDate: new Date('2026-01-05') })).rejects.toThrow(
      'Les nouvelles dates se chevauchent'
    )
  })

  it('throws when the promotion to update is not found', async () => {
    productPromotion.findUnique.mockResolvedValue(null)
    await expect(updatePromotion('missing', { startDate: start })).rejects.toThrow(
      'Promotion non trouvée'
    )
  })

  it('updates without an overlap check when dates are unchanged', async () => {
    productPromotion.update.mockResolvedValue({ id: 'promo1', productId: 'p1' })

    await updatePromotion('promo1', { discountPercentage: 15 })

    expect(productPromotion.findUnique).not.toHaveBeenCalled()
    expect(productPromotion.update).toHaveBeenCalled()
    expect(invalidateProductCache).toHaveBeenCalledWith('p1')
  })
})

describe('cancelPromotion', () => {
  it('soft-deletes (isActive false) and invalidates the cache', async () => {
    productPromotion.update.mockResolvedValue({ id: 'promo1', productId: 'p1' })

    await cancelPromotion('promo1')

    expect(productPromotion.update).toHaveBeenCalledWith({
      where: { id: 'promo1' },
      data: { isActive: false },
    })
    expect(invalidateProductCache).toHaveBeenCalledWith('p1')
  })
})

describe('confirmPromotionWithOverlap', () => {
  it('creates the new promotion and deactivates the overlapping ones in a transaction', async () => {
    productPromotion.create.mockResolvedValue({ id: 'new1', productId: 'p1' })
    productPromotion.updateMany.mockResolvedValue({ count: 2 })

    const result = await confirmPromotionWithOverlap(
      {
        productId: 'p1',
        discountPercentage: 10,
        startDate: start,
        endDate: end,
        createdById: 'admin1',
      },
      ['old1', 'old2']
    )

    expect(result).toEqual({ id: 'new1', productId: 'p1' })
    expect(productPromotion.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['old1', 'old2'] } },
      data: { isActive: false, replacedById: 'new1' },
    })
    expect(invalidateProductCache).toHaveBeenCalledWith('p1')
  })
})

describe('getActivePromotionForProduct / getPromotionsForProducts', () => {
  it('returns the active promotion for a product', async () => {
    productPromotion.findFirst.mockResolvedValue({ id: 'promo1' })
    const result = await getActivePromotionForProduct('p1')
    expect(result).toEqual({ id: 'promo1' })
  })

  it('maps promotions by product id and keeps the first per product', async () => {
    productPromotion.findMany.mockResolvedValue([
      { id: 'a', productId: 'p1' },
      { id: 'b', productId: 'p1' }, // duplicate product → ignored
      { id: 'c', productId: 'p2' },
    ])

    const map = await getPromotionsForProducts(['p1', 'p2'])

    expect(map.get('p1')).toEqual({ id: 'a', productId: 'p1' })
    expect(map.get('p2')).toEqual({ id: 'c', productId: 'p2' })
    expect(map.size).toBe(2)
  })
})

describe('getProductsWithActivePromotions', () => {
  it('applies discount/type filters and sorts by discount by default', async () => {
    productPromotion.findMany.mockResolvedValue([{ id: 'promo1' }])

    await getProductsWithActivePromotions({ minDiscount: 20, typeId: 'type-1' })

    const args = productPromotion.findMany.mock.calls[0][0]
    expect(args.where.discountPercentage).toEqual({ gte: 20 })
    expect(args.where.product).toEqual({ typeId: 'type-1' })
    expect(args.orderBy).toEqual({ discountPercentage: 'desc' })
    expect(args.take).toBe(50)
  })

  it('honors the endDate sort option and pagination', async () => {
    productPromotion.findMany.mockResolvedValue([])

    await getProductsWithActivePromotions({ sortBy: 'endDate', limit: 10, offset: 5 })

    const args = productPromotion.findMany.mock.calls[0][0]
    expect(args.orderBy).toEqual({ endDate: 'asc' })
    expect(args.take).toBe(10)
    expect(args.skip).toBe(5)
  })
})

describe('getHostPricingSettings / updateHostPricingSettings', () => {
  it('creates default settings when none exist', async () => {
    hostPricingFindUnique.mockResolvedValue(null)
    hostPricingCreate.mockResolvedValue({ promotionPriority: 'PROMOTION_FIRST' })

    const result = await getHostPricingSettings('user-1')

    expect(hostPricingCreate).toHaveBeenCalledWith({
      data: { userId: 'user-1', promotionPriority: 'PROMOTION_FIRST' },
    })
    expect(result.promotionPriority).toBe('PROMOTION_FIRST')
  })

  it('returns existing settings without creating', async () => {
    hostPricingFindUnique.mockResolvedValue({ promotionPriority: 'MOST_ADVANTAGEOUS' })

    const result = await getHostPricingSettings('user-1')

    expect(hostPricingCreate).not.toHaveBeenCalled()
    expect(result.promotionPriority).toBe('MOST_ADVANTAGEOUS')
  })

  it('upserts on update', async () => {
    hostPricingUpsert.mockResolvedValue({})
    await updateHostPricingSettings('user-1', { promotionPriority: 'STACK_DISCOUNTS' })
    expect(hostPricingUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } })
    )
  })
})

describe('calculateFinalPrice pricing engine', () => {
  beforeEach(() => {
    productFindUnique.mockResolvedValue({ basePrice: '100' })
    productPromotion.findFirst.mockResolvedValue(null)
    specialPricesFindMany.mockResolvedValue([])
  })

  it('throws when the product does not exist', async () => {
    productFindUnique.mockResolvedValue(null)
    await expect(calculateFinalPrice('missing', 'mgr')).rejects.toThrow('Produit non trouvé')
  })

  it('returns the base price when no promotion or special price applies', async () => {
    hostPricingFindUnique.mockResolvedValue({ promotionPriority: 'PROMOTION_FIRST' })

    const result = await calculateFinalPrice('p1', 'mgr')

    expect(result.finalPrice).toBe(100)
    expect(result.breakdown.promotionApplied).toBe(false)
    expect(result.breakdown.specialPriceApplied).toBe(false)
  })

  it('PROMOTION_FIRST applies the promotion even if a special price exists', async () => {
    hostPricingFindUnique.mockResolvedValue({ promotionPriority: 'PROMOTION_FIRST' })
    productPromotion.findFirst.mockResolvedValue({ discountPercentage: 20 })
    specialPricesFindMany.mockResolvedValue([{ pricesEuro: '50', startDate: null, endDate: null }])

    const result = await calculateFinalPrice('p1', 'mgr')

    expect(result.finalPrice).toBe(80) // 100 * (1 - 0.2)
    expect(result.breakdown.promotionApplied).toBe(true)
    expect(result.appliedSpecialPrice).toBeNull()
  })

  it('SPECIAL_PRICE_FIRST applies the special price over the promotion', async () => {
    hostPricingFindUnique.mockResolvedValue({ promotionPriority: 'SPECIAL_PRICE_FIRST' })
    productPromotion.findFirst.mockResolvedValue({ discountPercentage: 20 })
    specialPricesFindMany.mockResolvedValue([{ pricesEuro: '50', startDate: null, endDate: null }])

    const result = await calculateFinalPrice('p1', 'mgr')

    expect(result.finalPrice).toBe(50)
    expect(result.breakdown.specialPriceApplied).toBe(true)
    expect(result.appliedPromotion).toBeNull()
  })

  it('MOST_ADVANTAGEOUS picks the lowest price (special beats promo here)', async () => {
    hostPricingFindUnique.mockResolvedValue({ promotionPriority: 'MOST_ADVANTAGEOUS' })
    productPromotion.findFirst.mockResolvedValue({ discountPercentage: 20 }) // → 80
    specialPricesFindMany.mockResolvedValue([{ pricesEuro: '50', startDate: null, endDate: null }])

    const result = await calculateFinalPrice('p1', 'mgr')

    expect(result.finalPrice).toBe(50)
    expect(result.breakdown.specialPriceApplied).toBe(true)
  })

  it('STACK_DISCOUNTS compounds the promotion and the special-price discount', async () => {
    hostPricingFindUnique.mockResolvedValue({ promotionPriority: 'STACK_DISCOUNTS' })
    productPromotion.findFirst.mockResolvedValue({ discountPercentage: 10 }) // 100 → 90
    // special 80 → 20% off base → 90 * 0.8 = 72
    specialPricesFindMany.mockResolvedValue([{ pricesEuro: '80', startDate: null, endDate: null }])

    const result = await calculateFinalPrice('p1', 'mgr')

    expect(result.finalPrice).toBeCloseTo(72)
    expect(result.breakdown.promotionApplied).toBe(true)
    expect(result.breakdown.specialPriceApplied).toBe(true)
  })

  it('filters out special prices whose date range excludes the requested date', async () => {
    hostPricingFindUnique.mockResolvedValue({ promotionPriority: 'SPECIAL_PRICE_FIRST' })
    specialPricesFindMany.mockResolvedValue([
      {
        pricesEuro: '50',
        startDate: new Date('2020-01-01'),
        endDate: new Date('2020-12-31'),
      },
    ])

    const result = await calculateFinalPrice('p1', 'mgr', new Date('2026-06-15'))

    // Special price out of range → no discount, base price returned.
    expect(result.finalPrice).toBe(100)
    expect(result.breakdown.specialPriceApplied).toBe(false)
  })
})
