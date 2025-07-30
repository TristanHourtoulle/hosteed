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
  roles: 'ADMIN' | 'BLOGWRITTER' | 'HOST' | 'HOST_VERIFIED' | 'USER'
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
}

export interface ReservationDetails {
  reservation: Reservation
  host: Host
}
