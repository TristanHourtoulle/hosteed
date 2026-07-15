/**
 * Characterization tests for the options service. Prisma mocked at the boundary.
 */
const prismaMock = {
  options: { findMany: jest.fn() as jest.Mock },
}

jest.mock('@/lib/prisma', () => ({ __esModule: true, default: prismaMock }))

import { findAllOptionsByProductId } from '../options.service'

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

beforeEach(() => {
  jest.clearAllMocks()
})

describe('findAllOptionsByProductId', () => {
  it('queries options scoped to the given product id', async () => {
    prismaMock.options.findMany.mockResolvedValue([{ id: 'o1' }])

    const result = await findAllOptionsByProductId('prod-1')

    expect(prismaMock.options.findMany).toHaveBeenCalledWith({
      where: { productId: 'prod-1' },
    })
    expect(result).toEqual([{ id: 'o1' }])
  })

  it('returns an empty list unchanged', async () => {
    prismaMock.options.findMany.mockResolvedValue([])
    await expect(findAllOptionsByProductId('prod-1')).resolves.toEqual([])
  })

  it('returns null when the query throws', async () => {
    prismaMock.options.findMany.mockRejectedValue(new Error('db'))
    await expect(findAllOptionsByProductId('prod-1')).resolves.toBeNull()
  })
})
