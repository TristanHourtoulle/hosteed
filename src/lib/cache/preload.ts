import { queryClient, prefetchQuery, CACHE_TAGS } from './query-client'
import { findAllProducts } from '@/lib/services/product.service'
import { findAllEquipments } from '@/lib/services/equipments.service'
import { findAllMeals } from '@/lib/services/meals.service'
import { findAllServices } from '@/lib/services/services.service'
import { findAllSecurity } from '@/lib/services/security.services'
import { findAllTypeRent } from '@/lib/services/typeRent.service'

// Preload static data that rarely changes
export async function preloadStaticData() {
  try {
    await Promise.all([
      prefetchQuery(
        CACHE_TAGS.staticData.equipments,
        findAllEquipments,
        1000 * 60 * 60 * 24 // 24 hours
      ),
      prefetchQuery(
        CACHE_TAGS.staticData.meals,
        findAllMeals,
        1000 * 60 * 60 * 24
      ),
      prefetchQuery(
        CACHE_TAGS.staticData.services,
        findAllServices,
        1000 * 60 * 60 * 24
      ),
      prefetchQuery(
        CACHE_TAGS.staticData.security,
        findAllSecurity,
        1000 * 60 * 60 * 24
      ),
      prefetchQuery(
        ['typeRent'],
        findAllTypeRent,
        1000 * 60 * 60 * 24
      ),
    ])
    
    console.log('Static data preloaded successfully')
  } catch (error) {
    console.error('Error preloading static data:', error)
  }
}

// Preload products with shorter cache time
export async function preloadProducts() {
  try {
    await prefetchQuery(
      CACHE_TAGS.products,
      findAllProducts,
      1000 * 60 * 5 // 5 minutes
    )
    
    console.log('Products preloaded successfully')
  } catch (error) {
    console.error('Error preloading products:', error)
  }
}

// Call this function in your app initialization
export async function initializeCache() {
  await Promise.all([
    preloadStaticData(),
    preloadProducts(),
  ])
}