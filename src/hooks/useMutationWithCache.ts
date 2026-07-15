import { useMutation, UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import { queryClient } from '@/lib/cache/query-client'
import { invalidateClientCache } from '@/lib/cache/client-invalidation'
import { toast } from 'sonner'

type QueryKey = readonly unknown[]

/**
 * Optional optimistic-update configuration.
 * `onMutate` runs before the mutation and returns a context snapshot used by
 * `rollback` to restore state if the mutation fails.
 */
interface OptimisticConfig<TVars, TContext> {
  onMutate: (variables: TVars) => TContext | Promise<TContext>
  rollback?: (context: TContext | undefined, variables: TVars, error: unknown) => void
}

export interface UseMutationWithCacheOptions<TData, TVars, TContext = unknown> {
  /** The async mutation to run. */
  mutationFn: (variables: TVars) => Promise<TData>
  /**
   * Query keys to invalidate on success via the shared QueryClient. Either a
   * static array of keys or a factory computed from the mutation result and
   * variables (useful when the invalidated id only exists after the mutation).
   */
  invalidateKeys?: QueryKey[] | ((data: TData, variables: TVars) => QueryKey[])
  /** Runs after invalidation on success. */
  onSuccess?: (data: TData, variables: TVars) => void | Promise<void>
  /** Runs on failure, after any optimistic rollback. */
  onError?: (error: unknown, variables: TVars, context: TContext | undefined) => void
  /** Optional optimistic update + rollback. */
  optimistic?: OptimisticConfig<TVars, TContext>
  /** Toast shown on success. */
  successMessage?: string
  /** Toast shown on failure. */
  errorMessage?: string
}

/**
 * Generic mutation hook that invalidates the given React Query keys on success.
 *
 * Model for migrating pages off `useState` + raw `fetch`: pass the mutation and
 * the `CACHE_TAGS.*(...)` keys it affects, and the shared cache stays coherent
 * without each caller touching the invalidation layer.
 */
export function useMutationWithCache<TData = unknown, TVars = void, TContext = unknown>(
  options: UseMutationWithCacheOptions<TData, TVars, TContext>
): UseMutationResult<TData, unknown, TVars, TContext> {
  const {
    mutationFn,
    invalidateKeys,
    onSuccess,
    onError,
    optimistic,
    successMessage,
    errorMessage,
  } = options

  return useMutation<TData, unknown, TVars, TContext>({
    mutationFn,
    onMutate: optimistic ? variables => optimistic.onMutate(variables) : undefined,
    onSuccess: async (data, variables) => {
      const keys =
        typeof invalidateKeys === 'function' ? invalidateKeys(data, variables) : invalidateKeys

      if (keys && keys.length > 0) {
        await Promise.all(keys.map(queryKey => queryClient.invalidateQueries({ queryKey })))
      }

      if (successMessage) {
        toast.success(successMessage)
      }

      if (onSuccess) {
        await onSuccess(data, variables)
      }
    },
    onError: (error, variables, context) => {
      if (optimistic?.rollback) {
        optimistic.rollback(context, variables, error)
      }

      if (errorMessage) {
        toast.error(errorMessage)
      }

      if (onError) {
        onError(error, variables, context)
      }
    },
  })
}

/* -------------------------------------------------------------------------- */
/* Domain-scoped mutation helper (invalidates via invalidateClientCache).     */
/* -------------------------------------------------------------------------- */

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
 * Domain-scoped mutation hook: invalidates predefined cache families through
 * `invalidateClientCache`. Backs the static-data / product / user helpers
 * below; new page migrations should prefer `useMutationWithCache`.
 */
export function useDomainMutationWithCache<TData, TError, TVariables, TContext = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  config: MutationConfig,
  options?: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'>
) {
  const originalOnSuccess = options?.onSuccess
  const originalOnError = options?.onError

  return useMutation({
    ...options,
    mutationFn,
    onSuccess: async (...args) => {
      // Automatic cache invalidation.
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

      if (config.successMessage) {
        toast.success(config.successMessage)
      }

      if (originalOnSuccess) {
        await originalOnSuccess(...args)
      }
    },
    onError: (...args) => {
      if (config.errorMessage) {
        toast.error(config.errorMessage)
      }

      if (originalOnError) {
        originalOnError(...args)
      }
    },
  })
}

// Helpers for common domain use cases.
export const useProductMutation = <TData, TError, TVariables, TContext = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  productId?: string,
  options?: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'>
) => {
  return useDomainMutationWithCache(
    mutationFn,
    {
      invalidate: {
        products: productId || true,
      },
    },
    options
  )
}

export const useStaticDataMutation = <TData, TError, TVariables, TContext = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  dataType: 'equipments' | 'meals' | 'services' | 'security' | 'typeRent',
  options?: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'>
) => {
  return useDomainMutationWithCache(
    mutationFn,
    {
      invalidate: {
        staticData: dataType,
      },
    },
    options
  )
}

export const useUserMutation = <TData, TError, TVariables, TContext = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  userId: string,
  options?: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'>
) => {
  return useDomainMutationWithCache(
    mutationFn,
    {
      invalidate: {
        user: userId,
      },
    },
    options
  )
}
