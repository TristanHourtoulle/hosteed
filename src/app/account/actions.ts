'use server'

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getUserData() {
  const session = await auth()
  if (!session?.user?.email) {
    throw new Error('Not authenticated')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
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
      Rent: {
        include: {
          product: {
            include: {
              img: true,
            },
          },
        },
      },
      favorites: {
        include: {
          product: {
            include: {
              img: true,
            },
          },
        },
      },
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Calculer les statistiques réelles si elles ne sont pas à jour
  const completedRents = await prisma.rent.count({
    where: {
      userId: user.id,
      status: 'CHECKOUT', // Séjours terminés
    },
  })

  // Calculer la note moyenne reçue
  const userRatings = await prisma.userRating.findMany({
    where: {
      ratedId: user.id,
      approved: true,
    },
    select: {
      rating: true,
    },
  })

  const averageRating =
    userRatings.length > 0
      ? userRatings.reduce((sum, rating) => sum + rating.rating, 0) / userRatings.length
      : null

  // Mettre à jour les statistiques si nécessaire
  if (
    user.totalTrips !== completedRents ||
    user.averageRating !== averageRating ||
    user.totalRatings !== userRatings.length
  ) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        totalTrips: completedRents,
        averageRating: averageRating,
        totalRatings: userRatings.length,
      },
    })
  }

  return {
    ...user,
    totalTrips: completedRents,
    averageRating: averageRating,
    totalRatings: userRatings.length,
  }
}

export async function updateUserProfile(data: { name: string; lastname: string }) {
  const session = await auth()
  if (!session?.user?.email) {
    throw new Error('Not authenticated')
  }

  await prisma.user.update({
    where: { email: session.user.email },
    data: {
      name: data.name,
      lastname: data.lastname,
    },
  })

  revalidatePath('/account')
}

export async function updateUserPhoto(formData: FormData) {
  const session = await auth()
  if (!session?.user?.email) {
    throw new Error('Not authenticated')
  }

  const base64Image = formData.get('file') as string
  if (!base64Image) {
    throw new Error('No image provided')
  }

  await prisma.user.update({
    where: { email: session.user.email },
    data: {
      profilePicture: base64Image,
    },
  })

  revalidatePath('/account')
}

export async function updateUserPersonalInfo(data: {
  name: string
  lastname: string
  email: string
}) {
  const session = await auth()
  if (!session?.user?.email) {
    throw new Error('Not authenticated')
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name: data.name,
        lastname: data.lastname,
        email: data.email,
      },
    })

    revalidatePath('/account')
    return { success: true, user: updatedUser }
  } catch (error) {
    console.error('Error updating user:', error)
    throw new Error('Failed to update user information')
  }
}
