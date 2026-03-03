import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createRent } from '@/lib/services/rents.service'
import { BookingConflictError, BookingValidationError } from '@/lib/errors/booking.errors'
import Stripe from 'stripe'
import { RentStatus } from '@prisma/client'
import { logger } from '@/lib/logger'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
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
        logger.error({ sessionId, error }, 'Failed to retrieve Stripe session')
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
        logger.error({ paymentIntent, error }, 'Failed to retrieve payment intent')
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
          logger.info({ sessionId }, 'Creating reservation from session metadata')

          let selectedExtras: Array<{ extraId: string; quantity: number }> = []
          if (metadata.selectedExtras) {
            try {
              const extraIds = JSON.parse(metadata.selectedExtras)
              selectedExtras = extraIds.map((id: string) => ({
                extraId: id,
                quantity: 1,
              }))
            } catch (error) {
              logger.error({ error }, 'Failed to parse selectedExtras')
            }
          }

          const newRent = await createRent({
            productId: metadata.productId,
            userId: metadata.userId,
            arrivingDate: new Date(metadata.arrivingDate),
            leavingDate: new Date(metadata.leavingDate),
            peopleNumber: parseInt(metadata.peopleNumber),
            options: metadata.options ? JSON.parse(metadata.options) : [],
            stripeId: paymentIntentObj.id,
            prices: Number(metadata.prices),
            selectedExtras,
          })

          // Update payment status
          await prisma.rent.update({
            where: { id: newRent.id },
            data: {
              status:
                paymentIntentObj.status === 'succeeded'
                  ? ('RESERVED' as RentStatus)
                  : ('WAITING' as RentStatus),
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
        } catch (error) {
          if (error instanceof BookingConflictError) {
            return NextResponse.json(
              { error: 'Ces dates ne sont plus disponibles' },
              { status: 409 }
            )
          }
          if (error instanceof BookingValidationError) {
            return NextResponse.json(
              { error: error.message },
              { status: 400 }
            )
          }
          logger.error({ error }, 'Failed to create rent from session')
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
    logger.error({ error }, 'Failed to verify payment')
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du paiement' },
      { status: 500 }
    )
  }
}
