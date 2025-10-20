import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { calculateTotalBookingCost } from '@/lib/utils/costCalculation'

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

    // Récupérer le produit avec son prix de base
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        basePrice: true,
        priceMGA: true,
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 })
    }

    // Récupérer les extras sélectionnés
    const selectedExtras = await prisma.productExtra.findMany({
      where: {
        id: { in: selectedExtraIds },
      },
    })

    // Calculer les dates et la durée
    const bookingStartDate = new Date(startDate)
    const bookingEndDate = new Date(endDate)
    const numberOfDays = Math.ceil(
      (bookingEndDate.getTime() - bookingStartDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (numberOfDays <= 0) {
      return NextResponse.json(
        { error: 'La date de fin doit être après la date de début' },
        { status: 400 }
      )
    }

    // Obtenir le prix de base selon la devise
    const basePrice =
      currency === 'EUR' ? parseFloat(product.basePrice) : parseFloat(product.priceMGA)

    // Calculer le coût total
    const bookingDetails = {
      startDate: bookingStartDate,
      endDate: bookingEndDate,
      guestCount,
    }

    const costCalculation = calculateTotalBookingCost(
      basePrice,
      numberOfDays,
      selectedExtras,
      bookingDetails,
      currency
    )

    // Retourner le détail complet du calcul
    return NextResponse.json({
      productId,
      bookingDetails: {
        startDate: bookingStartDate,
        endDate: bookingEndDate,
        numberOfDays,
        guestCount,
      },
      pricing: {
        currency,
        basePrice,
        basePricePerDay: basePrice,
        baseTotal: costCalculation.baseTotal,
        extrasTotal: costCalculation.extrasTotal,
        grandTotal: costCalculation.grandTotal,
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
