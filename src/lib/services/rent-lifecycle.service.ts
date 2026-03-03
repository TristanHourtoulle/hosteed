'use server'

import { RentStatus } from '@prisma/client'
import prisma from '@/lib/prisma'
import { StripeService } from '@/lib/services/stripe'
import { sendTemplatedMail } from '@/lib/services/sendTemplatedMail'
import { findAllUserByRoles } from '@/lib/services/user.service'
import { availabilityCacheService } from '@/lib/cache/redis-cache.service'
import { invalidateProductCache } from '@/lib/cache/invalidation'
import { sendGuestRejectionNotification, notifyAdminOfRejection } from './rent-notifications.service'
import { logger } from '@/lib/logger'

/**
 * Invalidate all availability-related caches for a product.
 * Covers Redis availability cache and Next.js ISR revalidation.
 *
 * @param {string} productId - Product identifier
 * @param {string} context - Description of why invalidation is triggered
 */
async function invalidateAvailabilityCaches(productId: string, context: string) {
  try {
    await availabilityCacheService.invalidateAvailability(productId)
    await invalidateProductCache(productId)
  } catch (cacheError) {
    logger.warn({ productId, error: cacheError }, `Failed to invalidate cache after ${context}`)
  }
}

/**
 * Confirm a reservation by the host. Updates status and sends confirmation email to the guest.
 *
 * @param {string} id - Rent ID
 * @returns {Promise<{ success: boolean; message?: string; error?: string }>}
 * @throws {Error} When reservation is not found
 */
