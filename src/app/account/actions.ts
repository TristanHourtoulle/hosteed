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
    include: {
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

  const file = formData.get('file') as File
  if (!file) {
    throw new Error('No file provided')
  }

  // TODO: Upload file to storage service (e.g. S3, Cloudinary)
  // For now, we'll just update the image URL in the database
  const imageUrl = URL.createObjectURL(file)

  await prisma.user.update({
    where: { email: session.user.email },
    data: {
      image: imageUrl,
    },
  })

  revalidatePath('/account')
}
