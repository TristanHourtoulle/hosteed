import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createRent } from '@/lib/services/rents.service'
import Stripe from 'stripe'
import { RentStatus } from '@prisma/client'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function POST(req: Request) {
  try {
    const { sessionId, paymentIntent } = await req.json()

    let session: Stripe.Checkout.Session | null = null
    let paymentIntentObj: Stripe.PaymentIntent | null = null

    // Try to get session first
    if (sessionId) {
      try {
        session = await stripe.checkout.sessions.retrieve(sessionId)
        if (session.payment_intent) {
          paymentIntentObj = await stripe.paymentIntents.retrieve(session.payment_intent as string)
        }
      } catch (error) {
        console.error('Error retrieving session:', error)
      }
    }

    // If no session, try to get payment intent directly
    if (!session && paymentIntent) {
      try {
        paymentIntentObj = await stripe.paymentIntents.retrieve(paymentIntent)
        // Try to find associated session
        const sessions = await stripe.checkout.sessions.list({
          payment_intent: paymentIntent,
          limit: 1,
        })
        if (sessions.data.length > 0) {
          session = sessions.data[0]
        }
      } catch (error) {
        console.error('Error retrieving payment intent:', error)
      }
    }

    if (!paymentIntentObj) {
      return NextResponse.json({ error: 'Paiement non trouvé' }, { status: 404 })
    }

    // Check if payment is successful
    if (paymentIntentObj.status !== 'succeeded' && paymentIntentObj.status !== 'requires_capture') {
      return NextResponse.json({ error: 'Paiement non validé' }, { status: 400 })
    }

    // Check if reservation already exists
    let existingRent = await prisma.rent.findFirst({
      where: { stripeId: paymentIntentObj.id },
      include: {
        product: {
          select: {
            name: true,
          },
        },
      },
    })

    // If no reservation exists, try to create it from session metadata
    if (!existingRent && session?.metadata) {
      const metadata = session.metadata

      if (
        metadata.productId &&
        metadata.userId &&
        metadata.arrivingDate &&
        metadata.leavingDate &&
        metadata.peopleNumber &&
        metadata.prices
      ) {
        try {
          console.log('Creating reservation from session metadata...')
          const newRent = await createRent({
            productId: metadata.productId,
            userId: metadata.userId,
            arrivingDate: new Date(metadata.arrivingDate),
            leavingDate: new Date(metadata.leavingDate),
            peopleNumber: parseInt(metadata.peopleNumber),
            options: metadata.options ? JSON.parse(metadata.options) : [],
            stripeId: paymentIntentObj.id,
            prices: Number(metadata.prices),
          })

          if (newRent) {
            // Update payment status
            await prisma.rent.update({
              where: { id: newRent.id },
              data: {
                status: 'RESERVED' as RentStatus,
                payment: paymentIntentObj.status === 'succeeded' ? 'CLIENT_PAID' : 'NOT_PAID',
              },
            })

            existingRent = await prisma.rent.findFirst({
              where: { id: newRent.id },
              include: {
                product: {
                  select: {
                    name: true,
                  },
                },
              },
            })
          }
        } catch (error) {
          console.error('Error creating rent from session:', error)
        }
      }
    }

    if (!existingRent) {
      return NextResponse.json(
        { error: 'Réservation non trouvée. Veuillez contacter le support.' },
        { status: 404 }
      )
    }

    // Return reservation data
    return NextResponse.json({
      success: true,
      reservation: {
        id: existingRent.id,
        productName: existingRent.product.name,
        arrivingDate: existingRent.arrivingDate.toISOString(),
        leavingDate: existingRent.leavingDate.toISOString(),
        totalPrice: Number(existingRent.prices),
      },
    })
  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du paiement' },
      { status: 500 }
    )
  }
}
