import prisma from '@/lib/prisma'

export async function updateUserStatistics(userId: string) {
  try {
    // Calculer la note moyenne des ratings approuvés reçus
    const approvedRatings = await prisma.userRating.findMany({
      where: {
        ratedId: userId,
        approved: true,
      },
      select: {
        rating: true,
      },
    })

    const averageRating =
      approvedRatings.length > 0
        ? approvedRatings.reduce((sum, rating) => sum + rating.rating, 0) / approvedRatings.length
        : null

    // Compter les voyages terminés
    const completedTrips = await prisma.rent.count({
      where: {
        userId: userId,
        status: 'CHECKOUT',
      },
    })

    // Mettre à jour les statistiques de l'utilisateur
    await prisma.user.update({
      where: { id: userId },
      data: {
        averageRating: averageRating,
        totalRatings: approvedRatings.length,
        totalTrips: completedTrips,
      },
    })

    return {
      averageRating,
      totalRatings: approvedRatings.length,
      totalTrips: completedTrips,
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour des statistiques utilisateur:', error)
    throw error
  }
}

export async function calculateUserStatistics(userId: string) {
  try {
    // Calculer la note moyenne des ratings approuvés reçus
    const approvedRatings = await prisma.userRating.findMany({
      where: {
        ratedId: userId,
        approved: true,
      },
      select: {
        rating: true,
      },
    })

    const averageRating =
      approvedRatings.length > 0
        ? approvedRatings.reduce((sum, rating) => sum + rating.rating, 0) / approvedRatings.length
        : null

    // Compter les voyages terminés
    const completedTrips = await prisma.rent.count({
      where: {
        userId: userId,
        status: 'CHECKOUT',
      },
    })

    return {
      averageRating,
      totalRatings: approvedRatings.length,
      totalTrips: completedTrips,
    }
  } catch (error) {
    console.error('Erreur lors du calcul des statistiques utilisateur:', error)
    throw error
  }
}

export async function getUserRatings(userId: string, limit?: number) {
  try {
    const receivedRatings = await prisma.userRating.findMany({
      where: {
        ratedId: userId,
        approved: true,
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
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    return receivedRatings
  } catch (error) {
    console.error('Erreur lors de la récupération des notes utilisateur:', error)
    throw error
  }
}

export async function canUserRate(
  userId: string,
  rentId: string,
  ratedUserId: string,
  type: 'HOST_TO_GUEST' | 'GUEST_TO_HOST'
) {
  try {
    // Vérifier que la réservation existe et est terminée
    const rent = await prisma.rent.findUnique({
      where: { id: rentId },
      include: {
        product: {
          select: { ownerId: true },
        },
        user: {
          select: { id: true },
        },
      },
    })

    if (!rent || rent.status !== 'CHECKOUT') {
      return { canRate: false, reason: "La réservation n'est pas terminée" }
    }

    // Vérifier les permissions selon le type
    let isAuthorized = false
    if (type === 'HOST_TO_GUEST') {
      isAuthorized = rent.product.ownerId === userId && rent.user.id === ratedUserId
    } else if (type === 'GUEST_TO_HOST') {
      isAuthorized = rent.user.id === userId && rent.product.ownerId === ratedUserId
    }

    if (!isAuthorized) {
      return { canRate: false, reason: "Vous n'avez pas l'autorisation de noter cet utilisateur" }
    }

    // Vérifier qu'une note n'existe pas déjà
    const existingRating = await prisma.userRating.findUnique({
      where: {
        rentId_raterId_ratedId_type: {
          rentId,
          raterId: userId,
          ratedId: ratedUserId,
          type,
        },
      },
    })

    if (existingRating) {
      return {
        canRate: false,
        reason: 'Vous avez déjà noté cet utilisateur pour cette réservation',
      }
    }

    return { canRate: true, reason: null }
  } catch (error) {
    console.error('Erreur lors de la vérification des permissions de notation:', error)
    return { canRate: false, reason: 'Erreur lors de la vérification' }
  }
}
