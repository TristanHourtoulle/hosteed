import { bedsSummary, roomTypeLine } from '../roomTypeView'
import type { RoomTypeWithRelations } from '../roomTypeTypes'

const baseRoomType: RoomTypeWithRelations = {
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
}

describe('bedsSummary', () => {
  it('formats a beds summary in French', () => {
    expect(
      bedsSummary([
        { bedType: 'DOUBLE', count: 2 },
        { bedType: 'SIMPLE', count: 1 },
      ])
    ).toBe('2 lit double, 1 lit simple')
  })

  it('drops zero-count beds', () => {
    expect(
      bedsSummary([
        { bedType: 'DOUBLE', count: 0 },
        { bedType: 'KING', count: 1 },
      ])
    ).toBe('1 lit King')
  })

  it('returns a fallback for an empty list', () => {
    expect(bedsSummary([])).toBe('Aucun lit')
  })
})

describe('roomTypeLine', () => {
  it('formats a room-type line: name, quantity, capacity, price', () => {
    expect(roomTypeLine(baseRoomType)).toMatchObject({
      title: 'Double',
      quantityLabel: '4 chambres',
      capacityLabel: '2 pers.',
      priceLabel: '80€ / nuit',
      surfaceLabel: '18 m²',
      smokingLabel: 'Non-fumeur',
      bedsLabel: '1 lit double',
    })
  })

  it('singularizes the quantity label and omits missing surface', () => {
    const line = roomTypeLine({ ...baseRoomType, quantity: 1, surface: null })
    expect(line.quantityLabel).toBe('1 chambre')
    expect(line.surfaceLabel).toBeNull()
  })

  it('marks smoking room types', () => {
    expect(roomTypeLine({ ...baseRoomType, smoking: true }).smokingLabel).toBe('Fumeur')
  })
})
