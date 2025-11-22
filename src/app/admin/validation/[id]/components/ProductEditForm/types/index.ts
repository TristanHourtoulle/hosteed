import { ExtraPriceType, ProductValidation } from '@prisma/client'

// ===== RE-EXPORT UNIFIED TYPES =====
// Import unified form types from central location
export type {
  ProductFormData,
  NearbyPlace,
  ImageFile,
  SpecialPrice,
} from '@/types/product-form'

// Alias for backward compatibility
export type { ProductFormData as FormData } from '@/types/product-form'

// ===== ENTITY INTERFACES =====
// These interfaces represent database entities from Prisma

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

export interface Product {
  id: string
  name: string
  description: string
  address: string
  latitude?: number
  longitude?: number
  basePrice: string
  priceMGA?: string
  availableRooms?: number
  room?: number // Nombre de chambres (bedroom in schema is actually 'room')
  bathroom?: number
  arriving: number // Hour as integer (e.g., 14 for 14:00)
  leaving: number // Hour as integer (e.g., 12 for 12:00)
  validate: ProductValidation
  phone?: string
  phoneCountry?: string
  surface?: number
  minPeople?: number
  maxPeople?: number
  nearbyPlaces?: { name: string; distance: string; duration: string; transport: string }[]
  propertyInfo?: {
    hasHandicapAccess?: boolean
    hasPetsOnProperty?: boolean
  } | null
  hotel?: { id: string; name: string }[] // Array because it's a one-to-many relation
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
