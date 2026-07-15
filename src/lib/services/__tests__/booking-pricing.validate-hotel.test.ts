import { makePrismaMock } from './helpers/prisma-mock'

const prismaMock = makePrismaMock()
jest.mock('@/lib/prisma', () => ({ __esModule: true, default: prismaMock }))

import { validateBooking } from '../booking-pricing.service'

const START = new Date('2099-08-01')
const END = new Date('2099-08-03')

beforeEach(() => {
  jest.clearAllMocks()
})

/**
 * `Product.maxPeople` / `Product.minPeople` describe a single bookable unit.
 * A hotel is booked per room type, so those bounds must not gate the guest
 * count — `calculateHotelBookingPrice` + the checkout route (VAL_006) enforce
 * the authoritative rule: guestCount <= Σ(RoomType.capacity × quantity).
 */
describe('validateBooking guest bounds', () => {
  it('rejects a guest count above maxPeople for a non-hotel product', async () => {
    prismaMock.product.findUnique.mockResolvedValue({
      maxPeople: BigInt(4),
      minPeople: BigInt(2),
      type: { isHotelType: false },
    })

    const result = await validateBooking('p1', START, END, 6)

    expect(result.isValid).toBe(false)
    expect(result.errors.join(' ')).toMatch(/nombre maximum d'invités/)
  })

  it('rejects a guest count below minPeople for a non-hotel product', async () => {
    prismaMock.product.findUnique.mockResolvedValue({
      maxPeople: BigInt(4),
      minPeople: BigInt(2),
      type: { isHotelType: false },
    })

    const result = await validateBooking('p1', START, END, 1)

    expect(result.isValid).toBe(false)
    expect(result.errors.join(' ')).toMatch(/nombre minimum d'invités/)
  })

  it('ignores the product-level guest bounds for a hotel product', async () => {
    prismaMock.product.findUnique.mockResolvedValue({
      maxPeople: BigInt(4),
      minPeople: BigInt(2),
      type: { isHotelType: true },
    })

    // 6 guests across 2 Suites (capacity 4 each) is legitimate even though the
    // host typed maxPeople=4 in the wizard.
    const result = await validateBooking('p1', START, END, 6)

    expect(result.isValid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('still validates the date range for a hotel product', async () => {
    prismaMock.product.findUnique.mockResolvedValue({
      maxPeople: BigInt(4),
      minPeople: BigInt(2),
      type: { isHotelType: true },
    })

    const result = await validateBooking('p1', END, START, 6)

    expect(result.isValid).toBe(false)
    expect(result.errors.join(' ')).toMatch(/date de fin doit être après la date de début/)
  })
})
