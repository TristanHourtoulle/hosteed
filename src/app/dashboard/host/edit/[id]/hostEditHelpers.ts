import type { FormData, SpecialPrice } from '@/app/createProduct/types'
import type { RoomTypeWithRelations } from '@/types/room-type-db'
import type { CreateRoomTypeInput } from '@/lib/services/room-type.service'
import {
  buildRoomTypesPayload,
  mapDbRoomTypeToForm,
  sumRoomQuantities,
} from '@/app/createProduct/utils/roomTypeHelpers'

/**
 * Pure hydration / serialisation for the host edit page (TRI-1028).
 *
 * Extracted from the page component so the room-type round-trip (load → edit →
 * save) is testable without mounting the wizard, and so the room-type mapping
 * and payload builders are shared with the admin wizard rather than forked.
 */

/** The `GET /api/products/[id]` JSON as consumed by the edit form. */
export interface HostEditProduct {
  id?: string
  name?: string
  description?: string
  address?: string
  completeAddress?: string | null
  placeId?: string | null
  latitude?: number | null
  longitude?: number | null
  phone?: string | null
  phoneCountry?: string | null
  typeId?: string | null
  type?: { id: string; name: string; isHotelType?: boolean | null } | null
  arriving?: number | null
  leaving?: number | null
  basePrice?: string | null
  priceMGA?: string | null
  specialPrices?: SpecialPrice[]
  autoAccept?: boolean | null
  equipments?: { id: string }[]
  mealsList?: { id: string }[]
  securities?: { id: string }[]
  servicesList?: { id: string }[]
  includedServices?: { id: string }[]
  extras?: { id: string }[]
  highlights?: { id: string }[]
  nearbyPlaces?: { name: string; distance: number }[]
  proximityLandmarks?: FormData['proximityLandmarks']
  transportOptions?: { name: string }[]
  room?: number | null
  bathroom?: number | null
  surface?: number | null
  minPeople?: number | null
  maxPeople?: number | null
  accessibility?: boolean | null
  petFriendly?: boolean | null
  rules?: {
    smokingAllowed?: boolean
    petsAllowed?: boolean
    eventsAllowed?: boolean
    selfCheckIn?: boolean
    selfCheckInType?: string | null
  }[]
  propertyInfo?: {
    hasStairs?: boolean
    hasElevator?: boolean
    hasHandicapAccess?: boolean
    hasPetsOnProperty?: boolean
    additionalNotes?: string | null
  } | null
  hotel?: { name: string }[]
  availableRooms?: number | null
  roomTypes?: RoomTypeWithRelations[]
  owner?: { id?: string } | null
}

export interface SeoData {
  metaTitle?: string
  metaDescription?: string
  keywords?: string
  slug?: string
}

/**
 * Transform an existing product into the wizard form shape.
 *
 * `isHotel` is derived from `type.isHotelType` — the authoritative
 * discriminator, and the same one `useProductForm` applies when the type is
 * changed. It cannot be derived from the `hotel` relation, which Prisma returns
 * as a list (`[]` is truthy, so it would mark every product as a hotel).
 */
export function mapProductToFormData(product: HostEditProduct): FormData {
  const isHotel = Boolean(product.type?.isHotelType)

  return {
    name: product.name || '',
    description: product.description || '',
    address: product.address || '',
    completeAddress: product.completeAddress || '',
    placeId: product.placeId || '',
    latitude: product.latitude || 0,
    longitude: product.longitude || 0,
    phone: product.phone || '',
    phoneCountry: product.phoneCountry || 'MG',
    typeId: product.typeId || '',
    typeRentId: product.typeId || '', // Sync with typeId
    arriving: product.arriving?.toString() || '15',
    leaving: product.leaving?.toString() || '12',
    basePrice: product.basePrice || '',
    priceMGA: product.priceMGA || '',
    basePriceMGA: product.priceMGA || '', // Sync with priceMGA
    specialPrices: product.specialPrices || [],
    autoAccept: product.autoAccept || false,
    equipmentIds: product.equipments?.map(e => e.id) || [],
    mealIds: product.mealsList?.map(m => m.id) || [],
    securityIds: product.securities?.map(s => s.id) || [],
    serviceIds: product.servicesList?.map(s => s.id) || [],
    includedServiceIds: product.includedServices?.map(s => s.id) || [],
    extraIds: product.extras?.map(e => e.id) || [],
    highlightIds: product.highlights?.map(h => h.id) || [],
    nearbyPlaces:
      product.nearbyPlaces?.map(p => ({
        name: p.name,
        distance: p.distance?.toString() || '',
        unit: (p.distance && p.distance < 1000 ? 'mètres' : 'kilomètres') as
          | 'mètres'
          | 'kilomètres',
      })) || [],
    proximityLandmarks: product.proximityLandmarks || [],
    transportation: product.transportOptions?.map(t => t.name).join(', ') || '',
    room: product.room?.toString() || '',
    bathroom: product.bathroom?.toString() || '',
    surface: product.surface?.toString() || '',
    minPeople: product.minPeople?.toString() || '',
    maxPeople: product.maxPeople?.toString() || '',
    accessibility: product.accessibility || false,
    petFriendly: product.petFriendly || false,
    // Rules (rules is an array from Prisma, take first element)
    smokingAllowed: product.rules?.[0]?.smokingAllowed || false,
    petsAllowed: product.rules?.[0]?.petsAllowed || false,
    eventsAllowed: product.rules?.[0]?.eventsAllowed || false,
    selfCheckIn: product.rules?.[0]?.selfCheckIn || false,
    selfCheckInType: product.rules?.[0]?.selfCheckInType || '',
    // Property info
    hasStairs: product.propertyInfo?.hasStairs || false,
    hasElevator: product.propertyInfo?.hasElevator || false,
    hasHandicapAccess: product.propertyInfo?.hasHandicapAccess || false,
    hasPetsOnProperty: product.propertyInfo?.hasPetsOnProperty || false,
    additionalNotes: product.propertyInfo?.additionalNotes || '',
    isHotel,
    hotelName: product.hotel?.[0]?.name || '',
    availableRooms: product.availableRooms?.toString() || '',
    // Only hotels carry room types; the same mapper the admin wizard uses, so a
    // persisted room type keeps its DB id and is updated rather than recreated.
    roomTypes: isHotel ? (product.roomTypes ?? []).map(mapDbRoomTypeToForm) : [],
  }
}

