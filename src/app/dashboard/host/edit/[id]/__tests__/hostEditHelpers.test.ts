/**
 * The host edit page must let the listing owner (and HOST_MANAGER / ADMIN) edit
 * a hotel's room types, which previously only the admin wizard could do — the
 * page hardcoded `roomTypes: []` (TRI-1028).
 *
 * These cover the two pure halves of that flow: hydrating the form from the API
 * payload, and building the PUT body. The `rt-` temp-id vs DB cuid
 * discriminator is the load-bearing part: existing types must keep their id
 * (→ update), new ones must omit it (→ create), removed ones must simply be
 * absent (→ delete by `syncRoomTypes`). Non-hotel products must be untouched.
 */

import { mapProductToFormData, buildHostUpdatePayload } from '../hostEditHelpers'
import type { HostEditProduct } from '../hostEditHelpers'
import { createEmptyRoomType } from '@/app/createProduct/utils/roomTypeHelpers'
import type { FormData } from '@/app/createProduct/types'

const dbSuite = {
  id: 'ckdbsuite000001',
  name: 'Suite',
  quantity: 3,
  capacity: 4,
  surface: 40,
  smoking: false,
  basePrice: '200',
  priceMGA: '900000',
  position: 0,
  beds: [{ bedType: 'KING' as const, count: 1 }],
  specialPrices: [],
  mealsList: [{ id: 'meal1' }],
  includedServices: [{ id: 'inc1' }],
  extras: [{ id: 'extra1' }],
}

function makeProduct(overrides: Partial<HostEditProduct> = {}): HostEditProduct {
  return {
    id: 'p1',
    name: 'Hotel Beau Rivage',
    description: 'desc',
    address: 'Somewhere',
    basePrice: '100',
    priceMGA: '400000',
    type: { id: 't1', name: 'Hotel', isHotelType: true },
    typeId: 't1',
    owner: { id: 'owner-1' },
    ...overrides,
  }
}

describe('mapProductToFormData (hydration)', () => {
  it('loads existing room types into the form, preserving DB ids', () => {
    const formData = mapProductToFormData(makeProduct({ roomTypes: [dbSuite] }))

    expect(formData.isHotel).toBe(true)
    expect(formData.roomTypes).toHaveLength(1)
    expect(formData.roomTypes[0].id).toBe('ckdbsuite000001')
    expect(formData.roomTypes[0].name).toBe('Suite')
    expect(formData.roomTypes[0].quantity).toBe('3')
    expect(formData.roomTypes[0].mealIds).toEqual(['meal1'])
  })

  it('re-expands beds to the full 4-counter grid', () => {
    const formData = mapProductToFormData(makeProduct({ roomTypes: [dbSuite] }))

    expect(formData.roomTypes[0].beds).toEqual([
      { bedType: 'SIMPLE', count: 0 },
      { bedType: 'DOUBLE', count: 0 },
      { bedType: 'KING', count: 1 },
      { bedType: 'GRAND_KING', count: 0 },
    ])
  })

  it('derives isHotel from type.isHotelType, not from the hotel relation array', () => {
    // `hotel` is a Prisma list: `[]` is truthy, so it can never discriminate.
    const nonHotel = mapProductToFormData(
      makeProduct({ type: { id: 't2', name: 'Villa', isHotelType: false }, hotel: [] })
    )
    expect(nonHotel.isHotel).toBe(false)

    const hotel = mapProductToFormData(
      makeProduct({ type: { id: 't1', name: 'Hotel', isHotelType: true }, hotel: [] })
    )
    expect(hotel.isHotel).toBe(true)
  })

  it('leaves roomTypes empty for a non-hotel product (regression guard)', () => {
    const formData = mapProductToFormData(
      makeProduct({ type: { id: 't2', name: 'Villa', isHotelType: false }, roomTypes: [] })
    )

    expect(formData.isHotel).toBe(false)
    expect(formData.roomTypes).toEqual([])
  })

  it('keeps mapping the classic product fields', () => {
    const formData = mapProductToFormData(
      makeProduct({ room: 3, bathroom: 2, arriving: 15, leaving: 11, phone: '0340000000' })
    )

    expect(formData.name).toBe('Hotel Beau Rivage')
    expect(formData.room).toBe('3')
    expect(formData.bathroom).toBe('2')
    expect(formData.arriving).toBe('15')
    expect(formData.leaving).toBe('11')
    expect(formData.phone).toBe('0340000000')
  })
})

