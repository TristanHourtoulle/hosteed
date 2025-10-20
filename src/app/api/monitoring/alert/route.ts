import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

/**
 * PERFORMANCE ALERT API
 * Handles performance alerts and notifications
 */

interface PerformanceAlert {
  type: 'warning' | 'error' | 'critical'
  metric: string
  value: number
  threshold: number
  message: string
  url: string
  timestamp: number
  suggestions: string[]
  userAgent?: string
  sessionId?: string
  userId?: string
}

interface NotificationDetails {
  metric?: string
  value?: string | number
  threshold?: string | number
  url?: string
  timestamp?: string
  suggestions?: string[]
}

export async function POST(request: NextRequest) {
  try {
    const alert: PerformanceAlert = await request.json()

    // Validate required fields
    if (!alert.type || !alert.metric || !alert.value || !alert.url) {
      return NextResponse.json(
        { error: 'Missing required fields: type, metric, value, url' },
        { status: 400 }
      )
    }

    // Get additional request metadata
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for') || 'unknown'
    const referer = headersList.get('referer') || ''

    // Enrich alert data
    const enrichedAlert = {
      ...alert,
      id: generateAlertId(),
      ip,
      referer,
      receivedAt: new Date().toISOString(),
      resolved: false,
    }

    // Store alert in database
    await storePerformanceAlert(enrichedAlert)

    // Send notifications based on alert type
    if (alert.type === 'critical') {
      await sendImmediateNotification(enrichedAlert)
    } else if (alert.type === 'error') {
      await sendHighPriorityNotification(enrichedAlert)
    }

    // Log alert for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚨 Performance Alert [${alert.type.toUpperCase()}]:`, {
        metric: alert.metric,
        value: alert.value,
        threshold: alert.threshold,
        url: alert.url,
        message: alert.message,
      })
    }

    return NextResponse.json({
      success: true,
      alertId: enrichedAlert.id,
      received: enrichedAlert.receivedAt,
    })
  } catch (error) {
    console.error('Performance alert error:', error)
    return NextResponse.json({ error: 'Failed to process performance alert' }, { status: 500 })
  }
}

/**
 * GET endpoint for retrieving performance alerts
 */
export async function GET() {
  try {
    const alerts = await getPerformanceAlerts()
    const summary = await getAlertsSummary()

    return NextResponse.json({
      alerts,
      summary,
      total: alerts.length,
    })
  } catch (error) {
    console.error('Performance alerts query error:', error)
    return NextResponse.json({ error: 'Failed to fetch performance alerts' }, { status: 500 })
  }
}

/**
 * Store performance alert in database
 */
async function storePerformanceAlert(alert: Record<string, unknown>) {
  try {
    // Example implementation - adapt to your database
    /*
    await prisma.performanceAlert.create({
      data: {
        id: alert.id,
        type: alert.type,
        metric: alert.metric,
        value: alert.value,
        threshold: alert.threshold,
        message: alert.message,
        url: alert.url,
        timestamp: new Date(typeof alert.timestamp === 'number' ? alert.timestamp : Date.now()),
        suggestions: alert.suggestions,
        userAgent: alert.userAgent,
        sessionId: alert.sessionId,
        userId: alert.userId,
        ip: alert.ip,
        referer: alert.referer,
        receivedAt: new Date(alert.receivedAt),
        resolved: alert.resolved,
      }
    })
    */

    // Temporary: log to console (replace with actual database storage)
    console.log('💾 Storing alert:', alert.type, alert.metric, alert.message)
  } catch (error) {
    console.error('Failed to store performance alert:', error)
  }
}

/**
 * Send immediate notification for critical alerts
 */
async function sendImmediateNotification(alert: Record<string, unknown>) {
  try {
    const notification = {
      title: `🚨 CRITICAL: Performance Issue Detected`,
      message: alert.message,
      details: {
        metric: alert.metric,
        value: alert.value,
        threshold: alert.threshold,
        url: alert.url,
        timestamp: new Date(
          typeof alert.timestamp === 'number' ? alert.timestamp : Date.now()
        ).toISOString(),
        suggestions: alert.suggestions,
      },
      priority: 'critical',
      channels: ['slack', 'email', 'sms'], // Multiple notification channels
    }

    // Integrate with notification services
    await Promise.allSettled([
      sendSlackNotification(notification),
      sendEmailNotification(notification),
      // Add other notification channels as needed
    ])
  } catch (error) {
    console.error('Failed to send immediate notification:', error)
  }
}

/**
 * Send high priority notification for error alerts
 */
async function sendHighPriorityNotification(alert: Record<string, unknown>) {
  try {
    const notification = {
      title: `⚠️ Performance Issue Detected`,
      message: alert.message,
      details: {
        metric: alert.metric,
        value: alert.value,
        threshold: alert.threshold,
        url: alert.url,
        suggestions: alert.suggestions,
      },
      priority: 'high',
      channels: ['slack', 'email'],
    }

    // Send to fewer channels for non-critical alerts
    await Promise.allSettled([
      sendSlackNotification(notification),
      sendEmailNotification(notification),
    ])
  } catch (error) {
    console.error('Failed to send high priority notification:', error)
  }
}

/**
 * Send Slack notification
 */
