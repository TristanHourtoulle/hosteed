import { Product, Rent, User } from '@prisma/client'

export interface ExtendedRent extends Rent {
  arrivingDate: Date
  leavingDate: Date
  status: 'WAITING' | 'RESERVED' | 'CHECKIN' | 'CHECKOUT' | 'CANCEL'
}

export interface ExtendedUser extends User {
  Product: Product[]
  Rent: ExtendedRent[]
}
