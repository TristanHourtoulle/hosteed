import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ReservationDetails } from './types'

export async function getReservationDetails(reservationId: string): Promise<ReservationDetails> {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth')
  }

  const reservation = await prisma.rent.findUnique({
    where: {
      id: reservationId,
      userId: session.user.id, // Security: ensure the user can only see their own reservations
    },
    include: {
      product: {
        include: {
          img: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          rules: true,
          propertyInfo: true,
          nearbyPlaces: true,
          transportOptions: true,
          equipments: true,
          servicesList: true,
          mealsList: true,
          securities: true,
        },
      },
      options: true,
      PayRequest: {
        orderBy: {
          id: 'desc',
        },
        take: 1,
      },
    },
  })

  if (!reservation) {
    redirect('/account')
  }

  // Add host information in the reservation
  const host = await prisma.user.findUnique({
    where: {
      id: reservation.product.user[0].id,
    },
  })

  return { reservation, host } as unknown as ReservationDetails
}
