import type { BedType } from '@/app/createProduct/types/roomType'
import type { RoomTypeBedView, RoomTypeWithRelations } from './roomTypeTypes'

/** Singular French label per bed type (used in "2 lit double, 1 lit simple"). */
const BED_TYPE_FR_LABEL: Record<BedType, string> = {
  SIMPLE: 'lit simple',
  DOUBLE: 'lit double',
  KING: 'lit King',
  GRAND_KING: 'lit grand King',
}

/**
 * Human-readable beds summary in French, e.g.
 * `[{DOUBLE,2},{SIMPLE,1}]` → `"2 lit double, 1 lit simple"`.
 * Zero-count beds are dropped; an empty list yields `"Aucun lit"`.
 */
export function bedsSummary(beds: RoomTypeBedView[]): string {
  const parts = beds
    .filter(bed => bed.count > 0)
    .map(bed => `${bed.count} ${BED_TYPE_FR_LABEL[bed.bedType] ?? bed.bedType}`)
  return parts.length > 0 ? parts.join(', ') : 'Aucun lit'
}

export interface RoomTypeLine {
  id: string
  title: string
  quantityLabel: string
  capacityLabel: string
  priceLabel: string
  priceMGALabel: string | null
  surfaceLabel: string | null
  smokingLabel: string
  bedsLabel: string
}

/** Derive the display strings for a single room type card row. */
export function roomTypeLine(roomType: RoomTypeWithRelations): RoomTypeLine {
  return {
    id: roomType.id,
    title: roomType.name,
    quantityLabel: `${roomType.quantity} chambre${roomType.quantity > 1 ? 's' : ''}`,
    capacityLabel: `${roomType.capacity} pers.`,
    priceLabel: `${roomType.basePrice}€ / nuit`,
    priceMGALabel: roomType.priceMGA ? `${roomType.priceMGA} Ariary / nuit` : null,
    surfaceLabel: roomType.surface != null ? `${roomType.surface} m²` : null,
    smokingLabel: roomType.smoking ? 'Fumeur' : 'Non-fumeur',
    bedsLabel: bedsSummary(roomType.beds),
  }
}
