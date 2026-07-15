import { buildCreateProductPayload } from '../buildCreateProductPayload'
import { DEFAULT_FORM_DATA, type ProductFormData, type SpecialPrice } from '@/types/product-form'
import { createEmptyRoomType } from '../roomTypeHelpers'
import type { RoomTypeFormData } from '../../types/roomType'

const seoData = { metaTitle: 't', metaDescription: 'd', keywords: 'k', slug: 's' }

function baseForm(overrides: Partial<ProductFormData> = {}): ProductFormData {
  return {
    ...DEFAULT_FORM_DATA,
    roomTypes: [],
    name: 'My place',
    description: 'desc',
    address: 'Somewhere',
    basePrice: '100',
    priceMGA: '500000',
    typeId: 't1',
    mealIds: ['meal-est'],
    extraIds: ['extra-est'],
    includedServiceIds: ['inc-est'],
    equipmentIds: ['eq1'],
    serviceIds: ['srv1'],
    highlightIds: ['hl1'],
    ...overrides,
  }
}

function roomType(over: Partial<RoomTypeFormData> = {}): RoomTypeFormData {
  return {
    ...createEmptyRoomType(),
    name: 'Double',
    quantity: '3',
    capacity: '2',
    basePrice: '80',
    priceMGA: '400000',
    beds: [
      { bedType: 'SIMPLE', count: 0 },
      { bedType: 'DOUBLE', count: 1 },
      { bedType: 'KING', count: 0 },
      { bedType: 'GRAND_KING', count: 0 },
    ],
    mealIds: ['meal-type'],
    extraIds: ['extra-type'],
    ...over,
  }
}

const specialPrices: SpecialPrice[] = [
  {
    id: 'sp1',
    pricesEuro: '120',
    pricesMga: '600000',
    day: [],
    startDate: null,
    endDate: null,
    activate: true,
  },
]

describe('buildCreateProductPayload — non-hotel', () => {
  it('has no roomTypes and uses the form basePrice', () => {
    const payload = buildCreateProductPayload({
      formData: baseForm({ isHotel: false }),
      seoData,
      userId: 'u1',
      specialPrices,
    })
    expect(payload.roomTypes).toBeUndefined()
    expect(payload.basePrice).toBe('100')
    expect(payload.priceMGA).toBe('500000')
    expect(payload.isHotel).toBe(false)
    expect(payload.hotelInfo).toBeNull()
  })

  it('keeps establishment-level meals, extras and special prices', () => {
    const payload = buildCreateProductPayload({
      formData: baseForm({ isHotel: false }),
      seoData,
      userId: 'u1',
      specialPrices,
    })
    expect(payload.meals).toEqual(['meal-est'])
    expect(payload.extras).toEqual(['extra-est'])
    expect(payload.specialPrices).toHaveLength(1)
  })

  it('sets userId to the provided single-element array', () => {
    const payload = buildCreateProductPayload({
      formData: baseForm(),
      seoData,
      userId: 'owner-9',
      specialPrices: [],
    })
    expect(payload.userId).toEqual(['owner-9'])
  })
})

describe('buildCreateProductPayload — hotel', () => {
  const hotelForm = baseForm({
    isHotel: true,
    hotelName: 'Grand Hotel',
    roomTypes: [
      roomType({ basePrice: '80', priceMGA: '400000', quantity: '3' }),
      roomType({ basePrice: '50', priceMGA: '250000', quantity: '2', name: 'Suite' }),
    ],
  })

  it('includes roomTypes[] and derives basePrice from the cheapest type', () => {
    const payload = buildCreateProductPayload({
      formData: hotelForm,
      seoData,
      userId: 'u1',
      specialPrices,
    })
    expect(payload.roomTypes).toHaveLength(2)
    expect(payload.basePrice).toBe('50')
    expect(payload.priceMGA).toBe('250000')
  })

  it('sets hotelInfo.availableRooms to the sum of quantities', () => {
    const payload = buildCreateProductPayload({
      formData: hotelForm,
      seoData,
      userId: 'u1',
      specialPrices,
    })
    expect(payload.hotelInfo).toEqual({ name: 'Grand Hotel', availableRooms: 5 })
  })

  it('omits establishment-level meals/extras/included and establishment special prices', () => {
    const payload = buildCreateProductPayload({
      formData: hotelForm,
      seoData,
      userId: 'u1',
      specialPrices,
    })
    expect(payload.meals).toEqual([])
    expect(payload.extras).toEqual([])
    expect(payload.includedServices).toEqual([])
    expect(payload.specialPrices).toEqual([])
  })

  it('keeps establishment-level equipments, services and highlights', () => {
    const payload = buildCreateProductPayload({
      formData: hotelForm,
      seoData,
      userId: 'u1',
      specialPrices,
    })
    expect(payload.equipments).toEqual(['eq1'])
    expect(payload.services).toEqual(['srv1'])
    expect(payload.highlights).toEqual(['hl1'])
  })

  it('forwards per-type meals/extras inside roomTypes', () => {
    const payload = buildCreateProductPayload({
      formData: hotelForm,
      seoData,
      userId: 'u1',
      specialPrices,
    })
    expect(payload.roomTypes?.[0].mealIds).toEqual(['meal-type'])
    expect(payload.roomTypes?.[0].extraIds).toEqual(['extra-type'])
  })
})
