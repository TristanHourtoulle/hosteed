import { useQuery } from '@tanstack/react-query'
import { CACHE_TAGS } from '@/lib/cache/query-client'
import { findProductBySlugOrId } from '@/lib/services/product.service'
import { findUserById } from '@/lib/services/user.service'
import {
  validateBooking,
  calculateBookingPrice,
  type BookingPriceResult,
} from '@/lib/services/booking-pricing.service'
import {
  calculateTotalRentPrice,
  type CommissionCalculation,
} from '@/lib/services/commission.service'

/**
 * Fetch product by slug or ID for the booking flow.
 *
 * @param {string} productId - Product slug or ID
 * @returns React Query result with product data
 */
export function useBookingProduct(productId: string) {
  return useQuery({
    queryKey: CACHE_TAGS.product(productId),
    queryFn: () => findProductBySlugOrId(productId),
    enabled: !!productId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  })
}

/**
 * Fetch user profile data for pre-filling the booking form.
 *
 * @param {string | undefined} userId - User ID from session
 * @returns React Query result with user data
 */
export function useBookingUser(userId: string | undefined) {
  return useQuery({
    queryKey: CACHE_TAGS.user(userId ?? ''),
    queryFn: () => findUserById(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 20,
  })
}

interface BookingPricingParams {
  productId: string
  startDate: Date | null
  endDate: Date | null
  guestCount: number
  extrasCost: number
  ownerId?: string
  typeId?: string
}

interface BookingPricingResult {
  validationErrors: string[]
  pricing: BookingPriceResult | null
  priceCalculation: CommissionCalculation | null
}

/**
 * Calculate booking pricing with validation, day-by-day breakdown, and commission.
 * Re-runs when dates, guest count, or extras change.
 *
 * @param {BookingPricingParams} params - Booking parameters
 * @returns React Query result with pricing data, validation errors, and commission breakdown
 */
export function useBookingPricing(params: BookingPricingParams) {
  const { productId, startDate, endDate, guestCount, extrasCost, ownerId, typeId } = params

  return useQuery<BookingPricingResult | null>({
    queryKey: [
      'booking-pricing',
      productId,
      startDate?.toISOString(),
      endDate?.toISOString(),
      guestCount,
      extrasCost,
      ownerId,
    ],
    queryFn: async () => {
      if (!startDate || !endDate) return null

      const nights = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (nights <= 0) return null

      const validation = await validateBooking(productId, startDate, endDate, guestCount)
      if (!validation.isValid) {
        return { validationErrors: validation.errors, pricing: null, priceCalculation: null }
      }

      const pricing = await calculateBookingPrice(productId, startDate, endDate, ownerId)
      const calculation = await calculateTotalRentPrice(
        pricing.subtotal / nights,
        nights,
        extrasCost,
        typeId
      )

      return { validationErrors: [], pricing, priceCalculation: calculation }
    },
    enabled: !!productId && !!startDate && !!endDate,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
  })
}
