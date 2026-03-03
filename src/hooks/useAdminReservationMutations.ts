'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface StatusChangeParams {
  rentId: string
  status: 'RESERVED' | 'CHECKIN' | 'CHECKOUT' | 'CANCEL'
  reason?: string
}

export function useAdminReservationStatusChange() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ rentId, status, reason }: StatusChangeParams) => {
      const response = await fetch(`/api/admin/reservations/${rentId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Erreur lors du changement de statut')
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success('Statut de la réservation mis à jour')
      queryClient.invalidateQueries({ queryKey: ['admin-reservations'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors du changement de statut')
    },
  })
}
