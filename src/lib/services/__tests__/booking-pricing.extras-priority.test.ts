/**
 * Pricing extras multipliers, promotion-priority strategies, and the
 * establishment `calculateCompleteBookingPrice` path. Complements
 * `booking-pricing.roomtype.test.ts` (per-type base pricing + capacity guard).
 * Prisma + commission service mocked at the boundary.
 */
const prismaMock = {
  product: { findUnique: jest.fn() },
  roomType: { findUnique: jest.fn(), findMany: jest.fn() },
  productPromotion: { findFirst: jest.fn(), findMany: jest.fn() },
  specialPrices: { findMany: jest.fn() },
  roomTypeSpecialPrice: { findMany: jest.fn() },
  hostPricingSettings: { findUnique: jest.fn(), create: jest.fn() },
}
jest.mock('@/lib/prisma', () => ({ __esModule: true, default: prismaMock }))

const calculateTotalRentPriceMock = jest.fn()
jest.mock('../commission.service', () => ({
  calculateTotalRentPrice: (...a: unknown[]) => calculateTotalRentPriceMock(...a),
}))

import {
  calculateRoomTypeBookingPrice,
  calculateHotelBookingPrice,
  calculateCompleteBookingPrice,
} from '../booking-pricing.service'

const A = new Date('2026-08-01')
const L2 = new Date('2026-08-03') // 2 nights
const L1 = new Date('2026-08-02') // 1 night

beforeEach(() => {
  jest.clearAllMocks()
  prismaMock.hostPricingSettings.findUnique.mockResolvedValue({
    promotionPriority: 'MOST_ADVANTAGEOUS',
  })
  prismaMock.productPromotion.findFirst.mockResolvedValue(null)
  prismaMock.productPromotion.findMany.mockResolvedValue([])
  prismaMock.specialPrices.findMany.mockResolvedValue([])
  prismaMock.roomTypeSpecialPrice.findMany.mockResolvedValue([])
  calculateTotalRentPriceMock.mockResolvedValue({
    clientCommission: 0,
    hostCommission: 0,
    hostReceives: 0,
    totalPrice: 0,
  })
})

// ------------------------------------------------------------------
// Promotion-priority strategies (calculateRoomTypeBookingPrice)
// ------------------------------------------------------------------
describe('calculateRoomTypeBookingPrice — priority strategies', () => {
  it('MOST_ADVANTAGEOUS picks the lowest of promo vs special vs base', async () => {
    prismaMock.roomType.findUnique.mockResolvedValue({ basePrice: '100', productId: 'p1' })
    // promo 20% -> 80, special -> 70. Lowest is the 70 special price.
    prismaMock.productPromotion.findMany.mockResolvedValue([
      { roomTypeId: 'rt-1', discountPercentage: 20, isActive: true },
    ])
    prismaMock.roomTypeSpecialPrice.findMany.mockResolvedValue([
      { pricesEuro: '70', startDate: null, endDate: null, activate: true },
    ])

    const r = await calculateRoomTypeBookingPrice('rt-1', A, L1, 'owner')

    expect(r.subtotal).toBe(70)
    expect(r.specialPriceApplied).toBe(true)
    expect(r.promotionApplied).toBe(false)
  })

  it('STACK_DISCOUNTS applies promotion then special discount on top', async () => {
    prismaMock.hostPricingSettings.findUnique.mockResolvedValue({
      promotionPriority: 'STACK_DISCOUNTS',
    })
    prismaMock.roomType.findUnique.mockResolvedValue({ basePrice: '100', productId: 'p1' })
    // promo 10% -> 90, then special 80 implies a 20% special discount -> 90 * 0.8 = 72.
    prismaMock.productPromotion.findMany.mockResolvedValue([
      { roomTypeId: 'rt-1', discountPercentage: 10, isActive: true },
    ])
    prismaMock.roomTypeSpecialPrice.findMany.mockResolvedValue([
      { pricesEuro: '80', startDate: null, endDate: null, activate: true },
    ])

    const r = await calculateRoomTypeBookingPrice('rt-1', A, L1, 'owner')

    expect(r.subtotal).toBeCloseTo(72)
    expect(r.promotionApplied).toBe(true)
    expect(r.specialPriceApplied).toBe(true)
  })

  it('throws when the date range is invalid (end <= start)', async () => {
    prismaMock.roomType.findUnique.mockResolvedValue({ basePrice: '100', productId: 'p1' })

    await expect(calculateRoomTypeBookingPrice('rt-1', L1, A, 'owner')).rejects.toThrow(
      /End date must be after start date/
    )
  })
})

