import { NextResponse } from 'next/server'
import { findAllSecurity } from '@/lib/services/security.services'
import { staticDataCacheService } from '@/lib/cache/redis-cache.service'

export async function GET() {
  const startTime = Date.now()
  
  try {
    // Use Redis cache for lightning-fast static data retrieval
    const securities = await staticDataCacheService.getStaticDataWithCache(
      'security',
      findAllSecurity
    )
    
    const responseTime = Date.now() - startTime
    
    return NextResponse.json(securities || [], {
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=172800', // 24h cache
        'X-Response-Time': responseTime.toString(),
        'X-Cache-Service': 'redis-static',
        'X-Cache-Meta': JSON.stringify({
          cached: true,
          responseTime,
          dataType: 'static'
        })
      },
    })
  } catch (error) {
    console.error('Error fetching security:', error)
    return NextResponse.json(
      { error: 'Failed to fetch security' },
      { status: 500 }
    )
  }
}