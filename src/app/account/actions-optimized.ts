'use server'

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath, revalidateTag } from 'next/cache'
import { unstable_cache } from 'next/cache'

// Optimized getUserData with single query and caching
export const getUserDataOptimized = unstable_cache(
  async (userEmail: string) => {
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        name: true,
        lastname: true,
        email: true,
        image: true,
        profilePicture: true,
        password: true,
        createdAt: true,
        averageRating: true,
        totalRatings: true,
        totalTrips: true,
        _count: {
          select: {
            Rent: {
              where: {
                status: 'CHECKOUT'
              }
            }
          }
        },
        Rent: {
          include: {
            product: {
              include: {
                img: true,
              },
            },
          },
          orderBy: {
            arrivingDate: 'desc'
          },
          take: 10 // Limit to recent 10 rentals for performance
        },
        favorites: {
          include: {
            product: {
              include: {
                img: true,
              },
            },
          },
          orderBy: {
            id: 'desc'
          },
          take: 20 // Limit to 20 favorites for performance
        },
        // Get ratings in the same query
        receivedRatings: {
          where: {
            approved: true
          },
          select: {
            rating: true
          }
        }
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Calculate statistics from the fetched data
    const completedRents = user._count.Rent
    const averageRating = user.receivedRatings.length > 0
      ? user.receivedRatings.reduce((sum, r) => sum + r.rating, 0) / user.receivedRatings.length
      : null
    const totalRatings = user.receivedRatings.length

    // Only update if stats have changed
    const needsUpdate = 
      user.totalTrips !== completedRents ||
      user.averageRating !== averageRating ||
      user.totalRatings !== totalRatings

    if (needsUpdate) {
      // Update stats asynchronously without blocking the response
      prisma.user.update({
        where: { id: user.id },
        data: {
          totalTrips: completedRents,
          averageRating: averageRating,
          totalRatings: totalRatings,
        },
      }).then(() => {
        revalidateTag(`user-${user.id}`)
      }).catch(console.error)
    }

    // Remove internal fields from response
    const { receivedRatings, _count, ...userData } = user

    return {
      ...userData,
      totalTrips: completedRents,
      averageRating: averageRating,
      totalRatings: totalRatings,
    }
  },
  ['user-data'],
  {
    revalidate: 60 * 5, // 5 minutes cache
    tags: ['user-data'],
  }
)

export async function getUserData() {
  const session = await auth()
  if (!session?.user?.email) {
    throw new Error('Not authenticated')
  }

  return getUserDataOptimized(session.user.email)
}

// Batch update user profile with optimistic updates
export async function updateUserProfileBatch(data: {
  name?: string
  lastname?: string
  email?: string
  profilePicture?: string
}) {
  const session = await auth()
  if (!session?.user?.email) {
    throw new Error('Not authenticated')
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: data,
    })

    // Invalidate caches
    revalidateTag('user-data')
    revalidateTag(`user-${updatedUser.id}`)
    revalidatePath('/account')

    return updatedUser
  } catch (error) {
    console.error('Error updating user profile:', error)
    throw new Error('Failed to update profile')
  }
}

export async function updateUserProfile(data: { name: string; lastname: string }) {
  return updateUserProfileBatch(data)
}

export async function updateUserPhoto(formData: FormData) {
  const base64Image = formData.get('file') as string
  if (!base64Image) {
    throw new Error('No image provided')
  }

  return updateUserProfileBatch({ profilePicture: base64Image })
}

export async function updateUserPersonalInfo(data: {
  name: string
  lastname: string
  email: string
}) {
  return updateUserProfileBatch(data)
}