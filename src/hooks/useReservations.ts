import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { CACHE_TAGS } from '@/lib/cache/query-client'
import { 
  findAllRentsByUserIdWithProducts, 
  findRentByIdWithFullDetails,
  getUserRentStatistics 
} from '@/lib/services/rents-optimized.service'
import { cancelRent } from '@/lib/services/rents.service'
import { toast } from 'sonner'

export function useUserReservations() {
  const { data: session } = useSession()
  const userId = session?.user?.id

  return useQuery({
    queryKey: CACHE_TAGS.reservations(userId || ''),
    queryFn: async () => {
      if (!userId) return []
      const rents = await findAllRentsByUserIdWithProducts(userId)
      // Transform dates from BigInt to Date
      return rents.map(rent => ({
        ...rent,
        arrivingDate: new Date(Number(rent.arrivingDate)),
        leavingDate: new Date(Number(rent.leavingDate)),
      }))
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useReservationDetails(rentId: string) {
  return useQuery({
    queryKey: CACHE_TAGS.reservation(rentId),
    queryFn: async () => {
      const rent = await findRentByIdWithFullDetails(rentId)
      if (!rent) return null
      
      // Transform dates from BigInt to Date
      return {
        ...rent,
        arrivingDate: new Date(Number(rent.arrivingDate)),
        leavingDate: new Date(Number(rent.leavingDate)),
      }
    },
    enabled: !!rentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })
}

export function useUserRentStatistics() {
  const { data: session } = useSession()
  const userId = session?.user?.id

  return useQuery({
    queryKey: ['rent-statistics', userId],
    queryFn: async () => {
      if (!userId) return null
      return getUserRentStatistics(userId)
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  })
}

export function useCancelReservation() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const userId = session?.user?.id

  return useMutation({
    mutationFn: async (rentId: string) => {
      return cancelRent(rentId)
    },
    onSuccess: (_, rentId) => {
      toast.success('Réservation annulée avec succès')
      
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: CACHE_TAGS.reservations(userId || '')
      })
      queryClient.invalidateQueries({
        queryKey: CACHE_TAGS.reservation(rentId)
      })
      queryClient.invalidateQueries({
        queryKey: ['rent-statistics', userId]
      })
    },
    onError: (error) => {
      console.error('Error cancelling reservation:', error)
      toast.error('Erreur lors de l\'annulation de la réservation')
    }
  })
}