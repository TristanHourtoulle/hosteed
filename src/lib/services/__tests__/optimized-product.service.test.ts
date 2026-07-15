/**
 * Characterization tests for the optimized product search service.
 * Prisma is mocked at the boundary (node env); the WHERE-clause and computed
 * fields are the behaviour under test, so we assert on the exact query Prisma
 * receives and on the transformed output shape.
 */
import { ProductValidation } from '@prisma/client'

const prismaMock = {
  product: {
    findMany: jest.fn() as jest.Mock,
    count: jest.fn() as jest.Mock,
    aggregate: jest.fn() as jest.Mock,
  },
  specialPrices: { findFirst: jest.fn() as jest.Mock },
  $queryRaw: jest.fn() as jest.Mock,
}

jest.mock('@/lib/prisma', () => ({ __esModule: true, default: prismaMock }))

import {
  searchProductsOptimized,
  getHostProductsOptimized,
  getSearchFilters,
} from '../optimized-product.service'

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

beforeEach(() => {
  jest.clearAllMocks()
  prismaMock.product.findMany.mockResolvedValue([])
  prismaMock.product.count.mockResolvedValue(0)
  prismaMock.specialPrices.findFirst.mockResolvedValue(null)
})

/** Pull the flattened AND conditions from the WHERE clause Prisma received. */
function whereAndConditions(): Array<Record<string, unknown>> {
  const arg = prismaMock.product.findMany.mock.calls[0][0]
  return arg.where.AND as Array<Record<string, unknown>>
}

describe('searchProductsOptimized', () => {
  it('defaults to Approve-only validation and drops empty conditions', async () => {
    await searchProductsOptimized()

    const conditions = whereAndConditions()
    // Empty {} conditions are filtered out; only the validation filter remains.
    expect(conditions).toEqual([{ validate: { in: [ProductValidation.Approve] } }])
  })

  it('adds a case-insensitive OR text search on name/description/address', async () => {
    await searchProductsOptimized({ query: 'beach' })

    const conditions = whereAndConditions()
    const textCond = conditions.find(c => 'OR' in c) as { OR: unknown[] }
    expect(textCond.OR).toEqual([
      { name: { contains: 'beach', mode: 'insensitive' } },
      { description: { contains: 'beach', mode: 'insensitive' } },
      { address: { contains: 'beach', mode: 'insensitive' } },
    ])
  })

  it('converts the guest capacity filter to a BigInt maxPeople gte', async () => {
    await searchProductsOptimized({ guests: 4 })

    const conditions = whereAndConditions()
    expect(conditions).toContainEqual({ maxPeople: { gte: BigInt(4) } })
  })

  it('maps price bounds to string comparisons on basePrice', async () => {
    await searchProductsOptimized({ minPrice: 50, maxPrice: 200 })

    const conditions = whereAndConditions()
    expect(conditions).toContainEqual({ basePrice: { gte: '50' } })
    expect(conditions).toContainEqual({ basePrice: { lte: '200' } })
  })

  it('sorts by basePrice when sortBy=price', async () => {
    await searchProductsOptimized({ sortBy: 'price', sortOrder: 'asc' })
    const arg = prismaMock.product.findMany.mock.calls[0][0]
    expect(arg.orderBy).toEqual({ basePrice: 'asc' })
  })

  it('transforms rows into the optimized shape with computed host + special price', async () => {
    prismaMock.product.findMany.mockResolvedValue([
      {
        id: 'p1',
        name: 'Villa',
        img: [{ id: 'i1', img: 'data' }],
        _count: { img: 3 },
        type: { id: 't1', name: 'House' },
        owner: { id: 'u1', name: 'Jane', lastname: 'Doe', isVerifiedTraveler: true },
        latitude: 0,
        longitude: 0,
      },
    ])
    prismaMock.product.count.mockResolvedValue(1)
    prismaMock.specialPrices.findFirst.mockResolvedValue({ id: 'sp' })

    const result = await searchProductsOptimized({})

    expect(result.products[0]).toMatchObject({
      id: 'p1',
      primaryImage: { id: 'i1', img: 'data' },
      imageCount: 3,
      host: { id: 'u1', name: 'Jane', lastname: 'Doe', isVerified: true },
      specialPriceActive: true,
      isAvailable: true,
    })
  })

  it('computes distanceKm when coordinates are supplied', async () => {
    prismaMock.product.findMany.mockResolvedValue([
      {
        id: 'p1',
        name: 'Near',
        img: [],
        _count: { img: 0 },
        type: { id: 't', name: 'T' },
        owner: null,
        latitude: -18.9,
        longitude: 47.5,
      },
    ])
    prismaMock.product.count.mockResolvedValue(1)

    const result = await searchProductsOptimized({ latitude: -18.9, longitude: 47.5 })

    expect(result.products[0].distanceKm).toBeCloseTo(0, 5)
    // Missing owner is normalised to empty host fields.
    expect(result.products[0].host).toEqual({
      id: '',
      name: null,
      lastname: null,
      isVerified: false,
    })
  })

  it('returns correct pagination metadata', async () => {
    prismaMock.product.findMany.mockResolvedValue([])
    prismaMock.product.count.mockResolvedValue(45)

    const result = await searchProductsOptimized({ page: 2, limit: 20 })

    expect(result.pagination).toEqual({
      page: 2,
      limit: 20,
      total: 45,
      totalPages: 3,
      hasNext: true,
      hasPrev: true,
    })
  })

  it('throws a wrapped error when the query fails', async () => {
    prismaMock.product.findMany.mockRejectedValue(new Error('db'))
    await expect(searchProductsOptimized({})).rejects.toThrow('Failed to search products')
  })
})

