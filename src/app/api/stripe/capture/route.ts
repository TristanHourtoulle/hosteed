import { NextResponse } from 'next/server'
import Stripe from 'stripe'

// Initialize Stripe only if the secret key is available
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
    })
  : null

export async function POST(request: Request) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const { paymentIntentId } = await request.json()

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Payment Intent ID is required' }, { status: 400 })
    }

    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId)

    return NextResponse.json({
      success: true,
      paymentIntent,
    })
  } catch (error) {
    console.error('Error capturing payment:', error)
    return NextResponse.json({ error: 'Failed to capture payment' }, { status: 500 })
  }
}
