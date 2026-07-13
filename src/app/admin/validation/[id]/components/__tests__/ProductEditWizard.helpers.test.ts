import { ProductValidation } from '@prisma/client'
import { buildInitialFormData, buildUpdatePayload } from '../ProductEditWizard.helpers'
import type { Product, RoomTypeWithRelations } from '../ProductEditForm/types'

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    name: 'Test',
    description: 'desc',
    address: 'Somewhere',
    basePrice: '100',
    arriving: 14,
    leaving: 12,
    validate: ProductValidation.Approve,
    owner: { id: 'o1', email: 'owner@test.com' },
    ...overrides,
  }
}

const dbDoubleRoom: RoomTypeWithRelations = {
  id: 'rt1',
  name: 'Double',
  quantity: 4,
  capacity: 2,
  surface: 18,
  smoking: false,
  basePrice: '80',
  priceMGA: '400000',
  position: 0,
  beds: [{ bedType: 'DOUBLE', count: 1 }],
  mealsList: [{ id: 'meal1' }],
  includedServices: [{ id: 'inc1' }],
  extras: [{ id: 'extra1' }],
}

function makeHotelProduct(roomTypes: RoomTypeWithRelations[]): Product {
  return makeProduct({ hotel: [{ id: 'h1', name: 'Hotel One' }], roomTypes })
}

describe('buildInitialFormData room types', () => {
  it('maps DB room types (with beds) into RoomTypeFormData with string fields and preserved id', () => {
    const fd = buildInitialFormData(makeHotelProduct([dbDoubleRoom]))
    expect(fd.isHotel).toBe(true)
    expect(fd.roomTypes).toHaveLength(1)
    expect(fd.roomTypes[0]).toMatchObject({
      id: 'rt1',
      name: 'Double',
      quantity: '4',
      capacity: '2',
      surface: '18',
      smoking: false,
      basePrice: '80',
      priceMGA: '400000',
      mealIds: ['meal1'],
      includedServiceIds: ['inc1'],
      extraIds: ['extra1'],
    })
  })

  it('re-expands beds to the fixed 4-counter grid', () => {
    const fd = buildInitialFormData(makeHotelProduct([dbDoubleRoom]))
    expect(fd.roomTypes[0].beds).toEqual([
      { bedType: 'SIMPLE', count: 0 },
      { bedType: 'DOUBLE', count: 1 },
      { bedType: 'KING', count: 0 },
      { bedType: 'GRAND_KING', count: 0 },
    ])
  })

  it('returns empty roomTypes for a non-hotel product', () => {
    expect(buildInitialFormData(makeProduct({})).roomTypes).toEqual([])
    expect(buildInitialFormData(makeProduct({})).isHotel).toBe(false)
  })
})

describe('buildUpdatePayload room types', () => {
  const seo = { metaTitle: '', metaDescription: '', keywords: '', slug: '' }

  it('includes roomTypes (numbers, preserved id) and derives availableRooms for hotels', () => {
    const formData = buildInitialFormData(makeHotelProduct([dbDoubleRoom]))
    const payload = buildUpdatePayload(formData, seo, makeHotelProduct([dbDoubleRoom]))
    expect(payload.isHotel).toBe(true)
    expect(payload.roomTypes).toBeDefined()
    expect(payload.roomTypes?.[0]).toMatchObject({
      id: 'rt1',
      name: 'Double',
      quantity: 4,
      capacity: 2,
      basePrice: '80',
    })
    expect(payload.roomTypes?.[0].beds).toEqual([{ bedType: 'DOUBLE', count: 1 }])
    // availableRooms derived from the sum of quantities (legacy read compat)
    expect(payload.hotelInfo?.availableRooms).toBe(4)
  })

  it('omits an id for a newly added (temp) room type so it is created', () => {
    const formData = buildInitialFormData(makeHotelProduct([dbDoubleRoom]))
    formData.roomTypes.push({
      id: 'rt-1700000000-1',
      name: 'Suite',
      quantity: '2',
      capacity: '3',
      surface: '',
      smoking: false,
      basePrice: '150',
      priceMGA: '700000',
      beds: [{ bedType: 'KING', count: 1 }],
      specialPrices: [],
      mealIds: [],
      includedServiceIds: [],
      extraIds: [],
    })
    const payload = buildUpdatePayload(formData, seo, makeHotelProduct([dbDoubleRoom]))
    expect(payload.roomTypes?.[0].id).toBe('rt1')
    expect(payload.roomTypes?.[1].id).toBeUndefined()
    expect(payload.hotelInfo?.availableRooms).toBe(6)
  })

  it('omits roomTypes for non-hotel products', () => {
    const formData = buildInitialFormData(makeProduct({}))
    expect(buildUpdatePayload(formData, seo, makeProduct({})).roomTypes).toBeUndefined()
  })
})
