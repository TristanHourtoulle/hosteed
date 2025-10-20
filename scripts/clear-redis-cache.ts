#!/usr/bin/env ts-node

/**
 * Script to clear Redis cache
 * Useful for debugging cache issues and forcing fresh data
 *
 * Usage:
 *   pnpm tsx scripts/clear-redis-cache.ts [pattern]
 *
 * Examples:
 *   pnpm tsx scripts/clear-redis-cache.ts           # Clear all cache
 *   pnpm tsx scripts/clear-redis-cache.ts search:*  # Clear only search cache
 *   pnpm tsx scripts/clear-redis-cache.ts product:* # Clear only product cache
 */

import Redis from 'ioredis'

async function clearRedisCache(pattern: string = '*') {
  const redisUrl = process.env.REDIS_URL

  if (!redisUrl && !process.env.REDIS_HOST) {
    console.error('❌ Redis configuration not found in environment variables')
    console.error('Please set REDIS_URL or REDIS_HOST in your .env file')
    process.exit(1)
  }

  const client = redisUrl
    ? new Redis(redisUrl)
    : new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
      })

  try {
    console.log('🔗 Connecting to Redis...')
    await client.ping()
    console.log('✅ Connected to Redis')

    console.log(`🔍 Searching for keys matching pattern: ${pattern}`)

    let cursor = '0'
    let totalDeleted = 0
    const batchSize = 100

    do {
      const result = await client.scan(cursor, 'MATCH', pattern, 'COUNT', batchSize)
      cursor = result[0]
      const keys = result[1]

      if (keys.length > 0) {
        console.log(`🗑️  Found ${keys.length} keys to delete...`)
        const deleted = await client.del(...keys)
        totalDeleted += deleted
        console.log(`   Deleted ${deleted} keys`)
      }
    } while (cursor !== '0')

    if (totalDeleted === 0) {
      console.log('ℹ️  No keys found matching pattern')
    } else {
      console.log(`\n✅ Successfully deleted ${totalDeleted} cache keys`)
    }

    // Show cache statistics after clearing
    console.log('\n📊 Redis Statistics:')
    const info = await client.info('memory')
    const dbSize = await client.dbsize()

    const memoryUsed = info.match(/used_memory_human:(.+)/)?.[1]?.trim() || 'Unknown'
    console.log(`   Memory used: ${memoryUsed}`)
    console.log(`   Total keys remaining: ${dbSize}`)

    await client.quit()
    console.log('\n👋 Disconnected from Redis')
  } catch (error) {
    console.error('❌ Error clearing cache:', error)
    process.exit(1)
  }
}

// Get pattern from command line arguments
const pattern = process.argv[2] || '*'

console.log('🧹 Redis Cache Cleaner\n')
clearRedisCache(pattern)
  .then(() => {
    console.log('\n✨ Done!')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })
