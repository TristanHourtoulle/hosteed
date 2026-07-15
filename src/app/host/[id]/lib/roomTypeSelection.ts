/**
 * Pure, immutable helpers for the guest hotel room-type selection (Lot 4).
 *
 * No React, no I/O — fully unit-testable under the `node` Jest environment.
 * A "selection" is a plain `{ roomTypeId -> quantity }` map. All mutators
 * return a NEW object and never touch their input.
 */
import type { RoomTypeView, SelectedRoomLine } from '@/types/roomType'

/** `{ roomTypeId -> quantity }`. Keys with quantity 0 are never stored. */
export type RoomTypeSelection = Record<string, number>

/** A minimal `{ roomTypeId, quantity }` line for URLs / server payloads. */
export interface RequestedLine {
  roomTypeId: string
  quantity: number
}

/**
 * Set the requested quantity of a room type, clamped to `[0, maxQuantity]`.
 * A resulting quantity of 0 removes the key. Always returns a new object.
 *
 * @param {RoomTypeSelection} selection - Current selection (not mutated)
 * @param {string} roomTypeId - Room type to update
 * @param {number} quantity - Desired quantity (clamped)
 * @param {number} maxQuantity - Upper bound (availability cap)
 * @returns {RoomTypeSelection} New selection
 */
export function setRoomTypeQuantity(
  selection: RoomTypeSelection,
  roomTypeId: string,
  quantity: number,
  maxQuantity: number
): RoomTypeSelection {
  const upperBound = Math.max(0, Math.floor(maxQuantity))
  const clamped = Math.min(Math.max(0, Math.floor(quantity)), upperBound)

  const next: RoomTypeSelection = { ...selection }
  if (clamped <= 0) {
    delete next[roomTypeId]
  } else {
    next[roomTypeId] = clamped
  }
  return next
}

/**
 * Total number of rooms selected across all types.
 *
 * @param {RoomTypeSelection} selection - Current selection
 * @returns {number} Sum of quantities
 */
export function totalSelectedRooms(selection: RoomTypeSelection): number {
  return Object.values(selection).reduce((sum, qty) => sum + qty, 0)
}

/**
 * Resolve a selection into displayable lines, ordered by room-type `position`.
 * Unknown ids (not in `roomTypes`) are dropped.
 *
 * @param {RoomTypeSelection} selection - Current selection
 * @param {RoomTypeView[]} roomTypes - Available room types
 * @param {Record<string, number>} [availabilityById] - Optional per-type availability caps
 * @returns {SelectedRoomLine[]} Resolved lines
 */
export function getSelectedLines(
  selection: RoomTypeSelection,
  roomTypes: readonly RoomTypeView[],
  availabilityById?: Record<string, number>
): SelectedRoomLine[] {
  return roomTypes
    .filter(rt => (selection[rt.id] ?? 0) > 0)
    .slice()
    .sort((a, b) => a.position - b.position)
    .map(rt => ({
      roomTypeId: rt.id,
      name: rt.name,
      quantity: selection[rt.id]!,
      unitPricePerNight: Number.parseFloat(rt.basePrice) || 0,
      availableQuantity: availabilityById?.[rt.id] ?? rt.quantity,
    }))
}

/**
 * Client-side subtotal estimate: `Σ(unitPricePerNight × quantity) × nights`.
 * The authoritative amount always comes from the server pricing service.
 *
 * @param {Pick<SelectedRoomLine, 'unitPricePerNight' | 'quantity'>[]} lines - Selected lines
 * @param {number} nights - Number of nights
 * @returns {number} Estimated rooms subtotal
 */
export function selectionSubtotal(
  lines: ReadonlyArray<Pick<SelectedRoomLine, 'unitPricePerNight' | 'quantity'>>,
  nights: number
): number {
  const perNight = lines.reduce((sum, l) => sum + l.unitPricePerNight * l.quantity, 0)
  return perNight * Math.max(0, nights)
}

/**
 * Convert a selection into `{ roomTypeId, quantity }` lines for server calls.
 *
 * @param {RoomTypeSelection} selection - Current selection
 * @returns {RequestedLine[]} Lines
 */
export function selectionToLines(selection: RoomTypeSelection): RequestedLine[] {
  return Object.entries(selection)
    .filter(([, qty]) => qty > 0)
    .map(([roomTypeId, quantity]) => ({ roomTypeId, quantity }))
}

/**
 * Encode a selection as a compact URL-safe string: `id:q;id:q`.
 * Deterministic order (by id) for stable, testable output.
 *
 * @param {RoomTypeSelection} selection - Current selection
 * @returns {string} Encoded selection
 */
export function encodeRoomTypeSelection(selection: RoomTypeSelection): string {
  return Object.entries(selection)
    .filter(([, qty]) => qty > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, qty]) => `${id}:${qty}`)
    .join(';')
}

/**
 * Decode an `id:q;id:q` string back into a selection. Empty or malformed
 * input yields an empty selection (never throws).
 *
 * @param {string | null | undefined} str - Encoded selection
 * @returns {RoomTypeSelection} Decoded selection
 */
export function decodeRoomTypeSelection(str: string | null | undefined): RoomTypeSelection {
  if (!str) return {}

  const selection: RoomTypeSelection = {}
  for (const pair of str.split(';')) {
    if (!pair) continue
    const [id, rawQty] = pair.split(':')
    if (!id) continue
    const qty = Number.parseInt(rawQty ?? '', 10)
    if (!Number.isFinite(qty) || qty <= 0) continue
    selection[id] = qty
  }
  return selection
}

/**
 * Parse a `?roomTypes=` query value into server-ready lines.
 *
 * @param {string | null | undefined} param - Raw query param
 * @returns {RequestedLine[]} Lines
 */
export function parseReservationRoomTypes(param: string | null | undefined): RequestedLine[] {
  return selectionToLines(decodeRoomTypeSelection(param))
}

/** Strip a date to local midnight (comparison helper). */
function startOfDay(date: Date): number {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/**
 * Whether a date falls inside any blocked range (boundaries inclusive).
 *
 * @param {Date} date - Date to test
 * @param {ReadonlyArray<{ startDate: Date; endDate: Date }>} blockedRanges - Blocked ranges
 * @returns {boolean} True if the date is blocked
 */
export function isDateBlocked(
  date: Date,
  blockedRanges: ReadonlyArray<{ startDate: Date; endDate: Date }>
): boolean {
  const target = startOfDay(date)
  return blockedRanges.some(
    range => startOfDay(range.startDate) <= target && target <= startOfDay(range.endDate)
  )
}
