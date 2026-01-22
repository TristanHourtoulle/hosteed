import { SendSmtpEmail } from '@getbrevo/brevo'
import { getBrevoClient } from './brevo.client'
import { emailConfig } from '@/lib/config/email.config'
import { loadTemplate } from './template.loader'
import {
  SendEmailParams,
  EmailResult,
  EmailTemplate,
  EmailRecipient,
  TemplateVariables,
} from './email.types'

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

function normalizeRecipients(
  recipients: EmailRecipient | EmailRecipient[]
): Array<{ email: string; name?: string }> {
  const list = Array.isArray(recipients) ? recipients : [recipients]
  return list.map(r => ({ email: r.email, name: r.name }))
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Send an email using Brevo API with retry logic
 */
export async function sendEmail(params: SendEmailParams): Promise<EmailResult> {
  // Skip if email sending is disabled
  if (!emailConfig.sendingEnabled) {
    console.log('[Email] Sending disabled, skipping:', params.subject)
    return { success: true, messageId: 'skipped', skipped: true }
  }

  const brevoClient = getBrevoClient()
  const message = new SendSmtpEmail()

  // Sender configuration from Brevo config
  message.sender = {
    name: emailConfig.senderName,
    email: emailConfig.senderEmail,
  }

  // Recipients
  message.to = normalizeRecipients(params.to)

  if (params.cc?.length) {
    message.cc = normalizeRecipients(params.cc)
  }

  if (params.bcc?.length) {
    message.bcc = normalizeRecipients(params.bcc)
  }

  if (params.replyTo) {
    message.replyTo = { email: params.replyTo.email, name: params.replyTo.name }
  }

  // Subject and content
  message.subject = params.subject
  message.htmlContent = params.htmlContent

  if (params.textContent) {
    message.textContent = params.textContent
  }

  // Tags for tracking
  if (params.tags?.length) {
    message.tags = params.tags
  }

  // Retry logic with exponential backoff
  let lastError: Error | null = null
  const recipientEmail = message.to?.[0]?.email ?? 'unknown'

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await brevoClient.sendTransacEmail(message)

      console.log(`[Email] Sent successfully to ${recipientEmail}`, {
        messageId: result.body.messageId,
        subject: params.subject,
        attempt,
      })

      return {
        success: true,
        messageId: result.body.messageId,
      }
    } catch (error) {
      lastError = error as Error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      console.warn(
        `[Email] Attempt ${attempt}/${MAX_RETRIES} failed for ${recipientEmail}:`,
        errorMessage
      )

      if (attempt < MAX_RETRIES) {
        const waitTime = RETRY_DELAY_MS * Math.pow(2, attempt - 1)
        await delay(waitTime)
      }
    }
  }

  console.error(`[Email] All retries failed for ${recipientEmail}:`, lastError?.message)
  return {
    success: false,
    error: lastError?.message ?? 'Unknown error after retries',
  }
}

/**
 * Send email using a local HTML template
 */
