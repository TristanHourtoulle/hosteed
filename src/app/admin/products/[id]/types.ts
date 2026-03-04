import {
  Product,
  ProductValidation,
  DayEnum,
  ExtraPriceType,
  RentStatus,
  PaymentStatus,
} from '@prisma/client'

export interface AdminProductOwner {
  id: string
  name: string | null
  lastname: string | null
  email: string
  image: string | null
  profilePicture: string | null
  profilePictureBase64: string | null
}

export interface AdminProductReview {
  id: string
  title: string
  text: string
  grade: number
  welcomeGrade: number
  staff: number
  comfort: number
  equipment: number
  cleaning: number
  visitDate: Date
  publishDate: Date
  approved: boolean
}

export interface NearbyPlace {
  id: string
  name: string
  distance: number
  duration: number
  transport: string
}

export interface TransportOption {
  id: string
  name: string
  description: string | null
}

export interface PropertyInfo {
  id: string
  hasStairs: boolean
  hasElevator: boolean
  hasHandicapAccess: boolean
  hasPetsOnProperty: boolean
  additionalNotes: string | null
}

export interface ProductRules {
  id: string
  smokingAllowed: boolean
  petsAllowed: boolean
  eventsAllowed: boolean
  checkInTime: string
  checkOutTime: string
  selfCheckIn: boolean
  selfCheckInType: string | null
}

export interface ProductExtraItem {
  id: string
  name: string
  description: string | null
  priceEUR: number
  priceMGA: number
  type: ExtraPriceType
}

export interface ProductHighlightItem {
  id: string
  name: string
  description: string | null
  icon: string | null
}

export interface IncludedServiceItem {
  id: string
  name: string
  description: string | null
  icon: string | null
}

export interface SecurityItem {
  id: string
  name: string
}

export interface ProductPromotion {
  id: string
  discountPercentage: number
  startDate: Date
  endDate: Date
  isActive: boolean
}

export interface AdminRent {
  id: string
  arrivingDate: Date
  leavingDate: Date
  numberPeople: bigint
  status: RentStatus
  payment: PaymentStatus
  prices: bigint
  user: {
    id: string
    name: string | null
    lastname: string | null
    email: string
  }
  options: Array<{
    id: string
    name: string
    price: bigint
  }>
}

export interface AdminProductWithRelations extends Product {
  type: { id: string; name: string } | null
  equipments: Array<{ id: string; name: string }>
  servicesList: Array<{ id: string; name: string }>
  mealsList: Array<{ id: string; name: string }>
  img: Array<{ id: string; img: string }>
  reviews: AdminProductReview[]
  owner: AdminProductOwner
  securities: SecurityItem[]
  includedServices: IncludedServiceItem[]
  extras: ProductExtraItem[]
  highlights: ProductHighlightItem[]
  hotel: Array<{ id: string; name: string }>
  rules: ProductRules[]
  nearbyPlaces: NearbyPlace[]
  transportOptions: TransportOption[]
  propertyInfo: PropertyInfo | null
  promotions: ProductPromotion[]
  rents: AdminRent[]
  options: Array<{ id: string; name: string; price: bigint }>
  discount: Array<{ id: string }>
}

export interface SpecialPrice {
  id: string
  pricesMga: string
  pricesEuro: string
  day: DayEnum[]
  startDate: Date | null
  endDate: Date | null
  activate: boolean
  productId: string
}

export interface SpecialPriceData {
  pricesMga: string
  pricesEuro: string
  day: DayEnum[]
  startDate: Date | null
  endDate: Date | null
  activate: boolean
}

export { ProductValidation }
