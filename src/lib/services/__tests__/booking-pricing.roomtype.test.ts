import { makePrismaMock } from './helpers/prisma-mock'

const prismaMock = makePrismaMock()
jest.mock('@/lib/prisma', () => ({ __esModule: true, default: prismaMock }))

const calculateTotalRentPriceMock = jest.fn()
jest.mock('../commission.service', () => ({
  calculateTotalRentPrice: (...args: unknown[]) => calculateTotalRentPriceMock(...args),
}))

import {
  calculateRoomTypeBookingPrice,
  calculateHotelBookingPrice,
} from '../booking-pricing.service'

const A = new Date('2026-08-01')
const L2 = new Date('2026-08-03') // 2 nights
const L1 = new Date('2026-08-02') // 1 night

beforeEach(() => {
  jest.clearAllMocks()
  prismaMock.hostPricingSettings.findUnique.mockResolvedValue({
    promotionPriority: 'MOST_ADVANTAGEOUS',
  })
  prismaMock.productPromotion.findMany.mockResolvedValue([])
  prismaMock.roomTypeSpecialPrice.findMany.mockResolvedValue([])
})

// ------------------------------------------------------------------
// calculateRoomTypeBookingPrice (Task 8)
// ------------------------------------------------------------------
describe('calculateRoomTypeBookingPrice', () => {
  it('uses RoomType.basePrice (not Product.basePrice)', async () => {
    prismaMock.roomType.findUnique.mockResolvedValue({ basePrice: '100', productId: 'p1' })

    const r = await calculateRoomTypeBookingPrice('rt-1', A, L2, 'owner')

    expect(r.numberOfNights).toBe(2)
    expect(r.subtotal).toBe(200)
  })

  it('applies a type-specific promotion over a product-wide one', async () => {
    prismaMock.roomType.findUnique.mockResolvedValue({ basePrice: '100', productId: 'p1' })
    prismaMock.hostPricingSettings.findUnique.mockResolvedValue({
      promotionPriority: 'PROMOTION_FIRST',
    })
    prismaMock.productPromotion.findMany.mockResolvedValue([
      { roomTypeId: null, discountPercentage: 10, isActive: true },
      { roomTypeId: 'rt-1', discountPercentage: 25, isActive: true },
    ])

    const r = await calculateRoomTypeBookingPrice('rt-1', A, L1, 'owner')

    expect(r.numberOfNights).toBe(1)
    expect(r.subtotal).toBe(75) // type-specific 25% wins over product-wide 10%
    expect(r.promotionApplied).toBe(true)
  })

  it('applies a per-type special price', async () => {
    prismaMock.roomType.findUnique.mockResolvedValue({ basePrice: '100', productId: 'p1' })
    prismaMock.roomTypeSpecialPrice.findMany.mockResolvedValue([
      { pricesEuro: '60', startDate: null, endDate: null, activate: true },
    ])

    const r = await calculateRoomTypeBookingPrice('rt-1', A, L1, 'owner')

    expect(r.subtotal).toBe(60)
    expect(r.specialPriceApplied).toBe(true)
  })

  it('throws when the room type does not exist', async () => {
    prismaMock.roomType.findUnique.mockResolvedValue(null)

    await expect(calculateRoomTypeBookingPrice('missing', A, L1, 'owner')).rejects.toThrow(
      'Room type not found'
    )
  })
})

// ------------------------------------------------------------------
// calculateHotelBookingPrice (Task 9)
// ------------------------------------------------------------------
describe('calculateHotelBookingPrice', () => {
  it('multi-type total = sum of line subtotals (+ extras + commission)', async () => {
    prismaMock.roomType.findMany.mockResolvedValue([
      { id: 'rt-1', basePrice: '100', capacity: 2 },
      { id: 'rt-2', basePrice: '150', capacity: 3 },
    ])
    prismaMock.roomType.findUnique
      .mockResolvedValueOnce({ basePrice: '100', productId: 'p1' }) // rt-1
      .mockResolvedValueOnce({ basePrice: '150', productId: 'p1' }) // rt-2
    prismaMock.product.findUnique.mockResolvedValue({ typeId: 't1', extras: [] })
    calculateTotalRentPriceMock.mockResolvedValue({
      clientCommission: 80,
      hostCommission: 40,
      hostReceives: 760,
      totalPrice: 880,
    })

    const result = await calculateHotelBookingPrice(
      'p1',
      [
        { roomTypeId: 'rt-1', quantity: 1 },
        { roomTypeId: 'rt-2', quantity: 2 },
      ],
      A,
      L2,
      2,
      [],
      'owner'
    )

    expect(result.lines[0].lineSubtotal).toBe(200) // 100 * 2 nights * 1 room
    expect(result.lines[1].lineSubtotal).toBe(600) // 150 * 2 nights * 2 rooms
    expect(result.lines[0].unitPrice).toBe('100')
    expect(result.lines[1].unitPrice).toBe('150')
    expect(result.subtotal).toBe(800)
    expect(result.summary.subtotal).toBe(800)
    expect(result.summary.numberOfNights).toBe(2)
    expect(result.extrasTotal).toBe(0)
    expect(result.clientCommission).toBe(80)
    expect(result.hostCommission).toBe(40)
    expect(result.platformAmount).toBe(120)
    expect(result.hostAmount).toBe(760)
    expect(result.totalAmount).toBe(880)
  })

  it('throws if selections is empty', async () => {
    await expect(calculateHotelBookingPrice('p1', [], A, L2, 2, [], 'owner')).rejects.toThrow(
      'At least one room type must be selected'
    )
  })

  it('rejects when guestCount exceeds the total capacity of the selected room types', async () => {
    // 1 Double (capacity 2) selected for 8 guests → must be rejected.
    prismaMock.roomType.findMany.mockResolvedValue([{ id: 'rt-1', basePrice: '100', capacity: 2 }])

    await expect(
      calculateHotelBookingPrice(
        'p1',
        [{ roomTypeId: 'rt-1', quantity: 1 }],
        A,
        L2,
        8,
        [],
        'owner'
      )
    ).rejects.toThrow(/capacité maximale des chambres sélectionnées \(2 personnes/)
  })

  it('accepts when guestCount equals the total capacity (capacity × quantity)', async () => {
    // 2 rooms of capacity 3 = 6 seats; exactly 6 guests is allowed.
    prismaMock.roomType.findMany.mockResolvedValue([{ id: 'rt-1', basePrice: '100', capacity: 3 }])
    prismaMock.roomType.findUnique.mockResolvedValue({ basePrice: '100', productId: 'p1' })
    prismaMock.product.findUnique.mockResolvedValue({ typeId: 't1', extras: [] })
    calculateTotalRentPriceMock.mockResolvedValue({
      clientCommission: 0,
      hostCommission: 0,
      hostReceives: 400,
      totalPrice: 400,
    })

    const result = await calculateHotelBookingPrice(
      'p1',
      [{ roomTypeId: 'rt-1', quantity: 2 }],
      A,
      L2,
      6,
      [],
      'owner'
    )

    expect(result.totalAmount).toBe(400)
  })
})
