'use server'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendTemplatedMail } from '@/lib/services/sendTemplatedMail'

export async function GET() {
  try {
    const tomorrow = new Date()
    tomorrow.setUTCHours(0, 0, 0, 0)
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)

    const dayAfterTomorrow = new Date(tomorrow)
    dayAfterTomorrow.setUTCDate(dayAfterTomorrow.getUTCDate() + 1)

    const rent = await prisma.rent.findMany({
      where: {
        arrivingDate: {
          gte: tomorrow,
          lt: dayAfterTomorrow,
        },
        accepted: true,
      },
      include: {
        product: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    })
    console.log('Résultats trouvés:', rent)

    // Envoyer des rappels aux hôtes (propriétaires du produit)
    for (const unique of rent) {
      if (unique.product.owner) {
        const host = unique.product.owner
        console.log(`Envoi de rappel à l'hôte: ${host.email}`)
        try {
          await sendTemplatedMail(
            host.email,
            'Rappel de réservation !',
            'cron-reminder-host.html',
            {
              bookId: unique.id,
              establishmentName: unique.product.name,
              establishmentAddress: unique.product.address,
              checkInDate: unique.arrivingDate.toDateString(),
              checkInTime: unique.product.arriving,
              checkOutDate: unique.leavingDate.toDateString(),
              checkOutTime: unique.product.leaving,
              establishmentPhone: unique.product.phone,
              name: unique.user?.name || '',
              bookUrl: process.env.NEXTAUTH_URL + '/reservation/' + unique.id,
            }
          )
          console.log(`Email envoyé avec succès à l'hôte: ${host.email}`)
        } catch (error) {
          console.error(`Erreur lors de l'envoi à l'hôte ${host.email}:`, error)
        }
      }
    }

    // Envoyer des rappels aux clients (utilisateurs qui ont réservé)
    for (const unique of rent) {
      if (unique.user) {
        console.log(`Envoi de rappel au client: ${unique.user.email}`)
        try {
          await sendTemplatedMail(
            unique.user.email,
            'Rappel de réservation !',
            'cron-reminder-client.html',
            {
              bookId: unique.id,
              establishmentName: unique.product.name,
              establishmentAddress: unique.product.address,
              checkInDate: unique.arrivingDate.toDateString(),
              checkInTime: unique.product.arriving,
              checkOutDate: unique.leavingDate.toDateString(),
              checkOutTime: unique.product.leaving,
              establishmentPhone: unique.product.phone,
              name: unique.user.name || '',
              bookUrl: process.env.NEXTAUTH_URL + '/reservation/' + unique.id,
            }
          )
          console.log(`Email envoyé avec succès au client: ${unique.user.email}`)
        } catch (error) {
          console.error(`Erreur lors de l'envoi au client ${unique.user.email}:`, error)
        }
      }
    }

    return NextResponse.json('200')
  } catch (error) {
    console.error('Error fetching upcoming rents:', error)
    return NextResponse.json({ error: 'Failed to fetch upcoming rents' }, { status: 500 })
  }
}