export async function confirmRentByHost(id: string) {
  try {
    const rent = await prisma.rent.findFirst({
      where: { id },
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

    if (!rent || !rent.user) throw new Error('Reservation not found')

    await prisma.rent.update({
      where: { id },
      data: {
        accepted: true,
        confirmed: true,
      },
    })

    await sendTemplatedMail(
      rent.user.email,
      "Réservation confirmée par l'hôte 🎉",
      'confirmation-reservation.html',
      {
        name: rent.user.name || '',
        listing_title: rent.product.name,
        listing_adress: rent.product.address,
        check_in: rent.product.arriving,
        check_out: rent.product.leaving,
        categories: rent.product.type.name,
        phone_number: rent.product.phone,
        arriving_date: rent.arrivingDate.toDateString(),
        leaving_date: rent.leavingDate.toDateString(),
        reservationUrl: process.env.NEXTAUTH_URL + '/reservation/' + rent.id,
        complete_address: rent.product.completeAddress || '',
        proximity_landmarks:
          rent.product.proximityLandmarks && rent.product.proximityLandmarks.length > 0
            ? rent.product.proximityLandmarks.join(', ')
            : '',
      }
    )

    return {
      success: true,
      message: 'Réservation confirmée avec succès',
    }
  } catch (error) {
    logger.error({ rentId: id, error }, 'Failed to confirm rent by host')
    return {
      success: false,
      error: 'Erreur lors de la confirmation de la réservation',
    }
  }
}

/**
 * Approve a reservation: capture Stripe payment, update status, send notifications.
 * Invalidates availability cache after approval.
 *
 * @param {string} id - Rent ID
 * @returns {Promise<{ success: boolean }>}
 * @throws {Error} When reservation or Stripe ID is missing
 */
export async function approveRent(id: string) {
  const createdRent = await prisma.rent.findFirst({
    where: { id },
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
  if (!createdRent || !createdRent.stripeId || !createdRent.user) {
    throw new Error(`Rent ${id} not found, missing stripeId, or missing user association`)
  }
  const stripeResult = await StripeService.capturePaymentIntent(createdRent.stripeId)
  logger.info({ rentId: id, stripeSuccess: stripeResult?.success }, 'Stripe payment captured')

  await prisma.rent.update({
    where: { id },
    data: {
      status: 'RESERVED',
      payment: 'CLIENT_PAID',
      accepted: true,
      confirmed: true,
    },
  })

  await invalidateAvailabilityCaches(createdRent.productId, 'rent approval')

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
  await sendTemplatedMail(
    createdRent.user.email,
    'Réservation confirmée 🏨',
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
        createdRent.product.proximityLandmarks && createdRent.product.proximityLandmarks.length > 0
          ? createdRent.product.proximityLandmarks.join(', ')
          : '',
    }
  )
  return {
    success: true,
  }
}

/**
 * Cancel a reservation: refund Stripe payment, update status, send notification.
 * Invalidates availability cache after cancellation.
 *
 * @param {string} id - Rent ID
 * @returns {Promise<void | { error: string }>}
 * @throws {Error} When reservation is not found
 */
export async function cancelRent(id: string) {
  try {
    const rents = await prisma.rent.findUnique({
      where: { id },
      include: {
        user: true,
        product: true,
      },
    })
    if (!rents || !rents.user) throw Error('No Rents find')
    if (rents.stripeId) {
      const stripeRequest = await StripeService.RefundPaymentIntent(rents.stripeId)
      if (!stripeRequest) throw new Error(`Stripe refund failed for rent ${id}`)
      await prisma.rent.update({
        where: { id },
        data: {
          status: 'CANCEL',
        },
      })

      await invalidateAvailabilityCaches(rents.productId, 'rent cancellation')
    }
    await sendTemplatedMail(
      rents.user.email,
      'Annulation de votre réservation',
      'annulation.html',
      {
        name: rents.user.name || 'clients',
        productName: rents.product.name,
        arrivingDate: rents.arrivingDate.toDateString(),
        leavingDate: rents.leavingDate.toDateString(),
        reservationId: rents.id,
        refundAmount: rents.prices.toString(),
      }
    )
  } catch (error) {
    logger.error({ rentId: id, error }, 'Failed to cancel rent')
    return {
      error: 'Erreur lors de la création du paiement',
    }
  }
}

/**
 * Change the status of a reservation. Sends review request email on CHECKOUT.
 * Invalidates availability cache after status change.
 *
 * @param {string} id - Rent ID
 * @param {RentStatus} status - New status
 * @throws {Error} When reservation is not found or status change fails
 */
export async function changeRentStatus(id: string, status: RentStatus) {
  const rent = await prisma.rent.findUnique({
    where: { id },
    include: {
      user: true,
      product: true,
    },
  })
  if (!rent) throw Error('No Rents found')

  await prisma.rent.update({
    where: { id },
    data: { status },
  })

  await invalidateAvailabilityCaches(rent.productId, 'status change')

  if (status == RentStatus.CHECKOUT) {
    await sendTemplatedMail(
      rent.user.email,
      'Votre avis compte pour nous !',
      'review-request.html',
      {
        rentId: rent.id,
        reviewUrl: process.env.NEXTAUTH_URL + '/reviews/create?rentId=' + rent.id,
        productName: rent.product.name,
      }
    )
  }
}

/**
 * Reject a reservation request: update status, create rejection record,
 * notify guest and admins. Invalidates availability cache.
 *
 * @param {string} rentId - Rent ID
 * @param {string} hostId - Host user ID
 * @param {string} reason - Rejection reason
 * @param {string} message - Rejection message
 * @returns {Promise<{ success: boolean; rejection?: object; rent?: object; error?: string }>}
 */
export async function rejectRentRequest(
  rentId: string,
  hostId: string,
  reason: string,
  message: string
) {
  try {
    const rent = await prisma.rent.findFirst({
      where: {
        id: rentId,
        product: {
          ownerId: hostId,
        },
        status: RentStatus.WAITING,
      },
      include: {
        user: true,
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
      },
    })

    if (!rent) {
      return {
        success: false,
        error: "Réservation non trouvée ou vous n'avez pas l'autorisation de la refuser",
      }
    }

    const updatedRent = await prisma.rent.update({
      where: { id: rentId },
      data: { status: RentStatus.CANCEL },
    })

    await invalidateAvailabilityCaches(rent.productId, 'rent rejection')

    const rejection = await prisma.rentRejection.create({
      data: {
        rentId,
        hostId,
        reason,
        message,
        guestId: rent.userId,
      },
    })

    await sendGuestRejectionNotification(rent)
    await notifyAdminOfRejection(rejection, rent)

    return {
      success: true,
      rejection,
      rent: updatedRent,
    }
  } catch (error) {
    logger.error({ rentId, hostId, error }, 'Failed to reject rent request')
    return {
      success: false,
      error: 'Erreur lors du refus de la réservation',
    }
  }
}

/**
 * Retrieve all rent rejections for admin view with pagination.
 *
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @returns {Promise<{ rejections: object[]; pagination: object } | null>}
 */
export async function getAllRentRejections(page = 1, limit = 20) {
  try {
    const offset = (page - 1) * limit

    const rejections = await prisma.rentRejection.findMany({
      skip: offset,
      take: limit,
      include: {
        rent: {
          include: {
            product: {
              select: {
                name: true,
                address: true,
              },
            },
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        host: {
          select: {
            name: true,
            email: true,
          },
        },
        guest: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const total = await prisma.rentRejection.count()

    return {
      rejections,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  } catch (error) {
    logger.error({ page, limit, error }, 'Failed to fetch rent rejections')
    return null
  }
}

/**
 * Mark a rent rejection as resolved by an admin.
 *
 * @param {string} rejectionId - Rejection record ID
 * @param {string} adminId - Admin user ID
 * @returns {Promise<{ success: boolean; rejection?: object; error?: string }>}
 */
export async function resolveRentRejection(rejectionId: string, adminId: string) {
  try {
    const rejection = await prisma.rentRejection.update({
      where: { id: rejectionId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: adminId,
      },
      include: {
        rent: {
          include: {
            product: true,
            user: true,
          },
        },
        host: true,
      },
    })

    return {
      success: true,
      rejection,
    }
  } catch (error) {
    logger.error({ rejectionId, adminId, error }, 'Failed to resolve rent rejection')
    return {
      success: false,
      error: 'Erreur lors de la résolution du refus',
    }
  }
}
