import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { emailService } from '@/lib/services/email'

export async function GET() {
  try {
    const tomorrow = new Date()
    tomorrow.setUTCHours(0, 0, 0, 0)
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)

    const dayAfterTomorrow = new Date(tomorrow)
    dayAfterTomorrow.setUTCDate(dayAfterTomorrow.getUTCDate() + 1)

    const rents = await prisma.rent.findMany({
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
                emailBounced: true,
                emailOptOut: true,
              },
            },
          },
        },
        user: {
          select: {
            email: true,
            name: true,
            emailBounced: true,
            emailOptOut: true,
          },
        },
      },
    })

    console.log(`[Cron] Found ${rents.length} reservations arriving tomorrow`)

    let hostEmailsSent = 0
    let clientEmailsSent = 0

    // Send reminders to hosts
    for (const rent of rents) {
      const host = rent.product.owner
      if (!host) continue

      // Skip if host has opted out or email bounced
      if (host.emailOptOut || host.emailBounced) {
        console.log(`[Cron] Skipping host ${host.email} - opted out or bounced`)
        continue
      }

      try {
        const result = await emailService.sendBookingReminder(
          host.email,
          host.name ?? 'Hôte',
          true, // isHost
          {
            bookId: rent.id,
            establishmentName: rent.product.name,
            establishmentAddress: rent.product.address,
            checkInDate: rent.arrivingDate.toDateString(),
            checkInTime: rent.product.arriving,
            checkOutDate: rent.leavingDate.toDateString(),
            checkOutTime: rent.product.leaving,
            establishmentPhone: rent.product.phone,
            guestName: rent.user?.name ?? '',
            bookUrl: `${process.env.NEXTAUTH_URL}/reservation/${rent.id}`,
          }
        )

        if (result.success) {
          hostEmailsSent++
          console.log(`[Cron] Reminder sent to host: ${host.email}`)
        } else {
          console.error(`[Cron] Failed to send to host ${host.email}:`, result.error)
        }
      } catch (error) {
        console.error(`[Cron] Error sending to host ${host.email}:`, error)
      }
    }

    // Send reminders to guests
    for (const rent of rents) {
      const guest = rent.user
      if (!guest) continue

      // Skip if guest has opted out or email bounced
      if (guest.emailOptOut || guest.emailBounced) {
        console.log(`[Cron] Skipping guest ${guest.email} - opted out or bounced`)
        continue
      }

      try {
        const result = await emailService.sendBookingReminder(
          guest.email,
          guest.name ?? 'Client',
          false, // isHost
          {
            bookId: rent.id,
            establishmentName: rent.product.name,
            establishmentAddress: rent.product.address,
            checkInDate: rent.arrivingDate.toDateString(),
            checkInTime: rent.product.arriving,
            checkOutDate: rent.leavingDate.toDateString(),
            checkOutTime: rent.product.leaving,
            establishmentPhone: rent.product.phone,
            hostName: rent.product.owner?.name ?? '',
            bookUrl: `${process.env.NEXTAUTH_URL}/reservation/${rent.id}`,
          }
        )

        if (result.success) {
          clientEmailsSent++
          console.log(`[Cron] Reminder sent to guest: ${guest.email}`)
        } else {
          console.error(`[Cron] Failed to send to guest ${guest.email}:`, result.error)
        }
      } catch (error) {
        console.error(`[Cron] Error sending to guest ${guest.email}:`, error)
      }
    }

    console.log(`[Cron] Complete: ${hostEmailsSent} host emails, ${clientEmailsSent} guest emails`)

    return NextResponse.json({
      success: true,
      reservationsFound: rents.length,
      hostEmailsSent,
      clientEmailsSent,
    })
  } catch (error) {
    console.error('[Cron] Error:', error)
    return NextResponse.json({ error: 'Failed to process reminders' }, { status: 500 })
  }
}
