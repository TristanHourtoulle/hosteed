import type { SpecialPrice } from '@/types/product-form'

/**
 * Bed types offered per room type. Mirrors the Prisma `BedType` enum
 * (SIMPLE | DOUBLE | KING | GRAND_KING) — kept as a string-literal union so the
 * client wizard has no runtime dependency on the generated Prisma client.
 */
export type BedType = 'SIMPLE' | 'DOUBLE' | 'KING' | 'GRAND_KING'

/** Selectable room-type names (host picks one per room type). */
export const ROOM_TYPE_NAMES = [
  'Double',
  'Triple',
  'Quadruple',
  'Suite',
  'Familiale',
  'Studio',
  'Appartement',
  'Lit en dortoir',
] as const
export type RoomTypeName = (typeof ROOM_TYPE_NAMES)[number]

/** Ordered bed-type options rendered by the bed counter group. */
export const BED_TYPE_OPTIONS: ReadonlyArray<{ value: BedType; label: string }> = [
  { value: 'SIMPLE', label: 'Lit simple' },
  { value: 'DOUBLE', label: 'Lit double' },
  { value: 'KING', label: 'Lit King' },
  { value: 'GRAND_KING', label: 'Lit grand King' },
]

export interface RoomTypeBedFormData {
  bedType: BedType
  count: number
}

/**
 * Editor state for a single room type inside the host create wizard.
 * All numeric fields are kept as strings (consistent with `ProductFormData`);
 * they are converted to numbers by `buildRoomTypesPayload` at submit time.
 */
export interface RoomTypeFormData {
  id: string // client temp id (React key + copy source); never sent to the server
  name: RoomTypeName | ''
  quantity: string // number of identical rooms of this type
  capacity: string // max guests per room
  surface: string // optional, m²
  smoking: boolean
  basePrice: string // EUR
  priceMGA: string // Ariary
  beds: RoomTypeBedFormData[] // always the 4 bed types, count >= 0
  specialPrices: SpecialPrice[] // per-type special prices
  mealIds: string[] // included meals for this type
  includedServiceIds: string[] // included services for this type
  extraIds: string[] // paid extras for this type
}
