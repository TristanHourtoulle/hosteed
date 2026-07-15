import { buildRoomTypeDiffs } from '../roomTypeDiff'
import type { RoomTypeWithRelations } from '../roomTypeTypes'

function makeRoomType(overrides: Partial<RoomTypeWithRelations> = {}): RoomTypeWithRelations {
  return {
    id: 'rt-double',
    name: 'Double',
    quantity: 4,
    capacity: 2,
    surface: 18,
    smoking: false,
    basePrice: '80',
    priceMGA: '400000',
    position: 0,
    beds: [{ bedType: 'DOUBLE', count: 1 }],
    ...overrides,
  }
}

const rtDouble = makeRoomType()
const rtSuite = makeRoomType({ id: 'rt-suite', name: 'Suite', basePrice: '150' })

describe('buildRoomTypeDiffs', () => {
  it('flags an added room type', () => {
    const diffs = buildRoomTypeDiffs({ roomTypes: [rtDouble, rtSuite] }, { roomTypes: [rtDouble] })
    expect(diffs).toContainEqual(expect.objectContaining({ kind: 'added', label: 'Suite' }))
  })

  it('flags a removed room type', () => {
    const diffs = buildRoomTypeDiffs({ roomTypes: [rtDouble] }, { roomTypes: [rtDouble, rtSuite] })
    expect(diffs).toContainEqual(expect.objectContaining({ kind: 'removed', label: 'Suite' }))
  })

  it('flags changed quantity/price/beds on a matched type', () => {
    const before = makeRoomType({ quantity: 4, basePrice: '80', beds: [{ bedType: 'DOUBLE', count: 1 }] })
    const after = makeRoomType({ quantity: 6, basePrice: '90', beds: [{ bedType: 'DOUBLE', count: 2 }] })
    const diffs = buildRoomTypeDiffs({ roomTypes: [after] }, { roomTypes: [before] })
    const changed = diffs.find(d => d.kind === 'changed' && d.label === 'Double')
    expect(changed).toBeDefined()
    expect(changed?.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'quantity', from: 4, to: 6 }),
        expect.objectContaining({ field: 'basePrice', from: '80', to: '90' }),
        expect.objectContaining({ field: 'beds', from: '1 lit double', to: '2 lit double' }),
      ])
    )
  })

  it('matches by id even when the name changed (rename, not add+remove)', () => {
    const before = makeRoomType({ id: 'rt1', name: 'Double' })
    const after = makeRoomType({ id: 'rt1', name: 'Suite' })
    const diffs = buildRoomTypeDiffs({ roomTypes: [after] }, { roomTypes: [before] })
    expect(diffs).toHaveLength(1)
    expect(diffs[0].kind).toBe('changed')
    expect(diffs[0].fields).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'name', from: 'Double', to: 'Suite' })])
    )
  })

  it('returns [] when room types are identical', () => {
    expect(buildRoomTypeDiffs({ roomTypes: [rtDouble] }, { roomTypes: [rtDouble] })).toEqual([])
  })

  it('returns [] when both sides have no room types', () => {
    expect(buildRoomTypeDiffs({}, {})).toEqual([])
  })
})
