import { roomTypeSchema, roomTypesStepSchema } from '../roomTypeSchema'
import type { RoomTypeFormData } from '../../types/roomType'

function validType(overrides: Partial<RoomTypeFormData> = {}): RoomTypeFormData {
  return {
    id: 'rt-1',
    name: 'Double',
    quantity: '3',
    capacity: '2',
    surface: '20',
    smoking: false,
    basePrice: '80',
    priceMGA: '400000',
    beds: [
      { bedType: 'SIMPLE', count: 0 },
      { bedType: 'DOUBLE', count: 1 },
      { bedType: 'KING', count: 0 },
      { bedType: 'GRAND_KING', count: 0 },
    ],
    specialPrices: [],
    mealIds: [],
    includedServiceIds: [],
    extraIds: [],
    ...overrides,
  }
}

describe('roomTypeSchema', () => {
  it('accepts a fully filled room type', () => {
    expect(roomTypeSchema.safeParse(validType()).success).toBe(true)
  })

  it('rejects quantity below 1', () => {
    const result = roomTypeSchema.safeParse(validType({ quantity: '0' }))
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find(i => i.path.includes('quantity'))
      expect(issue?.message).toBe('La quantité doit être au moins 1')
    }
  })

  it('rejects capacity below 1', () => {
    const result = roomTypeSchema.safeParse(validType({ capacity: '0' }))
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find(i => i.path.includes('capacity'))
      expect(issue?.message).toBe('La capacité doit être au moins 1')
    }
  })

  it('rejects when no bed has a positive count', () => {
    const result = roomTypeSchema.safeParse(
      validType({
        beds: [
          { bedType: 'SIMPLE', count: 0 },
          { bedType: 'DOUBLE', count: 0 },
          { bedType: 'KING', count: 0 },
          { bedType: 'GRAND_KING', count: 0 },
        ],
      })
    )
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find(i => i.path.includes('beds'))
      expect(issue?.message).toBe('Ajoutez au moins un lit')
    }
  })

  it('rejects empty basePrice', () => {
    const result = roomTypeSchema.safeParse(validType({ basePrice: '' }))
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find(i => i.path.includes('basePrice'))
      expect(issue?.message).toBe('Le prix EUR est requis')
    }
  })

  it('rejects empty priceMGA', () => {
    const result = roomTypeSchema.safeParse(validType({ priceMGA: '' }))
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find(i => i.path.includes('priceMGA'))
      expect(issue?.message).toBe('Le prix MGA est requis')
    }
  })

  it('accepts omitted surface', () => {
    expect(roomTypeSchema.safeParse(validType({ surface: '' })).success).toBe(true)
  })

  it('rejects unknown name', () => {
    const result = roomTypeSchema.safeParse(validType({ name: 'Penthouse' as never }))
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find(i => i.path.includes('name'))
      expect(issue?.message).toBe('Sélectionnez un type de chambre')
    }
  })

  it('rejects empty name', () => {
    const result = roomTypeSchema.safeParse(validType({ name: '' as never }))
    expect(result.success).toBe(false)
  })
})

describe('roomTypesStepSchema', () => {
  it('accepts a single valid type', () => {
    expect(roomTypesStepSchema.safeParse({ roomTypes: [validType()] }).success).toBe(true)
  })

  it('rejects an empty array', () => {
    const result = roomTypesStepSchema.safeParse({ roomTypes: [] })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find(i => i.path.includes('roomTypes'))
      expect(issue?.message).toBe('Ajoutez au moins un type de chambre')
    }
  })

  it('surfaces per-card field paths', () => {
    const result = roomTypesStepSchema.safeParse({
      roomTypes: [validType(), validType({ basePrice: '' })],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find(i => i.path.join('.') === 'roomTypes.1.basePrice')
      expect(issue).toBeDefined()
    }
  })
})
