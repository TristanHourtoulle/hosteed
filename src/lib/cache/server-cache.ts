import { unstable_cache } from 'next/cache'
import { cache } from 'react'

// Server-side cache wrapper for expensive operations
export const cachedFindAllProducts = unstable_cache(
  async () => {
    const { findAllProducts } = await import('@/lib/services/product.service')
    return findAllProducts()
  },
  ['all-products'],
  {
    revalidate: 60 * 5, // 5 minutes
    tags: ['products'],
  }
)

export const cachedFindProductById = unstable_cache(
  async (id: string) => {
    const { findProductById } = await import('@/lib/services/product.service')
    return findProductById(id)
  },
  ['product-by-id'],
  {
    revalidate: 60 * 5, // 5 minutes
    tags: ['products'],
  }
)

export const cachedGetUserData = unstable_cache(
  async () => {
    const { getUserData } = await import('@/app/account/actions')
    return getUserData()
  },
  ['user-data'],
  {
    revalidate: 60 * 10, // 10 minutes
    tags: ['user-data'],
  }
)

// Static data with very long cache times
export const cachedStaticData = {
  equipments: unstable_cache(
    async () => {
      const { findAllEquipments } = await import('@/lib/services/equipments.service')
      return findAllEquipments()
    },
    ['static-equipments'],
    {
      revalidate: 60 * 60 * 24, // 24 hours
      tags: ['static-data', 'equipments'],
    }
  ),
  
  meals: unstable_cache(
    async () => {
      const { findAllMeals } = await import('@/lib/services/meals.service')
      return findAllMeals()
    },
    ['static-meals'],
    {
      revalidate: 60 * 60 * 24, // 24 hours
      tags: ['static-data', 'meals'],
    }
  ),
  
  services: unstable_cache(
    async () => {
      const { findAllServices } = await import('@/lib/services/services.service')
      return findAllServices()
    },
    ['static-services'],
    {
      revalidate: 60 * 60 * 24, // 24 hours
      tags: ['static-data', 'services'],
    }
  ),
  
  security: unstable_cache(
    async () => {
      const { findAllSecurity } = await import('@/lib/services/security.services')
      return findAllSecurity()
    },
    ['static-security'],
    {
      revalidate: 60 * 60 * 24, // 24 hours
      tags: ['static-data', 'security'],
    }
  ),
  
  typeRent: unstable_cache(
    async () => {
      const { findAllTypeRent } = await import('@/lib/services/typeRent.service')
      return findAllTypeRent()
    },
    ['static-type-rent'],
    {
      revalidate: 60 * 60 * 24, // 24 hours
      tags: ['static-data', 'type-rent'],
    }
  ),
}

// React cache for request-level memoization
export const getCachedSession = cache(async () => {
  const { auth } = await import('@/lib/auth')
  return auth()
})

// Validation statistics with moderate cache time
export const cachedValidationStats = unstable_cache(
  async () => {
    const { getValidationStats } = await import('@/app/admin/validation/actions')
    return getValidationStats()
  },
  ['validation-stats'],
  {
    revalidate: 60 * 2, // 2 minutes
    tags: ['validation-stats'],
  }
)

// Products for validation with short cache time
export const cachedProductsForValidation = unstable_cache(
  async () => {
    const { getProductsForValidation } = await import('@/app/admin/validation/actions')
    return getProductsForValidation()
  },
  ['products-for-validation'],
  {
    revalidate: 60, // 1 minute
    tags: ['validation-products'],
  }
)