async function sendSlackNotification(notification: Record<string, unknown>) {
  try {
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL
    if (!slackWebhookUrl) {
      console.log('🔕 Slack webhook not configured')
      return
    }

    const slackMessage = {
      text: notification.title,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: notification.title,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: notification.message,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Metric:* ${(notification.details as NotificationDetails)?.metric || 'N/A'}`,
            },
            {
              type: 'mrkdwn',
              text: `*Value:* ${(notification.details as NotificationDetails)?.value || 'N/A'}`,
            },
            {
              type: 'mrkdwn',
              text: `*Threshold:* ${(notification.details as NotificationDetails)?.threshold || 'N/A'}`,
            },
            {
              type: 'mrkdwn',
              text: `*URL:* ${(notification.details as NotificationDetails)?.url || 'N/A'}`,
            },
          ],
        },
      ],
    }

    // Add suggestions if available
    const suggestions = (notification.details as NotificationDetails)?.suggestions
    if (Array.isArray(suggestions) && suggestions.length > 0) {
      slackMessage.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Suggestions:*\n${suggestions.map((s: string) => `• ${s}`).join('\n')}`,
        },
      })
    }

    await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackMessage),
    })

    console.log('📤 Slack notification sent')
  } catch (error) {
    console.error('Failed to send Slack notification:', error)
  }
}

/**
 * Send email notification
 */
async function sendEmailNotification(notification: Record<string, unknown>) {
  try {
    // This would integrate with your email service (SendGrid, SES, etc.)
    console.log('📧 Email notification:', notification.title)

    // Example implementation:
    /*
    await sendEmail({
      to: process.env.ALERT_EMAIL || 'admin@hosteed.com',
      subject: notification.title,
      html: generateAlertEmailHtml(notification),
      priority: notification.priority
    })
    */
  } catch (error) {
    console.error('Failed to send email notification:', error)
  }
}

/**
 * Get performance alerts from database
 */
async function getPerformanceAlerts(): Promise<unknown[]> {
  try {
    // Example implementation
    /*
    return await prisma.performanceAlert.findMany({
      where: filters,
      orderBy: { timestamp: 'desc' },
      take: limit,
    })
    */

    // Temporary mock data
    return []
  } catch (error) {
    console.error('Failed to fetch performance alerts:', error)
    return []
  }
}

/**
 * Get alerts summary statistics
 */
async function getAlertsSummary() {
  try {
    // Calculate summary statistics
    /*
    const [total, critical, error, warning, resolved] = await Promise.all([
      prisma.performanceAlert.count(),
      prisma.performanceAlert.count({ where: { type: 'critical' } }),
      prisma.performanceAlert.count({ where: { type: 'error' } }),
      prisma.performanceAlert.count({ where: { type: 'warning' } }),
      prisma.performanceAlert.count({ where: { resolved: true } })
    ])
    
    return { total, critical, error, warning, resolved }
    */

    // Temporary mock data
    return {
      total: 0,
      critical: 0,
      error: 0,
      warning: 0,
      resolved: 0,
    }
  } catch (error) {
    console.error('Failed to fetch alerts summary:', error)
    return { total: 0, critical: 0, error: 0, warning: 0, resolved: 0 }
  }
}

/**
 * Generate unique alert ID
 */
function generateAlertId(): string {
  return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Generate HTML for alert email
 * Currently unused but kept for future implementation
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function generateAlertEmailHtml(notification: Record<string, unknown>): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>${notification.title}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: #f8f9fa; padding: 20px; border-radius: 5px; }
            .alert-critical { border-left: 4px solid #dc3545; }
            .alert-error { border-left: 4px solid #fd7e14; }
            .alert-warning { border-left: 4px solid #ffc107; }
            .details { background: #f8f9fa; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .suggestions { background: #e7f3ff; padding: 15px; border-radius: 5px; }
            .suggestions ul { margin: 0; padding-left: 20px; }
        </style>
    </head>
    <body>
        <div class="header alert-${notification.priority}">
            <h2>${notification.title}</h2>
            <p>${notification.message}</p>
        </div>
        
        <div class="details">
            <h3>Alert Details</h3>
            <ul>
                <li><strong>Metric:</strong> ${(notification.details as NotificationDetails)?.metric || 'N/A'}</li>
                <li><strong>Value:</strong> ${(notification.details as NotificationDetails)?.value || 'N/A'}</li>
                <li><strong>Threshold:</strong> ${(notification.details as NotificationDetails)?.threshold || 'N/A'}</li>
                <li><strong>URL:</strong> ${(notification.details as NotificationDetails)?.url || 'N/A'}</li>
                <li><strong>Timestamp:</strong> ${(notification.details as NotificationDetails)?.timestamp || 'N/A'}</li>
            </ul>
        </div>
        
        ${
          Array.isArray((notification.details as NotificationDetails)?.suggestions) &&
          ((notification.details as NotificationDetails).suggestions?.length ?? 0) > 0
            ? `
        <div class="suggestions">
            <h3>Suggestions</h3>
            <ul>
                ${(notification.details as NotificationDetails).suggestions?.map((s: string) => `<li>${s}</li>`).join('')}
            </ul>
        </div>
        `
            : ''
        }
        
        <p><small>This alert was generated automatically by Hosteed Performance Monitor.</small></p>
    </body>
    </html>
  `
}
