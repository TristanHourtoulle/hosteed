import {
  createEmptyRoomType,
  copyRoomType,
  buildRoomTypesPayload,
  deriveHotelBasePrice,
  mapDbRoomTypeToForm,
  sumRoomQuantities,
} from '../roomTypeHelpers'
import type { RoomTypeFormData } from '../../types/roomType'
import type { RoomTypeWithRelations } from '@/types/room-type-db'

function filledType(overrides: Partial<RoomTypeFormData> = {}): RoomTypeFormData {
  return {
    id: 'rt-source',
    name: 'Suite',
    quantity: '2',
    capacity: '4',
    surface: '30',
    smoking: true,
    basePrice: '120',
    priceMGA: '600000',
    beds: [
      { bedType: 'SIMPLE', count: 0 },
      { bedType: 'DOUBLE', count: 1 },
      { bedType: 'KING', count: 2 },
      { bedType: 'GRAND_KING', count: 0 },
    ],
    specialPrices: [
      {
        id: 'sp-1',
        pricesEuro: '150',
        pricesMga: '750000',
        day: ['Monday'],
        startDate: null,
        endDate: null,
        activate: true,
      },
    ],
    mealIds: ['m1'],
    includedServiceIds: ['s1'],
    extraIds: ['e1'],
    images: [
      {
        id: 'img-1',
        file: null,
        preview: '/uploads/products/p1/img_0_full_1_a.webp',
        url: '/uploads/products/p1/img_0_full_1_a.webp',
        isExisting: true,
      },
    ],
    ...overrides,
  }
}

describe('createEmptyRoomType', () => {
  it('returns 4 zeroed bed counters and empty defaults', () => {
    const empty = createEmptyRoomType()
    expect(empty.beds).toHaveLength(4)
    expect(empty.beds.every(b => b.count === 0)).toBe(true)
    expect(empty.name).toBe('')
    expect(empty.quantity).toBe('1')
    expect(empty.specialPrices).toEqual([])
  })

  it('starts with no photos', () => {
    expect(createEmptyRoomType().images).toEqual([])
  })

  it('generates unique ids', () => {
    expect(createEmptyRoomType().id).not.toBe(createEmptyRoomType().id)
  })
})

describe('copyRoomType', () => {
  it('preserves the target id and copies editable fields', () => {
    const source = filledType()
    const result = copyRoomType(source, 'rt-target')
    expect(result.id).toBe('rt-target')
    expect(result.basePrice).toBe(source.basePrice)
    expect(result.name).toBe(source.name)
  })

  it('deep-copies beds and arrays (new references)', () => {
    const source = filledType()
    const result = copyRoomType(source, 'rt-target')
    expect(result.beds).not.toBe(source.beds)
    expect(result.beds).toEqual(source.beds)
    expect(result.mealIds).not.toBe(source.mealIds)
    expect(result.specialPrices).not.toBe(source.specialPrices)
  })

  // Photos are deliberately NOT copied: they are drawn from the listing's
  // shared 20-photo budget, so duplicating them would double-charge it.
  it('never copies photos', () => {
    const source = filledType()
    expect(copyRoomType(source, 'rt-target').images).toEqual([])
  })
})

describe('mapDbRoomTypeToForm photos', () => {
  const dbRoomType: RoomTypeWithRelations = {
    id: 'rt1',
    name: 'Double',
    quantity: 2,
    capacity: 2,
    surface: 18,
    smoking: false,
    basePrice: '80',
    priceMGA: '400000',
    position: 0,
    beds: [{ bedType: 'DOUBLE', count: 1 }],
    images: [
      { id: 'i1', img: '/uploads/products/p1/a_full_1_x.webp', position: 0 },
      { id: 'i2', img: '/uploads/products/p1/b_full_1_y.webp', position: 1 },
    ],
  }

  it('maps persisted photos as existing image files keyed on their url', () => {
    const form = mapDbRoomTypeToForm(dbRoomType)
    expect(form.images).toEqual([
      {
        id: 'i1',
        file: null,
        preview: '/uploads/products/p1/a_full_1_x.webp',
        url: '/uploads/products/p1/a_full_1_x.webp',
        isExisting: true,
      },
      {
        id: 'i2',
        file: null,
        preview: '/uploads/products/p1/b_full_1_y.webp',
        url: '/uploads/products/p1/b_full_1_y.webp',
        isExisting: true,
      },
    ])
  })

  it('yields an empty list when the room type has no photos', () => {
    expect(mapDbRoomTypeToForm({ ...dbRoomType, images: undefined }).images).toEqual([])
  })
})

describe('buildRoomTypesPayload', () => {
  it('converts strings to numbers and sets position', () => {
    const payload = buildRoomTypesPayload([
      filledType({ quantity: '2', surface: '30' }),
      filledType({ id: 'rt-2', quantity: '5', surface: '' }),
    ])
    expect(payload[0].quantity).toBe(2)
    expect(payload[0].surface).toBe(30)
    expect(payload[0].position).toBe(0)
    expect(payload[1].position).toBe(1)
    expect(payload[1].surface).toBeNull()
  })

  it('drops beds with count 0', () => {
    const payload = buildRoomTypesPayload([filledType()])
    expect(payload[0].beds).toEqual([
      { bedType: 'DOUBLE', count: 1 },
      { bedType: 'KING', count: 2 },
    ])
  })

  it('never sends the client temp id', () => {
    const payload = buildRoomTypesPayload([filledType()])
    expect('id' in payload[0]).toBe(false)
  })

  it('forwards per-type meals, included services and extras', () => {
    const payload = buildRoomTypesPayload([filledType()])
    expect(payload[0].mealIds).toEqual(['m1'])
    expect(payload[0].includedServiceIds).toEqual(['s1'])
    expect(payload[0].extraIds).toEqual(['e1'])
  })

  it('forwards the urls of already-persisted photos', () => {
    const payload = buildRoomTypesPayload([filledType()])
    expect(payload[0].imageUrls).toEqual(['/uploads/products/p1/img_0_full_1_a.webp'])
  })

  it('sends an empty url list for a type without photos', () => {
    const payload = buildRoomTypesPayload([filledType({ images: [] })])
    expect(payload[0].imageUrls).toEqual([])
  })

  it('ignores photos still pending upload (no url yet)', () => {
    const pending = filledType({
      images: [
        { id: 'new-1', file: null, preview: 'data:image/png;base64,AAA', isExisting: false },
      ],
    })
    expect(buildRoomTypesPayload([pending])[0].imageUrls).toEqual([])
  })
})

describe('deriveHotelBasePrice', () => {
  it('returns the cheapest EUR price with its matching MGA price', () => {
    const result = deriveHotelBasePrice([
      filledType({ basePrice: '80', priceMGA: '400000' }),
      filledType({ id: 'b', basePrice: '50', priceMGA: '250000' }),
      filledType({ id: 'c', basePrice: '120', priceMGA: '600000' }),
    ])
    expect(result).toEqual({ basePrice: '50', priceMGA: '250000' })
  })

  it('falls back to "0" when no price is filled', () => {
    expect(deriveHotelBasePrice([filledType({ basePrice: '', priceMGA: '' })])).toEqual({
      basePrice: '0',
      priceMGA: '0',
    })
  })
})

describe('sumRoomQuantities', () => {
  it('sums quantities across types', () => {
    expect(
      sumRoomQuantities([filledType({ quantity: '3' }), filledType({ id: 'b', quantity: '2' })])
    ).toBe(5)
  })

  it('treats non-numeric quantities as 0', () => {
    expect(sumRoomQuantities([filledType({ quantity: '' })])).toBe(0)
  })
})
