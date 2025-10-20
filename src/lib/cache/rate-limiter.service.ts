/**
 * REDIS RATE LIMITING SERVICE
 * Protects API endpoints from abuse and ensures fair usage
 * Uses Redis for distributed rate limiting across multiple server instances
 */

import { redisCache } from './redis-cache.service'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  total: number
  retryAfter?: number
}

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (identifier: string) => string
}

export class RateLimiterService {
  private cache = redisCache

  /**
   * Check rate limit for a given identifier
   */
  async checkRateLimit(identifier: string, config: RateLimitConfig): Promise<RateLimitResult> {
    try {
      if (!this.cache.isRedisAvailable()) {
        // Fail open - allow requests if Redis is not available
        return {
          allowed: true,
          remaining: config.maxRequests,
          resetTime: Date.now() + config.windowMs,
          total: config.maxRequests,
        }
      }

      const windowStart = Math.floor(Date.now() / config.windowMs) * config.windowMs
      const key = config.keyGenerator
        ? config.keyGenerator(identifier)
        : `rate_limit:${identifier}:${windowStart}`

      // Get current count
      const client = this.cache.getClient()
      if (!client) {
        return {
          allowed: true,
          remaining: config.maxRequests,
          resetTime: windowStart + config.windowMs,
          total: config.maxRequests,
        }
      }

      // Use Redis pipeline for atomic operations
      const pipeline = client.pipeline()

      // Increment counter
      pipeline.incr(key)

      // Set expiration on first use
      pipeline.expire(key, Math.ceil(config.windowMs / 1000))

      const results = await pipeline.exec()
      const currentCount = (results?.[0]?.[1] as number) || 0

      const resetTime = windowStart + config.windowMs
      const remaining = Math.max(0, config.maxRequests - currentCount)
      const allowed = currentCount <= config.maxRequests

      return {
        allowed,
        remaining,
        resetTime,
        total: config.maxRequests,
        retryAfter: allowed ? undefined : Math.ceil((resetTime - Date.now()) / 1000),
      }
    } catch (error) {
      console.error('Rate limiter error:', error)
      // Fail open on error
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetTime: Date.now() + config.windowMs,
        total: config.maxRequests,
      }
    }
  }

  /**
   * Advanced rate limiting with multiple windows (burst and sustained)
   */
  async checkMultiWindowRateLimit(
    identifier: string,
    configs: {
      short: RateLimitConfig // e.g., 10 requests per minute
      long: RateLimitConfig // e.g., 100 requests per hour
    }
  ): Promise<RateLimitResult> {
    const [shortResult, longResult] = await Promise.all([
      this.checkRateLimit(identifier, configs.short),
      this.checkRateLimit(identifier, configs.long),
    ])

    // Return the most restrictive result
    if (!shortResult.allowed) return shortResult
    if (!longResult.allowed) return longResult

    return {
      allowed: true,
      remaining: Math.min(shortResult.remaining, longResult.remaining),
      resetTime: Math.min(shortResult.resetTime, longResult.resetTime),
      total: Math.min(shortResult.total, longResult.total),
    }
  }

  /**
   * IP-based rate limiting
   */
  async checkIPRateLimit(ip: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const sanitizedIP = ip.replace(/[^0-9a-f.:]/gi, '')
    return this.checkRateLimit(`ip:${sanitizedIP}`, config)
  }

  /**
   * User-based rate limiting
   */
  async checkUserRateLimit(userId: string, config: RateLimitConfig): Promise<RateLimitResult> {
    return this.checkRateLimit(`user:${userId}`, config)
  }

  /**
   * API endpoint-based rate limiting
   */
  async checkEndpointRateLimit(
    endpoint: string,
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const key = `endpoint:${endpoint}:${identifier}`
    return this.checkRateLimit(key, config)
  }

  /**
   * Reset rate limit for an identifier
   */
  async resetRateLimit(identifier: string, windowMs: number): Promise<void> {
    try {
      if (!this.cache.isRedisAvailable()) return

      const windowStart = Math.floor(Date.now() / windowMs) * windowMs
      const key = `rate_limit:${identifier}:${windowStart}`

      await this.cache.delete(key)
    } catch (error) {
      console.error('Failed to reset rate limit:', error)
    }
  }

  /**
   * Get rate limit statistics
   */
  async getRateLimitStats(
    identifier: string,
    windowMs: number
  ): Promise<{
    currentCount: number
    resetTime: number
    windowStart: number
  } | null> {
    try {
      if (!this.cache.isRedisAvailable()) return null

      const windowStart = Math.floor(Date.now() / windowMs) * windowMs
      const key = `rate_limit:${identifier}:${windowStart}`

      const client = this.cache.getClient()
      if (!client) return null

      const currentCount = await client.get(key)

      return {
        currentCount: currentCount ? parseInt(currentCount) : 0,
        resetTime: windowStart + windowMs,
        windowStart,
      }
    } catch (error) {
      console.error('Failed to get rate limit stats:', error)
      return null
    }
  }
}

// ================================
// PREDEFINED RATE LIMIT CONFIGS
// ================================

export const RATE_LIMITS = {
  // API endpoint limits
  SEARCH_API: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
  },

  PRODUCT_DETAILS: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  },

  BOOKING_API: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 booking attempts per minute
  },

  // Authentication limits
  LOGIN_ATTEMPTS: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 login attempts per 15 minutes
  },

  PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 password resets per hour
  },

  // User action limits
  FAVORITES: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 favorite actions per minute
  },

  CONTACT_FORM: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // 5 contact form submissions per hour
  },

  // Admin action limits
  ADMIN_ACTIONS: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 admin actions per minute
  },

  // Global limits
  GLOBAL_API: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200, // 200 requests per minute per IP
  },

  // Burst protection
  BURST_PROTECTION: {
    short: {
      windowMs: 10 * 1000, // 10 seconds
      maxRequests: 20, // 20 requests per 10 seconds
    },
    long: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 1000, // 1000 requests per hour
    },
  },
} as const

// ================================
// SINGLETON INSTANCE
// ================================

export const rateLimiterService = new RateLimiterService()

export default rateLimiterService
