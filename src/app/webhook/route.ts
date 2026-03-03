import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createRent } from '@/lib/services/rents.service'
import { BookingConflictError, BookingValidationError } from '@/lib/errors/booking.errors'
import Stripe from 'stripe'
import { emailService } from '@/lib/services/email'
import { RentStatus } from '@prisma/client'
import { logger } from '@/lib/logger'

type StripeWebhookEvent = {
  type: string
  data: {
    object: Stripe.PaymentIntent | Stripe.Dispute | Stripe.Charge | Stripe.Checkout.Session
  }
}

let stripeInstance: Stripe | null = null

function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) throw new Error('Missing required environment variable: STRIPE_SECRET_KEY')
    stripeInstance = new Stripe(secretKey, { apiVersion: '2025-10-29.clover' })
  }
  return stripeInstance
}

export async function POST(req: Request): Promise<Response> {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    logger.error('Missing required environment variable: STRIPE_WEBHOOK_SECRET')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const stripe = getStripe()

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    ) as StripeWebhookEvent

    // Handle disputes
    if (event.type === 'charge.dispute.created') {
      const dispute = event.data.object as Stripe.Dispute
      const paymentIntent = dispute.payment_intent as string

      const rent = await prisma.rent.findFirst({
        where: { stripeId: paymentIntent },
      })

      if (!rent) {
        logger.warn({ paymentIntent }, 'No rent found for disputed payment intent')
        return NextResponse.json({ received: true })
      }

      logger.info({ paymentIntent, rentId: rent.id }, 'Charge dispute created')
      await prisma.rent.update({
        where: { id: rent.id },
        data: {
          status: 'CANCEL' as RentStatus,
          payment: 'DISPUTE',
        },
      })
      if (rent.userId) {
        const user = await prisma.user.findUnique({
          where: { id: rent.userId },
        })
        if (user?.email && !user.emailOptOut && !user.emailBounced) {
          await emailService.sendDisputeNotification(user.email, {
            bookingId: rent.id,
            amount: String(rent.prices),
            reason: 'Paiement contesté',
            adminUrl: `${process.env.NEXTAUTH_URL}/admin/reservations/${rent.id}`,
          })
        }
      }
    }

    // Handle resolved disputes
    if (event.type === 'charge.dispute.closed') {
      const dispute = event.data.object as Stripe.Dispute
      const paymentIntent = dispute.payment_intent as string

      const rent = await prisma.rent.findFirst({
        where: { stripeId: paymentIntent },
      })

      if (!rent) {
        logger.warn({ paymentIntent }, 'No rent found for closed dispute')
        return NextResponse.json({ received: true })
      }

      await prisma.rent.update({
        where: { id: rent.id },
        data: {
          status: dispute.status === 'won' ? 'RESERVED' : 'CANCEL',
          payment: dispute.status === 'won' ? 'CLIENT_PAID' : 'NOT_PAID',
        },
      })
    }

    // Handle successful payments
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent

      const rent = await prisma.rent.findFirst({
        where: { stripeId: paymentIntent.id },
      })
      if (rent) {
        await prisma.rent.update({
          where: { id: rent.id },
          data: {
            status: 'RESERVED' as RentStatus,
            accepted: true,
            payment: 'CLIENT_PAID',
          },
        })
        logger.info({ rentId: rent.id }, 'Rent updated to RESERVED after payment success')
      } else {
        logger.info({ paymentIntentId: paymentIntent.id }, 'No rent found for payment intent, checking session')

        const sessions = await stripe.checkout.sessions.list({
          payment_intent: paymentIntent.id,
        })

        if (sessions.data.length > 0) {
          const session = sessions.data[0]

          if (session.metadata?.productId && session.metadata?.userId) {
            // Idempotency: skip if rent already exists for this payment
            const existingRentForPI = await prisma.rent.findFirst({
              where: { stripeId: paymentIntent.id },
            })
            if (existingRentForPI) {
              logger.info({ rentId: existingRentForPI.id, stripeId: paymentIntent.id }, 'Rent already exists for payment intent, skipping creation (idempotent)')
              return NextResponse.json({ received: true })
            }

            logger.info({ sessionId: session.id }, 'Creating rent from session')
            try {
              const newRent = await createRent({
                productId: session.metadata.productId,
                userId: session.metadata.userId,
                arrivingDate: new Date(session.metadata.arrivingDate),
                leavingDate: new Date(session.metadata.leavingDate),
                peopleNumber: parseInt(session.metadata.peopleNumber),
                options: session.metadata.options ? JSON.parse(session.metadata.options) : [],
                stripeId: paymentIntent.id,
                prices: Number(session.metadata.prices),
                selectedExtras: session.metadata.selectedExtras
                  ? JSON.parse(session.metadata.selectedExtras)
                  : [],
              })

              logger.info({ rentId: newRent.id }, 'Rent created successfully from session')
              await prisma.rent.update({
                where: { id: newRent.id },
                data: {
                  status: 'RESERVED' as RentStatus,
                  payment: 'CLIENT_PAID',
                },
              })
            } catch (error) {
              if (error instanceof BookingConflictError) {
                logger.warn({ paymentIntentId: paymentIntent.id, error: error.message }, 'Booking conflict during webhook rent creation')
              } else if (error instanceof BookingValidationError) {
                logger.error({ paymentIntentId: paymentIntent.id, error: error.message }, 'Booking validation error during webhook rent creation')
              } else {
                logger.error({ error }, 'Failed to create rent from session')
              }
            }
          }
        }
      }
    }

    // Handle failed payments
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent

      const rent = await prisma.rent.findFirst({
        where: { stripeId: paymentIntent.id },
      })

      if (!rent) {
        logger.warn({ paymentIntentId: paymentIntent.id }, 'No rent found for failed payment intent')
        return NextResponse.json({ received: true })
      }

      await prisma.rent.update({
        where: { id: rent.id },
        data: {
          status: 'CANCEL' as RentStatus,
          payment: 'NOT_PAID',
        },
      })

      if (rent.userId) {
        const user = await prisma.user.findUnique({
          where: { id: rent.userId },
        })
        if (user?.email && !user.emailOptOut && !user.emailBounced) {
          await emailService.sendPaymentError(user.email, user.name ?? 'Client', {
            amount: String(rent.prices),
            listingTitle: 'Votre réservation',
            errorMessage: "Votre paiement n'a pas pu être traité.",
            retryUrl: `${process.env.NEXTAUTH_URL}/reservation/${rent.id}`,
          })
        }
      }
    }

    // Handle refunds
    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge

      const rent = await prisma.rent.findFirst({
        where: { stripeId: charge.payment_intent as string },
      })

      if (!rent) {
        logger.warn({ paymentIntent: charge.payment_intent }, 'No rent found for refunded charge')
        return NextResponse.json({ received: true })
      }

      await prisma.rent.update({
        where: { id: rent.id },
        data: {
          status: 'CANCEL' as RentStatus,
          payment: 'REFUNDED',
        },
      })

      if (rent.userId) {
        const user = await prisma.user.findUnique({
          where: { id: rent.userId },
        })
        if (user?.email && !user.emailOptOut && !user.emailBounced) {
          await emailService.sendFromTemplate(
            'annulation',
            user.email,
            'Remboursement effectué - Hosteed',
            {
              userName: user.name ?? 'Client',
              message: 'Votre remboursement a été effectué avec succès.',
            }
          )
        }
      }
    }

    // Handle completed checkout sessions
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      if (
        !session.metadata?.productId ||
        !session.metadata?.userId ||
        !session.metadata?.arrivingDate ||
        !session.metadata?.leavingDate ||
        !session.metadata?.peopleNumber ||
        !session.payment_intent ||
        session.status !== 'complete' ||
        !session.metadata.prices
      ) {
        logger.error({ metadata: session.metadata }, 'Missing metadata in Stripe session')
        return NextResponse.json({ error: 'Métadonnées manquantes' }, { status: 400 })
      }

      // Idempotency: skip if rent already exists for this payment
      const existingRent = await prisma.rent.findFirst({
        where: { stripeId: session.payment_intent.toString() },
      })
      if (existingRent) {
        logger.info({ rentId: existingRent.id, stripeId: session.payment_intent }, 'Rent already exists, skipping creation (idempotent)')
        return NextResponse.json({ received: true })
      }

      try {
        const rent = await createRent({
          productId: session.metadata.productId,
          userId: session.metadata.userId,
          arrivingDate: new Date(session.metadata.arrivingDate),
          leavingDate: new Date(session.metadata.leavingDate),
          peopleNumber: parseInt(session.metadata.peopleNumber),
          options: session.metadata.options ? JSON.parse(session.metadata.options) : [],
          stripeId: session.payment_intent.toString(),
          prices: Number(session.metadata.prices),
          selectedExtras: session.metadata.selectedExtras
            ? JSON.parse(session.metadata.selectedExtras)
            : [],
        })

        // Update rent status
        await prisma.rent.update({
          where: { id: rent.id },
          data: {
            status: 'WAITING' as RentStatus,
            payment: 'NOT_PAID',
          },
        })
      } catch (error) {
        if (error instanceof BookingConflictError) {
          logger.warn({ sessionId: session.id, error: error.message }, 'Booking conflict during checkout completion')
          return NextResponse.json(
            { error: 'Ces dates ne sont plus disponibles' },
            { status: 409 }
          )
        }
        if (error instanceof BookingValidationError) {
          logger.error({ sessionId: session.id, error: error.message }, 'Booking validation error during checkout')
          return NextResponse.json(
            { error: error.message },
            { status: 400 }
          )
        }
        logger.error({ error }, 'Failed to create reservation from checkout session')
        return NextResponse.json(
          { error: 'Erreur lors de la création de la réservation' },
          { status: 500 }
        )
      }
    }

    // Handle payment intent creation
    if (event.type === 'payment_intent.created') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      logger.info({ paymentIntentId: paymentIntent.id }, 'New payment intent created with manual capture')

      const rent = await prisma.rent.findFirst({
        where: { stripeId: paymentIntent.id },
      })

      if (rent) {
        logger.info({ rentId: rent.id }, 'Payment created, awaiting capture to move to RESERVED')
      }
    }

    // Handle payment capture
    if (event.type === 'payment_intent.captured') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      logger.info({ paymentIntentId: paymentIntent.id }, 'Payment captured')

      const rent = await prisma.rent.findFirst({
        where: { stripeId: paymentIntent.id },
      })

      if (rent) {
        await prisma.rent.update({
          where: { id: rent.id },
          data: {
            status: 'RESERVED' as RentStatus,
            accepted: true,
            payment: 'CLIENT_PAID',
          },
        })
        logger.info({ rentId: rent.id }, 'Rent updated to RESERVED after payment capture')
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    logger.error({ error: err }, 'Webhook processing error')
    return NextResponse.json({ error: 'Erreur webhook' }, { status: 400 })
  }
}
