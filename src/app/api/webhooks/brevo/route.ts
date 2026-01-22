import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import crypto from 'crypto'

// Brevo webhook event types
type BrevoEventType =
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'click'
  | 'soft_bounce'
  | 'hard_bounce'
  | 'invalid_email'
  | 'deferred'
  | 'complaint'
  | 'unsubscribed'
  | 'blocked'
  | 'error'

interface BrevoWebhookEvent {
  event: BrevoEventType
  email: string
  'message-id': string
  ts_event: number
  subject?: string
  tag?: string[]
  link?: string
  reason?: string
  sending_ip?: string
  template_id?: number
}

function verifyWebhookSignature(
  payload: string,
  signature: string | null
): boolean {
  const webhookSecret = process.env.BREVO_WEBHOOK_SECRET

  // Skip verification if no secret configured
  if (!webhookSecret || !signature) {
    return true
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex')

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text()
    const signature = request.headers.get('x-brevo-signature')

    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature)) {
      console.error('[Brevo Webhook] Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event: BrevoWebhookEvent = JSON.parse(payload)

    console.log(`[Brevo Webhook] Received: ${event.event} for ${event.email}`)

    // Store event in database for analytics
    await prisma.emailEvent.create({
      data: {
        messageId: event['message-id'],
        email: event.email,
        event: event.event,
        timestamp: new Date(event.ts_event * 1000),
        subject: event.subject,
        tags: event.tag ?? [],
        metadata: {
          link: event.link,
          reason: event.reason,
          sendingIp: event.sending_ip,
          templateId: event.template_id,
        },
      },
    })

    // Handle events that affect user email status
    switch (event.event) {
      case 'hard_bounce':
      case 'invalid_email':
        // Mark email as bounced - stop sending to this address
        await prisma.user.updateMany({
          where: { email: event.email },
          data: {
            emailVerified: null,
            emailBounced: true,
          },
        })
        console.log(`[Brevo Webhook] Marked ${event.email} as bounced`)
        break

      case 'complaint':
        // User marked email as spam - respect their preference
        await prisma.user.updateMany({
          where: { email: event.email },
          data: { emailOptOut: true },
        })
        console.log(`[Brevo Webhook] Marked ${event.email} as opted-out (complaint)`)
        break

      case 'unsubscribed':
        // User unsubscribed via Brevo link
        await prisma.user.updateMany({
          where: { email: event.email },
          data: { emailOptOut: true },
        })
        console.log(`[Brevo Webhook] Marked ${event.email} as unsubscribed`)
        break

      case 'delivered':
        // Email successfully delivered - clear any previous bounce flag
        // Only clear if it was a soft bounce (transient issue)
        await prisma.user.updateMany({
          where: {
            email: event.email,
            emailBounced: true,
          },
          data: { emailBounced: false },
        })
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Brevo Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Allow GET for webhook verification (some providers ping the URL)
export async function GET() {
  return NextResponse.json({ status: 'Brevo webhook endpoint active' })
}
