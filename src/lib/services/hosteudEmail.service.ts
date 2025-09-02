import nodemailer from 'nodemailer'
import Mail from 'nodemailer/lib/mailer'

export enum EmailType {
  CONTACT = 'contact',
  BOOKING = 'booking',
  HOST = 'host',
  ADMIN = 'admin',
  NOREPLY = 'noreply'
}

const getEmailAddress = (type: EmailType): string => {
  switch (type) {
    case EmailType.CONTACT:
      return process.env.HOSTEED_CONTACT_EMAIL || 'contact@hosteed.fr'
    case EmailType.BOOKING:
      return process.env.HOSTEED_BOOKING_EMAIL || 'booking@hosteed.fr'
    case EmailType.HOST:
      return process.env.HOSTEED_HOST_EMAIL || 'host@hosteed.fr'
    case EmailType.ADMIN:
      return process.env.HOSTEED_ADMIN_EMAIL || 'admin@hosteed.fr'
    case EmailType.NOREPLY:
    default:
      return process.env.EMAIL_LOGIN || 'noreply@hosteed.fr'
  }
}

function getFromName(type: EmailType): string {
  switch (type) {
    case EmailType.CONTACT:
      return 'Hosteed - Contact'
    case EmailType.BOOKING:
      return 'Hosteed - Réservations'
    case EmailType.HOST:
      return 'Hosteed - Hôtes'
    case EmailType.ADMIN:
      return 'Hosteed - Administration'
    case EmailType.NOREPLY:
    default:
      return 'Hosteed'
  }
}

export async function sendHosteedEmail(
  to: string,
  subject: string,
  content: string,
  type: EmailType = EmailType.NOREPLY,
  isHtml: boolean = false
) {
  const fromEmail = getEmailAddress(type)
  const fromName = getFromName(type)

  // Utilise le domaine approprié selon la configuration
  const domain = fromEmail.includes('@hosteed.fr') ? 'hosteed.fr' : 'skillsnotation.fr'

  const transport = nodemailer.createTransport({
    host: 'ssl0.ovh.net',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_LOGIN,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
    dkim: {
      domainName: domain,
      keySelector: 'ovh',
      privateKey: process.env.DKIM_PRIVATE_KEY || '',
    },
  } as nodemailer.TransportOptions)

  const mailOptions: Mail.Options = {
    from: `"${fromName}" <${fromEmail}>`,
    replyTo: type === EmailType.NOREPLY ? getEmailAddress(EmailType.CONTACT) : fromEmail,
    to,
    subject: `[Hosteed] ${subject}`,
    [isHtml ? 'html' : 'text']: content,
    headers: {
      'List-Unsubscribe': `<mailto:unsubscribe@${domain}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      'X-Mailer': 'Hosteed Platform',
      'X-Priority': '3',
      'Importance': 'Normal',
    },
  }

  try {
    const info = await transport.sendMail(mailOptions)
    console.log(`✅ Email envoyé depuis: ${fromEmail} vers: ${to}`)
    console.log(`📋 Sujet: [Hosteed] ${subject}`)
    return info
  } catch (error) {
    console.error(`❌ Erreur envoi email depuis: ${fromEmail}`, error)
    throw error
  }
}

// Fonctions spécialisées pour chaque type d'email
export const sendContactEmail = (to: string, subject: string, content: string, isHtml = false) =>
  sendHosteedEmail(to, subject, content, EmailType.CONTACT, isHtml)

export const sendBookingEmail = (to: string, subject: string, content: string, isHtml = false) =>
  sendHosteedEmail(to, subject, content, EmailType.BOOKING, isHtml)

export const sendHostEmail = (to: string, subject: string, content: string, isHtml = false) =>
  sendHosteedEmail(to, subject, content, EmailType.HOST, isHtml)

export const sendAdminEmail = (to: string, subject: string, content: string, isHtml = false) =>
  sendHosteedEmail(to, subject, content, EmailType.ADMIN, isHtml)

export const sendNotificationEmail = (to: string, subject: string, content: string, isHtml = false) =>
  sendHosteedEmail(to, subject, content, EmailType.NOREPLY, isHtml)

// Fonction pour les emails avec templates
export async function sendTemplatedHosteedEmail(
  to: string,
  subject: string,
  templatePath: string,
  variables: Record<string, string | number>,
  type: EmailType = EmailType.NOREPLY
) {
  const fs = await import('fs/promises')
  const path = await import('path')
  
  try {
    const fullPath = path.join(process.cwd(), 'public/templates/emails', templatePath)
    let html = await fs.readFile(fullPath, 'utf-8')
    
    // Remplacer les variables {{variable}}
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\s*${key}\s*}}`, 'g')
      html = html.replace(regex, String(value))
    }
    
    return sendHosteedEmail(to, subject, html, type, true)
  } catch (error) {
    console.error(`❌ Erreur lecture template: ${templatePath}`, error)
    throw error
  }
}

// Types d'emails prédéfinis avec templates
export const EmailTemplates = {
  WELCOME: 'welcome-hosteed.html',
  BOOKING_CONFIRMATION: 'booking-confirmation.html',
  HOST_NEW_BOOKING: 'host-new-booking.html',
  PAYMENT_SUCCESS: 'payment-success.html',
  PASSWORD_RESET: 'password-reset.html',
  EMAIL_VERIFICATION: 'email-verification.html',
} as const

// Fonctions d'envoi spécialisées avec templates
export const sendWelcomeEmail = (to: string, variables: Record<string, string | number>) =>
  sendTemplatedHosteedEmail(to, 'Bienvenue chez Hosteed !', EmailTemplates.WELCOME, variables, EmailType.CONTACT)

export const sendBookingConfirmation = (to: string, variables: Record<string, string | number>) =>
  sendTemplatedHosteedEmail(to, 'Confirmation de votre réservation', EmailTemplates.BOOKING_CONFIRMATION, variables, EmailType.BOOKING)

export const sendHostNotification = (to: string, variables: Record<string, string | number>) =>
  sendTemplatedHosteedEmail(to, 'Nouvelle réservation reçue', EmailTemplates.HOST_NEW_BOOKING, variables, EmailType.HOST)