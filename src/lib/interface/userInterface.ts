import { UserRole } from '@prisma/client'

export interface UserInterface {
  id: string
  email: string
  name: string | null
  lastname?: string
  image?: string
  info?: string
  emailVerified?: Date
  password?: string
  roles: UserRole
}

export interface NearbyPlace {
  name: string
  distance: number | string
  duration: number | string
  transport: string
}

export interface TransportOption {
  name: string
  description?: string
}

export interface PropertyInfo {
  hasStairs: boolean
  hasElevator: boolean
  hasHandicapAccess: boolean
  hasPetsOnProperty: boolean
  additionalNotes?: string
}

export interface CancellationPolicy {
  freeCancellationHours: number | string
  partialRefundPercent: number | string
  additionalTerms?: string
}

export interface HotelInfo {
  name: string
  availableRooms: number
}

export interface CreateProductInput {
  name: string
  description: string
  address: string
  longitude: number | string
  latitude: number | string
  basePrice: string
  priceMGA: string
  room?: number | string | null
  bathroom?: number | string | null
  arriving: number | string
  leaving: number | string
  phone?: string
  phoneCountry?: string
  typeId: string
  userId: string[]
  equipments: string[]
  services: string[]
  meals: string[]
  securities: string[]
  includedServices?: string[]
  extras?: string[]
  highlights?: string[]
  images: string[]
  nearbyPlaces?: NearbyPlace[]
  transportOptions?: TransportOption[]
  propertyInfo?: PropertyInfo
  cancellationPolicy?: CancellationPolicy
  // Nouveaux champs pour les hôtels
  isHotel?: boolean
  hotelInfo?: HotelInfo | null
}

export interface Product {
  // ... existing fields ...
  nearbyPlaces?: {
    name: string
    distance: number
    duration: number
    transport: string
  }[]
  transportOptions?: {
    name: string
    description?: string
  }[]
  propertyInfo?: {
    hasStairs: boolean
    hasElevator: boolean
    hasHandicapAccess: boolean
    hasPetsOnProperty: boolean
    additionalNotes?: string
  }
  cancellationPolicy?: {
    freeCancellationHours: number
    partialRefundPercent: number
    additionalTerms?: string
  }
}
