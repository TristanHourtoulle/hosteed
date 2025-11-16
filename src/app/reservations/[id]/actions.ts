import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getPayablePricesPerRent } from '@/lib/services/payment.service'
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
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              roles: true,
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
  if (!reservation.product.owner) {
    redirect('/account')
  }

  return { reservation, host: reservation.product.owner } as unknown as ReservationDetails
}

export async function getPaymentDetailsForReservation(reservationId: string) {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth')
  }

  // Vérifier que l'utilisateur peut accéder à cette réservation
  const reservation = await prisma.rent.findUnique({
    where: {
      id: reservationId,
      userId: session.user.id,
    },
    select: {
      id: true,
    },
  })

  if (!reservation) {
    redirect('/account')
  }

  try {
    const paymentDetails = await getPayablePricesPerRent(reservationId)
    return paymentDetails
  } catch (error) {
    console.error('Error fetching payment details:', error)
    return null
  }
}
