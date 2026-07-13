/**
 * UI view types for the guest-facing hotel booking flow (Lot 4).
 *
 * These mirror the Prisma `RoomType` model but are trimmed to what the guest
 * detail/reservation pages render. They are intentionally serializable (no
 * `Date`, no `BigInt`) so they can cross the server/client boundary safely.
 */

export interface RoomTypeBedView {
  bedType: string
  count: number
}

export interface RoomTypeView {
  id: string
  name: string
  quantity: number
  capacity: number
  surface?: number | null
  smoking: boolean
  /** EUR base price, string convention mirroring `Product.basePrice`. */
  basePrice: string
  priceMGA: string
  position: number
  beds: RoomTypeBedView[]
}

/**
 * A single selected room-type line, resolved from a {@link RoomTypeSelection}
 * against the available room types. Used to render the price summary and to
 * build the reservation URL / checkout payload.
 */
export interface SelectedRoomLine {
  roomTypeId: string
  name: string
  quantity: number
  /** `parseFloat(RoomType.basePrice)` — client-side estimate only. */
  unitPricePerNight: number
  /** Capacity cap for the selector (from availability, or the type quantity). */
  availableQuantity: number
}

/** A priced room-type line as displayed in {@link BookingCostSummary}. */
export interface RoomLineSummary {
  roomTypeId: string
  name: string
  quantity: number
  unitPricePerNight: number
  lineSubtotal: number
}
