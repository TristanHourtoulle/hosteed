import { NextResponse } from 'next/server'
import { StripeService } from '@/lib/services/stripe'
import { calculateCompleteBookingPrice } from '@/lib/services/booking-pricing.service'
import { createCheckoutSessionSchema } from '@/lib/zod/payment.schema'
import { logger } from '@/lib/logger'

export async function POST(req: Request) {
  try {
    const rawBody = await req.json()
    const parseResult = createCheckoutSessionSchema.safeParse(rawBody)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: { code: 'VAL_001', message: parseResult.error.errors[0].message } },
        { status: 400 }
      )
    }

    const { productName, metadata } = parseResult.data

    const startDate = new Date(metadata.arrivingDate)
    const endDate = new Date(metadata.leavingDate)
    const guestCount = parseInt(metadata.peopleNumber, 10)

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: { code: 'VAL_002', message: 'Leaving date must be after arriving date' } },
        { status: 400 }
      )
    }

    let selectedExtras: Array<{ extraId: string; quantity: number }> = []
    try {
      selectedExtras = JSON.parse(metadata.selectedExtras)
    } catch {
      selectedExtras = []
    }

    // Server-side price calculation — never trust client-supplied amounts
    const pricing = await calculateCompleteBookingPrice(
      metadata.productId,
      startDate,
      endDate,
      guestCount,
      selectedExtras
    )

    const serverCalculatedAmount = Math.round(pricing.totalAmount)

    // Store server-calculated price in metadata for verify-payment/webhook to use
    const enrichedMetadata = {
      ...metadata,
      prices: String(serverCalculatedAmount),
    }

    const result = await StripeService.createCheckoutSession({
      mode: 'payment',
      payment_intent_data: {
        capture_method: 'manual',
      },
      amount: serverCalculatedAmount,
      productName,
      successUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/host/${metadata.productId}/reservation`,
      metadata: enrichedMetadata,
    })

    if (!result.success) {
      logger.error({ error: result.error }, 'Failed to create Stripe checkout session')
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ url: result.url })
  } catch (error) {
    logger.error({ error }, 'Error creating checkout session')
    return NextResponse.json(
      { error: 'Error creating payment session' },
      { status: 500 }
    )
  }
}
