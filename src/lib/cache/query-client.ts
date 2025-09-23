import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export const CACHE_TAGS = {
  user: (id: string) => ['user', id] as const,
  users: ['users'] as const,
  product: (id: string) => ['product', id] as const,
  products: ['products'] as const,
  productValidation: (id: string) => ['product-validation', id] as const,
  productsValidation: ['products-validation'] as const,
  favorites: (userId: string) => ['favorites', userId] as const,
  favoriteStatus: (userId: string, productId: string) => ['favorite-status', userId, productId] as const,
  reservations: (userId: string) => ['reservations', userId] as const,
  reservation: (id: string) => ['reservation', id] as const,
  reviews: (productId: string) => ['reviews', productId] as const,
  userRatings: (userId: string) => ['user-ratings', userId] as const,
  userStats: (userId: string) => ['user-stats', userId] as const,
  validationStats: ['validation-stats'] as const,
  staticData: {
    equipments: ['static', 'equipments'] as const,
    meals: ['static', 'meals'] as const,
    services: ['static', 'services'] as const,
    security: ['static', 'security'] as const,
    typeRent: ['static', 'typeRent'] as const,
    all: ['static'] as const,
  },
} as const

export const invalidateCacheTags = async (tags: readonly unknown[][]) => {
  await Promise.all(
    tags.map(tag => queryClient.invalidateQueries({ queryKey: tag }))
  )
}

export const prefetchQuery = async <T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  staleTime?: number
) => {
  await queryClient.prefetchQuery({
    queryKey,
    queryFn,
    staleTime: staleTime ?? 1000 * 60 * 30, // 30 minutes by default for prefetch
  })
}