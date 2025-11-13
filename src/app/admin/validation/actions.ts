'use server'

import { revalidatePath } from 'next/cache'
import { validationService } from '@/lib/services/validation-simple.service'
import {
  deleteRejectedProduct,
  deleteMultipleRejectedProducts,
} from '@/lib/services/product.service'
import prisma from '@/lib/prisma'

export async function getProductsForValidation() {
  try {
    const result = await validationService.getProductsForValidationPaginated({
      page: 1,
      limit: 20, // ✅ Réduit de 100 à 20 produits
      includeLightweight: true, // ✅ Mode léger = 1 image seulement
    })
    return { success: true, data: result.products }
  } catch (error) {
    console.error('Error fetching products for validation:', error)
    return { success: false, error: 'Impossible de charger les produits' }
  }
}

export async function getValidationStats() {
  try {
    const stats = await validationService.getValidationStats()
    const total =
      stats.pending +
      stats.approved +
      stats.rejected +
      stats.recheckRequest +
      stats.modificationPending +
      stats.drafts
    return { success: true, data: { ...stats, total } }
  } catch (error) {
    console.error('Error fetching validation stats:', error)
    return { success: false, error: 'Impossible de charger les statistiques' }
  }
}

export async function getProductForValidation(productId: string) {
  try {
    const productIncludeConfig = {
      owner: {
        select: {
          id: true,
          name: true,
          lastname: true,
          email: true,
          image: true,
          profilePicture: true,
          profilePictureBase64: true,
        },
      },
      img: {
        select: {
          img: true,
        },
      },
      type: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
      equipments: {
        select: {
          id: true,
          name: true,
          icon: true,
        },
      },
      mealsList: {
        select: {
          id: true,
          name: true,
        },
      },
      servicesList: {
        select: {
          id: true,
          name: true,
        },
      },
      securities: {
        select: {
          id: true,
          name: true,
        },
      },
      typeRoom: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
      rules: {
        select: {
          id: true,
          smokingAllowed: true,
          petsAllowed: true,
          eventsAllowed: true,
          checkInTime: true,
          checkOutTime: true,
          selfCheckIn: true,
          selfCheckInType: true,
        },
      },
      nearbyPlaces: {
        select: {
          id: true,
          name: true,
          distance: true,
          duration: true,
          transport: true,
        },
      },
      transportOptions: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
      propertyInfo: {
        select: {
          id: true,
          hasStairs: true,
          hasElevator: true,
          hasHandicapAccess: true,
          hasPetsOnProperty: true,
          additionalNotes: true,
        },
      },
      hotel: {
        select: {
          id: true,
          name: true,
          userId: true,
        },
      },
      includedServices: {
        select: {
          id: true,
          name: true,
          description: true,
          icon: true,
        },
      },
      extras: {
        select: {
          id: true,
          name: true,
          description: true,
          priceEUR: true,
          priceMGA: true,
          type: true,
        },
      },
      highlights: {
        select: {
          id: true,
          name: true,
          description: true,
          icon: true,
        },
      },
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: productIncludeConfig,
    })

    if (!product) {
      return { success: false, error: 'Produit non trouvé' }
    }

    // If this is a draft product, also fetch the original for comparison
    let originalProduct = null
    if (product.isDraft && product.originalProductId) {
      originalProduct = await prisma.product.findUnique({
        where: { id: product.originalProductId },
        include: productIncludeConfig,
      })
    }

    return {
      success: true,
      data: {
        ...product,
        originalProduct: originalProduct,
      },
    }
  } catch (error) {
    console.error('Error fetching product for validation:', error)
    return { success: false, error: 'Impossible de charger le produit' }
  }
}

export async function approveProduct(productId: string, adminId: string, reason?: string) {
  try {
    await validationService.approveProduct(productId, adminId, reason)

    // Force la revalidation des pages
    revalidatePath('/admin/validation', 'page')
    revalidatePath(`/admin/validation/${productId}`, 'page')
    revalidatePath('/admin', 'page')

    return { success: true }
  } catch (error) {
    console.error('Error approving product:', error)
    return { success: false, error: 'Erreur lors de la validation du produit' }
  }
}

export async function rejectProduct(productId: string, adminId: string, reason: string) {
  try {
    await validationService.rejectProduct(productId, adminId, reason)

    // Force la revalidation des pages
    revalidatePath('/admin/validation', 'page')
    revalidatePath(`/admin/validation/${productId}`, 'page')
    revalidatePath('/admin', 'page')

    return { success: true }
  } catch (error) {
    console.error('Error rejecting product:', error)
    return { success: false, error: 'Erreur lors du refus du produit' }
  }
}

export async function requestRecheck(productId: string, adminId: string, reason: string) {
  try {
    await validationService.requestRecheck(productId, adminId, reason)

    // Force la revalidation des pages
    revalidatePath('/admin/validation', 'page')
    revalidatePath(`/admin/validation/${productId}`, 'page')
    revalidatePath('/admin', 'page')

    return { success: true }
  } catch (error) {
    console.error('Error requesting recheck:', error)
    return { success: false, error: 'Erreur lors de la demande de révision' }
  }
}

export async function getValidationHistory(productId: string) {
  try {
    const history = await validationService.getValidationHistory(productId)
    return { success: true, data: history }
  } catch (error) {
    console.error('Error fetching validation history:', error)
    return { success: false, error: "Impossible de charger l'historique" }
  }
}

export async function getValidationComments(productId: string) {
  try {
    const comments = await validationService.getValidationComments(productId)
    return { success: true, data: comments }
  } catch (error) {
    console.error('Error fetching validation comments:', error)
    return { success: false, error: 'Impossible de charger les commentaires' }
  }
}

export async function deleteSingleRejectedProduct(productId: string) {
  try {
    await deleteRejectedProduct(productId)

    // Force la revalidation des pages
    revalidatePath('/admin/validation', 'page')
    revalidatePath('/admin', 'page')

    return { success: true }
  } catch (error) {
    console.error('Error deleting rejected product:', error)
    return { success: false, error: 'Erreur lors de la suppression du produit rejeté' }
  }
}

export async function deleteBulkRejectedProducts(productIds: string[]) {
  try {
    await deleteMultipleRejectedProducts(productIds)

    // Force la revalidation des pages
    revalidatePath('/admin/validation', 'page')
    revalidatePath('/admin', 'page')

    return { success: true }
  } catch (error) {
    console.error('Error deleting rejected products:', error)
    return { success: false, error: 'Erreur lors de la suppression des produits rejetés' }
  }
}