function makeFormData(overrides: Partial<FormData> = {}): FormData {
  return {
    ...mapProductToFormData(makeProduct()),
    ...overrides,
  }
}

describe('buildHostUpdatePayload (save)', () => {
  it('keeps the DB id of an edited room type so it is updated, not recreated', () => {
    const loaded = mapProductToFormData(makeProduct({ roomTypes: [dbSuite] }))
    const edited = {
      ...loaded.roomTypes[0],
      quantity: '5',
    }

    const payload = buildHostUpdatePayload(makeFormData({ ...loaded, roomTypes: [edited] }), [], {})

    expect(payload.roomTypes).toHaveLength(1)
    expect(payload.roomTypes?.[0].id).toBe('ckdbsuite000001')
    expect(payload.roomTypes?.[0].quantity).toBe(5)
  })

  it('omits the id of a newly added `rt-` room type so it is created', () => {
    const added = { ...createEmptyRoomType(), name: 'Double' as const, quantity: '2', capacity: '2' }
    expect(added.id.startsWith('rt-')).toBe(true)

    const payload = buildHostUpdatePayload(makeFormData({ isHotel: true, roomTypes: [added] }), [], {})

    expect(payload.roomTypes).toHaveLength(1)
    expect(payload.roomTypes?.[0]).not.toHaveProperty('id')
    expect(payload.roomTypes?.[0].name).toBe('Double')
  })

  it('drops a removed room type from the payload so syncRoomTypes deletes it', () => {
    const loaded = mapProductToFormData(makeProduct({ roomTypes: [dbSuite] }))

    const payload = buildHostUpdatePayload(makeFormData({ ...loaded, roomTypes: [] }), [], {})

    expect(payload.roomTypes).toEqual([])
  })

  it('mixes update + create in one save', () => {
    const loaded = mapProductToFormData(makeProduct({ roomTypes: [dbSuite] }))
    const added = { ...createEmptyRoomType(), name: 'Double' as const, quantity: '1', capacity: '2' }

    const payload = buildHostUpdatePayload(
      makeFormData({ ...loaded, roomTypes: [loaded.roomTypes[0], added] }),
      [],
      {}
    )

    expect(payload.roomTypes?.[0].id).toBe('ckdbsuite000001')
    expect(payload.roomTypes?.[1]).not.toHaveProperty('id')
    expect(payload.roomTypes?.[0].position).toBe(0)
    expect(payload.roomTypes?.[1].position).toBe(1)
  })

  it('derives the legacy availableRooms from the sum of quantities for a hotel', () => {
    const loaded = mapProductToFormData(makeProduct({ roomTypes: [dbSuite] }))
    const added = { ...createEmptyRoomType(), name: 'Double' as const, quantity: '2', capacity: '2' }

    const payload = buildHostUpdatePayload(
      makeFormData({ ...loaded, hotelName: 'Beau Rivage', roomTypes: [loaded.roomTypes[0], added] }),
      [],
      {}
    )

    expect(payload.isHotel).toBe(true)
    expect(payload.hotelInfo).toEqual({ name: 'Beau Rivage', availableRooms: 5 })
  })

  it('omits roomTypes entirely for a non-hotel product, leaving syncRoomTypes a no-op', () => {
    const payload = buildHostUpdatePayload(
      makeFormData({ isHotel: false, roomTypes: [] }),
      [],
      {}
    )

    expect(payload.roomTypes).toBeUndefined()
    expect(payload.isHotel).toBe(false)
    expect(payload.hotelInfo).toBeNull()
  })

  it('still sends the classic non-hotel fields (regression guard)', () => {
    const payload = buildHostUpdatePayload(
      makeFormData({ isHotel: false, name: 'Villa', basePrice: '120', priceMGA: '500000', room: '3' }),
      [],
      { metaTitle: 'Villa' }
    )

    expect(payload.name).toBe('Villa')
    expect(payload.basePrice).toBe('120')
    expect(payload.priceMGA).toBe('500000')
    expect(payload.room).toBe(3)
    expect(payload.seoData).toEqual({ metaTitle: 'Villa' })
  })
})
