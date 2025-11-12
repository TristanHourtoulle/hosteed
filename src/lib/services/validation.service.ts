'use server'

import prisma from '@/lib/prisma'
import {
  ValidationSection,
  ValidationCommentStatus,
  ProductValidation,
  ValidationComment,
} from '@prisma/client'
import { sendTemplatedMail } from '@/lib/services/sendTemplatedMail'

// Interface pour créer un commentaire de validation
export interface CreateValidationCommentInput {
  productId: string
  adminId: string
  section: ValidationSection
  comment: string
}

// Interface pour l'historique de validation
export interface CreateValidationHistoryInput {
  productId: string
  previousStatus: ProductValidation
  newStatus: ProductValidation
  adminId?: string
  hostId?: string
  reason?: string
  changes?: object
}

// Créer un commentaire de validation
export async function createValidationComment(data: CreateValidationCommentInput) {
  try {
    const comment = await prisma.validationComment.create({
      data: {
        productId: data.productId,
        adminId: data.adminId,
        section: data.section,
        comment: data.comment,
        status: ValidationCommentStatus.PENDING,
      },
      include: {
        admin: {
          select: {
            name: true,
            email: true,
          },
        },
        product: {
          include: {
            owner: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    return comment
  } catch (error) {
    console.error('Erreur lors de la création du commentaire de validation:', error)
    return null
  }
}

// Obtenir tous les commentaires d'un produit
export async function getValidationCommentsByProduct(productId: string) {
  try {
    const comments = await prisma.validationComment.findMany({
      where: {
        productId,
      },
      include: {
        admin: {
          select: {
            name: true,
            email: true,
          },
        },
        resolver: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return comments
  } catch (error) {
    console.error('Erreur lors de la récupération des commentaires:', error)
    return null
  }
}

// Marquer un commentaire comme résolu
export async function resolveValidationComment(commentId: string, resolvedBy: string) {
  try {
    const comment = await prisma.validationComment.update({
      where: {
        id: commentId,
      },
      data: {
        status: ValidationCommentStatus.RESOLVED,
        resolvedAt: new Date(),
        resolvedBy,
      },
      include: {
        admin: {
          select: {
            name: true,
            email: true,
          },
        },
        product: {
          include: {
            owner: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    return comment
  } catch (error) {
    console.error('Erreur lors de la résolution du commentaire:', error)
    return null
  }
}

// Créer un historique de validation
export async function createValidationHistory(data: CreateValidationHistoryInput) {
  try {
    const history = await prisma.validationHistory.create({
      data: {
        productId: data.productId,
        previousStatus: data.previousStatus,
        newStatus: data.newStatus,
        adminId: data.adminId,
        hostId: data.hostId,
        reason: data.reason,
        changes: data.changes,
      },
      include: {
        admin: {
          select: {
            name: true,
            email: true,
          },
        },
        host: {
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
    })

    return history
  } catch (error) {
    console.error("Erreur lors de la création de l'historique de validation:", error)
    return null
  }
}

// Obtenir l'historique de validation d'un produit
export async function getValidationHistoryByProduct(productId: string) {
  try {
    const history = await prisma.validationHistory.findMany({
      where: {
        productId,
      },
      include: {
        admin: {
          select: {
            name: true,
            email: true,
          },
        },
        host: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return history
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique:", error)
    return null
  }
}

// Envoyer un email de notification avec les commentaires de validation
export async function sendValidationCommentsEmail(
  productId: string,
  hostEmail: string,
  hostName: string,
  productName: string
) {
  try {
    const comments = await getValidationCommentsByProduct(productId)

    if (!comments || comments.length === 0) {
      return false
    }

    const pendingComments = comments.filter(c => c.status === ValidationCommentStatus.PENDING)

    if (pendingComments.length === 0) {
      return false
    }

    await sendTemplatedMail(
      hostEmail,
      `Modifications requises pour votre annonce "${productName}"`,
      'annonce-rejected.html',
      {
        productName,
        rejectionReason:
          comments?.map((c: ValidationComment) => c.comment).join('\n') ||
          'Aucun commentaire spécifié',
        productId,
      }
    )

    return true
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de validation:", error)
    return false
  }
}

// Obtenir les produits avec leurs commentaires en attente
export async function getProductsWithPendingComments() {
  try {
    const products = await prisma.product.findMany({
      where: {
        validate: {
          in: [ProductValidation.NotVerified, ProductValidation.RecheckRequest],
        },
      },
      include: {
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
        img: true,
        type: true,
        validationComments: {
          where: {
            status: ValidationCommentStatus.PENDING,
          },
          include: {
            admin: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        validationHistory: {
          include: {
            admin: {
              select: {
                name: true,
                email: true,
              },
            },
            host: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5, // Dernières 5 entrées d'historique
        },
      },
      orderBy: {
        id: 'desc',
      },
    })

    return products
  } catch (error) {
    console.error('Erreur lors de la récupération des produits avec commentaires:', error)
    return null
  }
}
