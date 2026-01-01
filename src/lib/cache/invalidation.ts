import { revalidateTag, revalidatePath } from 'next/cache'

/**
 * Invalidation centralisée du cache
 * Appelée après chaque mutation de données
 */

export async function invalidateProductCache(productId?: string) {
  // Invalider le cache serveur Next.js (Next.js 16 requires cacheLife profile)
  revalidateTag('products', 'max')
  if (productId) {
    revalidateTag(`product-${productId}`, 'max')
  }

  // Invalider les pages concernées
  revalidatePath('/search')
  revalidatePath('/search-optimized')
  revalidatePath('/')
  if (productId) {
    revalidatePath(`/host/${productId}`)
  }
}

export async function invalidateStaticDataCache(
  type: 'equipments' | 'meals' | 'services' | 'security' | 'typeRent'
) {
  // Invalider le cache serveur pour les données statiques
  revalidateTag('static-data', 'max')
  revalidateTag(type, 'max')

  // Invalider les pages qui utilisent ces données
  revalidatePath('/search')
  revalidatePath('/search-optimized')
  revalidatePath('/createProduct')
}

export async function invalidateUserCache(userId: string) {
  revalidateTag('user-data', 'max')
  revalidateTag(`user-${userId}`, 'max')
  revalidatePath('/account')
}

export async function invalidateReservationCache(userId: string, rentId?: string) {
  revalidateTag(`reservations-${userId}`, 'max')
  if (rentId) {
    revalidateTag(`reservation-${rentId}`, 'max')
  }
  revalidatePath('/reservations')
}

export async function invalidateFavoriteCache(userId: string, productId?: string) {
  revalidateTag(`favorites-${userId}`, 'max')
  if (productId) {
    revalidateTag(`favorite-${userId}-${productId}`, 'max')
  }
  revalidatePath('/favorites')
}

export async function invalidateValidationCache() {
  revalidateTag('validation-stats', 'max')
  revalidateTag('validation-products', 'max')
  revalidatePath('/admin/validation')
}
