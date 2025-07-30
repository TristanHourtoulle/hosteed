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
      password: true,
      createdAt: true,
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

  return user
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
      image: base64Image,
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
