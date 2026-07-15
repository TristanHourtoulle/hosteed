import {
  DEFAULT_ROOM_TYPE_NAME,
  buildDefaultRoomTypeData,
  buildRentRoomTypeData,
  isBackfillEligible,
  type BackfillProductInput,
} from '../room-types-backfill'

const baseHotelProduct: BackfillProductInput = {
  id: 'p1',
  isHotelType: true,
  availableRooms: 8,
  maxPeople: 4n,
  surface: 25n,
  basePrice: '120',
  priceMGA: '540000',
  existingRoomTypeCount: 0,
}

describe('room-types-backfill', () => {
  describe('buildDefaultRoomTypeData', () => {
    it('maps availableRooms to quantity and maxPeople to capacity', () => {
      const result = buildDefaultRoomTypeData(baseHotelProduct)

      expect(result).toEqual({
        productId: 'p1',
        name: DEFAULT_ROOM_TYPE_NAME,
        quantity: 8,
        capacity: 4,
        surface: 25,
        smoking: false,
        basePrice: '120',
        priceMGA: '540000',
        position: 0,
      })
    })

    it('defaults quantity to 1 when availableRooms is null', () => {
      const result = buildDefaultRoomTypeData({ ...baseHotelProduct, availableRooms: null })

      expect(result.quantity).toBe(1)
    })

    it('defaults capacity to 1 and surface to null when absent', () => {
      const result = buildDefaultRoomTypeData({
        ...baseHotelProduct,
        maxPeople: null,
        surface: null,
      })

      expect(result.capacity).toBe(1)
      expect(result.surface).toBeNull()
    })

    it('keeps prices as strings (no numeric coercion)', () => {
      const result = buildDefaultRoomTypeData({ ...baseHotelProduct, basePrice: '120.50' })

      expect(result.basePrice).toBe('120.50')
      expect(typeof result.basePrice).toBe('string')
    })
  })

  describe('isBackfillEligible', () => {
    it('is true for a hotel with no existing room types', () => {
      expect(isBackfillEligible(baseHotelProduct)).toBe(true)
    })

    it('is false for non-hotel products', () => {
      expect(isBackfillEligible({ ...baseHotelProduct, isHotelType: false })).toBe(false)
    })

    it('is false when room types already exist (idempotent)', () => {
      expect(isBackfillEligible({ ...baseHotelProduct, existingRoomTypeCount: 1 })).toBe(false)
    })
  })

  describe('buildRentRoomTypeData', () => {
    it('sets quantity 1 and snapshots unitPrice', () => {
      const result = buildRentRoomTypeData('r1', 'rt1', '120')

      expect(result).toEqual({
        rentId: 'r1',
        roomTypeId: 'rt1',
        quantity: 1,
        unitPrice: '120',
      })
    })
  })
})
