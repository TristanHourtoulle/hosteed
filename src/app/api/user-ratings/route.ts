import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// POST pour créer une nouvelle note d'utilisateur
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const {
      ratedUserId,
      rentId,
      rating,
      comment,
      ratingType,
    }: {
      ratedUserId: string
      rentId: string
      rating: number
      comment?: string
      ratingType: 'HOST_TO_GUEST' | 'GUEST_TO_HOST'
    } = await request.json()

    // Validation des données
    if (!ratedUserId || !rentId || rating < 1 || rating > 5) {
      return NextResponse.json(
        {
          error: 'Données invalides',
        },
        { status: 400 }
      )
    }

    // Vérifier que la réservation existe et que l'utilisateur a le droit de noter
    const rent = await prisma.rent.findUnique({
      where: { id: rentId },
      include: {
        product: { select: { userManager: true } },
        user: { select: { id: true } },
      },
    })

    if (!rent) {
      return NextResponse.json({ error: 'Réservation non trouvée' }, { status: 404 })
    }

    // Vérifier les droits selon le type de notation
    let canRate = false
    if (ratingType === 'HOST_TO_GUEST' && rent.product.userManager.toString() === session.user.id) {
      canRate = true // L'hôte peut noter l'invité
    } else if (ratingType === 'GUEST_TO_HOST' && rent.user.id === session.user.id) {
      canRate = true // L'invité peut noter l'hôte
    }

    if (!canRate) {
      return NextResponse.json(
        {
          error: "Vous n'avez pas le droit de noter cette personne pour cette réservation",
        },
        { status: 403 }
      )
    }

    // Vérifier qu'une note n'existe pas déjà
    const existingRating = await prisma.userRating.findFirst({
      where: {
        raterId: session.user.id,
        ratedId: ratedUserId,
        rentId: rentId,
      },
    })

    if (existingRating) {
      return NextResponse.json(
        {
          error: 'Vous avez déjà noté cette personne pour cette réservation',
        },
        { status: 400 }
      )
    }

    // Créer la nouvelle note
    const newRating = await prisma.userRating.create({
      data: {
        raterId: session.user.id,
        ratedId: ratedUserId,
        rentId: rentId,
        rating: rating,
        comment: comment,
        type: ratingType,
        approved: false, // Nécessite validation admin
      },
      include: {
        rater: {
          select: {
            name: true,
            lastname: true,
          },
        },
        rated: {
          select: {
            name: true,
            lastname: true,
          },
        },
        rent: {
          include: {
            product: {
              select: { name: true },
            },
          },
        },
      },
    })

    // TODO: Envoyer email de notification aux admins

    return NextResponse.json({
      message: 'Note créée avec succès. Elle sera validée par un administrateur.',
      rating: newRating,
    })
  } catch (error) {
    console.error('Erreur lors de la création de la note:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// GET pour récupérer les notes d'un utilisateur
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'ID utilisateur requis' }, { status: 400 })
    }

    const ratings = await prisma.userRating.findMany({
      where: {
        ratedId: userId,
        approved: true, // Seulement les notes validées
      },
      include: {
        rater: {
          select: {
            name: true,
            lastname: true,
          },
        },
        rent: {
          include: {
            product: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ ratings })
  } catch (error) {
    console.error('Erreur lors de la récupération des notes:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
