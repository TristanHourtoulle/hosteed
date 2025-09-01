import { revalidateTag, revalidatePath } from 'next/cache'

/**
 * Invalidation centralisée du cache
 * Appelée après chaque mutation de données
 */

export async function invalidateProductCache(productId?: string) {
  // Invalider le cache serveur Next.js
  revalidateTag('products')
  if (productId) {
    revalidateTag(`product-${productId}`)
  }
  
  // Invalider les pages concernées
  revalidatePath('/search')
  revalidatePath('/search-optimized')
  revalidatePath('/')
  if (productId) {
    revalidatePath(`/host/${productId}`)
  }
}

export async function invalidateStaticDataCache(type: 'equipments' | 'meals' | 'services' | 'security' | 'typeRent') {
  // Invalider le cache serveur pour les données statiques
  revalidateTag('static-data')
  revalidateTag(type)
  
  // Invalider les pages qui utilisent ces données
  revalidatePath('/search')
  revalidatePath('/search-optimized')
  revalidatePath('/createProduct')
}

export async function invalidateUserCache(userId: string) {
  revalidateTag('user-data')
  revalidateTag(`user-${userId}`)
  revalidatePath('/account')
}

export async function invalidateReservationCache(userId: string, rentId?: string) {
  revalidateTag(`reservations-${userId}`)
  if (rentId) {
    revalidateTag(`reservation-${rentId}`)
  }
  revalidatePath('/reservations')
}

export async function invalidateFavoriteCache(userId: string, productId?: string) {
  revalidateTag(`favorites-${userId}`)
  if (productId) {
    revalidateTag(`favorite-${userId}-${productId}`)
  }
  revalidatePath('/favorites')
}

export async function invalidateValidationCache() {
  revalidateTag('validation-stats')
  revalidateTag('validation-products')
  revalidatePath('/admin/validation')
}