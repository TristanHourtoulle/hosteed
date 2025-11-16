import { PaymentStatus, RentStatus } from '@prisma/client'

export interface Equipment {
  id: string
  name: string
}

export interface Service {
  id: string
  name: string
}

export interface Security {
  id: string
  name: string
}

export interface Meal {
  id: string
  name: string
}

export interface Transport {
  id: string
  name: string
}

export interface NearbyPlace {
  id: string
  name: string
}

export interface Image {
  id: string
  img: string
}

export interface Host {
  id: string
  name: string | null
  email: string
  image: string | null
  roles: 'ADMIN' | 'BLOGWRITER' | 'HOST' | 'HOST_VERIFIED' | 'USER'
}

export interface Product {
  id: string
  name: string
  address: string
  img: Image[]
  user: Host
  equipments: Equipment[]
  servicesList: Service[]
  securities: Security[]
  mealsList: Meal[]
  transportOptions: Transport[]
  nearbyPlaces: NearbyPlace[]
  proximityLandmarks: string[]
}

export interface Reservation {
  id: string
  stripeId: string | null
  productId: string
  userId: string
  numberPeople: bigint
  notes: bigint
  accepted: boolean
  prices: bigint
  arrivingDate: Date
  leavingDate: Date
  payment: PaymentStatus
  status: RentStatus
  confirmed: boolean
  product: Product
  // New pricing fields
  numberOfNights: number | null
  basePricePerNight: number | null
  subtotal: number | null
  promotionApplied: boolean
  specialPriceApplied: boolean
  discountAmount: number | null
  totalSavings: number | null
  extrasTotal: number | null
  clientCommission: number | null
  hostCommission: number | null
  platformAmount: number | null
  hostAmount: number | null
  totalAmount: number | null
  pricingSnapshot: unknown
  options?: Array<{
    id: string
    name: string
    price: bigint
    type: bigint
    productId: string
  }>
}

export interface ReservationDetails {
  reservation: Reservation
  host: Host
}
