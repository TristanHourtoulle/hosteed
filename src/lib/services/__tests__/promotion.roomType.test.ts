/**
 * Promotions scoped to a hotel room type (Lot 5). Prisma is mocked at the
 * boundary (node env). We verify roomTypeId is persisted on create and that
 * overlap detection is scoped to the same room type (plus establishment-wide).
 */

const productPromotion = {
  create: jest.fn(),
  findMany: jest.fn(),
  update: jest.fn(),
  findUnique: jest.fn(),
  updateMany: jest.fn(),
}
const productFindUnique = jest.fn()
const roomTypeFindUnique = jest.fn()

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    productPromotion,
    product: { findUnique: (...a: unknown[]) => productFindUnique(...a) },
    roomType: { findUnique: (...a: unknown[]) => roomTypeFindUnique(...a) },
    $transaction: (fn: (tx: unknown) => unknown) => fn({ productPromotion }),
  },
}))

jest.mock('@/lib/cache/invalidation', () => ({ invalidateProductCache: jest.fn() }))

import {
  createPromotion,
  findOverlappingPromotions,
} from '../promotion.service'

const start = new Date('2026-01-01')
const end = new Date('2026-01-10')

beforeEach(() => {
  jest.clearAllMocks()
  productPromotion.findMany.mockResolvedValue([]) // no overlaps by default
  productPromotion.create.mockResolvedValue({ id: 'promo1' })
  // Commission validation reads the product; give it a permissive commission.
  productFindUnique.mockResolvedValue({
    basePrice: '100',
    type: { commission: null },
  })
  // Per-type commission validation reads the room type base price.
  roomTypeFindUnique.mockResolvedValue({ basePrice: '100' })
})

describe('createPromotion with roomTypeId', () => {
  it('persists roomTypeId when provided', async () => {
    await createPromotion({
      productId: 'p1',
      roomTypeId: 'rt1',
      discountPercentage: 10,
      startDate: start,
      endDate: end,
      createdById: 'admin1',
    })

    expect(productPromotion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ productId: 'p1', roomTypeId: 'rt1' }),
      })
    )
  })

  it('treats a missing roomTypeId as an establishment-wide promotion (null)', async () => {
    await createPromotion({
      productId: 'p1',
      discountPercentage: 10,
      startDate: start,
      endDate: end,
      createdById: 'admin1',
    })

    expect(productPromotion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ roomTypeId: null }),
      })
    )
  })
})

describe('findOverlappingPromotions scoping', () => {
  it('scopes overlap detection to the same room type or establishment-wide', async () => {
    await findOverlappingPromotions('p1', start, end, undefined, 'rt1')

    const where = productPromotion.findMany.mock.calls[0][0].where
    expect(where.productId).toBe('p1')
    // The room-type scope is an OR of the exact type and the null (all-rooms) promo.
    const andClauses = where.AND as Array<Record<string, unknown>>
    expect(andClauses).toEqual(
      expect.arrayContaining([
        { OR: [{ roomTypeId: 'rt1' }, { roomTypeId: null }] },
      ])
    )
  })

  it('does not add a room-type filter for establishment-wide checks', async () => {
    await findOverlappingPromotions('p1', start, end)

    const where = productPromotion.findMany.mock.calls[0][0].where
    const andClauses = (where.AND ?? []) as Array<Record<string, unknown>>
    const hasRoomTypeScope = andClauses.some(c => 'OR' in c && Array.isArray(c.OR) &&
      c.OR.some((o: Record<string, unknown>) => 'roomTypeId' in o))
    expect(hasRoomTypeScope).toBe(false)
  })
})
