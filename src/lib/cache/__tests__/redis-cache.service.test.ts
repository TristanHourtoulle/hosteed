/**
 * Server-side cache correctness (TRI-1016).
 * ioredis is mocked at the client boundary; the RedisCache instance is forced
 * into an "available" state so the real serialization / invalidation logic runs.
 */
const mockRedis = {
  get: jest.fn(),
  setex: jest.fn().mockResolvedValue('OK'),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  keys: jest.fn().mockResolvedValue([]),
  scan: jest.fn().mockResolvedValue(['0', []]),
  connect: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
}

jest.mock('ioredis', () => ({
  __esModule: true,
  default: jest.fn(() => mockRedis),
}))

import RedisCache, {
  ProductCacheService,
  StaticDataCacheService,
  AvailabilityCacheService,
  CACHE_TTL,
} from '../redis-cache.service'

function makeCache(): RedisCache {
  const cache = new RedisCache()
  Object.assign(cache as unknown as Record<string, unknown>, {
    isEnabled: true,
    isConnected: true,
    client: mockRedis,
  })
  return cache
}

beforeEach(() => {
  jest.clearAllMocks()
  mockRedis.get.mockResolvedValue(null)
  mockRedis.scan.mockResolvedValue(['0', []])
  mockRedis.del.mockResolvedValue(1)
})

describe('RedisCache.set - generic set caches all non-null values', () => {
  it('caches an empty array (never-cache-empty is scoped to the static path, not generic set)', async () => {
    const cache = makeCache()

    await cache.set('favorites:user1', [], 300)

    expect(mockRedis.setex).toHaveBeenCalledTimes(1)
    expect(mockRedis.setex).toHaveBeenCalledWith('favorites:user1', 300, JSON.stringify([]))
  })

  it('caches a non-empty array', async () => {
    const cache = makeCache()

    await cache.set('static:meals', [{ id: '1' }], 300)

    expect(mockRedis.setex).toHaveBeenCalledTimes(1)
    expect(mockRedis.setex).toHaveBeenCalledWith('static:meals', 300, JSON.stringify([{ id: '1' }]))
  })

  it('does not cache null', async () => {
    const cache = makeCache()

    await cache.set('static:meals', null, 300)

    expect(mockRedis.setex).not.toHaveBeenCalled()
  })
})

describe('StaticDataCacheService.getStaticDataWithCache - never cache empty results', () => {
  it('returns a fresh empty array without caching it', async () => {
    const cache = makeCache()
    const service = new StaticDataCacheService(cache)
    const fetchFn = jest.fn().mockResolvedValue([])

    const result = await service.getStaticDataWithCache('meals', fetchFn)

    expect(result).toEqual([])
    expect(mockRedis.setex).not.toHaveBeenCalled()
  })

  it('caches a fresh non-empty array', async () => {
    const cache = makeCache()
    const service = new StaticDataCacheService(cache)
    const fetchFn = jest.fn().mockResolvedValue([{ id: '1' }])

    const result = await service.getStaticDataWithCache('meals', fetchFn)

    expect(result).toEqual([{ id: '1' }])
    expect(mockRedis.setex).toHaveBeenCalledTimes(1)
  })

  it('calls fetchFunction exactly once and propagates the error when it throws (no duplicate DB hit on outage)', async () => {
    const cache = makeCache()
    const service = new StaticDataCacheService(cache)
    const dbError = new Error('DB outage')
    const fetchFn = jest.fn().mockRejectedValue(dbError)

    await expect(service.getStaticDataWithCache('meals', fetchFn)).rejects.toThrow('DB outage')
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  it('still falls back to fetchFunction (one call) when the cache read itself fails', async () => {
    const cache = makeCache()
    const service = new StaticDataCacheService(cache)
    mockRedis.get.mockRejectedValueOnce(new Error('cache read failed'))
    const fetchFn = jest.fn().mockResolvedValue([{ id: '1' }])

    const result = await service.getStaticDataWithCache('meals', fetchFn)

    expect(result).toEqual([{ id: '1' }])
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })
})

describe('StaticDataCacheService - Redis invalidation & TTL', () => {
  it('invalidateStaticData deletes the static:{type} key', async () => {
    const cache = makeCache()
    const service = new StaticDataCacheService(cache)

    await service.invalidateStaticData('meals')

    expect(mockRedis.del).toHaveBeenCalledWith('static:meals')
  })

  it('uses a short (minutes-scale) TTL for the count-derived typeRent', async () => {
    const cache = makeCache()
    const service = new StaticDataCacheService(cache)

    await service.cacheStaticData('typeRent', [{ id: '1' }])

    expect(mockRedis.setex).toHaveBeenCalledWith(
      'static:typeRent',
      CACHE_TTL.STATIC_DATA_DERIVED,
      expect.any(String)
    )
    expect(CACHE_TTL.STATIC_DATA_DERIVED).toBeLessThan(CACHE_TTL.STATIC_DATA)
  })

  it('keeps the long 24h TTL for truly-static types', async () => {
    const cache = makeCache()
    const service = new StaticDataCacheService(cache)

    await service.cacheStaticData('meals', [{ id: '1' }])

    expect(mockRedis.setex).toHaveBeenCalledWith(
      'static:meals',
      CACHE_TTL.STATIC_DATA,
      expect.any(String)
    )
  })

  it('invalidateAllStaticData uses SCAN, not KEYS', async () => {
    const cache = makeCache()
    const service = new StaticDataCacheService(cache)

    await service.invalidateAllStaticData()

    expect(mockRedis.scan).toHaveBeenCalled()
    expect(mockRedis.keys).not.toHaveBeenCalled()
  })
})

describe('ProductCacheService.invalidateProductCache', () => {
  it('invalidates the search:* pattern via SCAN (not KEYS)', async () => {
    const cache = makeCache()
    const service = new ProductCacheService(cache)

    await service.invalidateProductCache('p1')

    const scannedPatterns = mockRedis.scan.mock.calls.map(call => call[2])
    expect(scannedPatterns).toContain('search:*')
    expect(mockRedis.keys).not.toHaveBeenCalled()
  })

  it('deletes the product:{id} key when a productId is provided', async () => {
    const cache = makeCache()
    const service = new ProductCacheService(cache)

    await service.invalidateProductCache('p1')

    expect(mockRedis.del).toHaveBeenCalledWith('product:p1')
  })

  it('still clears shared search/host lists when no productId is provided', async () => {
    const cache = makeCache()
    const service = new ProductCacheService(cache)

    await service.invalidateProductCache()

    const scannedPatterns = mockRedis.scan.mock.calls.map(call => call[2])
    expect(scannedPatterns).toContain('search:*')
    expect(scannedPatterns).toContain('host:*:products:*')
    expect(mockRedis.del).not.toHaveBeenCalledWith('product:undefined')
  })
})

describe('AvailabilityCacheService.invalidateAvailability', () => {
  it('invalidates the availability pattern via SCAN (not KEYS)', async () => {
    const cache = makeCache()
    const service = new AvailabilityCacheService(cache)

    await service.invalidateAvailability('p1')

    const scannedPatterns = mockRedis.scan.mock.calls.map(call => call[2])
    expect(scannedPatterns).toContain('availability:p1:*')
    expect(mockRedis.keys).not.toHaveBeenCalled()
  })
})
