import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { CACHE_TAGS } from '@/lib/cache/query-client'

export function useFavoritesOptimized(productId: string) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const userId = session?.user?.id

  // Check favorite status using React Query
  const { data: isFavorite = false, isLoading: isChecking } = useQuery({
    queryKey: CACHE_TAGS.favoriteStatus(userId || '', productId),
    queryFn: async () => {
      if (!userId) return false
      const response = await fetch(`/api/favorites/${productId}`)
      if (!response.ok) return false
      const data = await response.json()
      return data.isFavorite
    },
    enabled: !!userId && !!productId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })

  // Toggle favorite mutation
  const { mutate: toggleFavorite, isPending: isToggling } = useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error('Vous devez être connecté pour ajouter aux favoris')
      }

      const method = isFavorite ? 'DELETE' : 'POST'
      const response = await fetch('/api/favorites', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour des favoris')
      }

      return { success: data.success, message: data.message, newState: !isFavorite }
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: CACHE_TAGS.favoriteStatus(userId || '', productId) 
      })

      // Snapshot the previous value
      const previousFavorite = queryClient.getQueryData(
        CACHE_TAGS.favoriteStatus(userId || '', productId)
      )

      // Optimistically update to the new value
      queryClient.setQueryData(
        CACHE_TAGS.favoriteStatus(userId || '', productId),
        !isFavorite
      )

      // Return a context object with the snapshotted value
      return { previousFavorite }
    },
    onError: (err, _, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousFavorite !== undefined) {
        queryClient.setQueryData(
          CACHE_TAGS.favoriteStatus(userId || '', productId),
          context.previousFavorite
        )
      }
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la mise à jour des favoris')
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.newState ? 'Ajouté aux favoris' : 'Retiré des favoris')
        // Invalidate user's favorites list
        queryClient.invalidateQueries({ 
          queryKey: CACHE_TAGS.favorites(userId || '') 
        })
      } else if (data.message) {
        toast.info(data.message)
      }
    },
  })

  return {
    isFavorite,
    isLoading: isChecking || isToggling,
    toggleFavorite,
  }
}

// Hook to get all favorites for a user
export function useUserFavorites() {
  const { data: session } = useSession()
  const userId = session?.user?.id

  return useQuery({
    queryKey: CACHE_TAGS.favorites(userId || ''),
    queryFn: async () => {
      if (!userId) return []
      const response = await fetch('/api/favorites')
      if (!response.ok) throw new Error('Failed to fetch favorites')
      return response.json()
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })
}

// Hook to bulk check favorite status for multiple products
export function useBulkFavoriteStatus(productIds: string[]) {
  const { data: session } = useSession()
  const userId = session?.user?.id

  return useQuery({
    queryKey: ['bulk-favorites', userId, ...productIds],
    queryFn: async () => {
      if (!userId || productIds.length === 0) return {}
      
      // This would require a new API endpoint to check multiple products at once
      const response = await fetch('/api/favorites/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productIds }),
      })
      
      if (!response.ok) throw new Error('Failed to fetch bulk favorite status')
      return response.json() as Promise<Record<string, boolean>>
    },
    enabled: !!userId && productIds.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })
}