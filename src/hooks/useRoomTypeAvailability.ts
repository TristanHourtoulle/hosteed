import { useQuery } from '@tanstack/react-query'
import { CACHE_TAGS } from '@/lib/cache/query-client'
import type { RoomTypeAvailabilityView } from '@/types/roomType'

interface RoomTypeAvailabilityParams {
  productId: string | undefined
  arrivalDate: Date | null
  leavingDate: Date | null
  /** Only fetch for hotel products (avoids a needless call for single units). */
  enabled?: boolean
}

/**
 * Per-room-type availability for a hotel product via TanStack Query.
 *
 * When both dates are provided the server applies the overlap math; when they
 * are null it still returns calendar-only availability (each type reported as
 * fully available), so the selector can render before a date range is chosen.
 *
 * @param {RoomTypeAvailabilityParams} params - Product id + optional date range
 * @returns Query result with the per-type availability array
 */
export function useRoomTypeAvailability({
  productId,
  arrivalDate,
  leavingDate,
  enabled = true,
}: RoomTypeAvailabilityParams) {
  const arrivalISO = arrivalDate ? arrivalDate.toISOString() : ''
  const leavingISO = leavingDate ? leavingDate.toISOString() : ''

  return useQuery<RoomTypeAvailabilityView[]>({
    queryKey: CACHE_TAGS.roomTypeAvailability(productId ?? '', arrivalISO, leavingISO),
    queryFn: async () => {
      const params = new URLSearchParams({ productId: productId! })
      if (arrivalISO && leavingISO) {
        params.set('arrival', arrivalISO)
        params.set('leaving', leavingISO)
      }

      const response = await fetch(`/api/check-room-availability?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Room-type availability check failed')
      }

      return result as RoomTypeAvailabilityView[]
    },
    enabled: enabled && !!productId,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
  })
}

/**
 * Index a per-type availability array into a `{ roomTypeId -> availableQuantity }`
 * map for quick lookups by the selection UI.
 *
 * @param {RoomTypeAvailabilityView[] | undefined} availabilities - Availability array
 * @returns {Record<string, number>} Availability caps by room-type id
 */
export function availabilityCapsById(
  availabilities: RoomTypeAvailabilityView[] | undefined
): Record<string, number> {
  if (!availabilities) return {}
  return Object.fromEntries(availabilities.map(a => [a.roomTypeId, a.availableQuantity]))
}
