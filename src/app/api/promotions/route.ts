import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  createPromotion,
  getPromotionsByHost,
  CreatePromotionInput,
} from '@/lib/services/promotion.service'

/**
 * POST /api/promotions
 * Créer une nouvelle promotion
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier les rôles (ADMIN, HOST_MANAGER, HOST)
    const allowedRoles = ['ADMIN', 'HOST_MANAGER', 'HOST', 'HOST_VERIFIED']
    if (!allowedRoles.includes(session.user.roles)) {
      return NextResponse.json(
        { error: 'Non autorisé. Seuls les hôtes et administrateurs peuvent créer des promotions.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { productId, discountPercentage, startDate, endDate } = body

    if (!productId || !discountPercentage || !startDate || !endDate) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Vérifier que l'utilisateur est le propriétaire du produit (sauf si ADMIN)
    if (session.user.roles !== 'ADMIN') {
      const prisma = (await import('@/lib/prisma')).default
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { ownerId: true },
      })

      if (!product) {
        return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 })
      }

      if (product.ownerId !== session.user.id) {
        return NextResponse.json(
          { error: 'Vous ne pouvez créer des promotions que pour vos propres produits' },
          { status: 403 }
        )
      }
    }

    const data: CreatePromotionInput = {
      productId,
      discountPercentage: parseFloat(discountPercentage),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      createdById: session.user.id,
    }

    const result = await createPromotion(data)

    if (result.hasOverlap) {
      // Retourner les promotions en conflit
      return NextResponse.json(
        {
          requiresConfirmation: true,
          overlappingPromotions: result.overlappingPromotions,
          message: 'Une ou plusieurs promotions actives seront désactivées',
        },
        { status: 409 } // Conflict
      )
    }

    return NextResponse.json(result.promotion, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création de la promotion:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/promotions
 * Récupérer toutes les promotions de l'utilisateur connecté
 * Si ADMIN ou HOST_MANAGER: récupère toutes les promotions
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Si ADMIN ou HOST_MANAGER, récupérer toutes les promotions
    if (session.user.roles === 'ADMIN' || session.user.roles === 'HOST_MANAGER') {
      const prisma = (await import('@/lib/prisma')).default
      const allPromotions = await prisma.productPromotion.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              address: true,
              basePrice: true,
              img: {
                select: { img: true },
                take: 1,
              },
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      })
      return NextResponse.json(allPromotions)
    }

    // Sinon, récupérer seulement les promotions de l'hôte
    const promotions = await getPromotionsByHost(session.user.id)

    return NextResponse.json(promotions)
  } catch (error) {
    console.error('Erreur lors de la récupération des promotions:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
