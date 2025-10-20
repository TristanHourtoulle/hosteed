import { NextResponse } from 'next/server'
import { cacheMonitorService } from '@/lib/cache/cache-monitor.service'

export async function GET() {
  try {
    const [currentAlerts, alertHistory] = await Promise.all([
      cacheMonitorService.checkAlerts(),
      cacheMonitorService.getAlertHistory(),
    ])

    const thresholds = cacheMonitorService.getThresholds()

    return NextResponse.json(
      {
        current: {
          count: currentAlerts.length,
          errors: currentAlerts.filter(a => a.type === 'error').length,
          warnings: currentAlerts.filter(a => a.type === 'warning').length,
          alerts: currentAlerts,
        },
        history: {
          total: alertHistory.length,
          recent: alertHistory.slice(-10), // Last 10 alerts
          last24h: alertHistory.filter(a => a.timestamp > Date.now() - 24 * 60 * 60 * 1000),
        },
        thresholds,
        status:
          currentAlerts.length === 0
            ? 'ok'
            : currentAlerts.some(a => a.type === 'error')
              ? 'critical'
              : 'warning',
        timestamp: Date.now(),
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Alert-Count': currentAlerts.length.toString(),
          'X-Alert-Status': currentAlerts.length === 0 ? 'ok' : 'alert',
        },
      }
    )
  } catch (error) {
    console.error('Cache alerts error:', error)
    return NextResponse.json(
      {
        error: 'Failed to retrieve alerts',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { thresholds } = await request.json()

    if (!thresholds || typeof thresholds !== 'object') {
      return NextResponse.json(
        {
          error: 'Invalid thresholds format',
        },
        { status: 400 }
      )
    }

    cacheMonitorService.updateThresholds(thresholds)

    return NextResponse.json({
      success: true,
      message: 'Alert thresholds updated',
      newThresholds: cacheMonitorService.getThresholds(),
    })
  } catch (error) {
    console.error('Failed to update thresholds:', error)
    return NextResponse.json(
      {
        error: 'Failed to update thresholds',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
