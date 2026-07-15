import type { BedType } from '@/app/createProduct/types/roomType'

/**
 * Shared, view-friendly shapes for hotel room types as loaded from the DB
 * (`getProductForValidation` for the admin path, `findProductById` for the host
 * edit path). These decouple consumers from the generated Prisma client while
 * matching the queried fields.
 *
 * Neutral location (TRI-1028): both the admin validation views and the host
 * edit page map these into the wizard form, so the shapes cannot live under
 * `/admin`.
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

/**
 * A persisted room-type photo. Only the full-size URL is stored (`img`); the
 * thumb/medium variants are derived from it by `getFullSizeImageUrl` & co.
 */
export interface RoomTypeImageView {
  id: string
  img: string
  position?: number
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
  /** Optional: only the read paths that hydrate an editor select these. */
  images?: RoomTypeImageView[]
  promotions?: RoomTypePromotionView[]
  specialPrices?: RoomTypeSpecialPriceView[]
  mealsList?: { id: string }[]
  includedServices?: { id: string }[]
  servicesList?: { id: string }[]
  extras?: { id: string }[]
}
