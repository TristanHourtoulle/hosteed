import type { BedType } from '@/app/createProduct/types/roomType'

/**
 * Shared, view-friendly shapes for hotel room types as loaded by
 * `getProductForValidation` (Lot 5). These decouple the admin validation
 * views from the generated Prisma client while matching the queried fields.
 */

export interface RoomTypeBedView {
  bedType: BedType
  count: number
}

export interface RoomTypePromotionView {
  id: string
  discountPercentage: number
  startDate: Date | string
  endDate: Date | string
  isActive: boolean
  roomTypeId?: string | null
}

export interface RoomTypeSpecialPriceView {
  id: string
  pricesMga: string
  pricesEuro: string
  day: string[]
  startDate: Date | string | null
  endDate: Date | string | null
  activate: boolean
}

export interface RoomTypeWithRelations {
  id: string
  name: string
  quantity: number
  capacity: number
  surface?: number | null
  smoking: boolean
  basePrice: string
  priceMGA: string
  position: number
  beds: RoomTypeBedView[]
  promotions?: RoomTypePromotionView[]
  specialPrices?: RoomTypeSpecialPriceView[]
  mealsList?: { id: string }[]
  includedServices?: { id: string }[]
  servicesList?: { id: string }[]
  extras?: { id: string }[]
}
