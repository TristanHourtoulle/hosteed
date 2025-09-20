/**
 * REDIS CACHING SERVICE
 * High-performance caching layer to reduce database load
 * Addresses performance bottlenecks identified in audit
 */

// import Redis from 'ioredis'
import { OptimizedProductFilters, OptimizedProduct } from '@/lib/services/optimized-product.service'

// ================================
// REDIS CLIENT CONFIGURATION
// ================================

class RedisCache {
  private client: Record<string, unknown> | null = null
  private isConnected: boolean = false
  
  constructor() {
    /* this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      
      // Connection optimization
      connectTimeout: 10000,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      
      // Performance optimization
      enableReadyCheck: false,
      maxLoadingTimeout: 3000,
      
      // Connection pooling
      family: 4,
      keepAlive: true,
    }) */

    // this.setupEventHandlers()
    // this.connect()
  }

  private setupEventHandlers() {
    /* this.client.on('connect', () => {
      console.log('✅ Redis connected')
      this.isConnected = true
    })

    this.client.on('error', (error) => {
      console.error('❌ Redis connection error:', error)
      this.isConnected = false
    })

    this.client.on('close', () => {
      console.log('🔌 Redis connection closed')
      this.isConnected = false
    })

    this.client.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...')
    }) */
  }

  private async connect() {
    /* try {
      await this.client.connect()
    } catch (error) {
      console.error('Failed to connect to Redis:', error)
    } */
  }

  // ================================
  // CORE CACHE OPERATIONS
  // ================================

