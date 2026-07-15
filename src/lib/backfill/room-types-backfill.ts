/**
 * Pure, DB-free mapping and predicate functions for the hotel multi-room-type
 * backfill (LOT 1 / TRI-994).
 *
 * Single source of truth for how a legacy hotel `Product` (single
 * `availableRooms` field) becomes a default `RoomType`, and how a historical
 * hotel `Rent` becomes a `RentRoomType` line. Consumed by the runner script
 * (`scripts/backfill-room-types.ts`) and by unit tests. No I/O, no `any`.
 */

/**
 * User-facing name given to the single room type created for each migrated
 * hotel establishment. French, consistent with the FR data model / enum values.
 * Hosts can rename it afterwards (LOT 2).
 */
export const DEFAULT_ROOM_TYPE_NAME = 'Chambre standard'

/** Minimal `Product` shape needed to decide and build a backfill. */
export interface BackfillProductInput {
  id: string
  isHotelType: boolean
  /** Legacy `Product.availableRooms` (deprecated, removed in LOT 6). */
  availableRooms: number | null
  /** `Product.maxPeople` — BigInt in Prisma, converted by the caller. */
  maxPeople: bigint | null
  /** `Product.surface` — BigInt in Prisma, converted by the caller. */
  surface: bigint | null
  basePrice: string
  priceMGA: string
  /** Number of `RoomType` rows already attached (0 unless already migrated). */
  existingRoomTypeCount: number
}

/** Data required to create the default `RoomType` for a migrated hotel. */
export interface DefaultRoomTypeData {
  productId: string
  name: string
  quantity: number
  capacity: number
  surface: number | null
  smoking: boolean
  basePrice: string
  priceMGA: string
  position: number
}

/** Data required to create one historical `RentRoomType` line. */
export interface RentRoomTypeData {
  rentId: string
  roomTypeId: string
  quantity: number
  unitPrice: string
}

/**
 * A product is eligible for backfill when it is a hotel type and has no
 * existing room types. The second condition makes re-runs idempotent, and the
 * first guarantees non-hotel products are never touched.
 */
export function isBackfillEligible(product: BackfillProductInput): boolean {
  return product.isHotelType && product.existingRoomTypeCount === 0
}

/**
 * Build the single default `RoomType` for a migrated hotel establishment.
 * - quantity  ← availableRooms (default 1 when null)
 * - capacity  ← maxPeople      (default 1 when null)
 * - surface   ← surface        (null when absent)
 * - prices are copied verbatim as strings (no numeric coercion).
 */
export function buildDefaultRoomTypeData(product: BackfillProductInput): DefaultRoomTypeData {
  return {
    productId: product.id,
    name: DEFAULT_ROOM_TYPE_NAME,
    quantity: product.availableRooms ?? 1,
    capacity: product.maxPeople !== null ? Number(product.maxPeople) : 1,
    surface: product.surface !== null ? Number(product.surface) : null,
    smoking: false,
    basePrice: product.basePrice,
    priceMGA: product.priceMGA,
    position: 0,
  }
}

/**
 * Build one historical `RentRoomType` line. Legacy hotel availability counted
 * one `Rent` as exactly one booked room (`existingRents.length`), so every
 * backfilled line has `quantity = 1`. `unitPrice` snapshots the establishment's
 * base price at migration time.
 */
export function buildRentRoomTypeData(
  rentId: string,
  roomTypeId: string,
  unitPrice: string
): RentRoomTypeData {
  return {
    rentId,
    roomTypeId,
    quantity: 1,
    unitPrice,
  }
}
