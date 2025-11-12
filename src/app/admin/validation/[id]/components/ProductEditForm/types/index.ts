import { ExtraPriceType, ProductValidation, DayEnum } from '@prisma/client'

export interface SpecialPrice {
  id: string
  pricesMga: string
  pricesEuro: string
  day: DayEnum[]
  startDate: Date | null
  endDate: Date | null
  activate: boolean
}

export interface Equipment {
  id: string
  name: string
  icon: string
}

export interface Meal {
  id: string
  name: string
}

export interface Security {
  id: string
  name: string
}

export interface Service {
  id: string
  name: string
}

export interface IncludedService {
  id: string
  name: string
  description: string | null
  icon: string | null
  userId: string | null
}

export interface ProductExtra {
  id: string
  name: string
  description: string | null
  priceEUR: number
  priceMGA: number
  type: ExtraPriceType
  userId: string | null
  createdAt?: Date
  updatedAt?: Date
}

export interface PropertyHighlight {
  id: string
  name: string
  description: string | null
  icon: string | null
  userId: string | null
}

export interface NearbyPlace {
  name: string
  distance: string
  unit: 'mètres' | 'kilomètres'
}

export interface ImageFile {
  file: File | null
  preview: string
  id: string
  isExisting?: boolean
  url?: string
}

export interface Product {
  id: string
  name: string
  description: string
  address: string
  basePrice: string
  priceMGA?: string
  availableRooms?: number
  guest: number
  bedroom: number
  bed: number
  bathroom: number
  arriving: number
  leaving: number
  validate: ProductValidation
  img?: { img: string }[]
  owner: {
    id: string
    name?: string | null
    lastname?: string | null
    email: string
  }
  type?: { id: string; name: string; description: string }
  equipments?: { id: string; name: string; icon: string }[]
  mealsList?: { id: string; name: string }[]
  servicesList?: { id: string; name: string }[]
  securities?: { id: string; name: string }[]
  includedServices?: { id: string; name: string; description: string | null; icon: string | null }[]
  extras?: {
    id: string
    name: string
    description: string | null
    priceEUR: number
    priceMGA: number
    type: ExtraPriceType
  }[]
  highlights?: { id: string; name: string; description: string | null; icon: string | null }[]
}

export interface ProductEditFormProps {
  product: Product
  onSave: (updatedProduct: Product) => void
  onCancel: () => void
}

export interface FormData {
  name: string
  description: string
  address: string // Localisation Google Maps (visible sur l'annonce)
  completeAddress: string // Adresse complète manuelle (visible dans le mail de confirmation)
  placeId?: string
  phone: string
  phoneCountry: string
  room: string
  bathroom: string
  arriving: string
  leaving: string
  basePrice: string
  priceMGA: string
  basePriceMGA: string
  specialPrices: SpecialPrice[]
  autoAccept: boolean
  typeId: string
  equipmentIds: string[]
  mealIds: string[]
  securityIds: string[]
  serviceIds: string[]
  includedServiceIds: string[]
  extraIds: string[]
  highlightIds: string[]
  surface: string
  maxPeople: string
  minPeople: string
  accessibility: boolean
  petFriendly: boolean
  nearbyPlaces: NearbyPlace[]
  proximityLandmarks: string[] // Points de repère pour localisation (texte libre)
  transportation: string
  typeRentId: string
  isHotel: boolean
  hotelName: string
  availableRooms: string
  [key: string]: unknown
}

// Test booking interface - currently unused but kept for future features
// export interface TestBooking {
//   startDate: Date
//   endDate: Date
//   guestCount: number
// }
