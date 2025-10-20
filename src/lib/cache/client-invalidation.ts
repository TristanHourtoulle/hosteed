'use client'

import { queryClient, CACHE_TAGS } from './query-client'

/**
 * Invalidation côté client pour React Query
 * À utiliser après des mutations côté client
 */

export const invalidateClientCache = {
  products: async (productId?: string) => {
    await Promise.all(
      [
        queryClient.invalidateQueries({ queryKey: CACHE_TAGS.products }),
        productId && queryClient.invalidateQueries({ queryKey: CACHE_TAGS.product(productId) }),
      ].filter(Boolean)
    )
  },

  staticData: async (type?: 'equipments' | 'meals' | 'services' | 'security' | 'typeRent') => {
    if (type && type !== 'typeRent') {
      await queryClient.invalidateQueries({
        queryKey: CACHE_TAGS.staticData[type as keyof typeof CACHE_TAGS.staticData],
      })
    } else if (type === 'typeRent') {
      await queryClient.invalidateQueries({ queryKey: CACHE_TAGS.staticData.typeRent })
    } else {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CACHE_TAGS.staticData.equipments }),
        queryClient.invalidateQueries({ queryKey: CACHE_TAGS.staticData.meals }),
        queryClient.invalidateQueries({ queryKey: CACHE_TAGS.staticData.services }),
        queryClient.invalidateQueries({ queryKey: CACHE_TAGS.staticData.security }),
        queryClient.invalidateQueries({ queryKey: CACHE_TAGS.staticData.typeRent }),
      ])
    }
  },

  user: async (userId: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: CACHE_TAGS.user(userId) }),
      queryClient.invalidateQueries({ queryKey: CACHE_TAGS.userStats(userId) }),
    ])
  },

  favorites: async (userId: string, productId?: string) => {
    await Promise.all(
      [
        queryClient.invalidateQueries({ queryKey: CACHE_TAGS.favorites(userId) }),
        productId &&
          queryClient.invalidateQueries({
            queryKey: CACHE_TAGS.favoriteStatus(userId, productId),
          }),
      ].filter(Boolean)
    )
  },

  reservations: async (userId: string, rentId?: string) => {
    await Promise.all(
      [
        queryClient.invalidateQueries({ queryKey: CACHE_TAGS.reservations(userId) }),
        rentId && queryClient.invalidateQueries({ queryKey: CACHE_TAGS.reservation(rentId) }),
        queryClient.invalidateQueries({ queryKey: ['rent-statistics', userId] }),
      ].filter(Boolean)
    )
  },

  reviews: async (productId: string) => {
    await queryClient.invalidateQueries({ queryKey: CACHE_TAGS.reviews(productId) })
  },

  validation: async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: CACHE_TAGS.validationStats }),
      queryClient.invalidateQueries({ queryKey: CACHE_TAGS.productsValidation }),
    ])
  },

  // Invalidation globale en cas de doute
  all: async () => {
    await queryClient.invalidateQueries()
  },

  // Pour forcer un refresh immédiat d'une query
  refetch: async (queryKey: unknown[]) => {
    await queryClient.refetchQueries({ queryKey })
  },

  // Pour remove une query du cache
  remove: async (queryKey: unknown[]) => {
    queryClient.removeQueries({ queryKey })
  },
}
