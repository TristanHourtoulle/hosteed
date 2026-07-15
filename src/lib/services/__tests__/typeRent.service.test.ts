import { ProductValidation } from '@prisma/client'

/**
 * `findAllTypeRent` and `findAllTypeRentForForm` are verified against a mocked
 * Prisma client (mocks only at the DB boundary). The key behavioural
 * difference: the public list filters out categories with zero approved
 * products, while the form variant returns every category so the creation
 * wizard dropdown is never empty on a fresh database.
 */
const findManyMock = jest.fn()

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    typeRent: {
      findMany: (...args: unknown[]) => findManyMock(...args),
    },
  },
}))

jest.mock('@/lib/cache/redis-cache.service', () => ({
  staticDataCacheService: {
    invalidateStaticData: jest.fn(),
  },
}))

import { findAllTypeRent, findAllTypeRentForForm } from '../typeRent.service'

const typeWithProducts = {
  id: 'type-with',
  name: 'Villa',
  description: 'Has approved products',
  _count: { products: 3 },
}

const typeWithoutProducts = {
  id: 'type-empty',
  name: 'Cabin',
  description: 'No approved products yet',
  _count: { products: 0 },
}

beforeEach(() => {
  findManyMock.mockReset()
})

describe('findAllTypeRent', () => {
  it('filters out types that have zero approved products', async () => {
    findManyMock.mockResolvedValue([typeWithProducts, typeWithoutProducts])

    const result = await findAllTypeRent()

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('type-with')
    expect(result.some(type => type.id === 'type-empty')).toBe(false)
  })

  it('only counts approved products in the _count query', async () => {
    findManyMock.mockResolvedValue([])

    await findAllTypeRent()

    const queryArg = findManyMock.mock.calls[0][0]
    expect(queryArg.include._count.select.products.where.validate).toBe(
      ProductValidation.Approve
    )
  })

  it('exposes productCount on returned types (shared mapping with the form variant)', async () => {
    findManyMock.mockResolvedValue([typeWithProducts])

    const result = (await findAllTypeRent()) as unknown as Array<{
      id: string
      productCount: number
    }>

    expect(result.find(type => type.id === 'type-with')?.productCount).toBe(3)
  })
})

describe('findAllTypeRentForForm', () => {
  it('returns every type even when a type has zero approved products', async () => {
    findManyMock.mockResolvedValue([typeWithProducts, typeWithoutProducts])

    const result = await findAllTypeRentForForm()

    expect(result).toHaveLength(2)
    expect(result.some(type => type.id === 'type-empty')).toBe(true)
    expect(result.some(type => type.id === 'type-with')).toBe(true)
  })

  it('sorts types by approved product count descending', async () => {
    findManyMock.mockResolvedValue([typeWithoutProducts, typeWithProducts])

    const result = await findAllTypeRentForForm()

    expect(result.map(type => type.id)).toEqual(['type-with', 'type-empty'])
  })

  it('exposes productCount on each returned type', async () => {
    findManyMock.mockResolvedValue([typeWithProducts, typeWithoutProducts])

    const result = (await findAllTypeRentForForm()) as unknown as Array<{
      id: string
      productCount: number
    }>

    expect(result.find(type => type.id === 'type-empty')?.productCount).toBe(0)
    expect(result.find(type => type.id === 'type-with')?.productCount).toBe(3)
  })
})
