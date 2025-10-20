import { NextResponse } from 'next/server'
import { cacheMonitorService } from '@/lib/cache/cache-monitor.service'

export async function GET() {
  try {
    const metrics = await cacheMonitorService.getMetrics()

    if (!metrics) {
      return NextResponse.json(
        {
          error: 'Unable to retrieve cache metrics',
          connected: false,
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      {
        metrics,
        performance: {
          hitRate: metrics.hitRate.toFixed(2) + '%',
          missRate: metrics.missRate.toFixed(2) + '%',
          opsPerSecond: metrics.instantaneousOpsPerSec,
          memoryEfficiency: {
            used: metrics.memoryUsedHuman,
            fragmentation: metrics.memoryFragmentationRatio.toFixed(2),
          },
        },
        connections: {
          current: metrics.connectedClients,
          blocked: metrics.blockedClients,
          rejected: metrics.rejectedConnections,
        },
        keys: {
          total: metrics.totalKeys,
          expired: metrics.expiredKeys,
          evicted: metrics.evictedKeys,
        },
        uptime: {
          seconds: metrics.uptime,
          formatted: formatUptime(metrics.uptime),
        },
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json',
          'X-Cache-Connected': metrics.connected.toString(),
          'X-Cache-Hit-Rate': metrics.hitRate.toFixed(2),
        },
      }
    )
  } catch (error) {
    console.error('Cache metrics error:', error)
    return NextResponse.json(
      {
        error: 'Failed to retrieve metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${secs}s`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}
