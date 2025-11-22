import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  updatePromotion,
  cancelPromotion,
  CreatePromotionInput,
} from '@/lib/services/promotion.service'
import prisma from '@/lib/prisma'

/**
 * PUT /api/promotions/[id]
 * Mettre à jour une promotion
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id } = await params

    // Vérifier que la promotion existe et appartient à l'utilisateur
    const promotion = await prisma.productPromotion.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            ownerId: true,
          },
        },
      },
    })

    if (!promotion) {
      return NextResponse.json({ error: 'Promotion non trouvée' }, { status: 404 })
    }

    // Vérifier les permissions
    if (
      session.user.roles !== 'ADMIN' &&
      promotion.product.ownerId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const { discountPercentage, startDate, endDate } = body

    const data: Partial<CreatePromotionInput> = {}
    if (discountPercentage !== undefined) {
      data.discountPercentage = parseFloat(discountPercentage)
    }
    if (startDate) data.startDate = new Date(startDate)
    if (endDate) data.endDate = new Date(endDate)

    const updated = await updatePromotion(id, data)

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la promotion:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/promotions/[id]
 * Annuler une promotion (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id } = await params

    // Vérifier que la promotion existe et appartient à l'utilisateur
    const promotion = await prisma.productPromotion.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            ownerId: true,
          },
        },
      },
    })

    if (!promotion) {
      return NextResponse.json({ error: 'Promotion non trouvée' }, { status: 404 })
    }

    // Vérifier les permissions
    if (
      session.user.roles !== 'ADMIN' &&
      promotion.product.ownerId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const cancelled = await cancelPromotion(id)

    return NextResponse.json({
      success: true,
      message: 'Promotion annulée avec succès',
      promotion: cancelled,
    })
  } catch (error) {
    console.error("Erreur lors de l'annulation de la promotion:", error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
