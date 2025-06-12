import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

export function useFavorites(productId: string) {
  const { data: session } = useSession()
  const [isFavorite, setIsFavorite] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const checkFavoriteStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/favorites/${productId}`)
      if (response.ok) {
        const data = await response.json()
        setIsFavorite(data.isFavorite)
      }
    } catch (error) {
      console.error('Error checking favorite status:', error)
    }
  }, [productId])

  // Check if product is favorited on mount
  useEffect(() => {
    if (session?.user?.id && productId) {
      checkFavoriteStatus()
    }
  }, [session?.user?.id, productId, checkFavoriteStatus])

  const toggleFavorite = async () => {
    if (!session?.user?.id) {
      toast.error('Vous devez être connecté pour ajouter aux favoris')
      return
    }

    setIsLoading(true)
    try {
      const method = isFavorite ? 'DELETE' : 'POST'
      const response = await fetch('/api/favorites', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      })

      if (response.ok) {
        setIsFavorite(!isFavorite)
        toast.success(isFavorite ? 'Retiré des favoris' : 'Ajouté aux favoris')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la mise à jour des favoris')
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      toast.error('Erreur lors de la mise à jour des favoris')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isFavorite,
    isLoading,
    toggleFavorite,
  }
}
