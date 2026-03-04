import { useQuery } from '@tanstack/react-query'
import { CACHE_TAGS } from '@/lib/cache/query-client'

interface AvailabilityParams {
  productId: string | undefined
  arrivalDate: Date | null
  leavingDate: Date | null
  arrivingHour?: number
  leavingHour?: number
}

interface AvailabilityResult {
  available: boolean
  message?: string
}

/**
 * Check product availability for a date range using TanStack Query.
 * @param params - Product ID, arrival/leaving dates, and optional check-in/out hours
 * @returns Query result with availability status
 */
export function useAvailability({
  productId,
  arrivalDate,
  leavingDate,
  arrivingHour = 14,
  leavingHour = 11,
}: AvailabilityParams) {
  const arrival = arrivalDate ? new Date(arrivalDate) : null
  const leaving = leavingDate ? new Date(leavingDate) : null

  if (arrival) arrival.setHours(arrivingHour, 0, 0, 0)
  if (leaving) leaving.setHours(leavingHour, 0, 0, 0)

  const arrivalISO = arrival?.toISOString() ?? ''
  const leavingISO = leaving?.toISOString() ?? ''

  return useQuery<AvailabilityResult>({
    queryKey: CACHE_TAGS.availability(productId ?? '', arrivalISO, leavingISO),
    queryFn: async () => {
      const params = new URLSearchParams({
        productId: productId!,
        arrival: arrivalISO,
        leaving: leavingISO,
      })
      const response = await fetch(`/api/check-availability?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Availability check failed')
      }

      return result as AvailabilityResult
    },
    enabled: !!productId && !!arrivalDate && !!leavingDate,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
  })
}
