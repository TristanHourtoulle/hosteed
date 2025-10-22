import ical, { ICalEventStatus, ICalEventBusyStatus, ICalEventTransparency } from 'ical-generator'
import prisma from '@/lib/prisma'
import crypto from 'crypto'

/**
 * Generate or retrieve calendar feed token for a product
 */
export async function getOrCreateCalendarFeedToken(productId: string): Promise<string> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { calendarFeedToken: true },
  })

  if (!product) {
    throw new Error('Product not found')
  }

  // If token already exists, return it
  if (product.calendarFeedToken) {
    return product.calendarFeedToken
  }

  // Generate new token (32 bytes = 64 hex characters)
  const token = crypto.randomBytes(32).toString('hex')

  // Save token to database
  await prisma.product.update({
    where: { id: productId },
    data: { calendarFeedToken: token },
  })

  return token
}

/**
 * Regenerate calendar feed token (invalidate old one)
 */
export async function regenerateCalendarFeedToken(productId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex')

  await prisma.product.update({
    where: { id: productId },
    data: { calendarFeedToken: token },
  })

  return token
}

/**
 * Generate ICS feed for a product
 */
export async function generateProductICSFeed(productId: string, baseUrl: string) {
  // Fetch product data with reservations and unavailability blocks
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      rents: {
        where: {
          status: {
            in: ['RESERVED', 'CHECKIN', 'CHECKOUT'],
          },
        },
        select: {
          id: true,
          arrivingDate: true,
          leavingDate: true,
          numberPeople: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
      UnAvailableProduct: {
        select: {
          id: true,
          startDate: true,
          endDate: true,
          title: true,
          description: true,
        },
      },
    },
  })

  if (!product) {
    throw new Error('Product not found')
  }

  // Create calendar
  const calendar = ical({
    name: `${product.name} - Hosteed`,
    description: `Calendrier de disponibilité pour ${product.name}`,
    timezone: 'Europe/Paris',
    prodId: {
      company: 'Hosteed',
      product: 'Calendar Sync',
      language: 'FR',
    },
    url: `${baseUrl}/host/${product.slug || product.id}`,
  })

  // Add reservations as events
  product.rents.forEach(rent => {
    calendar.createEvent({
      id: rent.id,
      start: rent.arrivingDate,
      end: rent.leavingDate,
      summary: `Réservé - ${rent.user.name || rent.user.email}`,
      description: `Réservation pour ${rent.numberPeople} personne(s)`,
      status: ICalEventStatus.CONFIRMED,
      busystatus: ICalEventBusyStatus.BUSY,
      transparency: ICalEventTransparency.OPAQUE,
    })
  })

  // Add unavailability blocks as events
  product.UnAvailableProduct.forEach(block => {
    calendar.createEvent({
      id: block.id,
      start: block.startDate,
      end: block.endDate,
      summary: block.title,
      description: block.description || 'Période bloquée',
      status: ICalEventStatus.CONFIRMED,
      busystatus: ICalEventBusyStatus.BUSY,
      transparency: ICalEventTransparency.OPAQUE,
    })
  })

  return calendar.toString()
}

/**
 * Verify calendar feed token for a product
 */
export async function verifyCalendarFeedToken(productId: string, token: string): Promise<boolean> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { calendarFeedToken: true },
  })

  if (!product || !product.calendarFeedToken) {
    return false
  }

  return product.calendarFeedToken === token
}
