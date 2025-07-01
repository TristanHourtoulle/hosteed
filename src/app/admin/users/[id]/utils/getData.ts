import { findUserById } from '@/lib/services/user.service'
import { notFound } from 'next/navigation'
import type { ExtendedUser } from '../types'

export async function getUserData(id: string) {
  if (!id) {
    notFound()
  }

  try {
    const userData = await findUserById(id)
    if (!userData) {
      notFound()
    }

    // Cast and transform the data
    const user = userData as unknown as ExtendedUser
    return {
      ...user,
      Rent: user.Rent.map(rent => ({
        ...rent,
        arrivingDate: new Date(rent.arrivingDate),
        leavingDate: new Date(rent.leavingDate),
      })),
    }
  } catch (error) {
    console.error('Error fetching user:', error)
    throw new Error('Failed to fetch user data')
  }
}
