import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// PATCH pour valider/rejeter une note (admin seulement)
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, roles: true },
    })

    if (!admin || !['ADMIN', 'HOST_MANAGER'].includes(admin.roles)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const ratingId = id
    const { approved }: { approved: boolean } = await request.json()

    // Vérifier que la note existe et n'est pas déjà validée
    const rating = await prisma.userRating.findUnique({
      where: { id: ratingId },
      include: {
        rater: { select: { name: true, lastname: true } },
        rated: { select: { name: true, lastname: true } },
        rent: {
          include: {
            product: {
              select: { name: true },
            },
          },
        },
      },
    })

    if (!rating) {
      return NextResponse.json({ error: 'Note non trouvée' }, { status: 404 })
    }

    if (rating.approved) {
      return NextResponse.json(
        {
          error: 'Cette note a déjà été validée',
        },
        { status: 400 }
      )
    }

    // Mettre à jour la note
    const updatedRating = await prisma.userRating.update({
      where: { id: ratingId },
      data: {
        approved: approved === true,
        adminId: admin.id,
        approvedAt: approved === true ? new Date() : null,
      },
    })

    if (approved === true) {
      // Recalculer les statistiques de l'utilisateur noté
      await updateUserStatistics(rating.ratedId)

      // TODO: Envoyer email de confirmation aux utilisateurs concernés
    } else {
      // TODO: Envoyer email de rejet avec raison si fournie
    }

    return NextResponse.json({
      message: approved === true ? 'Note validée avec succès' : 'Note rejetée',
      rating: updatedRating,
    })
  } catch (error) {
    console.error('Erreur lors de la validation de la note:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// Fonction pour recalculer les statistiques d'un utilisateur
async function updateUserStatistics(userId: string) {
  const approvedRatings = await prisma.userRating.findMany({
    where: {
      ratedId: userId,
      approved: true,
    },
  })

  const averageRating =
    approvedRatings.length > 0
      ? approvedRatings.reduce((sum: number, rating) => sum + rating.rating, 0) /
        approvedRatings.length
      : 0

  const totalRatings = approvedRatings.length

  // Calculer le nombre total de voyages (réservations terminées en tant qu'invité)
  const totalTrips = await prisma.rent.count({
    where: {
      userId: userId, // En tant qu'invité seulement
      status: 'CHECKOUT',
    },
  })

  await prisma.user.update({
    where: { id: userId },
    data: {
      averageRating: averageRating,
      totalRatings: totalRatings,
      totalTrips: totalTrips,
    },
  })
}

// GET pour récupérer les notes en attente de validation (admin seulement)
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, roles: true },
    })

    if (!admin || !['ADMIN', 'HOST_MANAGER'].includes(admin.roles)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const pendingRatings = await prisma.userRating.findMany({
      where: { approved: false },
      include: {
        rater: {
          select: {
            id: true,
            name: true,
            lastname: true,
            email: true,
          },
        },
        rated: {
          select: {
            id: true,
            name: true,
            lastname: true,
            email: true,
          },
        },
        rent: {
          include: {
            product: {
              select: { name: true, address: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ ratings: pendingRatings })
  } catch (error) {
    console.error('Erreur lors de la récupération des notes:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
