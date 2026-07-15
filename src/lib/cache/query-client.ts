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
  favoriteStatus: (userId: string, productId: string) =>
    ['favorite-status', userId, productId] as const,
  reservations: (userId: string) => ['reservations', userId] as const,
  reservation: (id: string) => ['reservation', id] as const,
  availability: (productId: string, arrival: string, leaving: string) =>
    ['availability', productId, arrival, leaving] as const,
  reviews: (productId: string) => ['reviews', productId] as const,
  userRatings: (userId: string) => ['user-ratings', userId] as const,
  userStats: (userId: string) => ['user-stats', userId] as const,
  validationStats: ['validation-stats'] as const,
  hostProducts: (page: number, limit: number) => ['host-products', page, limit] as const,
  rentStatistics: (userId: string | undefined) => ['rent-statistics', userId] as const,
  productsSearch: (params: unknown) => ['products-search', params] as const,
  roomTypeAvailability: (productId: string, arrival: string, leaving: string) =>
    ['room-type-availability', productId, arrival, leaving] as const,
  bookingPricing: (
    productId: string,
    startDate: string | undefined,
    endDate: string | undefined,
    guestCount: number,
    extrasCost: number,
    ownerId: string | undefined
  ) =>
    ['booking-pricing', productId, startDate, endDate, guestCount, extrasCost, ownerId] as const,
  hotelPricing: (
    productId: string,
    encodedSelection: string,
    arrival: string,
    leaving: string,
    guestCount: number
  ) =>
    ['hotel-booking-pricing', productId, encodedSelection, arrival, leaving, guestCount] as const,
  bulkFavorites: (userId: string | undefined, productIds: string[]) =>
    ['bulk-favorites', userId, ...productIds] as const,

  // --- Page-migration query keys (TRI-1017 foundation) ---
  // Host dashboard datasets
  hostPromotions: (hostId: string) => ['host', 'promotions', hostId] as const,
  hostProductsList: () => ['host', 'products', 'list'] as const,
  hostReservations: (hostId: string) => ['host', 'reservations', hostId] as const,
  hostUnavailability: (productId?: string) =>
    ['host', 'unavailability', productId ?? 'all'] as const,

  // Shared promotions endpoint (/api/promotions)
  promotions: () => ['promotions'] as const,

  // Admin dashboard datasets
  adminProducts: (params?: unknown) => ['admin', 'products', params ?? null] as const,
  adminCommissions: () => ['admin', 'commissions'] as const,
  adminCommissionSettings: () => ['admin', 'commission-settings'] as const,
  adminHomepage: () => ['admin', 'homepage'] as const,
  adminUserRatings: () => ['admin', 'user-ratings'] as const,
  adminTypeRent: (id: string) => ['admin', 'typeRent', id] as const,
  adminTypeRentProducts: (id: string) => ['admin', 'typeRent', id, 'products'] as const,
  adminBlog: () => ['admin', 'blog'] as const,
  adminBlogPost: (id: string) => ['admin', 'blog', id] as const,
  adminUsers: () => ['admin', 'users'] as const,
  adminUser: (id: string) => ['admin', 'users', id] as const,
  adminUnverifiedUsers: () => ['admin', 'users', 'unverified'] as const,
  adminPromotions: () => ['admin', 'promotions'] as const,
  adminIncludedServices: () => ['admin', 'included-services'] as const,
  adminWithdrawals: () => ['admin', 'withdrawals'] as const,
  adminHosts: () => ['admin', 'hosts'] as const,
  adminHostBalance: (hostId: string) =>
    ['admin', 'withdrawals', 'balance', hostId] as const,
  adminHighlights: () => ['admin', 'highlights'] as const,
  adminExtras: () => ['admin', 'extras'] as const,
  adminReviews: () => ['admin', 'reviews'] as const,

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
  await Promise.all(tags.map(tag => queryClient.invalidateQueries({ queryKey: tag })))
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