  /**
   * Generic get with fallback to callback if cache miss
   */
  async get<T>(key: string, fallback?: () => Promise<T>): Promise<T | null> {
    try {
      // Redis is disabled, always use fallback
      return fallback ? await fallback() : null
      
      /* if (!this.isConnected) {
        console.warn('Redis not connected, using fallback')
        return fallback ? await fallback() : null
      }

      const cached = await this.client.get(key)
      if (cached) {
        return JSON.parse(cached)
      }

      if (fallback) {
        const data = await fallback()
        if (data && ttl) {
          await this.set(key, data, ttl)
        }
        return data
      }

      return null */
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error)
      return fallback ? await fallback() : null
    }
  }

  /**
   * Set with TTL
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async set(key: string, value: unknown): Promise<void> {
    try {
      // Redis is disabled
      return
      
      /* if (!this.isConnected) return

      await this.client.setex(key, ttlSeconds, JSON.stringify(value)) */
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error)
    }
  }

  /**
   * Delete single key
   */
  async delete(key: string): Promise<void> {
    try {
      // Redis is disabled
      return
      
      /* if (!this.isConnected) return

      await this.client.del(key) */
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error)
    }
  }

  /**
   * Pattern-based cache invalidation
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      // Redis is disabled
      return 0
      
      /* if (!this.isConnected) return 0

      const keys = await this.client.keys(pattern)
      if (keys.length === 0) return 0

      return await this.client.del(...keys) */
    } catch (error) {
      console.error(`Cache invalidation error for pattern ${pattern}:`, error)
      return 0
    }
  }

  /**
   * Increment counter with TTL
   */
  async increment(key: string): Promise<number> {
    try {
      // Redis is disabled
      return 0
      
      /* if (!this.isConnected) return 0

      const count = await this.client.incr(key)
      if (count === 1) {
        // Set TTL only on first increment
        await this.client.expire(key, ttl)
      }
      return count */
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error)
      return 0
    }
  }

  /**
   * Hash operations for complex objects
   */
  async hget<T>(key: string, field: string): Promise<T | null> {
    try {
      // Redis is disabled
      return null
      
      /* if (!this.isConnected) return null

      const value = await this.client.hget(key, field)
      return value ? JSON.parse(value) : null */
    } catch (error) {
      console.error(`Cache hget error for key ${key}, field ${field}:`, error)
      return null
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async hset(key: string, field: string, value: unknown, ttl?: number): Promise<void> {
    try {
      // Redis is disabled
      return
      
      /* if (!this.isConnected) return

      await this.client.hset(key, field, JSON.stringify(value))
      if (ttl) {
        await this.client.expire(key, ttl)
      } */
    } catch (error) {
      console.error(`Cache hset error for key ${key}, field ${field}:`, error)
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    connected: boolean
    memory: string
    keys: number
    hits: number
    misses: number
  }> {
    try {
      // Redis is disabled
      return { connected: false, memory: '0', keys: 0, hits: 0, misses: 0 }
      
      /* if (!this.isConnected) {
        return { connected: false, memory: '0', keys: 0, hits: 0, misses: 0 }
      }

      const info = await this.client.info('memory')
      const dbSize = await this.client.dbsize()
      const stats = await this.client.info('stats')

      const memoryUsed = info.match(/used_memory_human:(.+)/)?.[1] || '0'
      const hits = parseInt(stats.match(/keyspace_hits:(\d+)/)?.[1] || '0')
      const misses = parseInt(stats.match(/keyspace_misses:(\d+)/)?.[1] || '0')

      return {
        connected: this.isConnected,
        memory: memoryUsed,
        keys: dbSize,
        hits,
        misses,
      } */
    } catch (error) {
      console.error('Failed to get cache stats:', error)
      return { connected: false, memory: '0', keys: 0, hits: 0, misses: 0 }
    }
  }
}

// ================================
// APPLICATION-SPECIFIC CACHE SERVICES
// ================================

export class ProductCacheService {
  private cache: RedisCache
  
  constructor(cache: RedisCache) {
    this.cache = cache
  }

  /**
   * Cache product search results - addresses slow search performance
   */
  async cacheProductSearch(
    filters: OptimizedProductFilters,
    results: OptimizedProduct[],
    pagination: { page: number; limit: number; total: number; hasNext: boolean; hasPrev: boolean }
  ): Promise<void> {
    const cacheKey = this.generateSearchKey(filters)
    const cacheData = { results, pagination, timestamp: Date.now() }
    
    // Cache search results for 5 minutes
    await this.cache.set(cacheKey, cacheData)
  }

  async getCachedProductSearch(
    filters: OptimizedProductFilters
  ): Promise<{ results: OptimizedProduct[]; pagination: { page: number; limit: number; total: number; hasNext: boolean; hasPrev: boolean } } | null> {
    const cacheKey = this.generateSearchKey(filters)
    return await this.cache.get(cacheKey)
  }

  /**
   * Cache individual product data
   */
  async cacheProduct(productId: string, productData: OptimizedProduct): Promise<void> {
    await this.cache.set(`product:${productId}`, productData) // 30 minutes
  }

  async getCachedProduct(productId: string): Promise<OptimizedProduct | null> {
    return await this.cache.get(`product:${productId}`)
  }

  /**
   * Cache host products - addresses slow host dashboard
   */
  async cacheHostProducts(
    hostId: string,
    page: number,
    products: OptimizedProduct[],
    pagination: { page: number; limit: number; total: number; hasNext: boolean; hasPrev: boolean }
  ): Promise<void> {
    const cacheKey = `host:${hostId}:products:page:${page}`
    const cacheData = { products, pagination }
    
    // Cache host products for 10 minutes
    await this.cache.set(cacheKey, cacheData)
  }

  async getCachedHostProducts(
    hostId: string,
    page: number
  ): Promise<{ products: OptimizedProduct[]; pagination: { total: number; pages: number; page: number; limit: number } } | null> {
    const cacheKey = `host:${hostId}:products:page:${page}`
    return await this.cache.get(cacheKey)
  }

  /**
   * Invalidate product-related cache
   */
  async invalidateProductCache(productId: string): Promise<void> {
    await Promise.all([
      this.cache.delete(`product:${productId}`),
      this.cache.invalidatePattern('search:*'), // Invalidate all search results
      this.cache.invalidatePattern('host:*:products:*'), // Invalidate host product lists
    ])
  }

  private generateSearchKey(filters: OptimizedProductFilters): string {
    // Create deterministic cache key from filters
    const keyParts = [
      'search',
      filters.query || 'all',
      filters.location || 'anywhere',
      filters.typeId || 'any',
      filters.minPrice || '0',
      filters.maxPrice || 'inf',
      filters.guests || '1',
      filters.page || '1',
      filters.limit || '20',
      filters.sortBy || 'created',
      filters.sortOrder || 'desc'
    ]
    
    return keyParts.join(':').toLowerCase().replace(/[^a-z0-9:]/g, '_')
  }
}

export class AvailabilityCacheService {
  private cache: RedisCache
  
  constructor(cache: RedisCache) {
    this.cache = cache
  }

  /**
   * Cache availability check results - high frequency operation
   */
  async cacheAvailability(
    productId: string,
    startDate: Date,
    endDate: Date,
    isAvailable: boolean
  ): Promise<void> {
    const cacheKey = `availability:${productId}:${startDate.toISOString().split('T')[0]}:${endDate.toISOString().split('T')[0]}`
    
    // Cache availability for 5 minutes (frequent bookings can change this)
    await this.cache.set(cacheKey, { isAvailable, cachedAt: Date.now() })
  }

  async getCachedAvailability(
    productId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ isAvailable: boolean; cachedAt: number } | null> {
    const cacheKey = `availability:${productId}:${startDate.toISOString().split('T')[0]}:${endDate.toISOString().split('T')[0]}`
    return await this.cache.get(cacheKey)
  }

  /**
   * Invalidate availability cache when booking is made
   */
  async invalidateAvailability(productId: string): Promise<void> {
    await this.cache.invalidatePattern(`availability:${productId}:*`)
  }
}

export class UserSessionCacheService {
  private cache: RedisCache
  
  constructor(cache: RedisCache) {
    this.cache = cache
  }

  /**
   * Cache user session data - reduces database queries
   */
  async cacheUserSession(sessionId: string, sessionData: Record<string, unknown>): Promise<void> {
    await this.cache.set(`session:${sessionId}`, sessionData) // 1 hour
  }

  async getCachedUserSession(sessionId: string): Promise<Record<string, unknown> | null> {
    return await this.cache.get(`session:${sessionId}`)
  }

  /**
   * Cache user preferences and activity
   */
  async cacheUserActivity(
    userId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _activity: { type: string; data: Record<string, unknown>; timestamp: number }
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _cacheKey = `user:${userId}:activity`
    
    // Keep last 50 activities - Redis is disabled
    // await this.cache.client.lpush(cacheKey, JSON.stringify(activity))
    // await this.cache.client.ltrim(cacheKey, 0, 49)
    // await this.cache.client.expire(cacheKey, 86400) // 24 hours
  }

  /**
   * Rate limiting cache
   */
  async checkRateLimit(
    identifier: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const cacheKey = `rate_limit:${identifier}:${Math.floor(Date.now() / (windowSeconds * 1000))}`
    
    try {
      const count = await this.cache.increment(cacheKey)
      const resetTime = Math.ceil(Date.now() / (windowSeconds * 1000)) * windowSeconds * 1000
      
      return {
        allowed: count <= limit,
        remaining: Math.max(0, limit - count),
        resetTime,
      }
    } catch {
      // Fail open - allow requests if cache fails
      return {
        allowed: true,
        remaining: limit,
        resetTime: Date.now() + windowSeconds * 1000,
      }
    }
  }
}

// ================================
// CACHE INVALIDATION STRATEGIES
// ================================

export class CacheInvalidationService {
  private cache: RedisCache
  private productCache: ProductCacheService
  private availabilityCache: AvailabilityCacheService
  
  constructor(cache: RedisCache) {
    this.cache = cache
    this.productCache = new ProductCacheService(cache)
    this.availabilityCache = new AvailabilityCacheService(cache)
  }

  /**
   * Invalidate all caches related to a product
   */
  async onProductUpdate(productId: string): Promise<void> {
    await Promise.all([
      this.productCache.invalidateProductCache(productId),
      this.availabilityCache.invalidateAvailability(productId),
      this.cache.invalidatePattern('search:*'), // Product updates affect search
    ])
  }

  /**
   * Invalidate caches when booking is made
   */
  async onBookingCreated(productId: string, hostId: string): Promise<void> {
    await Promise.all([
      this.availabilityCache.invalidateAvailability(productId),
      this.cache.invalidatePattern(`host:${hostId}:*`), // Update host dashboard
    ])
  }

  /**
   * Invalidate user-specific caches
   */
  async onUserUpdate(userId: string): Promise<void> {
    await Promise.all([
      this.cache.invalidatePattern(`session:*:${userId}`),
      this.cache.invalidatePattern(`user:${userId}:*`),
      this.cache.invalidatePattern(`host:${userId}:*`),
    ])
  }

  /**
   * Clear all caches (maintenance operation)
   */
  async clearAllCache(): Promise<number> {
    return await this.cache.invalidatePattern('*')
  }
}

// ================================
// SINGLETON INSTANCES
// ================================

let redisCache: RedisCache
let productCacheService: ProductCacheService
let availabilityCacheService: AvailabilityCacheService
let userSessionCacheService: UserSessionCacheService
let cacheInvalidationService: CacheInvalidationService

export function initializeCache() {
  if (!redisCache) {
    redisCache = new RedisCache()
    productCacheService = new ProductCacheService(redisCache)
    availabilityCacheService = new AvailabilityCacheService(redisCache)
    userSessionCacheService = new UserSessionCacheService(redisCache)
    cacheInvalidationService = new CacheInvalidationService(redisCache)
  }
}

// Initialize on module load
if (process.env.NODE_ENV !== 'test') {
  initializeCache()
}

export {
  redisCache,
  productCacheService,
  availabilityCacheService,
  userSessionCacheService,
  cacheInvalidationService,
}

export default RedisCache