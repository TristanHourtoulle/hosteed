#!/usr/bin/env ts-node

/**
 * Script to inspect Redis cache contents
 * Useful for debugging cache structure issues
 *
 * Usage:
 *   pnpm tsx scripts/inspect-redis-cache.ts [pattern]
 *
 * Examples:
 *   pnpm tsx scripts/inspect-redis-cache.ts search:*
 */

import Redis from 'ioredis'

async function inspectRedisCache(pattern: string = 'search:*') {
  const redisUrl = process.env.REDIS_URL

  if (!redisUrl && !process.env.REDIS_HOST) {
    console.error('❌ Redis configuration not found in environment variables')
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
    console.log('✅ Connected to Redis\n')

    console.log(`🔍 Searching for keys matching pattern: ${pattern}\n`)

    let cursor = '0'
    let totalKeys = 0
    const batchSize = 10

    do {
      const result = await client.scan(cursor, 'MATCH', pattern, 'COUNT', batchSize)
      cursor = result[0]
      const keys = result[1]

      for (const key of keys) {
        totalKeys++
        console.log(`\n${'='.repeat(80)}`)
        console.log(`🔑 Key ${totalKeys}: ${key}`)
        console.log('='.repeat(80))

        // Get TTL
        const ttl = await client.ttl(key)
        console.log(`⏰ TTL: ${ttl === -1 ? 'No expiration' : `${ttl} seconds (${Math.floor(ttl / 60)} minutes)`}`)

        // Get value
        const value = await client.get(key)
        if (value) {
          try {
            const parsed = JSON.parse(value)

            // Display structure
            console.log(`📦 Value structure:`)
            console.log(`   - Type: ${Array.isArray(parsed) ? 'Array' : typeof parsed}`)

            if (typeof parsed === 'object' && !Array.isArray(parsed)) {
              console.log(`   - Keys: ${Object.keys(parsed).join(', ')}`)

              // Check for products/results
              if (parsed.products) {
                console.log(`   - products: Array with ${parsed.products.length} items`)
              }
              if (parsed.results) {
                console.log(`   - results: Array with ${parsed.results.length} items`)
              }
              if (parsed.pagination) {
                console.log(`   - pagination:`, parsed.pagination)
              }
              if (parsed.timestamp) {
                const age = Date.now() - parsed.timestamp
                console.log(`   - cached: ${Math.floor(age / 1000)}s ago`)
              }
              if (parsed.cacheVersion) {
                console.log(`   - cacheVersion: ${parsed.cacheVersion}`)
              }
            }

            // Show sample data (first item if array)
            if (parsed.products && parsed.products.length > 0) {
              console.log(`\n📄 First product sample:`)
              const firstProduct = parsed.products[0]
              console.log(`   - id: ${firstProduct.id}`)
              console.log(`   - name: ${firstProduct.name}`)
              console.log(`   - basePrice: ${firstProduct.basePrice}`)
              console.log(`   - img count: ${firstProduct.img?.length || 0}`)
            }

            // Show full JSON for small objects
            const jsonStr = JSON.stringify(parsed, null, 2)
            if (jsonStr.length < 1000) {
              console.log(`\n📋 Full value:`)
              console.log(jsonStr)
            } else {
              console.log(`\n📋 Value size: ${jsonStr.length} characters (too large to display)`)
            }
          } catch (parseError) {
            console.error('❌ Failed to parse JSON:', parseError)
            console.log('Raw value (first 500 chars):', value.substring(0, 500))
          }
        }
      }

      // Limit to 10 keys to avoid overwhelming output
      if (totalKeys >= 10) {
        console.log(`\n⚠️  Showing first 10 keys only. Total keys may be higher.`)
        break
      }
    } while (cursor !== '0' && totalKeys < 10)

    if (totalKeys === 0) {
      console.log('ℹ️  No keys found matching pattern')
    } else {
      console.log(`\n✅ Inspected ${totalKeys} cache keys`)
    }

    await client.quit()
    console.log('\n👋 Disconnected from Redis')
  } catch (error) {
    console.error('❌ Error inspecting cache:', error)
    process.exit(1)
  }
}

const pattern = process.argv[2] || 'search:*'

console.log('🔍 Redis Cache Inspector\n')
inspectRedisCache(pattern)
  .then(() => {
    console.log('\n✨ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })
