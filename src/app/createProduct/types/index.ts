import { ExtraPriceType } from '@prisma/client'

// ===== RE-EXPORT UNIFIED TYPES =====
// Import unified form types from central location
export type {
  ProductFormData,
  ProductFormErrors,
  ProductFormState,
  NearbyPlace,
  ImageFile,
  SpecialPrice,
  TestBooking,
} from '@/types/product-form'

export { DEFAULT_FORM_DATA } from '@/types/product-form'

// Alias for backward compatibility
export type { ProductFormData as FormData } from '@/types/product-form'

// ===== ENTITY INTERFACES =====
// These interfaces represent database entities from Prisma

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
