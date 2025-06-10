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
