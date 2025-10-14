import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getHostPricingSettings,
  updateHostPricingSettings
} from '@/lib/services/promotion.service'
import { PricingPriority } from '@prisma/client'

/**
 * GET /api/host/pricing-settings
 * Récupérer les paramètres de tarification de l'hôte connecté
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const settings = await getHostPricingSettings(session.user.id)

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/host/pricing-settings
 * Mettre à jour les paramètres de tarification de l'hôte connecté
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { promotionPriority } = body

    if (!promotionPriority) {
      return NextResponse.json(
        { error: 'promotionPriority requis' },
        { status: 400 }
      )
    }

    // Valider que la priorité est valide
    const validPriorities: PricingPriority[] = [
      'PROMOTION_FIRST',
      'SPECIAL_PRICE_FIRST',
      'MOST_ADVANTAGEOUS',
      'STACK_DISCOUNTS'
    ]

    if (!validPriorities.includes(promotionPriority)) {
      return NextResponse.json(
        { error: 'Priorité de tarification invalide' },
        { status: 400 }
      )
    }

    const updated = await updateHostPricingSettings(session.user.id, {
      promotionPriority
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
