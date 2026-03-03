'use server'

import { RentStatus, Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { sendTemplatedMail } from '@/lib/services/sendTemplatedMail'
import { findAllUserByRoles } from '@/lib/services/user.service'
import { availabilityCacheService } from '@/lib/cache/redis-cache.service'
import { invalidateProductCache } from '@/lib/cache/invalidation'
import { BookingConflictError, BookingValidationError } from '@/lib/errors/booking.errors'
import { checkRentIsAvailable } from './rent-availability.service'
import { buildOverlapWhereClause } from './rent-overlap.utils'
import { logger } from '@/lib/logger'


export interface FormattedRent {
  id: string
  title: string
  start: string
  end: string
  propertyId: string
  propertyName: string
  status: RentStatus
}

export interface RentDetails {
  id: string
  productId: string
  productName: string
  userId: string
  userName: string
  numberPeople: number
  notes: string
  prices: number
  arrivingDate: string
  leavingDate: string
  status: RentStatus
  payment: string
}

type RentWithRelations = Prisma.RentGetPayload<{
  include: {
    product: {
      include: {
        img: true
        type: true
        owner: {
          select: {
            id: true
            name: true
            email: true
          }
        }
      }
    }
    user: true
    options: true
  }
}>

type RentWithReviews = Prisma.RentGetPayload<{
  include: {
    product: {
      include: {
        img: true
        type: true
        owner: {
          select: {
            id: true
            name: true
            email: true
          }
        }
      }
    }
    user: true
    options: true
    Review: true
  }
}>

export type RentWithDates = Omit<RentWithRelations, 'arrivingDate' | 'leavingDate'> & {
  arrivingDate: Date
  leavingDate: Date
}

export type RentWithDatesAndReviews = Omit<RentWithReviews, 'arrivingDate' | 'leavingDate'> & {
  arrivingDate: Date
  leavingDate: Date
}

function convertRentToDates(rent: RentWithRelations): RentWithDates {
  return {
    ...rent,
    arrivingDate: rent.arrivingDate,
    leavingDate: rent.leavingDate,
  }
}

function convertRentWithReviewsToDates(rent: RentWithReviews): RentWithDatesAndReviews {
  return {
    ...rent,
    arrivingDate: rent.arrivingDate,
    leavingDate: rent.leavingDate,
  }
}

/**
 * Find a rent by its ID, including product, user, options, and reviews.
 *
 * @param {string} id - Rent ID
 * @returns {Promise<RentWithDatesAndReviews | null>} Rent with relations or null if not found
 */
export async function getRentById(id: string): Promise<RentWithDatesAndReviews | null> {
  try {
    const rent = await prisma.rent.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            img: true,
            owner: true,
            type: true,
          },
        },
        options: true,
        user: true,
        Review: true,
      },
    })
    if (rent) {
      return convertRentWithReviewsToDates(rent)
    }
    return null
  } catch (error) {
    logger.error({ rentId: id, error }, 'Failed to find rent by ID')
    return null
  }
}

/**
 * Find the first rent for a given product.
 *
 * @param {string} id - Product ID
 * @returns {Promise<RentWithDates | null>} Rent with relations or null if not found
 */
