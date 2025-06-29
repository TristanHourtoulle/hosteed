import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function getUserData() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      Rent: {
        include: {
          product: {
            include: {
              img: true,
            },
          },
        },
        orderBy: {
          arrivingDate: 'desc',
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
    redirect('/auth')
  }

  return user
}
