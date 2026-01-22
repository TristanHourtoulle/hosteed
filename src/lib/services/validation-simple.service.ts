import prisma from '@/lib/prisma'
import { emailService } from '@/lib/services/email'
import { ProductValidation } from '@prisma/client'
import { applyDraftChanges, rejectDraftChanges } from '@/lib/services/product.service'

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
  // Legacy function - use getProductsForValidationPaginated instead
  async getProductsForValidation() {
    const result = await validationService.getProductsForValidationPaginated({
      page: 1,
      limit: 100,
    })
    return result?.products || []
  },

  // Optimized paginated version
  async getProductsForValidationPaginated({
    page = 1,
    limit = 20,
    status,
    includeLightweight = false,
  }: {
    page?: number
    limit?: number
    status?: ProductValidation
    includeLightweight?: boolean
  } = {}) {
    const skip = (page - 1) * limit

    // Build where clause based on status filter
    const whereClause = status ? { validate: status } : {}

    // Use the same pattern as getProductForValidation which works
    const baseUserInclude = {
      select: {
        id: true,
        name: true,
        lastname: true,
        email: true,
        image: true,
      },
    }

    const lightweightIncludes = {
      owner: baseUserInclude,
      img: {
        take: 1, // CRITICAL: Only 1 image for admin validation lists
        select: {
          id: true,
          img: true,
        },
      },
    }

    const fullIncludes = {
      owner: baseUserInclude,
      img: {
        take: 5, // Maximum 5 images for validation detail view
        select: {
          id: true,
          img: true,
        },
      },
      validationHistory: {
        orderBy: { createdAt: 'desc' },
        take: 2,
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
    }

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        include: includeLightweight ? lightweightIncludes : fullIncludes,
        skip,
        take: limit,
        orderBy: [
          { validate: 'asc' }, // Pending validation first
          { id: 'desc' },
        ],
      }),
      prisma.product.count({
        where: whereClause,
      }),
    ])

    // Only process metadata for non-lightweight requests
    const processedProducts = includeLightweight
      ? products
      : products.map(product => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const lastTwoEntries = (product as any).validationHistory || []
          let isRecentlyModified = false
          let wasRecheckRequested = false

          if (lastTwoEntries.length >= 2) {
            const [latest, previous] = lastTwoEntries
            wasRecheckRequested =
              previous.newStatus === ProductValidation.RecheckRequest &&
              latest.newStatus === ProductValidation.NotVerified &&
              latest.hostId !== null

            isRecentlyModified = wasRecheckRequested
          }

          return {
            ...product,
            validationHistory: undefined, // Remove from response
            isRecentlyModified,
            wasRecheckRequested,
          }
        })

    return {
      products: processedProducts,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
    }
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
      // Récupérer le produit avec ses informations de draft
      const currentProduct = await tx.product.findUnique({
        where: { id: productId },
        select: {
          validate: true,
          isDraft: true,
          originalProductId: true,
        },
      })

      if (!currentProduct) {
        throw new Error('Produit non trouvé')
      }

      let product

      // Si c'est un draft, appliquer les changements au produit original
      if (currentProduct.isDraft && currentProduct.originalProductId) {
        // Apply draft changes will handle the merge and deletion
        product = await applyDraftChanges(productId)

        // Get the updated product with user info for email
        product = await tx.product.findUnique({
          where: { id: currentProduct.originalProductId },
          include: {
            owner: {
              select: {
                email: true,
                name: true,
                lastname: true,
              },
            },
          },
        })
      } else {
        // Standard approval for non-draft products
        product = await tx.product.update({
          where: { id: productId },
          data: { validate: ProductValidation.Approve },
          include: {
            owner: {
              select: {
                email: true,
                name: true,
                lastname: true,
              },
            },
          },
        })
      }

      // Créer l'entrée dans l'historique
      const finalProductId =
        currentProduct.isDraft && currentProduct.originalProductId
          ? currentProduct.originalProductId
          : productId

      await tx.validationHistory.create({
        data: {
          productId: finalProductId,
          previousStatus: currentProduct.validate,
          newStatus: ProductValidation.Approve,
          adminId,
          reason:
            reason ||
            (currentProduct.isDraft
              ? 'Modifications approuvées par admin'
              : 'Produit approuvé par admin'),
        },
      })

      // Envoyer un email de confirmation au hôte
      if (product?.owner?.email) {
        try {
          const hostName = product.owner.name || product.owner.lastname || 'Cher hôte'
          await emailService.sendListingApproved(
            product.owner.email,
            hostName,
            {
              listingTitle: product.name,
              listingUrl: `${process.env.NEXT_PUBLIC_URL}/host/${finalProductId}`,
            }
          )
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
      // Récupérer le produit avec ses informations de draft
      const currentProduct = await tx.product.findUnique({
        where: { id: productId },
        select: {
          validate: true,
          isDraft: true,
          originalProductId: true,
          name: true,
        },
      })

      if (!currentProduct) {
        throw new Error('Produit non trouvé')
      }

      let product
      let finalProductId

      // Si c'est un draft, rejeter et supprimer le draft
      if (currentProduct.isDraft && currentProduct.originalProductId) {
        // Get user info before deletion
        product = await tx.product.findUnique({
          where: { id: productId },
          include: {
            owner: {
              select: {
                email: true,
                name: true,
                lastname: true,
              },
            },
          },
        })

        finalProductId = currentProduct.originalProductId

        // Reject draft will handle email and deletion
        await rejectDraftChanges(productId, reason)

        // The rejectDraftChanges function already sends the email, so we return early
        return product
      } else {
        // Standard rejection for non-draft products
        product = await tx.product.update({
          where: { id: productId },
          data: { validate: ProductValidation.Refused },
          include: {
            owner: {
              select: {
                email: true,
                name: true,
                lastname: true,
              },
            },
          },
        })
        finalProductId = productId
      }

      // Créer l'entrée dans l'historique (seulement pour les produits non-draft)
      if (!currentProduct.isDraft) {
        await tx.validationHistory.create({
          data: {
            productId: finalProductId,
            previousStatus: currentProduct.validate,
            newStatus: ProductValidation.Refused,
            adminId,
            reason,
          },
        })
      }

      // Envoyer un email au hôte (seulement pour les produits non-draft)
      if (!currentProduct.isDraft && product.owner?.email) {
        try {
          const hostName = product.owner.name || product.owner.lastname || 'Cher hôte'
          await emailService.sendListingRejected(
            product.owner.email,
            hostName,
            {
              listingTitle: product.name,
              rejectionReason: reason,
              contactUrl: `${process.env.NEXT_PUBLIC_URL}/contact`,
            }
          )
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
          owner: {
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
      if (product.owner?.email) {
        try {
          const hostName = product.owner.name || product.owner.lastname || 'Cher hôte'
          await emailService.sendFromTemplate(
            'annonce-modifiee',
            product.owner.email,
            `Modifications requises pour votre annonce "${product.name}"`,
            {
              userName: hostName,
              listingTitle: product.name,
              modificationsRequested: reason,
              editUrl: `${process.env.NEXT_PUBLIC_URL}/dashboard/host?productId=${productId}`,
            }
          )
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

    // Count drafts and modification pending products
    const draftsCount = await prisma.product.count({
      where: { isDraft: true },
    })

    const modificationPendingCount =
      stats.find(s => s.validate === ProductValidation.ModificationPending)?._count.id || 0

    return {
      pending: newSubmissions, // Vraiment nouvelles soumissions
      approved: stats.find(s => s.validate === ProductValidation.Approve)?._count.id || 0,
      rejected: stats.find(s => s.validate === ProductValidation.Refused)?._count.id || 0,
      recheckRequest: totalRecheckRequest + recentlyModifiedCount, // Révisions + modifications récentes
      modificationPending: modificationPendingCount,
      drafts: draftsCount,
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
