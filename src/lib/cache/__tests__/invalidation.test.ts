/**
 * Centralized invalidation wiring (TRI-1016).
 * next/cache and the Redis cache services are mocked at the boundary so we can
 * assert the server-side Redis invalidation is actually triggered.
 */
jest.mock('next/cache', () => ({
  revalidateTag: jest.fn(),
  revalidatePath: jest.fn(),
}))

jest.mock('@/lib/cache/redis-cache.service', () => ({
  productCacheService: {
    invalidateProductCache: jest.fn().mockResolvedValue(undefined),
  },
  staticDataCacheService: {
    invalidateStaticData: jest.fn().mockResolvedValue(undefined),
  },
}))

import { invalidateProductCache, invalidateStaticDataCache } from '../invalidation'
import { productCacheService, staticDataCacheService } from '@/lib/cache/redis-cache.service'

const productInvalidate = productCacheService.invalidateProductCache as jest.Mock
const staticInvalidate = staticDataCacheService.invalidateStaticData as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
})

describe('invalidateProductCache', () => {
  it('triggers a Redis product/search invalidation for the given product', async () => {
    await invalidateProductCache('p1')

    expect(productInvalidate).toHaveBeenCalledWith('p1')
  })

  it('also invalidates the count-derived typeRent static cache', async () => {
    await invalidateProductCache('p1')

    expect(staticInvalidate).toHaveBeenCalledWith('typeRent')
  })

  it('clears shared search lists even without a productId', async () => {
    await invalidateProductCache()

    expect(productInvalidate).toHaveBeenCalledWith(undefined)
  })
})

describe('invalidateStaticDataCache', () => {
  it('invalidates the matching Redis static:{type} cache', async () => {
    await invalidateStaticDataCache('meals')

    expect(staticInvalidate).toHaveBeenCalledWith('meals')
  })

  it.each(['equipments', 'services', 'security', 'typeRent'] as const)(
    'invalidates Redis static cache for %s',
    async type => {
      await invalidateStaticDataCache(type)

      expect(staticInvalidate).toHaveBeenCalledWith(type)
    }
  )
})
