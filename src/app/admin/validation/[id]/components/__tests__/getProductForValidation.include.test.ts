/**
 * Verifies the admin validation fetch (`getProductForValidation`) loads the
 * hotel room types with their beds and per-type promotions, so every
 * downstream validation view (detail, comparison, edit wizard) has the data.
 * Prisma is mocked at the boundary (node env, jest.fn()).
 */

const findUnique = jest.fn()

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    product: {
      findUnique: (...args: unknown[]) => findUnique(...args),
    },
  },
}))

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))
jest.mock('@/lib/services/validation-simple.service', () => ({ validationService: {} }))
jest.mock('@/lib/services/product.service', () => ({
  deleteRejectedProduct: jest.fn(),
  deleteMultipleRejectedProducts: jest.fn(),
}))

import { getProductForValidation } from '../../../actions'

describe('getProductForValidation room-types include', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('includes roomTypes with beds and per-type promotions in the fetch', async () => {
    findUnique.mockResolvedValue({ id: 'p1', isDraft: false, roomTypes: [] })

    await getProductForValidation('p1')

    expect(findUnique).toHaveBeenCalledTimes(1)
    const arg = findUnique.mock.calls[0][0] as {
      include: { roomTypes: { include: { beds: boolean; promotions: boolean } } }
    }
    expect(arg.include.roomTypes).toBeDefined()
    expect(arg.include.roomTypes.include.beds).toBe(true)
    expect(arg.include.roomTypes.include.promotions).toBe(true)
  })

  it('reuses the same include for the original product when the draft has one', async () => {
    findUnique
      .mockResolvedValueOnce({
        id: 'draft1',
        isDraft: true,
        originalProductId: 'orig1',
        roomTypes: [],
      })
      .mockResolvedValueOnce({ id: 'orig1', isDraft: false, roomTypes: [] })

    await getProductForValidation('draft1')

    expect(findUnique).toHaveBeenCalledTimes(2)
    const originalArg = findUnique.mock.calls[1][0] as {
      where: { id: string }
      include: { roomTypes: { include: { beds: boolean } } }
    }
    expect(originalArg.where.id).toBe('orig1')
    expect(originalArg.include.roomTypes.include.beds).toBe(true)
  })
})
