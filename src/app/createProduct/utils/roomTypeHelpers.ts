import { BED_TYPE_OPTIONS, type RoomTypeFormData, type RoomTypeName } from '../types/roomType'
import type { CreateRoomTypeInput } from '@/lib/services/room-type.service'
import type { RoomTypeWithRelations } from '@/types/room-type-db'
import type { DayEnum } from '@prisma/client'

/**
 * `CreateRoomTypeInput` carrying the room type's photo urls. The field is
 * declared here rather than widening the service input, so this lot and the
 * service-side one (TRI-1029) can land independently; once both are in, the
 * intersection is a redundant no-op.
 */
export type RoomTypeInputWithImages = CreateRoomTypeInput & { imageUrls?: string[] }

/**
 * Prefix used for client-only temporary room-type ids (React key + copy
 * source). Persisted DB ids are cuids and never carry this prefix, which lets
 * the admin edit wizard tell "existing row" from "newly added row".
 */
export const TEMP_ROOM_TYPE_ID_PREFIX = 'rt-'

let seq = 0
const genId = () => `${TEMP_ROOM_TYPE_ID_PREFIX}${Date.now()}-${seq++}`

/**
 * True when `id` is a persisted DB id (should be sent to `syncRoomTypes` so the
 * row is updated), false for client temp ids and empty strings (→ create).
 */
export function isPersistedRoomTypeId(id: string | undefined): id is string {
  return Boolean(id) && !id!.startsWith(TEMP_ROOM_TYPE_ID_PREFIX)
}

/** Build a fresh, empty room type with the 4 bed counters zeroed. */
export function createEmptyRoomType(): RoomTypeFormData {
  return {
    id: genId(),
    name: '',
    quantity: '1',
    capacity: '',
    surface: '',
    smoking: false,
    basePrice: '',
    priceMGA: '',
    beds: BED_TYPE_OPTIONS.map(o => ({ bedType: o.value, count: 0 })),
    specialPrices: [],
    mealIds: [],
    includedServiceIds: [],
    extraIds: [],
    images: [],
  }
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null
  return value instanceof Date ? value : new Date(value)
}

/**
 * Map a DB room type (with relations) into the wizard's `RoomTypeFormData`.
 * The DB `id` is preserved so a later PUT updates the existing row rather than
 * recreating it. Beds are re-expanded to the fixed 4-counter grid (DB only
 * stores non-zero beds). Numeric fields become strings (form convention).
 *
 * Shared by the admin edit wizard and the host edit page (TRI-1028).
 */
export function mapDbRoomTypeToForm(roomType: RoomTypeWithRelations): RoomTypeFormData {
  const bedCountByType = new Map(roomType.beds.map(bed => [bed.bedType, bed.count]))

  return {
    id: roomType.id,
    name: roomType.name as RoomTypeName | '',
    quantity: String(roomType.quantity),
    capacity: String(roomType.capacity),
    surface: roomType.surface != null ? String(roomType.surface) : '',
    smoking: roomType.smoking,
    basePrice: roomType.basePrice,
    priceMGA: roomType.priceMGA,
    beds: BED_TYPE_OPTIONS.map(option => ({
      bedType: option.value,
      count: bedCountByType.get(option.value) ?? 0,
    })),
    specialPrices: (roomType.specialPrices ?? []).map(sp => ({
      id: sp.id,
      pricesMga: sp.pricesMga,
      pricesEuro: sp.pricesEuro,
      day: (sp.day ?? []) as DayEnum[],
      startDate: toDate(sp.startDate),
      endDate: toDate(sp.endDate),
      activate: sp.activate,
    })),
    mealIds: (roomType.mealsList ?? []).map(m => m.id),
    includedServiceIds: (roomType.includedServices ?? []).map(s => s.id),
    extraIds: (roomType.extras ?? []).map(e => e.id),
    // Persisted photos: no File to re-upload, the stored full-size url is both
    // the preview source and the value sent back on save.
    images: (roomType.images ?? []).map(image => ({
      id: image.id,
      file: null,
      preview: image.img,
      url: image.img,
      isExisting: true,
    })),
  }
}

/**
 * Copy every editable field from `source` into a fresh type, preserving
 * `targetId`.
 *
 * Photos are deliberately excluded: they are drawn from the listing's shared
 * 20-photo budget, so copying them would silently double-charge it (and a copy
 * of a 5-photo type would eat a quarter of the allowance in one click). The
 * host re-uploads photos for the new type if they want any.
 */
export function copyRoomType(source: RoomTypeFormData, targetId: string): RoomTypeFormData {
  return {
    ...source,
    id: targetId,
    beds: source.beds.map(b => ({ ...b })),
    specialPrices: source.specialPrices.map(sp => ({ ...sp, day: [...sp.day] })),
    mealIds: [...source.mealIds],
    includedServiceIds: [...source.includedServiceIds],
    extraIds: [...source.extraIds],
    images: [],
  }
}

/**
 * Convert editor state to the `CreateRoomTypeInput[]` shape consumed by
 * `createProduct`/`updateProduct`. Persisted DB ids are forwarded so
 * `syncRoomTypes` updates the existing row instead of recreating it; client
 * temp ids (create flow, or newly added rows in the admin editor) are omitted.
 *
 * Photo urls ride inside each room type's own entry (`imageUrls`), so the
 * caller never has to match an upload result back to a server-generated room
 * type id — the temp-id/cuid distinction stays confined to `id`. Only images
 * that already resolved to a url are forwarded; ones still holding a `File`
 * must be uploaded by the caller first.
 */
export function buildRoomTypesPayload(roomTypes: RoomTypeFormData[]): RoomTypeInputWithImages[] {
  return roomTypes.map((rt, index) => ({
    ...(isPersistedRoomTypeId(rt.id) ? { id: rt.id } : {}),
    name: rt.name,
    quantity: Number(rt.quantity),
    capacity: Number(rt.capacity),
    surface: rt.surface ? Number(rt.surface) : null,
    smoking: rt.smoking,
    basePrice: rt.basePrice,
    priceMGA: rt.priceMGA,
    position: index,
    beds: rt.beds
      .filter(b => b.count > 0)
      .map(b => ({ bedType: b.bedType, count: b.count })),
    specialPrices: rt.specialPrices.map(sp => ({
      pricesEuro: sp.pricesEuro,
      pricesMga: sp.pricesMga,
      day: sp.day,
      startDate: sp.startDate,
      endDate: sp.endDate,
      activate: sp.activate,
    })),
    mealIds: rt.mealIds,
    includedServiceIds: rt.includedServiceIds,
    extraIds: rt.extraIds,
    imageUrls: rt.images.map(image => image.url).filter((url): url is string => Boolean(url)),
  }))
}

/** Product-level fallback price for hotels = cheapest room type (EUR "à partir de X€"). */
export function deriveHotelBasePrice(roomTypes: RoomTypeFormData[]): {
  basePrice: string
  priceMGA: string
} {
  const cheapest = roomTypes
    .filter(rt => rt.basePrice)
    .reduce<RoomTypeFormData | null>(
      (min, rt) => (!min || Number(rt.basePrice) < Number(min.basePrice) ? rt : min),
      null
    )
  return { basePrice: cheapest?.basePrice ?? '0', priceMGA: cheapest?.priceMGA ?? '0' }
}

/** Deprecated `availableRooms` backward-compat value = sum of every type's quantity. */
export function sumRoomQuantities(roomTypes: RoomTypeFormData[]): number {
  return roomTypes.reduce((total, rt) => total + (Number(rt.quantity) || 0), 0)
}
