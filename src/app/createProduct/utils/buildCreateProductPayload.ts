import type { CreateProductInput } from '@/lib/interface/userInterface'
import type { ProductFormData, SpecialPrice } from '@/types/product-form'
import {
  buildRoomTypesPayload,
  deriveHotelBasePrice,
  sumRoomQuantities,
} from './roomTypeHelpers'

interface SeoData {
  metaTitle?: string
  metaDescription?: string
  keywords?: string
  slug?: string
}

interface BuildCreateProductPayloadParams {
  formData: ProductFormData
  seoData: SeoData
  userId: string
  /** Establishment-level special prices (used only for non-hotel products). */
  specialPrices: SpecialPrice[]
}

/**
 * Assemble the `createProduct` payload from wizard state.
 *
 * Non-hotel products keep the exact previous shape (establishment-level meals /
 * extras / included services / special prices). Hotels derive the product-level
 * base price from the cheapest room type, move meals / extras / included services
 * into per-type `roomTypes`, drop establishment special prices, and populate the
 * deprecated `availableRooms` as the sum of every type's quantity.
 */
export function buildCreateProductPayload({
  formData,
  seoData,
  userId,
  specialPrices,
}: BuildCreateProductPayloadParams): CreateProductInput {
  const isHotel = formData.isHotel
  const hotelDerived = isHotel ? deriveHotelBasePrice(formData.roomTypes) : null

  return {
    name: formData.name,
    description: formData.description,
    address: formData.address,
    completeAddress: formData.completeAddress || null,
    longitude: formData.longitude,
    latitude: formData.latitude,
    basePrice: hotelDerived ? hotelDerived.basePrice : formData.basePrice,
    priceMGA: hotelDerived ? hotelDerived.priceMGA : formData.priceMGA,
    room: formData.room ? Number(formData.room) : null,
    bathroom: formData.bathroom ? Number(formData.bathroom) : null,
    surface: formData.surface ? Number(formData.surface) : null,
    minPeople: formData.minPeople ? Number(formData.minPeople) : null,
    maxPeople: formData.maxPeople ? Number(formData.maxPeople) : null,
    arriving: formData.arriving,
    leaving: formData.leaving,
    autoAccept: formData.autoAccept || false,
    accessibility: formData.accessibility || false,
    petFriendly: formData.petFriendly || false,
    phone: formData.phone,
    phoneCountry: formData.phoneCountry || 'MG',
    typeId: formData.typeId,
    userId: [userId],
    equipments: formData.equipmentIds,
    services: formData.serviceIds,
    // Meals / included services / extras are per-type for hotels → establishment lists cleared.
    meals: isHotel ? [] : formData.mealIds,
    securities: formData.securityIds,
    includedServices: isHotel ? [] : formData.includedServiceIds,
    extras: isHotel ? [] : formData.extraIds,
    highlights: formData.highlightIds,
    images: [],
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
      duration: place.unit === 'minutes à pied' ? (place.distance ? Number(place.distance) : 0) : 0,
      transport:
        place.unit === 'minutes à pied'
          ? 'à pied'
          : place.unit === 'kilomètres'
            ? 'voiture'
            : 'à pied',
    })),
    isHotel,
    hotelInfo: isHotel
      ? { name: formData.hotelName, availableRooms: sumRoomQuantities(formData.roomTypes) }
      : null,
    roomTypes: isHotel ? buildRoomTypesPayload(formData.roomTypes) : undefined,
    // Establishment special prices only apply to non-hotel products (per-type otherwise).
    specialPrices: isHotel
      ? []
      : specialPrices.map(sp => ({
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
  }
}
