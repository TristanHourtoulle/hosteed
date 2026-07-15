import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { StripeService } from '@/lib/services/stripe'
import {
  calculateCompleteBookingPrice,
  calculateHotelBookingPrice,
} from '@/lib/services/booking-pricing.service'
import { createCheckoutSessionSchema } from '@/lib/zod/payment.schema'
import { logger } from '@/lib/logger'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'AUTH_001', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const rawBody = await req.json()
    const parseResult = createCheckoutSessionSchema.safeParse(rawBody)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: { code: 'VAL_001', message: parseResult.error.errors[0].message } },
        { status: 400 }
      )
    }

    const { productName, metadata } = parseResult.data

    if (metadata.userId !== session.user.id) {
      return NextResponse.json(
        { error: { code: 'AUTH_002', message: 'User ID mismatch' } },
        { status: 403 }
      )
    }

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

    const product = await prisma.product.findUnique({
      where: { id: metadata.productId },
      select: { ownerId: true, roomTypes: { select: { id: true, capacity: true } } },
    })
    if (!product) {
      return NextResponse.json(
        { error: { code: 'VAL_003', message: 'Product not found' } },
        { status: 404 }
      )
    }

    // Parse the optional hotel selection. Never trust client-supplied prices:
    // we only accept room-type ids that actually belong to this product and
    // re-price them server-side from the database.
    let requestedRoomLines: Array<{ roomTypeId: string; quantity: number }> = []
    if (metadata.roomTypeLines) {
      try {
        const parsed = JSON.parse(metadata.roomTypeLines)
        if (Array.isArray(parsed)) {
          const validIds = new Set(product.roomTypes.map(rt => rt.id))
          requestedRoomLines = parsed
            .filter(
              (l): l is { roomTypeId: string; quantity: number } =>
                l &&
                typeof l.roomTypeId === 'string' &&
                validIds.has(l.roomTypeId) &&
                Number.isFinite(l.quantity) &&
                l.quantity > 0
            )
            .map(l => ({ roomTypeId: l.roomTypeId, quantity: Math.floor(l.quantity) }))
        }
      } catch {
        requestedRoomLines = []
      }
    }

    const isHotelBooking = requestedRoomLines.length > 0

    // A hotel booking whose lines are all invalid/tampered has no priceable
    // rooms — reject rather than silently fall back to the establishment price.
    if (metadata.roomTypeLines && !isHotelBooking) {
      return NextResponse.json(
        { error: { code: 'VAL_004', message: 'No valid room type selected' } },
        { status: 400 }
      )
    }

    // Enforce guest count against the selected room types' total capacity
    // (authoritative). Rule: guestCount <= Σ(RoomType.capacity × quantity).
    // Mirrors the guard inside calculateHotelBookingPrice, but returns a clean
    // 400 with the max capacity instead of a swallowed 500.
    if (isHotelBooking) {
      const capacityById = new Map(product.roomTypes.map(rt => [rt.id, rt.capacity]))
      const totalCapacity = requestedRoomLines.reduce(
        (sum, l) => sum + (capacityById.get(l.roomTypeId) ?? 0) * l.quantity,
        0
      )
      if (guestCount > totalCapacity) {
        return NextResponse.json(
          {
            error: {
              code: 'VAL_006',
              message:
                `Le nombre de voyageurs (${guestCount}) dépasse la capacité maximale des ` +
                `chambres sélectionnées (${totalCapacity} personne${totalCapacity > 1 ? 's' : ''} ` +
                `au total). Veuillez réduire le nombre de voyageurs ou ajouter des chambres.`,
            },
          },
          { status: 400 }
        )
      }
    }

    // Server-side price calculation — never trust client-supplied amounts
    const pricing = isHotelBooking
      ? await calculateHotelBookingPrice(
          metadata.productId,
          requestedRoomLines,
          startDate,
          endDate,
          guestCount,
          selectedExtras,
          product.ownerId
        )
      : await calculateCompleteBookingPrice(
          metadata.productId,
          startDate,
          endDate,
          guestCount,
          selectedExtras,
          product.ownerId
        )

    const serverCalculatedAmount = Math.round(pricing.totalAmount)

    if (serverCalculatedAmount <= 0) {
      return NextResponse.json(
        { error: { code: 'VAL_005', message: 'Invalid booking amount' } },
        { status: 400 }
      )
    }

    // Store server-calculated price in metadata for verify-payment/webhook to use.
    // Re-encode the VALIDATED room lines so the webhook persists only trusted data.
    const enrichedMetadata = {
      ...metadata,
      prices: String(serverCalculatedAmount),
      ...(isHotelBooking ? { roomTypeLines: JSON.stringify(requestedRoomLines) } : {}),
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
