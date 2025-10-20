import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

/**
 * PERFORMANCE ANALYTICS API
 * Collects Core Web Vitals and custom performance metrics
 */

interface PerformanceMetric {
  metric: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  url: string
  userAgent: string
  timestamp: number
  sessionId: string
  userId?: string
  connectionType?: string
  deviceMemory?: number
  viewport?: {
    width: number
    height: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: PerformanceMetric = await request.json()

    // Validate required fields
    if (!data.metric || !data.value || !data.url) {
      return NextResponse.json(
        { error: 'Missing required fields: metric, value, url' },
        { status: 400 }
      )
    }

    // Get additional request metadata
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for') || 'unknown'
    const referer = headersList.get('referer') || ''

    // Enrich data with server-side information
    const enrichedData = {
      ...data,
      ip,
      referer,
      receivedAt: new Date().toISOString(),
      // Add geolocation based on IP (implement if needed)
      country: headersList.get('cf-ipcountry') || 'unknown', // Cloudflare header
    }

    // Store in database (implement based on your database choice)
    await storePerformanceMetric(enrichedData)

    // Send alerts for critical metrics
    if (data.rating === 'poor') {
      await sendPerformanceAlert(enrichedData)
    }

    // Log for debugging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Performance Metric:', {
        metric: data.metric,
        value: `${data.value.toFixed(2)}ms`,
        rating: data.rating,
        url: data.url,
      })
    }

    return NextResponse.json({ success: true, received: enrichedData.receivedAt })
  } catch (error) {
    console.error('Performance analytics error:', error)
    return NextResponse.json({ error: 'Failed to process performance metric' }, { status: 500 })
  }
}

/**
 * Store performance metric in database
 */
async function storePerformanceMetric(data: Record<string, unknown>) {
  try {
    // Example implementation - adapt to your database
    // You might want to use a time-series database like InfluxDB for this

    // For now, we'll use Prisma with a simple table
    // You can create a PerformanceMetric model in your schema

    /*
    await prisma.performanceMetric.create({
      data: {
        metric: data.metric,
        value: data.value,
        rating: data.rating,
        url: data.url,
        userAgent: data.userAgent,
        timestamp: new Date(data.timestamp),
        sessionId: data.sessionId,
        userId: data.userId,
        connectionType: data.connectionType,
        deviceMemory: data.deviceMemory,
        ip: data.ip,
        country: data.country,
        referer: data.referer,
      }
    })
    */

    // Temporary: log to console (replace with actual database storage)
    console.log('📈 Storing metric:', data.metric, data.value, data.rating)
  } catch (error) {
    console.error('Failed to store performance metric:', error)
  }
}

/**
 * Send alert for poor performance metrics
 */
async function sendPerformanceAlert(data: Record<string, unknown>) {
  try {
    // Define thresholds for alerts
    const alertThresholds = {
      LCP: 4000, // > 4 seconds is critical
      FID: 300, // > 300ms is critical
      INP: 500, // > 500ms is critical
      CLS: 0.25, // > 0.25 is critical
      TTFB: 1800, // > 1.8s is critical
    }

    const threshold = alertThresholds[data.metric as keyof typeof alertThresholds]
    const value = typeof data.value === 'number' ? data.value : 0

    if (threshold && value > threshold) {
      // Send to monitoring service (Slack, email, etc.)
      const alertMessage = {
        title: `🚨 Critical Performance Issue`,
        message: `${data.metric} exceeded threshold on ${data.url}`,
        details: {
          metric: data.metric,
          value: `${value.toFixed(2)}ms`,
          threshold: `${threshold}ms`,
          url: data.url,
          userAgent: data.userAgent,
          timestamp: new Date(
            typeof data.timestamp === 'number' ? data.timestamp : Date.now()
          ).toISOString(),
        },
      }

      // Log alert (implement actual alerting)
      console.error('🚨 Performance Alert:', alertMessage)

      // You can integrate with services like:
      // - Slack webhooks
      // - Email notifications
      // - PagerDuty
      // - Sentry
    }
  } catch (error) {
    console.error('Failed to send performance alert:', error)
  }
}

/**
 * GET endpoint for retrieving performance analytics
 */
export async function GET() {
  try {
    /*const { searchParams } = new URL(request.url)
    const metric = searchParams.get('metric')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const url = searchParams.get('url')*/

    // Build query filters (commented for now)
    /*const filters = {
      ...(metric && { metric }),
      ...(url && { url }),
      ...(startDate && endDate && {
        timestamp: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    }*/

    // Query performance metrics from database
    const metrics = await getPerformanceMetrics()

    // Calculate aggregated statistics
    const stats = calculatePerformanceStats(metrics)

    return NextResponse.json({
      metrics,
      stats,
      total: metrics.length,
    })
  } catch (error) {
    console.error('Performance analytics query error:', error)
    return NextResponse.json({ error: 'Failed to fetch performance analytics' }, { status: 500 })
  }
}

/**
 * Get performance metrics from database
 */
async function getPerformanceMetrics() {
  try {
    // Example implementation
    /*
    return await prisma.performanceMetric.findMany({
      where: filters,
      orderBy: { timestamp: 'desc' },
      take: 1000, // Limit results
    })
    */

    // Temporary mock data
    return []
  } catch (error) {
    console.error('Failed to fetch performance metrics:', error)
    return []
  }
}

/**
 * Calculate performance statistics
 */
function calculatePerformanceStats(metrics: Record<string, unknown>[]) {
  if (metrics.length === 0) return {}

  const groupedByMetric = metrics.reduce(
    (acc, metric) => {
      const metricKey = typeof metric.metric === 'string' ? metric.metric : 'unknown'
      const metricValue = typeof metric.value === 'number' ? metric.value : 0
      if (!acc[metricKey]) {
        acc[metricKey] = []
      }
      ;(acc[metricKey] as number[]).push(metricValue)
      return acc
    },
    {} as { [key: string]: number[] }
  )

  const stats = Object.keys(groupedByMetric).reduce(
    (acc, metricName) => {
      const values = groupedByMetric[metricName] as number[]
      values.sort((a: number, b: number) => a - b)

      acc[metricName] = {
        count: values.length,
        min: values[0],
        max: values[values.length - 1],
        avg: values.reduce((sum, val) => sum + val, 0) / values.length,
        median: values[Math.floor(values.length / 2)],
        p75: values[Math.floor(values.length * 0.75)],
        p90: values[Math.floor(values.length * 0.9)],
        p95: values[Math.floor(values.length * 0.95)],
      }

      return acc
    },
    {} as Record<
      string,
      {
        count: number
        min: number
        max: number
        avg: number
        median: number
        p75: number
        p90: number
        p95: number
      }
    >
  )

  return stats
}
