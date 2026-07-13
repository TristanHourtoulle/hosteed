import {
  setRoomTypeQuantity,
  totalSelectedRooms,
  getSelectedLines,
  selectionSubtotal,
  selectionToLines,
  encodeRoomTypeSelection,
  decodeRoomTypeSelection,
  parseReservationRoomTypes,
  isDateBlocked,
  type RoomTypeSelection,
} from '../roomTypeSelection'
import type { RoomTypeView } from '@/types/roomType'

function makeRoomType(over: Partial<RoomTypeView> & { id: string }): RoomTypeView {
  return {
    name: over.id.toUpperCase(),
    quantity: 5,
    capacity: 2,
    surface: null,
    smoking: false,
    basePrice: '100',
    priceMGA: '500000',
    position: 0,
    beds: [],
    ...over,
  }
}

describe('setRoomTypeQuantity', () => {
  it('clamps quantity to availableQuantity when exceeding cap', () => {
    expect(setRoomTypeQuantity({}, 'a', 5, 3).a).toBe(3)
  })

  it('removes a room type when quantity set to 0', () => {
    expect(setRoomTypeQuantity({ a: 2 }, 'a', 0, 3)).toEqual({})
  })

  it('never mutates the input selection', () => {
    const input: RoomTypeSelection = Object.freeze({ a: 1 })
    const next = setRoomTypeQuantity(input, 'b', 2, 5)
    expect(next).not.toBe(input)
    expect(input).toEqual({ a: 1 })
    expect(next).toEqual({ a: 1, b: 2 })
  })

  it('clamps negative quantities to remove the key', () => {
    expect(setRoomTypeQuantity({ a: 2 }, 'a', -3, 5)).toEqual({})
  })
})

describe('totalSelectedRooms', () => {
  it('sums quantities across types', () => {
    expect(totalSelectedRooms({ a: 2, b: 1 })).toBe(3)
  })

  it('returns 0 for an empty selection', () => {
    expect(totalSelectedRooms({})).toBe(0)
  })
})

describe('getSelectedLines', () => {
  const roomTypes = [
    makeRoomType({ id: 'b', name: 'Suite', basePrice: '150', position: 1, quantity: 4 }),
    makeRoomType({ id: 'a', name: 'Double', basePrice: '100', position: 0, quantity: 3 }),
  ]

  it('resolves lines ordered by position and drops unselected types', () => {
    const lines = getSelectedLines({ a: 2, b: 1 }, roomTypes)
    expect(lines.map(l => l.roomTypeId)).toEqual(['a', 'b'])
    expect(lines[0]).toMatchObject({ name: 'Double', quantity: 2, unitPricePerNight: 100 })
    expect(lines[1]).toMatchObject({ name: 'Suite', quantity: 1, unitPricePerNight: 150 })
  })

  it('uses the availability cap when provided, else the type quantity', () => {
    const lines = getSelectedLines({ a: 1, b: 1 }, roomTypes, { a: 1 })
    const a = lines.find(l => l.roomTypeId === 'a')!
    const b = lines.find(l => l.roomTypeId === 'b')!
    expect(a.availableQuantity).toBe(1)
    expect(b.availableQuantity).toBe(4)
  })

  it('drops unknown room-type ids', () => {
    expect(getSelectedLines({ zzz: 1 }, roomTypes)).toEqual([])
  })
})

describe('selectionSubtotal', () => {
  it('computes subtotal as sum of unitPrice × quantity × nights', () => {
    const lines = [
      { unitPricePerNight: 100, quantity: 2 },
      { unitPricePerNight: 150, quantity: 1 },
    ]
    expect(selectionSubtotal(lines, 3)).toBe(1050)
  })

  it('returns 0 for zero nights', () => {
    expect(selectionSubtotal([{ unitPricePerNight: 100, quantity: 2 }], 0)).toBe(0)
  })
})

describe('encode/decode round-trip', () => {
  it('round-trips encode/decode', () => {
    expect(decodeRoomTypeSelection(encodeRoomTypeSelection({ a: 2, b: 1 }))).toEqual({ a: 2, b: 1 })
  })

  it('encodes in deterministic id order', () => {
    expect(encodeRoomTypeSelection({ b: 1, a: 2 })).toBe('a:2;b:1')
  })

  it('decodes to empty object for empty/garbage input', () => {
    expect(decodeRoomTypeSelection('')).toEqual({})
    expect(decodeRoomTypeSelection(null)).toEqual({})
    expect(decodeRoomTypeSelection('garbage')).toEqual({})
    expect(decodeRoomTypeSelection('a:0;b:-2;c:x')).toEqual({})
  })
})

describe('selectionToLines / parseReservationRoomTypes', () => {
  it('converts a selection into request lines', () => {
    expect(selectionToLines({ a: 2, b: 1 })).toEqual([
      { roomTypeId: 'a', quantity: 2 },
      { roomTypeId: 'b', quantity: 1 },
    ])
  })

  it('parses the roomTypes query param into selection lines', () => {
    expect(parseReservationRoomTypes('a:1;b:2')).toEqual([
      { roomTypeId: 'a', quantity: 1 },
      { roomTypeId: 'b', quantity: 2 },
    ])
  })
})

describe('isDateBlocked', () => {
  const ranges = [
    { startDate: new Date('2026-08-10'), endDate: new Date('2026-08-12') },
  ]

  it('marks a date inside a blocked range as blocked', () => {
    expect(isDateBlocked(new Date('2026-08-11'), ranges)).toBe(true)
  })

  it('treats range boundaries as blocked (inclusive)', () => {
    expect(isDateBlocked(new Date('2026-08-10'), ranges)).toBe(true)
    expect(isDateBlocked(new Date('2026-08-12'), ranges)).toBe(true)
  })

  it('returns false for a date outside every range', () => {
    expect(isDateBlocked(new Date('2026-08-13'), ranges)).toBe(false)
    expect(isDateBlocked(new Date('2026-08-09'), ranges)).toBe(false)
  })
})
