import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { confirmPromotionWithOverlap, CreatePromotionInput } from '@/lib/services/promotion.service'

/**
 * POST /api/promotions/confirm-overlap
 * Confirmer la création d'une promotion en désactivant les chevauchements
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier les rôles
    const allowedRoles = ['ADMIN', 'HOST_MANAGER', 'HOST', 'HOST_VERIFIED']
    if (!allowedRoles.includes(session.user.roles)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const { promotionData, overlappingIds } = body

    if (!promotionData || !overlappingIds || !Array.isArray(overlappingIds)) {
      return NextResponse.json({ error: 'Données manquantes ou invalides' }, { status: 400 })
    }

    // Vérifier la propriété du produit
    if (session.user.roles !== 'ADMIN') {
      const prisma = (await import('@/lib/prisma')).default
      const product = await prisma.product.findUnique({
        where: { id: promotionData.productId },
        select: { ownerId: true },
      })

      if (!product) {
        return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 })
      }

      if (product.ownerId !== session.user.id) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
      }
    }

    const data: CreatePromotionInput = {
      productId: promotionData.productId,
      discountPercentage: parseFloat(promotionData.discountPercentage),
      startDate: new Date(promotionData.startDate),
      endDate: new Date(promotionData.endDate),
      createdById: session.user.id,
    }

    const promotion = await confirmPromotionWithOverlap(data, overlappingIds)

    return NextResponse.json(
      {
        promotion,
        message: 'Promotion créée avec succès. Les promotions précédentes ont été désactivées.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erreur lors de la confirmation de la promotion:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
