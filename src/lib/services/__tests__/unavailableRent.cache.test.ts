/**
 * Availability cache invalidation on block create/delete (TRI-1016 / TRI-1003).
 * Prisma and the Redis availability cache are mocked at the boundary.
 */
const prismaMock = {
  rent: { findMany: jest.fn() },
  unAvailableProduct: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}

jest.mock('@/lib/prisma', () => ({ __esModule: true, default: prismaMock }))
jest.mock('@/lib/cache/redis-cache.service', () => ({
  availabilityCacheService: {
    invalidateAvailability: jest.fn().mockResolvedValue(undefined),
  },
}))

import { availabilityCacheService } from '@/lib/cache/redis-cache.service'
import {
  createUnavailableRent,
  deleteUnavailableRent,
  updateUnavailableRent,
} from '../unavailableRent.service'

const invalidateAvailability = availabilityCacheService.invalidateAvailability as jest.Mock

// A date safely in the future so the "not before today" guard passes.
const START = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
const END = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000)

beforeEach(() => {
  jest.clearAllMocks()
})

describe('createUnavailableRent', () => {
  it('invalidates the product availability cache after creating a block', async () => {
    prismaMock.rent.findMany.mockResolvedValue([])
    prismaMock.unAvailableProduct.findMany.mockResolvedValue([])
    prismaMock.unAvailableProduct.create.mockResolvedValue({ id: 'b1', productId: 'prod-1' })

    await createUnavailableRent('prod-1', START, END, 'Maintenance')

    expect(invalidateAvailability).toHaveBeenCalledTimes(1)
    expect(invalidateAvailability).toHaveBeenCalledWith('prod-1')
  })
})

describe('deleteUnavailableRent', () => {
  it('invalidates the product availability cache after deleting a block', async () => {
    prismaMock.unAvailableProduct.findUnique.mockResolvedValue({ id: 'b1', productId: 'prod-1' })
    prismaMock.unAvailableProduct.delete.mockResolvedValue({ id: 'b1' })

    await deleteUnavailableRent('b1')

    expect(invalidateAvailability).toHaveBeenCalledTimes(1)
    expect(invalidateAvailability).toHaveBeenCalledWith('prod-1')
  })
})

describe('updateUnavailableRent', () => {
  it('invalidates the product availability cache after updating a block', async () => {
    prismaMock.unAvailableProduct.findUnique.mockResolvedValue({
      id: 'b1',
      productId: 'prod-1',
      startDate: START,
      endDate: END,
    })
    prismaMock.rent.findMany.mockResolvedValue([])
    prismaMock.unAvailableProduct.findMany.mockResolvedValue([])
    prismaMock.unAvailableProduct.update.mockResolvedValue({ id: 'b1', productId: 'prod-1' })

    await updateUnavailableRent('b1', { title: 'Updated' })

    expect(invalidateAvailability).toHaveBeenCalledTimes(1)
    expect(invalidateAvailability).toHaveBeenCalledWith('prod-1')
  })
})

describe('cache failure isolation', () => {
  it('never lets a cache failure bubble out of a successful create', async () => {
    prismaMock.rent.findMany.mockResolvedValue([])
    prismaMock.unAvailableProduct.findMany.mockResolvedValue([])
    prismaMock.unAvailableProduct.create.mockResolvedValue({ id: 'b1', productId: 'prod-1' })
    invalidateAvailability.mockRejectedValueOnce(new Error('redis down'))

    await expect(
      createUnavailableRent('prod-1', START, END, 'Maintenance')
    ).resolves.toMatchObject({ id: 'b1' })
  })
})
