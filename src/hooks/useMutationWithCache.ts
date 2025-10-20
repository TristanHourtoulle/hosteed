import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { invalidateClientCache } from '@/lib/cache/client-invalidation'
import { toast } from 'sonner'

type MutationConfig = {
  invalidate?: {
    products?: boolean | string
    staticData?: boolean | 'equipments' | 'meals' | 'services' | 'security' | 'typeRent'
    user?: string
    favorites?: { userId: string; productId?: string }
    reservations?: { userId: string; rentId?: string }
    reviews?: string
    validation?: boolean
  }
  successMessage?: string
  errorMessage?: string
}

/**
 * Hook pour les mutations avec invalidation automatique du cache
 */
export function useMutationWithCache<TData, TError, TVariables, TContext>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  config: MutationConfig,
  options?: UseMutationOptions<TData, TError, TVariables, TContext>
) {
  return useMutation({
    mutationFn,
    onSuccess: async (data, variables, context) => {
      // Invalidation automatique du cache
      if (config.invalidate) {
        await Promise.all(
          [
            config.invalidate.products &&
              invalidateClientCache.products(
                typeof config.invalidate.products === 'string'
                  ? config.invalidate.products
                  : undefined
              ),
            config.invalidate.staticData &&
              invalidateClientCache.staticData(
                typeof config.invalidate.staticData === 'string'
                  ? config.invalidate.staticData
                  : undefined
              ),
            config.invalidate.user && invalidateClientCache.user(config.invalidate.user),
            config.invalidate.favorites &&
              invalidateClientCache.favorites(
                config.invalidate.favorites.userId,
                config.invalidate.favorites.productId
              ),
            config.invalidate.reservations &&
              invalidateClientCache.reservations(
                config.invalidate.reservations.userId,
                config.invalidate.reservations.rentId
              ),
            config.invalidate.reviews && invalidateClientCache.reviews(config.invalidate.reviews),
            config.invalidate.validation && invalidateClientCache.validation(),
          ].filter(Boolean)
        )
      }

      // Message de succès
      if (config.successMessage) {
        toast.success(config.successMessage)
      }

      // Callback utilisateur
      options?.onSuccess?.(data, variables, context)
    },
    onError: (error, variables, context) => {
      // Message d'erreur
      if (config.errorMessage) {
        toast.error(config.errorMessage)
      }

      // Callback utilisateur
      options?.onError?.(error, variables, context)
    },
    ...options,
  })
}

// Helpers pour des cas d'usage courants
export const useProductMutation = <TData, TError, TVariables, TContext>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  productId?: string,
  options?: UseMutationOptions<TData, TError, TVariables, TContext>
) => {
  return useMutationWithCache(
    mutationFn,
    {
      invalidate: {
        products: productId || true,
      },
    },
    options
  )
}

export const useStaticDataMutation = <TData, TError, TVariables, TContext>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  dataType: 'equipments' | 'meals' | 'services' | 'security' | 'typeRent',
  options?: UseMutationOptions<TData, TError, TVariables, TContext>
) => {
  return useMutationWithCache(
    mutationFn,
    {
      invalidate: {
        staticData: dataType,
      },
    },
    options
  )
}

export const useUserMutation = <TData, TError, TVariables, TContext>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  userId: string,
  options?: UseMutationOptions<TData, TError, TVariables, TContext>
) => {
  return useMutationWithCache(
    mutationFn,
    {
      invalidate: {
        user: userId,
      },
    },
    options
  )
}
