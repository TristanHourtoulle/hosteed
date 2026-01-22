export interface EmailRecipient {
  email: string
  name?: string
}

export interface SendEmailParams {
  to: EmailRecipient | EmailRecipient[]
  subject: string
  htmlContent: string
  textContent?: string
  tags?: string[]
  replyTo?: EmailRecipient
  cc?: EmailRecipient[]
  bcc?: EmailRecipient[]
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
  skipped?: boolean
}

// Enum mapping to local HTML template filenames (without .html extension)
export enum EmailTemplate {
  // Account
  EMAIL_VERIFICATION = 'checkEmail',
  PASSWORD_RESET = 'resetPassword',
  WELCOME = 'welcome-hosteed',
  ROLE_UPDATED = 'role-updated',

  // Listings
  LISTING_POSTED = 'annonce-postee',
  LISTING_APPROVED = 'annonce-approved',
  LISTING_REJECTED = 'annonce-rejected',
  LISTING_MODIFIED = 'annonce-modifiee',

  // Bookings
  BOOKING_CONFIRMATION = 'confirmation-reservation',
  BOOKING_NEW_HOST = 'new-book',
  BOOKING_REMINDER_CLIENT = 'cron-reminder-client',
  BOOKING_REMINDER_HOST = 'cron-reminder-host',
  BOOKING_MODIFICATION = 'modification-reservation',
  BOOKING_MODIFICATION_REJECTED = 'modification-rejected',
  BOOKING_CANCELLATION = 'annulation',
  BOOKING_REQUEST_ACCEPTED = 'demande-acceptee',

  // Payments
  PAYMENT_REQUEST_GUEST = 'payment-request-guest',
  PAYMENT_REQUEST_HOST = 'payment-request-host',
  PAYMENT_REQUEST_ADMIN = 'payment-request-admin',
  PAYMENT_ERROR = 'erreur-paiement',
  PAYMENT_INFO_NEEDED = 'payment-request-info-needed',
  PAYMENT_REJECTED = 'payment-request-rejected',

  // Reviews
  REVIEW_REQUEST = 'demande-avis',
  REVIEW_NEW = 'new-review',
  REVIEW_VALIDATION = 'validation-avis',

  // Admin
  DISPUTE = 'litige',
  RENT_REJECTION_ADMIN = 'rent-rejection-admin',
  RENT_REJECTION_GUEST = 'rent-rejection-guest',
  WAITING_APPROVAL = 'waiting-approve',
}

export type TemplateVariables = Record<string, string | number | boolean>
