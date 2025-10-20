import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { findOverlappingPromotions } from '@/lib/services/promotion.service'

/**
 * GET /api/promotions/check-overlap
 * Vérifier si des promotions se chevauchent avec les dates données
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const productId = searchParams.get('productId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!productId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Paramètres manquants: productId, startDate, endDate requis' },
        { status: 400 }
      )
    }

    const overlapping = await findOverlappingPromotions(
      productId,
      new Date(startDate),
      new Date(endDate)
    )

    return NextResponse.json({
      hasOverlap: overlapping.length > 0,
      overlappingPromotions: overlapping,
    })
  } catch (error) {
    console.error('Erreur lors de la vérification des chevauchements:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