/**
 * Build the `PUT /api/products/[id]` body from the edit form.
 *
 * For hotels the reconciled `roomTypes` list is sent (ids preserved for
 * existing rows, omitted for `rt-` temp ids) so `syncRoomTypes` can
 * create/update/delete, and the legacy `availableRooms` is derived from the sum
 * of quantities. Non-hotel products omit `roomTypes` entirely, which keeps
 * `syncRoomTypes` a no-op for them.
 */
export function buildHostUpdatePayload(
  formData: FormData,
  specialPrices: SpecialPrice[],
  seoData: SeoData
) {
  const roomTypesPayload: CreateRoomTypeInput[] | undefined = formData.isHotel
    ? buildRoomTypesPayload(formData.roomTypes)
    : undefined

  return {
    name: formData.name,
    description: formData.description,
    address: formData.address,
    completeAddress: formData.completeAddress || null,
    longitude: formData.longitude || 0,
    latitude: formData.latitude || 0,
    basePrice: formData.basePrice,
    priceMGA: formData.priceMGA,
    room: formData.room ? Number(formData.room) : null,
    bathroom: formData.bathroom ? Number(formData.bathroom) : null,
    surface: formData.surface ? Number(formData.surface) : null,
    arriving: formData.arriving ? Number(formData.arriving) : 15,
    leaving: formData.leaving ? Number(formData.leaving) : 12,
    phone: formData.phone,
    phoneCountry: formData.phoneCountry || 'MG',
    minPeople: formData.minPeople ? Number(formData.minPeople) : null,
    maxPeople: formData.maxPeople ? Number(formData.maxPeople) : null,
    accessibility: formData.accessibility || false,
    petFriendly: formData.petFriendly || false,
    autoAccept: formData.autoAccept || false,
    typeId: formData.typeId,
    equipmentIds: formData.equipmentIds,
    serviceIds: formData.serviceIds,
    mealIds: formData.mealIds,
    securityIds: formData.securityIds,
    includedServiceIds: formData.includedServiceIds,
    extraIds: formData.extraIds,
    highlightIds: formData.highlightIds,
    nearbyPlaces: formData.nearbyPlaces.map(place => ({
      name: place.name,
      distance:
        place.unit === 'minutes à pied'
          ? 0
          : place.unit === 'kilomètres'
            ? place.distance
              ? Number(place.distance) * 1000
              : 0
            : place.distance
              ? Number(place.distance)
              : 0,
      duration:
        place.unit === 'minutes à pied' ? (place.distance ? Number(place.distance) : 0) : 0,
      transport:
        place.unit === 'minutes à pied'
          ? 'à pied'
          : place.unit === 'kilomètres'
            ? 'voiture'
            : 'à pied',
    })),
    proximityLandmarks: formData.proximityLandmarks || [],
    isHotel: formData.isHotel,
    hotelInfo: formData.isHotel
      ? {
          name: formData.hotelName,
          availableRooms: sumRoomQuantities(formData.roomTypes),
        }
      : null,
    roomTypes: roomTypesPayload,
    specialPrices: specialPrices.map(sp => ({
      pricesMga: sp.pricesMga,
      pricesEuro: sp.pricesEuro,
      day: sp.day,
      startDate: sp.startDate,
      endDate: sp.endDate,
      activate: sp.activate,
    })),
    seoData,
    transportOptions: formData.transportation
      ? formData.transportation
          .split(',')
          .map((name: string) => ({ name: name.trim(), description: '' }))
          .filter((t: { name: string }) => t.name.length > 0)
      : [],
    rules: {
      smokingAllowed: formData.smokingAllowed || false,
      petsAllowed: formData.petsAllowed || false,
      eventsAllowed: formData.eventsAllowed || false,
      selfCheckIn: formData.selfCheckIn || false,
      selfCheckInType: (formData.selfCheckInType as string) || undefined,
    },
    propertyInfo: {
      hasStairs: formData.hasStairs || false,
      hasElevator: formData.hasElevator || false,
      hasHandicapAccess: formData.hasHandicapAccess || false,
      hasPetsOnProperty: formData.hasPetsOnProperty || false,
      additionalNotes: (formData.additionalNotes as string) || undefined,
    },
  }
}
