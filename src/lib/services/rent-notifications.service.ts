import { sendTemplatedMail } from '@/lib/services/sendTemplatedMail'
import { logger } from '@/lib/logger'

/**
 * Send a rejection notification email to the guest.
 *
 * @param {object} rent - Rent data with user and product info
 * @param {object} rent.user - Guest user
 * @param {string} rent.user.email - Guest email
 * @param {string|null} rent.user.name - Guest name
 * @param {object} rent.product - Product data
 * @param {string} rent.product.name - Product name
 * @param {Array} [rent.product.user] - Product owners
 * @param {Date} rent.arrivingDate - Arrival date
 * @param {Date} rent.leavingDate - Leaving date
 */
export async function sendGuestRejectionNotification(rent: {
  user: { email: string; name: string | null }
  product: { name: string; user?: { name: string | null }[] }
  arrivingDate: Date
  leavingDate: Date
}) {
  try {
    await sendTemplatedMail(
      rent.user.email,
      'Votre demande de réservation a été refusée',
      'rent-rejection-guest.html',
      {
        guestName: rent.user.name || 'Invité',
        propertyName: rent.product.name,
        hostName: rent.product.user?.[0]?.name || 'Hôte',
        arrivingDate: rent.arrivingDate.toLocaleDateString('fr-FR'),
        leavingDate: rent.leavingDate.toLocaleDateString('fr-FR'),
      }
    )
  } catch (error) {
    logger.error({ error, email: rent.user.email }, 'Failed to send guest rejection notification')
  }
}

/**
 * Notify administrators about a reservation rejection.
 *
 * @param {object} rejection - Rejection record
 * @param {string} rejection.id - Rejection ID
 * @param {string} rejection.reason - Rejection reason
 * @param {string} rejection.message - Rejection message
 * @param {object} rent - Rent data with user and product info
 * @param {object} rent.user - Guest user
 * @param {string|null} rent.user.name - Guest name
 * @param {object} rent.product - Product data
 * @param {string} rent.product.name - Product name
 * @param {Array} [rent.product.user] - Product owners
 * @param {Date} rent.arrivingDate - Arrival date
 * @param {Date} rent.leavingDate - Leaving date
 */
export async function notifyAdminOfRejection(
  rejection: {
    id: string
    reason: string
    message: string
  },
  rent: {
    user: { name: string | null }
    product: {
      name: string
      user?: { name: string | null }[]
    }
    arrivingDate: Date
    leavingDate: Date
  }
) {
  try {
    const { findAllUserByRoles } = await import('@/lib/services/user.service')
    const admins = await findAllUserByRoles(['ADMIN', 'HOST_MANAGER'])

    if (admins) {
      for (const admin of admins) {
        await sendTemplatedMail(
          admin.email,
          'Nouvelle demande de refus de réservation',
          'rent-rejection-admin.html',
          {
            adminName: admin.name || 'Administrateur',
            hostName: rent.product.user?.[0]?.name || 'Hôte',
            guestName: rent.user.name || 'Invité',
            propertyName: rent.product.name,
            reason: rejection.reason,
            message: rejection.message,
            arrivingDate: rent.arrivingDate.toLocaleDateString('fr-FR'),
            leavingDate: rent.leavingDate.toLocaleDateString('fr-FR'),
            rejectionId: rejection.id,
          }
        )
      }
    }
  } catch (error) {
    logger.error({ error, rejectionId: rejection.id }, 'Failed to notify admins of rejection')
  }
}