export async function findAllRentByProduct(id: string): Promise<RentWithDates | null> {
  try {
    const rent = await prisma.rent.findFirst({
      where: { productId: id },
      include: {
        product: {
          include: {
            img: true,
            type: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        user: true,
        options: true,
      },
    })
    if (rent) {
      return convertRentToDates(rent)
    }
    return null
  } catch (error) {
    logger.error({ productId: id, error }, 'Failed to find rent by product')
    return null
  }
}

/**
 * Create a new rent with atomic availability check using a Prisma serializable transaction.
 * Prevents race condition double bookings by re-checking availability inside the transaction.
 *
 * @param {object} params - Rent creation parameters
 * @param {string} params.productId - Product ID
 * @param {string} params.userId - User ID
 * @param {Date} params.arrivingDate - Arrival date
 * @param {Date} params.leavingDate - Leaving date
 * @param {number} params.peopleNumber - Number of guests
 * @param {string[]} params.options - Option IDs to connect
 * @param {string} params.stripeId - Stripe payment intent ID
 * @param {number} params.prices - Total price (legacy field)
 * @param {Array<{ extraId: string; quantity: number }>} [params.selectedExtras] - Selected extras
 * @returns {Promise<RentWithRelations>} Created rent with relations
 * @throws {BookingValidationError} When required parameters are missing or user/product not found
 * @throws {BookingConflictError} When dates are not available (overbooking prevention)
 * @throws {Error} On unexpected database or Stripe errors
 */
export async function createRent(params: {
  productId: string
  userId: string
  arrivingDate: Date
  leavingDate: Date
  peopleNumber: number
  options: string[]
  stripeId: string
  prices: number
  selectedExtras?: Array<{ extraId: string; quantity: number }>
}): Promise<RentWithRelations> {
  if (
    !params.productId ||
    !params.userId ||
    !params.arrivingDate ||
    !params.leavingDate ||
    !params.peopleNumber ||
    !params.prices
  ) {
    throw new BookingValidationError('Missing required parameters for rent creation')
  }

  // Parallelize independent DB lookups
  const [user, product] = await Promise.all([
    prisma.user.findUnique({ where: { id: params.userId } }),
    prisma.product.findFirst({ where: { id: params.productId } }),
  ])

  if (!user) {
    throw new BookingValidationError(`User not found: ${params.userId}`)
  }

  if (!product) {
    throw new BookingValidationError(`Product not found: ${params.productId}`)
  }

  const availabilityCheck = await checkRentIsAvailable(
    params.productId,
    params.arrivingDate,
    params.leavingDate
  )

  if (!availabilityCheck.available) {
    throw new BookingConflictError(availabilityCheck.message || 'Dates not available')
  }

  // Check if the product has autoAccept enabled
  const productSettings = await prisma.product.findUnique({
    where: { id: params.productId },
    select: { autoAccept: true, ownerId: true },
  })

  const shouldAutoAccept = productSettings?.autoAccept || false

  // Calculate complete pricing
  const { calculateCompleteBookingPrice } = await import('./booking-pricing.service')
  const pricingDetails = await calculateCompleteBookingPrice(
    params.productId,
    params.arrivingDate,
    params.leavingDate,
    params.peopleNumber,
    params.selectedExtras || [],
    productSettings?.ownerId
  )

  // Atomic check-then-create: prevents race condition double bookings
  const createdRent = await prisma.$transaction(async (tx) => {
    // Re-check availability inside transaction (definitive check with row-level isolation)
    const normalizedArrival = new Date(params.arrivingDate)
    normalizedArrival.setUTCHours(0, 0, 0, 0)
    const normalizedLeaving = new Date(params.leavingDate)
    normalizedLeaving.setUTCHours(0, 0, 0, 0)

    const dayAfterArrival = new Date(normalizedArrival)
    dayAfterArrival.setUTCDate(dayAfterArrival.getUTCDate() + 1)

    const productInfo = await tx.product.findUnique({
      where: { id: params.productId },
      select: { availableRooms: true },
    })

    const overlapWhere = buildOverlapWhereClause(
      params.productId,
      normalizedArrival,
      normalizedLeaving,
      dayAfterArrival
    )

    if (productInfo?.availableRooms && productInfo.availableRooms > 1) {
      const conflictCount = await tx.rent.count({ where: overlapWhere })
      if (conflictCount >= productInfo.availableRooms) {
        throw new BookingConflictError('Aucune chambre disponible pour cette période')
      }
    } else {
      const conflict = await tx.rent.findFirst({ where: overlapWhere })
      if (conflict) {
        throw new BookingConflictError('Il existe déjà une réservation sur cette période')
      }
    }

    // Create rent inside the transaction
    const rent = await tx.rent.create({
      data: {
        productId: params.productId,
        userId: params.userId,
        arrivingDate: params.arrivingDate,
        leavingDate: params.leavingDate,
        numberPeople: BigInt(params.peopleNumber),
        notes: BigInt(0),
        accepted: shouldAutoAccept,
        confirmed: shouldAutoAccept,
        prices: BigInt(params.prices),
        stripeId: params.stripeId || null,
        options: {
          connect: params.options.map(optionId => ({ id: optionId })),
        },
        basePricePerNight: pricingDetails.basePricing.averageNightlyPrice,
        numberOfNights: pricingDetails.basePricing.numberOfNights,
        subtotal: pricingDetails.basePricing.subtotal,
        discountAmount: pricingDetails.basePricing.totalSavings,
        promotionApplied: pricingDetails.basePricing.promotionApplied,
        specialPriceApplied: pricingDetails.basePricing.specialPriceApplied,
        totalSavings: pricingDetails.basePricing.totalSavings,
        extrasTotal: pricingDetails.extrasTotal,
        clientCommission: pricingDetails.clientCommission,
        hostCommission: pricingDetails.hostCommission,
        platformAmount: pricingDetails.platformAmount,
        hostAmount: pricingDetails.hostAmount,
        totalAmount: pricingDetails.totalAmount,
        pricingSnapshot: JSON.parse(JSON.stringify({
          dailyBreakdown: pricingDetails.basePricing.dailyBreakdown,
          extrasDetails: pricingDetails.extrasDetails,
          summary: pricingDetails.summary,
          calculatedAt: new Date().toISOString(),
        })),
      },
      include: {
        product: {
          include: {
            img: true,
            type: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        user: true,
        options: true,
        extras: true,
      },
    })

    // Create RentExtra entries inside the same transaction
    if (params.selectedExtras && params.selectedExtras.length > 0) {
      for (const extra of params.selectedExtras) {
        const extraDetail = pricingDetails.extrasDetails.find(e => e.extraId === extra.extraId)
        if (extraDetail) {
          await tx.rentExtra.create({
            data: {
              rentId: rent.id,
              extraId: extra.extraId,
              quantity: extra.quantity,
              totalPrice: extraDetail.total,
            },
          })
        }
      }
    }

    return rent
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

  // Invalidate availability cache after booking creation
  try {
    await availabilityCacheService.invalidateAvailability(params.productId)
    await invalidateProductCache(params.productId)
  } catch (cacheError) {
    logger.warn({ productId: params.productId, error: cacheError }, 'Failed to invalidate cache after booking creation')
  }

  // Send notifications (non-blocking)
  const request = await prisma.product.findUnique({
    where: { id: createdRent.productId },
    select: {
      type: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })
  if (!request) {
    logger.error({ rentId: createdRent.id }, 'Product not found for notification after rent creation')
    return createdRent
  }

  const admin = await findAllUserByRoles('ADMIN')
  if (admin && admin.length > 0) {
    const emailResults = await Promise.allSettled(
      admin.map(user =>
        sendTemplatedMail(user.email, 'Nouvelle réservation !', 'new-book.html', {
          bookId: createdRent.id,
          name: user.name || '',
          bookUrl: process.env.NEXTAUTH_URL + '/reservation/' + createdRent.id,
        })
      )
    )
    const failedEmails = emailResults.filter(r => r.status === 'rejected')
    if (failedEmails.length > 0) {
      logger.warn({ count: failedEmails.length }, 'Some admin notification emails failed to send')
    }
  }

  if (!createdRent.product.owner) {
    logger.error({ rentId: createdRent.id }, 'Product owner not available for notification')
    return createdRent
  }

  await sendTemplatedMail(createdRent.product.owner.email, 'Nouvelle réservation !', 'new-book.html', {
    bookId: createdRent.id,
    name: createdRent.product.owner.name || '',
    bookUrl: process.env.NEXTAUTH_URL + '/reservation/' + createdRent.id,
  })

  if (product.autoAccept) {
    await sendTemplatedMail(
      createdRent.user.email,
      'Réservation en confirmé 🏨',
      'confirmation-reservation.html',
      {
        name: createdRent.user.name || '',
        listing_title: createdRent.product.name,
        listing_adress: createdRent.product.address,
        check_in: createdRent.product.arriving,
        check_out: createdRent.product.leaving,
        categories: createdRent.product.type.name,
        phone_number: createdRent.product.phone,
        arriving_date: createdRent.arrivingDate.toDateString(),
        leaving_date: createdRent.leavingDate.toDateString(),
        reservationUrl: process.env.NEXTAUTH_URL + '/reservation/' + createdRent.id,
        complete_address: createdRent.product.completeAddress || '',
        proximity_landmarks:
          createdRent.product.proximityLandmarks &&
          createdRent.product.proximityLandmarks.length > 0
            ? createdRent.product.proximityLandmarks.join(', ')
            : '',
      }
    )
  } else {
    await sendTemplatedMail(
      createdRent.user.email,
      'Réservation en attente 🏨',
      'waiting-approve.html',
      {
        name: createdRent.user.name || '',
        listing_title: createdRent.product.name,
        listing_adress: createdRent.product.address,
        check_in: createdRent.product.arriving,
        check_out: createdRent.product.leaving,
        categories: createdRent.product.type.name,
        phone_number: createdRent.product.phone,
        arriving_date: createdRent.arrivingDate.toDateString(),
        leaving_date: createdRent.leavingDate.toDateString(),
        reservationUrl: process.env.NEXTAUTH_URL + '/reservation/' + createdRent.id,
        complete_address: createdRent.product.completeAddress || '',
        proximity_landmarks:
          createdRent.product.proximityLandmarks &&
          createdRent.product.proximityLandmarks.length > 0
            ? createdRent.product.proximityLandmarks.join(', ')
            : '',
      }
    )
  }

  return createdRent
}

/**
 * Find all rents for a given user ID.
 *
 * @param {string} id - User ID
 * @returns {Promise<RentWithRelations[] | null>} Array of rents or null on error
 */
export async function findAllRentByUserId(id: string): Promise<RentWithRelations[] | null> {
  try {
    const rents = await prisma.rent.findMany({
      where: { userId: id },
      include: {
        product: {
          include: {
            img: true,
            type: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        user: true,
        options: true,
        Review: true,
      },
    })

    return rents
  } catch (error) {
    logger.error({ userId: id, error }, 'Failed to find rents by user ID')
    return null
  }
}

/**
 * Find all rents for products owned by a given host user ID.
 *
 * @param {string} id - Host user ID
 * @returns {Promise<object[] | null>} Array of rents or null on error
 */
export async function findRentByHostUserId(id: string) {
  try {
    const rents = await prisma.rent.findMany({
      where: {
        product: { ownerId: id },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return rents
  } catch (error) {
    logger.error({ hostId: id, error }, 'Failed to find rents by host user ID')
    return null
  }
}

/**
 * Find all reservations for a given host, formatted for calendar display.
 *
 * @param {string} hostId - Host user ID
 * @returns {Promise<FormattedRent[]>} Array of formatted rents
 * @throws {Error} On database errors
 */
export async function findAllReservationsByHostId(hostId: string): Promise<FormattedRent[]> {
  try {
    const rents = await prisma.rent.findMany({
      where: {
        product: { ownerId: hostId },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        arrivingDate: 'asc',
      },
    })

    return rents.map(rent => ({
      id: rent.id,
      title: `Réservation #${rent.id}`,
      start: rent.arrivingDate.toISOString(),
      end: rent.leavingDate.toISOString(),
      propertyId: rent.productId,
      propertyName: rent.product.name,
      status: rent.status,
    }))
  } catch (error) {
    logger.error({ hostId, error }, 'Failed to find reservations by host ID')
    throw error
  }
}

/**
 * Find all rents for a given product ID, ordered by most recent first.
 *
 * @param {string} productId - Product ID
 * @returns {Promise<object[] | null>} Array of rents or null on error
 */
export async function findAllRentByProductId(productId: string) {
  try {
    const rents = await prisma.rent.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        options: true,
      },
      orderBy: {
        arrivingDate: 'desc',
      },
    })

    return rents
  } catch (error) {
    logger.error({ productId, error }, 'Failed to find rents by product ID')
    return null
  }
}
