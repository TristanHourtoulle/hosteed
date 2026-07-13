import { BED_TYPE_OPTIONS, type RoomTypeFormData } from '../types/roomType'
import type { CreateRoomTypeInput } from '@/lib/services/room-type.service'

let seq = 0
const genId = () => `rt-${Date.now()}-${seq++}`

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
  }
}

/** Copy every editable field from `source` into a fresh type, preserving `targetId`. */
export function copyRoomType(source: RoomTypeFormData, targetId: string): RoomTypeFormData {
  return {
    ...source,
    id: targetId,
    beds: source.beds.map(b => ({ ...b })),
    specialPrices: source.specialPrices.map(sp => ({ ...sp, day: [...sp.day] })),
    mealIds: [...source.mealIds],
    includedServiceIds: [...source.includedServiceIds],
    extraIds: [...source.extraIds],
  }
}

/** Convert editor state to the `CreateRoomTypeInput[]` shape consumed by `createProduct`. */
export function buildRoomTypesPayload(roomTypes: RoomTypeFormData[]): CreateRoomTypeInput[] {
  return roomTypes.map((rt, index) => ({
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
