import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { validatePromotionCommission } from '@/lib/services/promotion.service'

/**
 * POST /api/promotions/validate-commission
 * Vérifier que la promotion ne fait pas perdre d'argent à la plateforme
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { productId, discountPercentage } = body

    if (!productId || discountPercentage === undefined) {
      return NextResponse.json(
        { error: 'Paramètres manquants: productId et discountPercentage requis' },
        { status: 400 }
      )
    }

    const isValid = await validatePromotionCommission(
      productId,
      parseFloat(discountPercentage)
    )

    return NextResponse.json({
      valid: isValid,
      message: isValid
        ? 'Commission valide'
        : 'Réduction trop importante. La plateforme ne pourrait pas couvrir ses frais.'
    })
  } catch (error) {
    console.error('Erreur lors de la validation de la commission:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