describe('getHostProductsOptimized', () => {
  it('scopes to the owner and includes drafts by default', async () => {
    prismaMock.product.findMany.mockResolvedValue([])
    prismaMock.product.count.mockResolvedValue(0)

    await getHostProductsOptimized('host-1')

    const arg = prismaMock.product.findMany.mock.calls[0][0]
    expect(arg.where).toEqual({ ownerId: 'host-1' })
  })

  it('excludes drafts when includeDrafts is false', async () => {
    await getHostProductsOptimized('host-1', { includeDrafts: false })

    const arg = prismaMock.product.findMany.mock.calls[0][0]
    expect(arg.where).toEqual({ ownerId: 'host-1', isDraft: false })
  })

  it('omits primaryImage when includeImages is false', async () => {
    prismaMock.product.findMany.mockResolvedValue([
      { id: 'p1', name: 'A', _count: { img: 5 }, type: { id: 't', name: 'T' } },
    ])
    prismaMock.product.count.mockResolvedValue(1)

    const result = await getHostProductsOptimized('host-1', { includeImages: false })

    expect(result.products[0].primaryImage).toBeUndefined()
    expect(result.products[0].imageCount).toBe(5)
  })

  it('throws a wrapped error on failure', async () => {
    prismaMock.product.findMany.mockRejectedValue(new Error('x'))
    await expect(getHostProductsOptimized('host-1')).rejects.toThrow('Failed to get host products')
  })
})

describe('getSearchFilters', () => {
  it('derives a numeric price range from string aggregates', async () => {
    prismaMock.product.aggregate.mockResolvedValue({
      _min: { basePrice: '30' },
      _max: { basePrice: '900' },
    })
    prismaMock.$queryRaw.mockResolvedValue([{ city: 'Tana', count: 5 }])

    const result = await getSearchFilters({})

    expect(result?.priceRange).toEqual({ min: 30, max: 900 })
    expect(result?.locationCounts).toEqual([{ city: 'Tana', count: 5 }])
  })

  it('falls back to safe defaults when aggregation throws', async () => {
    prismaMock.product.aggregate.mockRejectedValue(new Error('agg'))

    const result = await getSearchFilters({})

    expect(result).toEqual({
      priceRange: { min: 0, max: 1000 },
      availableTypes: [],
      locationCounts: [],
    })
  })
})
