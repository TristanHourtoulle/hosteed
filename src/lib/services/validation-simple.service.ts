import prisma from '@/lib/prisma'
import { SendMail } from '@/lib/services/email.service'
import { ProductValidation } from '@prisma/client'

export enum ValidationSection {
  TITLE = 'TITLE',
  DESCRIPTION = 'DESCRIPTION',
  PHOTOS = 'PHOTOS',
  LOCATION = 'LOCATION',
  AMENITIES = 'AMENITIES',
  RULES = 'RULES',
  PRICING = 'PRICING',
  OTHER = 'OTHER',
}

export enum ValidationCommentStatus {
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  OBSOLETE = 'OBSOLETE',
}

export const validationService = {
  // Récupérer tous les produits pour la validation (tous les statuts)
  async getProductsForValidation() {
    const products = await prisma.product.findMany({
      where: {},
      include: {
        user: {
          select: {
            id: true,
            name: true,
            lastname: true,
            email: true,
            image: true,
          },
        },
        img: {
          select: {
            img: true,
          },
        },
        validationHistory: {
          orderBy: { createdAt: 'desc' },
          take: 2, // Les 2 dernières entrées pour déterminer le contexte
          include: {
            host: {
              select: {
                id: true,
                name: true,
                lastname: true,
              },
            },
            admin: {
              select: {
                id: true,
                name: true,
                lastname: true,
              },
            },
          },
        },
      },
    })

    return products.map(product => {
      // Enrichir chaque produit avec des métadonnées de statut
      const lastTwoEntries = product.validationHistory
      let isRecentlyModified = false
      let wasRecheckRequested = false

      if (lastTwoEntries.length >= 2) {
        const [latest, previous] = lastTwoEntries
        // Si le statut précédent était RecheckRequest et maintenant NotVerified avec un hostId
        wasRecheckRequested =
          previous.newStatus === ProductValidation.RecheckRequest &&
          latest.newStatus === ProductValidation.NotVerified &&
          latest.hostId !== null

        isRecentlyModified = wasRecheckRequested
      }

      return {
        ...product,
        // Retirer l'historique du résultat final pour éviter la surcharge
        validationHistory: undefined,
        // Ajouter les métadonnées
        isRecentlyModified,
        wasRecheckRequested,
      }
    })
  },

  // Mettre à jour le statut d'un produit
  async updateProductStatus(productId: string, newStatus: ProductValidation) {
    return await prisma.product.update({
      where: { id: productId },
      data: { validate: newStatus },
    })
  },

  // Workflow d'approbation d'un produit
  async approveProduct(productId: string, adminId: string, reason?: string) {
    return await prisma.$transaction(async tx => {
      // Récupérer le statut actuel
      const currentProduct = await tx.product.findUnique({
        where: { id: productId },
        select: { validate: true },
      })

      if (!currentProduct) {
        throw new Error('Produit non trouvé')
      }

      // Mettre à jour le produit
      const product = await tx.product.update({
        where: { id: productId },
        data: { validate: ProductValidation.Approve },
        include: {
          user: {
            select: {
              email: true,
              name: true,
              lastname: true,
            },
          },
        },
      })

      // Créer l'entrée dans l'historique
      await tx.validationHistory.create({
        data: {
          productId,
          previousStatus: currentProduct.validate,
          newStatus: ProductValidation.Approve,
          adminId,
          reason: reason || 'Produit approuvé par admin',
        },
      })

      // Envoyer un email de confirmation au hôte
      if (product.user[0]?.email) {
        try {
          const hostName = product.user[0].name || product.user[0].lastname || 'Cher hôte'
          const emailSubject = `Votre annonce "${product.name}" a été approuvée !`
          const emailContent = `
            <h2>Félicitations ${hostName} !</h2>
            <p>Votre annonce <strong>"${product.name}"</strong> a été approuvée par notre équipe.</p>
            <p>Elle est maintenant visible par tous les visiteurs de Hosteed.</p>
            <p><a href="${process.env.NEXT_PUBLIC_URL}/host/${productId}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Voir votre annonce</a></p>
            <p>Merci de faire confiance à Hosteed !</p>
          `

          await SendMail(product.user[0].email, emailSubject, emailContent, true)
        } catch (error) {
          console.error("Erreur lors de l'envoi de l'email d'approbation:", error)
        }
      }

      return product
    })
  },

  // Workflow de refus d'un produit
  async rejectProduct(productId: string, adminId: string, reason: string) {
    return await prisma.$transaction(async tx => {
      // Récupérer le statut actuel
      const currentProduct = await tx.product.findUnique({
        where: { id: productId },
        select: { validate: true },
      })

      if (!currentProduct) {
        throw new Error('Produit non trouvé')
      }

      // Mettre à jour le produit
      const product = await tx.product.update({
        where: { id: productId },
        data: { validate: ProductValidation.Refused },
        include: {
          user: {
            select: {
              email: true,
              name: true,
              lastname: true,
            },
          },
        },
      })

      // Créer l'entrée dans l'historique
      await tx.validationHistory.create({
        data: {
          productId,
          previousStatus: currentProduct.validate,
          newStatus: ProductValidation.Refused,
          adminId,
          reason,
        },
      })

      // Envoyer un email au hôte
      if (product.user[0]?.email) {
        try {
          const hostName = product.user[0].name || product.user[0].lastname || 'Cher hôte'
          const emailSubject = `Votre annonce "${product.name}" a été refusée`
          const emailContent = `
            <h2>Bonjour ${hostName},</h2>
            <p>Malheureusement, votre annonce <strong>"${product.name}"</strong> a été refusée.</p>
            <p><strong>Raison du refus:</strong> ${reason}</p>
            <p>Vous pouvez contacter notre support pour plus d'informations ou pour soumettre une nouvelle annonce.</p>
            <p><a href="${process.env.NEXT_PUBLIC_URL}/contact" style="background-color: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Contacter le support</a></p>
            <p>L'équipe Hosteed</p>
          `

          await SendMail(product.user[0].email, emailSubject, emailContent, true)
        } catch (error) {
          console.error("Erreur lors de l'envoi de l'email de refus:", error)
        }
      }

      return product
    })
  },

  // Demander une révision
  async requestRecheck(productId: string, adminId: string, reason: string) {
    return await prisma.$transaction(async tx => {
      // Récupérer le statut actuel
      const currentProduct = await tx.product.findUnique({
        where: { id: productId },
        select: { validate: true },
      })

      if (!currentProduct) {
        throw new Error('Produit non trouvé')
      }

      // Mettre à jour le produit
      const product = await tx.product.update({
        where: { id: productId },
        data: { validate: ProductValidation.RecheckRequest },
        include: {
          user: {
            select: {
              email: true,
              name: true,
              lastname: true,
            },
          },
        },
      })

      // Créer l'entrée dans l'historique
      await tx.validationHistory.create({
        data: {
          productId,
          previousStatus: currentProduct.validate,
          newStatus: ProductValidation.RecheckRequest,
          adminId,
          reason,
        },
      })

      // Envoyer un email au hôte
      if (product.user[0]?.email) {
        try {
          const hostName = product.user[0].name || product.user[0].lastname || 'Cher hôte'
          const emailSubject = `Modifications requises pour votre annonce "${product.name}"`
          const emailContent = `
            <h2>Bonjour ${hostName},</h2>
            <p>Votre annonce <strong>"${product.name}"</strong> nécessite quelques modifications avant d'être approuvée.</p>
            <p><strong>Modifications demandées:</strong> ${reason}</p>
            <p>Veuillez apporter les modifications nécessaires et resoumettre votre annonce.</p>
            <p><a href="${process.env.NEXT_PUBLIC_URL}/dashboard/host?productId=${productId}" style="background-color: #f59e0b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Modifier mon annonce</a></p>
            <p>Merci de votre compréhension,<br>L'équipe Hosteed</p>
          `

          await SendMail(product.user[0].email, emailSubject, emailContent, true)
        } catch (error) {
          console.error("Erreur lors de l'envoi de l'email de révision:", error)
        }
      }

      return product
    })
  },

  // Récupérer les statistiques de validation
  async getValidationStats() {
    const stats = await prisma.product.groupBy({
      by: ['validate'],
      _count: {
        id: true,
      },
    })

    // Calculer les statistiques détaillées
    const totalNotVerified =
      stats.find(s => s.validate === ProductValidation.NotVerified)?._count.id || 0
    const totalRecheckRequest =
      stats.find(s => s.validate === ProductValidation.RecheckRequest)?._count.id || 0

    // Pour distinguer les nouvelles des resoumises, nous devons faire une requête supplémentaire
    const recentlyModifiedCount = await prisma.product.count({
      where: {
        validate: ProductValidation.NotVerified,
        validationHistory: {
          some: {
            AND: [
              { newStatus: ProductValidation.NotVerified },
              { hostId: { not: null } },
              {
                createdAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Derniers 7 jours
                },
              },
            ],
          },
        },
      },
    })

    const newSubmissions = totalNotVerified - recentlyModifiedCount

    return {
      pending: newSubmissions, // Vraiment nouvelles soumissions
      approved: stats.find(s => s.validate === ProductValidation.Approve)?._count.id || 0,
      rejected: stats.find(s => s.validate === ProductValidation.Refused)?._count.id || 0,
      recheckRequest: totalRecheckRequest + recentlyModifiedCount, // Révisions + modifications récentes
    }
  },

  // Récupérer l'historique de validation d'un produit
  async getValidationHistory(productId: string) {
    return await prisma.validationHistory.findMany({
      where: { productId },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            lastname: true,
            email: true,
          },
        },
        host: {
          select: {
            id: true,
            name: true,
            lastname: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  // Récupérer les commentaires de validation d'un produit
  async getValidationComments(productId: string) {
    return await prisma.validationComment.findMany({
      where: { productId },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            lastname: true,
            email: true,
          },
        },
        resolver: {
          select: {
            id: true,
            name: true,
            lastname: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  },
}
