import { NextResponse } from 'next/server'
import { cacheMonitorService } from '@/lib/cache/cache-monitor.service'

export async function GET() {
  try {
    const healthCheck = await cacheMonitorService.healthCheck()

    return NextResponse.json(
      {
        status: healthCheck.healthy ? 'healthy' : 'unhealthy',
        score: healthCheck.score,
        summary: {
          connected: healthCheck.metrics.connected,
          hitRate: healthCheck.metrics.hitRate.toFixed(2) + '%',
          memoryUsed: healthCheck.metrics.memoryUsedHuman,
          totalKeys: healthCheck.metrics.totalKeys,
          uptime: healthCheck.metrics.uptime,
        },
        issues: healthCheck.issues,
        warnings: healthCheck.warnings,
        recommendations: healthCheck.recommendations,
        timestamp: Date.now(),
      },
      {
        status: healthCheck.healthy ? 200 : 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('Cache health check error:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to perform health check',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
