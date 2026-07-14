import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { validatePromotionCommission } from '@/lib/services/promotion.service'

/**
 * POST /api/promotions/validate-commission
 * Vérifier que la promotion ne fait pas perdre d'argent à la plateforme
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔷 [API validate-commission] Request received')

    const session = await auth()

    if (!session?.user?.id) {
      console.log('❌ [API validate-commission] User not authenticated')
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    console.log('✅ [API validate-commission] User authenticated:', session.user.id)

    const body = await request.json()
    const { productId, discountPercentage, roomTypeId } = body
    console.log('📥 [API validate-commission] Request body:', {
      productId,
      discountPercentage,
      roomTypeId,
    })

    if (!productId || discountPercentage === undefined) {
      console.log('❌ [API validate-commission] Missing parameters')
      return NextResponse.json(
        { error: 'Paramètres manquants: productId et discountPercentage requis' },
        { status: 400 }
      )
    }

    if (roomTypeId != null && typeof roomTypeId !== 'string') {
      return NextResponse.json({ error: 'roomTypeId invalide' }, { status: 400 })
    }

    const parsedDiscount = parseFloat(discountPercentage)
    console.log('🔍 [API validate-commission] Calling validatePromotionCommission with:', {
      productId,
      parsedDiscount,
      roomTypeId,
    })

    const { isValid, maxAllowedPercentage } = await validatePromotionCommission(
      productId,
      parsedDiscount,
      (roomTypeId as string | null | undefined) ?? null
    )
    console.log('📊 [API validate-commission] Validation result:', { isValid, maxAllowedPercentage })

    const response = {
      valid: isValid,
      maxAllowedPercentage,
      message: isValid
        ? 'Commission valide'
        : maxAllowedPercentage !== null && maxAllowedPercentage > 0
          ? `Réduction trop importante. Maximum autorisé pour ce produit : ${maxAllowedPercentage}%.`
          : 'Réduction trop importante. La plateforme ne peut pas couvrir ses frais de commission.',
    }
    console.log('📤 [API validate-commission] Sending response:', response)

    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ [API validate-commission] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
