import { dehydrate } from '@tanstack/react-query'
import { queryClient, CACHE_TAGS } from './query-client'

// Prefetch data on the server for better initial load
export async function prefetchPageData(prefetchFns: Array<() => Promise<void>>) {
  await Promise.all(prefetchFns.map(fn => fn()))
  return dehydrate(queryClient)
}

// Helper for product pages
export async function prefetchProductPage(productId: string) {
  const { findProductById } = await import('@/lib/services/product.service')

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['product', productId],
      queryFn: () => findProductById(productId),
      staleTime: 1000 * 60 * 5,
    }),
  ])

  return dehydrate(queryClient)
}

// Helper for search pages
export async function prefetchSearchPage() {
  const { findAllProducts } = await import('@/lib/services/product.service')
  const { findAllEquipments } = await import('@/lib/services/equipments.service')
  const { findAllMeals } = await import('@/lib/services/meals.service')
  const { findAllServicesForQuery } = await import('@/lib/services/services.service')
  const { findAllSecurity } = await import('@/lib/services/security.services')
  const { findAllTypeRent } = await import('@/lib/services/typeRent.service')

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['products'],
      queryFn: findAllProducts,
      staleTime: 1000 * 60 * 5,
    }),
    queryClient.prefetchQuery({
      queryKey: CACHE_TAGS.staticData.equipments,
      queryFn: findAllEquipments,
      staleTime: 1000 * 60 * 60 * 24,
    }),
    queryClient.prefetchQuery({
      queryKey: CACHE_TAGS.staticData.meals,
      queryFn: findAllMeals,
      staleTime: 1000 * 60 * 60 * 24,
    }),
    queryClient.prefetchQuery({
      queryKey: CACHE_TAGS.staticData.services,
      queryFn: findAllServicesForQuery,
      staleTime: 1000 * 60 * 60 * 24,
    }),
    queryClient.prefetchQuery({
      queryKey: CACHE_TAGS.staticData.security,
      queryFn: findAllSecurity,
      staleTime: 1000 * 60 * 60 * 24,
    }),
    queryClient.prefetchQuery({
      queryKey: CACHE_TAGS.staticData.typeRent,
      queryFn: findAllTypeRent,
      staleTime: 1000 * 60 * 60 * 24,
    }),
  ])

  return dehydrate(queryClient)
}
