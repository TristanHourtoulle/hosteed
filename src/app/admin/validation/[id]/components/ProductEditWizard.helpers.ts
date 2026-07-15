import type { ProductFormData } from '@/types/product-form'
import {
  buildRoomTypesPayload,
  mapDbRoomTypeToForm,
} from '@/app/createProduct/utils/roomTypeHelpers'
import type { CreateRoomTypeInput } from '@/lib/services/room-type.service'
import type { Product } from './ProductEditForm/types'

// Re-exported for backward compatibility: the mapper now lives with the other
// room-type helpers so the host edit page can reuse it (TRI-1028).
export { mapDbRoomTypeToForm }

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`
}

function parseHour(timeStr: string): number {
  if (!timeStr) return 0
  const hour = parseInt(timeStr.split(':')[0])
  return isNaN(hour) ? 0 : hour
}

/** Build the wizard's initial `ProductFormData` from an existing product. */
export function buildInitialFormData(product: Product): ProductFormData {
  return {
    name: product.name,
    description: product.description,
    address: product.address,
    completeAddress: '',
    placeId: '',
    latitude: product.latitude || 0,
    longitude: product.longitude || 0,
    phone: product.phone || '',
    phoneCountry: product.phoneCountry || 'MG',
    typeId: product.type?.id || '',
    typeRentId: product.type?.id || '',
    room: product.room?.toString() || '',
    bathroom: product.bathroom?.toString() || '',
    arriving: product.arriving ? formatHour(product.arriving) : '',
    leaving: product.leaving ? formatHour(product.leaving) : '',
    basePrice: product.basePrice,
    priceMGA: product.priceMGA || '',
    basePriceMGA: product.priceMGA || '',
    specialPrices: [],
    autoAccept: false,
    equipmentIds: product.equipments?.map(e => e.id) || [],
    mealIds: product.mealsList?.map(m => m.id) || [],
    securityIds: product.securities?.map(s => s.id) || [],
    serviceIds: product.servicesList?.map(s => s.id) || [],
    includedServiceIds: product.includedServices?.map(s => s.id) || [],
    extraIds: product.extras?.map(e => e.id) || [],
    highlightIds: product.highlights?.map(h => h.id) || [],
    surface: product.surface?.toString() || '',
    minPeople: product.minPeople?.toString() || '',
    maxPeople: product.maxPeople?.toString() || '',
    accessibility: product.propertyInfo?.hasHandicapAccess || false,
    petFriendly: product.propertyInfo?.hasPetsOnProperty || false,
    nearbyPlaces:
      product.nearbyPlaces?.map(place => ({
        name: place.name,
        distance: place.distance || '',
        unit: (place.distance && parseFloat(place.distance) < 1000
          ? 'mètres'
          : 'kilomètres') as 'mètres' | 'kilomètres',
      })) || [],
    proximityLandmarks: [],
    transportation: product.transportOptions?.map(t => t.name).join(', ') || '',
    smokingAllowed: product.rules?.smokingAllowed || false,
    petsAllowed: product.rules?.petsAllowed || false,
    eventsAllowed: product.rules?.eventsAllowed || false,
    selfCheckIn: product.rules?.selfCheckIn || false,
    selfCheckInType: product.rules?.selfCheckInType || '',
    hasStairs: product.propertyInfo?.hasStairs || false,
    hasElevator: product.propertyInfo?.hasElevator || false,
    hasHandicapAccess: product.propertyInfo?.hasHandicapAccess || false,
    hasPetsOnProperty: product.propertyInfo?.hasPetsOnProperty || false,
    additionalNotes: product.propertyInfo?.additionalNotes || '',
    isHotel: !!(product.hotel && product.hotel.length > 0),
    hotelName: product.hotel && product.hotel.length > 0 ? product.hotel[0].name : '',
    availableRooms: product.availableRooms?.toString() || '',
    roomTypes: (product.roomTypes ?? []).map(mapDbRoomTypeToForm),
  }
}

export interface SeoData {
  metaTitle?: string
  metaDescription?: string
  keywords?: string
  slug?: string
}

/**
 * Build the PUT payload from wizard state. For hotels, the reconciled
 * `roomTypes` list (with preserved ids) is sent so `syncRoomTypes` can
 * create/update/delete; the legacy `availableRooms` is derived from the sum of
 * quantities for backward-compatible reads. Non-hotel products omit roomTypes.
 */
export function buildUpdatePayload(
  formData: ProductFormData,
  seoData: SeoData,
  product: Product
) {
  const roomTypesPayload: CreateRoomTypeInput[] | undefined = formData.isHotel
    ? buildRoomTypesPayload(formData.roomTypes)
    : undefined

  const derivedAvailableRooms = roomTypesPayload
    ? roomTypesPayload.reduce((total, rt) => total + (rt.quantity || 0), 0)
    : Number(formData.availableRooms) || 0

  return {
    name: formData.name,
    description: formData.description,
    address: formData.address,
    completeAddress: formData.completeAddress || null,
    longitude: formData.longitude || product.longitude || 0,
    latitude: formData.latitude || product.latitude || 0,
    basePrice: formData.basePrice,
    priceMGA: formData.priceMGA || null,
    room: formData.room ? parseInt(formData.room) : null,
    bathroom: formData.bathroom ? parseInt(formData.bathroom) : null,
    surface: formData.surface ? Number(formData.surface) : null,
    minPeople: formData.minPeople ? Number(formData.minPeople) : null,
    maxPeople: formData.maxPeople ? Number(formData.maxPeople) : null,
    arriving: parseHour(formData.arriving),
    leaving: parseHour(formData.leaving),
    autoAccept: formData.autoAccept || false,
    phone: formData.phone,
    phoneCountry: formData.phoneCountry || 'MG',
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
      distance: place.distance ? Number(place.distance) : 0,
      duration: 0,
      transport: place.unit === 'kilomètres' ? 'voiture' : 'à pied',
    })),
    isHotel: formData.isHotel,
    hotelInfo: formData.isHotel
      ? { name: formData.hotelName, availableRooms: derivedAvailableRooms }
      : undefined,
    roomTypes: roomTypesPayload,
    transportOptions: formData.transportation
      ? formData.transportation
          .split(',')
          .map((name: string) => ({ name: name.trim(), description: '' }))
          .filter((t: { name: string }) => t.name.length > 0)
      : undefined,
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
    seoData: {
      metaTitle: seoData.metaTitle,
      metaDescription: seoData.metaDescription,
      keywords: seoData.keywords,
      slug: seoData.slug,
    },
  }
}