export async function sendTemplateEmail(
  template: EmailTemplate | string,
  to: EmailRecipient | EmailRecipient[],
  subject: string,
  variables: TemplateVariables,
  options?: {
    replyTo?: EmailRecipient
    tags?: string[]
    cc?: EmailRecipient[]
    bcc?: EmailRecipient[]
  }
): Promise<EmailResult> {
  try {
    const htmlContent = await loadTemplate(template, variables)

    return sendEmail({
      to,
      subject,
      htmlContent,
      replyTo: options?.replyTo,
      tags: options?.tags ?? [String(template)],
      cc: options?.cc,
      bcc: options?.bcc,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Template loading failed'
    console.error(`[Email] Failed to send template "${template}":`, errorMessage)

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Email service with specialized methods for common email types
 */
export const emailService = {
  // ============================================
  // Account Emails
  // ============================================

  async sendVerificationEmail(
    email: string,
    name: string,
    verificationUrl: string
  ): Promise<EmailResult> {
    return sendTemplateEmail(
      EmailTemplate.EMAIL_VERIFICATION,
      { email, name },
      'Vérifiez votre adresse email - Hosteed',
      { userName: name, verificationUrl },
      { tags: ['account', 'verification'] }
    )
  },

  async sendPasswordReset(
    email: string,
    name: string,
    resetUrl: string
  ): Promise<EmailResult> {
    return sendTemplateEmail(
      EmailTemplate.PASSWORD_RESET,
      { email, name },
      'Réinitialisation de votre mot de passe - Hosteed',
      { userName: name, resetUrl },
      { tags: ['account', 'password-reset'] }
    )
  },

  async sendWelcome(email: string, name: string): Promise<EmailResult> {
    return sendTemplateEmail(
      EmailTemplate.WELCOME,
      { email, name },
      'Bienvenue sur Hosteed !',
      {
        userName: name,
        loginUrl: `${process.env.NEXTAUTH_URL ?? 'https://hosteed.com'}/auth`,
      },
      { tags: ['account', 'welcome'] }
    )
  },

  async sendRoleUpdate(
    email: string,
    name: string,
    roleInfo: {
      label: string
      description: string
      class: string
      emoji: string
    }
  ): Promise<EmailResult> {
    return sendTemplateEmail(
      EmailTemplate.ROLE_UPDATED,
      { email, name },
      'Mise à jour de votre rôle sur Hosteed',
      {
        userName: name,
        newRoleLabel: roleInfo.label,
        roleDescription: roleInfo.description,
        newRoleClass: roleInfo.class,
        newRoleEmoji: roleInfo.emoji,
        loginUrl: `${process.env.NEXTAUTH_URL ?? 'https://hosteed.com'}/auth`,
      },
      { tags: ['account', 'role-update'] }
    )
  },

  // ============================================
  // Listing Emails
  // ============================================

  async sendListingPosted(
    email: string,
    name: string,
    variables: TemplateVariables
  ): Promise<EmailResult> {
    return sendTemplateEmail(
      EmailTemplate.LISTING_POSTED,
      { email, name },
      'Votre annonce a été publiée - Hosteed',
      { userName: name, ...variables },
      { tags: ['listing', 'posted'] }
    )
  },

  async sendListingApproved(
    email: string,
    name: string,
    variables: TemplateVariables
  ): Promise<EmailResult> {
    return sendTemplateEmail(
      EmailTemplate.LISTING_APPROVED,
      { email, name },
      'Votre annonce a été approuvée - Hosteed',
      { userName: name, ...variables },
      { tags: ['listing', 'approved'] }
    )
  },

  async sendListingRejected(
    email: string,
    name: string,
    variables: TemplateVariables
  ): Promise<EmailResult> {
    return sendTemplateEmail(
      EmailTemplate.LISTING_REJECTED,
      { email, name },
      'Votre annonce nécessite des modifications - Hosteed',
      { userName: name, ...variables },
      { tags: ['listing', 'rejected'] }
    )
  },

  async sendListingModified(
    email: string,
    name: string,
    variables: TemplateVariables
  ): Promise<EmailResult> {
    return sendTemplateEmail(
      EmailTemplate.LISTING_MODIFIED,
      { email, name },
      'Votre annonce a été modifiée - Hosteed',
      { userName: name, ...variables },
      { tags: ['listing', 'modified'] }
    )
  },

  async sendWaitingApproval(
    email: string,
    name: string,
    listingTitle: string
  ): Promise<EmailResult> {
    return sendTemplateEmail(
      EmailTemplate.WAITING_APPROVAL,
      { email, name },
      'Votre annonce est en attente de validation - Hosteed',
      { userName: name, listingTitle },
      { tags: ['listing', 'waiting-approval'] }
    )
  },

  // ============================================
  // Booking Emails
  // ============================================

  async sendBookingConfirmation(
    email: string,
    name: string,
    variables: TemplateVariables
  ): Promise<EmailResult> {
    return sendTemplateEmail(
      EmailTemplate.BOOKING_CONFIRMATION,
      { email, name },
      'Confirmation de votre réservation - Hosteed',
      { userName: name, ...variables },
      { tags: ['booking', 'confirmation'] }
    )
  },

  async sendNewBookingToHost(
    email: string,
    name: string,
    variables: TemplateVariables
  ): Promise<EmailResult> {
    return sendTemplateEmail(
      EmailTemplate.BOOKING_NEW_HOST,
      { email, name },
      'Nouvelle réservation reçue - Hosteed',
      { hostName: name, ...variables },
      { tags: ['booking', 'new-host'] }
    )
  },

  async sendBookingReminder(
    email: string,
    name: string,
    isHost: boolean,
    variables: TemplateVariables
  ): Promise<EmailResult> {
    const template = isHost
      ? EmailTemplate.BOOKING_REMINDER_HOST
      : EmailTemplate.BOOKING_REMINDER_CLIENT

    return sendTemplateEmail(
      template,
      { email, name },
      'Rappel: Arrivée demain - Hosteed',
      { userName: name, ...variables },
      { tags: ['booking', 'reminder', isHost ? 'host' : 'guest'] }
    )
  },

  async sendBookingModification(
    email: string,
    name: string,
    variables: TemplateVariables
  ): Promise<EmailResult> {
    return sendTemplateEmail(
      EmailTemplate.BOOKING_MODIFICATION,
      { email, name },
      'Modification de votre réservation - Hosteed',
      { userName: name, ...variables },
      { tags: ['booking', 'modification'] }
    )
  },

  async sendBookingCancellation(
    email: string,
    name: string,
    variables: TemplateVariables
  ): Promise<EmailResult> {
    return sendTemplateEmail(
      EmailTemplate.BOOKING_CANCELLATION,
      { email, name },
      'Annulation de réservation - Hosteed',
      { userName: name, ...variables },
      { tags: ['booking', 'cancellation'] }
    )
  },

  async sendBookingRequestAccepted(
    email: string,
    name: string,
    variables: TemplateVariables
  ): Promise<EmailResult> {
    return sendTemplateEmail(
      EmailTemplate.BOOKING_REQUEST_ACCEPTED,
      { email, name },
      'Votre demande de réservation a été acceptée - Hosteed',
      { userName: name, ...variables },
      { tags: ['booking', 'accepted'] }
    )
  },

  // ============================================
  // Payment Emails
  // ============================================

  async sendPaymentRequest(
    email: string,
    name: string,
    role: 'guest' | 'host' | 'admin',
    variables: TemplateVariables
  ): Promise<EmailResult> {
    const templateMap = {
      guest: EmailTemplate.PAYMENT_REQUEST_GUEST,
      host: EmailTemplate.PAYMENT_REQUEST_HOST,
      admin: EmailTemplate.PAYMENT_REQUEST_ADMIN,
    }

    return sendTemplateEmail(
      templateMap[role],
      { email, name },
      'Demande de paiement - Hosteed',
      { userName: name, ...variables },
      { tags: ['payment', 'request', role] }
    )
  },

  async sendPaymentError(
    email: string,
    name: string,
    variables: TemplateVariables
  ): Promise<EmailResult> {
    return sendTemplateEmail(
      EmailTemplate.PAYMENT_ERROR,
      { email, name },
      'Erreur de paiement - Hosteed',
      { userName: name, ...variables },
      { tags: ['payment', 'error'] }
    )
  },

  async sendPaymentInfoNeeded(
    email: string,
    name: string,
    variables: TemplateVariables
  ): Promise<EmailResult> {
    return sendTemplateEmail(
      EmailTemplate.PAYMENT_INFO_NEEDED,
      { email, name },
      'Informations de paiement requises - Hosteed',
      { userName: name, ...variables },
      { tags: ['payment', 'info-needed'] }
    )
  },

  async sendPaymentRejected(
    email: string,
    name: string,
    variables: TemplateVariables
  ): Promise<EmailResult> {
    return sendTemplateEmail(
      EmailTemplate.PAYMENT_REJECTED,
      { email, name },
      'Paiement refusé - Hosteed',
      { userName: name, ...variables },
      { tags: ['payment', 'rejected'] }
    )
  },

  // ============================================
  // Review Emails
  // ============================================

  async sendReviewRequest(
    email: string,
    name: string,
    variables: TemplateVariables
  ): Promise<EmailResult> {
    return sendTemplateEmail(
      EmailTemplate.REVIEW_REQUEST,
      { email, name },
      'Donnez votre avis sur votre séjour - Hosteed',
      { userName: name, ...variables },
      { tags: ['review', 'request'] }
    )
  },

  async sendNewReviewNotification(
    email: string,
    name: string,
    variables: TemplateVariables
  ): Promise<EmailResult> {
    return sendTemplateEmail(
      EmailTemplate.REVIEW_NEW,
      { email, name },
      'Nouvel avis reçu - Hosteed',
      { userName: name, ...variables },
      { tags: ['review', 'new'] }
    )
  },

  async sendReviewValidationToAdmin(
    email: string,
    variables: TemplateVariables
  ): Promise<EmailResult> {
    return sendTemplateEmail(
      EmailTemplate.REVIEW_VALIDATION,
      { email },
      'Nouvel avis à valider - Hosteed',
      variables,
      { tags: ['review', 'admin', 'validation'] }
    )
  },

  // ============================================
  // Admin Emails
  // ============================================

  async sendDisputeNotification(
    email: string,
    variables: TemplateVariables
  ): Promise<EmailResult> {
    return sendTemplateEmail(
      EmailTemplate.DISPUTE,
      { email },
      'Litige signalé - Hosteed',
      variables,
      { tags: ['admin', 'dispute'] }
    )
  },

  async sendRentRejectionAdmin(
    email: string,
    variables: TemplateVariables
  ): Promise<EmailResult> {
    return sendTemplateEmail(
      EmailTemplate.RENT_REJECTION_ADMIN,
      { email },
      'Réservation refusée - Hosteed',
      variables,
      { tags: ['admin', 'rent-rejection'] }
    )
  },

  async sendRentRejectionGuest(
    email: string,
    name: string,
    variables: TemplateVariables
  ): Promise<EmailResult> {
    return sendTemplateEmail(
      EmailTemplate.RENT_REJECTION_GUEST,
      { email, name },
      'Votre réservation a été refusée - Hosteed',
      { userName: name, ...variables },
      { tags: ['booking', 'rejection', 'guest'] }
    )
  },

  // ============================================
  // Generic / Backward Compatibility
  // ============================================

  /**
   * Generic method to send any template by name
   * Useful for backward compatibility during migration
   */
  async sendFromTemplate(
    templateName: string,
    email: string,
    subject: string,
    variables: TemplateVariables,
    options?: {
      name?: string
      replyTo?: EmailRecipient
      tags?: string[]
    }
  ): Promise<EmailResult> {
    return sendTemplateEmail(
      templateName,
      { email, name: options?.name },
      subject,
      variables,
      {
        replyTo: options?.replyTo,
        tags: options?.tags ?? [templateName],
      }
    )
  },
}

export default emailService
