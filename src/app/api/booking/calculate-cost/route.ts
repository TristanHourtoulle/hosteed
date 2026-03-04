import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { calculateBookingPrice } from '@/lib/services/booking-pricing.service'
import { calculateExtrasCost } from '@/lib/utils/costCalculation'

interface BookingCostRequest {
  productId: string
  startDate: string
  endDate: string
  guestCount: number
  selectedExtraIds: string[]
  currency?: 'EUR' | 'MGA'
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body: BookingCostRequest = await request.json()
    const { productId, startDate, endDate, guestCount, selectedExtraIds, currency = 'EUR' } = body

    if (!productId || !startDate || !endDate || !guestCount) {
      return NextResponse.json(
        { error: 'Données manquantes: productId, startDate, endDate, et guestCount sont requis' },
        { status: 400 }
      )
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        basePrice: true,
        priceMGA: true,
        ownerId: true,
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 })
    }

    const bookingStartDate = new Date(startDate)
    const bookingEndDate = new Date(endDate)

    if (bookingEndDate <= bookingStartDate) {
      return NextResponse.json(
        { error: 'La date de fin doit être après la date de début' },
        { status: 400 }
      )
    }

    // Day-by-day pricing with special rates and promotions
    const pricing = await calculateBookingPrice(
      productId,
      bookingStartDate,
      bookingEndDate,
      product.ownerId
    )

    // Calculate extras
    const selectedExtras = await prisma.productExtra.findMany({
      where: { id: { in: selectedExtraIds } },
    })

    const extrasTotal = calculateExtrasCost(
      selectedExtras,
      { startDate: bookingStartDate, endDate: bookingEndDate, guestCount },
      currency
    )

    const basePrice =
      currency === 'EUR' ? parseFloat(product.basePrice) : parseFloat(product.priceMGA)

    return NextResponse.json({
      productId,
      bookingDetails: {
        startDate: bookingStartDate,
        endDate: bookingEndDate,
        numberOfDays: pricing.numberOfNights,
        guestCount,
      },
      pricing: {
        currency,
        basePrice,
        basePricePerDay: pricing.averageNightlyPrice,
        baseTotal: pricing.subtotal,
        extrasTotal,
        grandTotal: pricing.subtotal + extrasTotal,
        totalSavings: pricing.totalSavings,
        promotionApplied: pricing.promotionApplied,
        specialPriceApplied: pricing.specialPriceApplied,
        dailyBreakdown: pricing.dailyBreakdown.map(day => ({
          date: day.date,
          basePrice: day.basePrice,
          finalPrice: day.finalPrice,
          promotionApplied: day.promotionApplied,
          promotionDiscount: day.promotionDiscount,
          specialPriceApplied: day.specialPriceApplied,
          savings: day.savings,
        })),
      },
      selectedExtras: selectedExtras.map(extra => ({
        id: extra.id,
        name: extra.name,
        type: extra.type,
        price: currency === 'EUR' ? extra.priceEUR : extra.priceMGA,
      })),
    })
  } catch (error) {
    console.error('Erreur lors du calcul du coût de réservation:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
