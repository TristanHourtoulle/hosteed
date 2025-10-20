import { ExtraPriceType, DayEnum } from '@prisma/client'

export interface Equipment {
  id: string
  name: string
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

export interface SpecialPrice {
  id: string
  pricesMga: string
  pricesEuro: string
  day: DayEnum[]
  startDate: Date | null
  endDate: Date | null
  activate: boolean
}

export interface NearbyPlace {
  name: string
  distance: string
  unit: 'mètres' | 'kilomètres'
}

export interface ImageFile {
  file: File | null // null for existing images from DB
  preview: string // URL for existing images, base64 for new images
  id: string
  isExisting?: boolean // true if image already exists in DB
  url?: string // Original URL for existing images
}

export interface FormData {
  name: string
  description: string
  address: string
  placeId?: string
  phone: string
  phoneCountry: string
  room: string
  bathroom: string
  arriving: string
  leaving: string
  basePrice: string
  priceMGA: string
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
  accessibility: boolean
  petFriendly: boolean
  nearbyPlaces: NearbyPlace[]
  proximityLandmarks: string[] // Points de repère pour localisation (texte libre)
  transportation: string
  isHotel: boolean
  hotelName: string
  availableRooms: string
  [key: string]: unknown
}

export interface TestBooking {
  startDate: Date
  endDate: Date
  guestCount: number
}