// ------------------------------------------------------------------
// Hotel extras multipliers (calculateHotelBookingPrice)
// ------------------------------------------------------------------
describe('calculateHotelBookingPrice — extras multipliers', () => {
  const NIGHTS = 2
  const GUESTS = 3

  async function priceWithExtra(extra: {
    id: string
    name: string
    priceEUR: number
    type: string
  }) {
    prismaMock.roomType.findMany.mockResolvedValue([{ id: 'rt-1', basePrice: '100', capacity: 4 }])
    prismaMock.roomType.findUnique.mockResolvedValue({ basePrice: '100', productId: 'p1' })
    prismaMock.product.findUnique.mockResolvedValue({ typeId: 't1', extras: [extra] })
    calculateTotalRentPriceMock.mockResolvedValue({
      clientCommission: 0,
      hostCommission: 0,
      hostReceives: 0,
      totalPrice: 0,
    })

    return calculateHotelBookingPrice(
      'p1',
      [{ roomTypeId: 'rt-1', quantity: 1 }],
      A,
      L2,
      GUESTS,
      [{ extraId: extra.id, quantity: 1 }],
      'owner'
    )
  }

  it('PER_DAY multiplies by number of nights', async () => {
    const r = await priceWithExtra({ id: 'e1', name: 'Bike', priceEUR: 10, type: 'PER_DAY' })
    expect(r.extrasTotal).toBe(10 * NIGHTS) // 20
    expect(r.extrasDetails[0].quantity).toBe(NIGHTS)
  })

  it('PER_PERSON multiplies by guest count', async () => {
    const r = await priceWithExtra({ id: 'e2', name: 'Meal', priceEUR: 10, type: 'PER_PERSON' })
    expect(r.extrasTotal).toBe(10 * GUESTS) // 30
  })

  it('PER_DAY_PERSON multiplies by nights × guests', async () => {
    const r = await priceWithExtra({ id: 'e3', name: 'Spa', priceEUR: 10, type: 'PER_DAY_PERSON' })
    expect(r.extrasTotal).toBe(10 * NIGHTS * GUESTS) // 60
  })

  it('PER_BOOKING multiplies by quantity only', async () => {
    const r = await priceWithExtra({ id: 'e4', name: 'Clean', priceEUR: 10, type: 'PER_BOOKING' })
    expect(r.extrasTotal).toBe(10) // 10 * 1
  })

  it('silently skips a selected extra that is not attached to the product', async () => {
    prismaMock.roomType.findMany.mockResolvedValue([{ id: 'rt-1', basePrice: '100', capacity: 4 }])
    prismaMock.roomType.findUnique.mockResolvedValue({ basePrice: '100', productId: 'p1' })
    prismaMock.product.findUnique.mockResolvedValue({ typeId: 't1', extras: [] })

    const r = await calculateHotelBookingPrice(
      'p1',
      [{ roomTypeId: 'rt-1', quantity: 1 }],
      A,
      L2,
      2,
      [{ extraId: 'ghost', quantity: 1 }],
      'owner'
    )

    expect(r.extrasTotal).toBe(0)
    expect(r.extrasDetails).toHaveLength(0)
  })

  it('treats a tampered room-type id as 0 capacity (guest guard trips)', async () => {
    // findMany returns no matching room types → total capacity 0 → any guest rejected.
    prismaMock.roomType.findMany.mockResolvedValue([])

    await expect(
      calculateHotelBookingPrice(
        'p1',
        [{ roomTypeId: 'tampered', quantity: 1 }],
        A,
        L2,
        2,
        [],
        'owner'
      )
    ).rejects.toThrow(/capacité maximale des chambres sélectionnées \(0 personne/)
  })
})

// ------------------------------------------------------------------
// calculateCompleteBookingPrice (establishment path)
// ------------------------------------------------------------------
describe('calculateCompleteBookingPrice', () => {
  it('sums base subtotal + extras and reports commission totals', async () => {
    // product.findUnique used twice (basePrice, then typeId+extras) → one object serves both.
    prismaMock.product.findUnique.mockResolvedValue({
      basePrice: '100',
      typeId: 't1',
      extras: [{ id: 'e1', name: 'Breakfast', priceEUR: 20, type: 'PER_BOOKING' }],
    })
    calculateTotalRentPriceMock.mockResolvedValue({
      clientCommission: 25,
      hostCommission: 15,
      hostReceives: 180,
      totalPrice: 220,
    })

    const r = await calculateCompleteBookingPrice(
      'p1',
      A,
      L2,
      2,
      [{ extraId: 'e1', quantity: 1 }],
      'owner'
    )

    expect(r.basePricing.subtotal).toBe(200) // 100 * 2 nights
    expect(r.extrasTotal).toBe(20)
    expect(r.subtotalBeforeCommission).toBe(220)
    expect(r.clientCommission).toBe(25)
    expect(r.platformAmount).toBe(40) // client + host commission
    expect(r.hostAmount).toBe(180)
    expect(r.totalAmount).toBe(220)
  })

  it('throws when the product is not found', async () => {
    // First findUnique (basePrice) resolves; second (typeId/extras) resolves null.
    prismaMock.product.findUnique
      .mockResolvedValueOnce({ basePrice: '100' })
      .mockResolvedValueOnce(null)

    await expect(
      calculateCompleteBookingPrice('p1', A, L2, 2, [], 'owner')
    ).rejects.toThrow(/Produit non trouvé/)
  })
})
