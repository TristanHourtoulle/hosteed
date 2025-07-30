'use server'
import prisma from '@/lib/prisma'
import { sendTemplatedMail } from '@/lib/services/sendTemplatedMail'
import { UserRole } from '@prisma/client'

interface CreateAdminReviewParams {
  productId: string
  adminId: string
  grade: number
  welcomeGrade: number
  staff: number
  comfort: number
  equipment: number
  cleaning: number
  title: string
  text: string
  visitingDate: Date
  publishDate: Date
  authorName?: string // Nom fictif pour l'auteur de l'avis
  authorEmail?: string // Email fictif pour l'auteur de l'avis
}

/**
 * Créer un avis administratif (faux avis) pour un hébergement
 * Réservé aux ADMIN et HOST_MANAGER
 */
export async function createAdminReview(params: CreateAdminReviewParams) {
  try {
    // Vérifier que l'utilisateur est admin ou host manager
    const admin = await prisma.user.findUnique({
      where: { id: params.adminId },
      select: { roles: true, name: true, email: true },
    })

    if (!admin || !['ADMIN', 'HOST_MANAGER'].includes(admin.roles)) {
      throw new Error(
        'Accès non autorisé - Seuls les administrateurs et host managers peuvent créer des avis'
      )
    }

    // Vérifier que le produit existe
    const product = await prisma.product.findUnique({
      where: { id: params.productId },
      select: { id: true, name: true },
    })

    if (!product) {
      throw new Error('Produit non trouvé')
    }

    // Créer une réservation fictive pour lier l'avis
    const fakeRent = await prisma.rent.create({
      data: {
        productId: params.productId,
        userId: params.adminId,
        numberPeople: BigInt(1),
        notes: BigInt(0),
        accepted: true,
        prices: BigInt(0),
        arrivingDate: params.visitingDate,
        leavingDate: new Date(params.visitingDate.getTime() + 24 * 60 * 60 * 1000), // +1 jour
        payment: 'FULL_TRANSFER_DONE',
        status: 'CHECKOUT',
        confirmed: true,
      },
    })

    // Créer l'avis
    const review = await prisma.review.create({
      data: {
        title: params.title,
        text: params.text,
        product: { connect: { id: params.productId } },
        rentRelation: { connect: { id: fakeRent.id } },
        grade: params.grade,
        welcomeGrade: params.welcomeGrade,
        staff: params.staff,
        comfort: params.comfort,
        equipment: params.equipment,
        cleaning: params.cleaning,
        visitDate: params.visitingDate,
        publishDate: params.publishDate,
        approved: true, // Automatiquement approuvé pour les avis admin
      },
      include: {
        rentRelation: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    // Optionnel : Mettre à jour les informations utilisateur de la réservation fictive
    // avec des données fictives si fournies
    if (params.authorName || params.authorEmail) {
      await prisma.user.update({
        where: { id: params.adminId },
        data: {
          // On peut créer un utilisateur fictif séparé si nécessaire
          // Pour l'instant on utilise l'admin mais on pourrait améliorer
        },
      })
    }

    // Notifier les autres admins de la création de l'avis
    const admins = await prisma.user.findMany({
      where: {
        roles: { in: ['ADMIN', 'HOST_MANAGER'] as UserRole[] },
        id: { not: params.adminId },
      },
    })

    for (const adminUser of admins) {
      await sendTemplatedMail(
        adminUser.email,
        'Nouvel avis administratif créé',
        'new-review.html',
        {
          reviewUrl: `${process.env.NEXTAUTH_URL}/host/${params.productId}`,
        }
      )
    }

    return {
      success: true,
      review,
      message: 'Avis administratif créé avec succès',
    }
  } catch (error) {
    console.error("Erreur lors de la création de l'avis administratif:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

/**
 * Créer un utilisateur fictif pour des avis plus réalistes
 */
export async function createFakeUser(params: { name: string; email: string }) {
  try {
    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: params.email },
    })

    if (existingUser) {
      return existingUser
    }

    // Créer un utilisateur fictif
    const fakeUser = await prisma.user.create({
      data: {
        name: params.name,
        email: params.email,
        roles: 'USER',
        emailVerified: new Date(), // Considéré comme vérifié
      },
    })

    return fakeUser
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur fictif:", error)
    throw error
  }
}

/**
 * Créer un avis avec un utilisateur fictif complet
 */
export async function createAdvancedAdminReview(
  params: CreateAdminReviewParams & {
    fakeUserName: string
    fakeUserEmail: string
  }
) {
  try {
    // Vérifier que l'utilisateur est admin ou host manager
    const admin = await prisma.user.findUnique({
      where: { id: params.adminId },
      select: { roles: true },
    })

    if (!admin || !(['ADMIN', 'HOST_MANAGER'] as UserRole[]).includes(admin.roles)) {
      throw new Error('Accès non autorisé')
    }

    // Créer ou récupérer l'utilisateur fictif
    const fakeUser = await createFakeUser({
      name: params.fakeUserName,
      email: params.fakeUserEmail,
    })

    // Créer une réservation fictive avec l'utilisateur fictif
    const fakeRent = await prisma.rent.create({
      data: {
        productId: params.productId,
        userId: fakeUser.id,
        numberPeople: BigInt(1),
        notes: BigInt(0),
        accepted: true,
        prices: BigInt(100), // Prix fictif
        arrivingDate: params.visitingDate,
        leavingDate: new Date(params.visitingDate.getTime() + 24 * 60 * 60 * 1000),
        payment: 'FULL_TRANSFER_DONE',
        status: 'CHECKOUT',
        confirmed: true,
      },
    })

    // Créer l'avis
    const review = await prisma.review.create({
      data: {
        title: params.title,
        text: params.text,
        product: { connect: { id: params.productId } },
        rentRelation: { connect: { id: fakeRent.id } },
        grade: params.grade,
        welcomeGrade: params.welcomeGrade,
        staff: params.staff,
        comfort: params.comfort,
        equipment: params.equipment,
        cleaning: params.cleaning,
        visitDate: params.visitingDate,
        publishDate: params.publishDate,
        approved: true,
      },
    })

    return {
      success: true,
      review,
      fakeUser,
      fakeRent,
      message: 'Avis administratif avec utilisateur fictif créé avec succès',
    }
  } catch (error) {
    console.error("Erreur lors de la création de l'avis avancé:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

/**
 * Lister tous les avis créés par les admins
 */
export async function getAdminCreatedReviews(adminId: string) {
  try {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { roles: true },
    })

    if (!admin || !(['ADMIN', 'HOST_MANAGER'] as UserRole[]).includes(admin.roles)) {
      throw new Error('Accès non autorisé')
    }

    // Pour identifier les avis admin, on peut chercher les réservations avec prix = 0
    // ou ajouter un champ dans le schéma pour marquer les avis admin
    const adminReviews = await prisma.review.findMany({
      where: {
        rentRelation: {
          prices: BigInt(0), // Prix fictif pour identifier les avis admin
        },
      },
      include: {
        rentRelation: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                roles: true,
              },
            },
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    return {
      success: true,
      reviews: adminReviews,
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des avis admin:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}
