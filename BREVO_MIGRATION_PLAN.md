# Plan de Migration Email vers Brevo

## Contexte

Migration complète du système d'envoi d'emails de Hosteed depuis Nodemailer/OVH SMTP vers l'API Brevo pour améliorer la délivrabilité, notamment vers les emails Outlook et scolaires.

### Problème actuel
- Système fragmenté avec 3 services email différents
- Délivrabilité faible vers Outlook/Microsoft 365/emails scolaires
- Pas de tracking des emails (opens, clicks, bounces)
- Configuration DKIM manuelle et complexe

### Solution Brevo
- API transactionnelle avec haute délivrabilité
- SPF/DKIM/DMARC gérés automatiquement par Brevo
- Webhooks pour tracking en temps réel
- **Templates HTML locaux conservés** (pas de migration vers Brevo)
- Meilleure réputation IP pour les emails B2B/scolaires

---

## Informations de Configuration

```
Clé API Brevo: xkeysib-YOUR_API_KEY_HERE
Email expéditeur vérifié: hello@hosteed.com
Nom d'expéditeur: Hosteed.com
```

---

## Phase 1: Setup et Configuration (Jour 1)

### 1.1 Installation du SDK Brevo

```bash
pnpm add @getbrevo/brevo
```

### 1.2 Configuration des variables d'environnement

Ajouter dans `.env`:
```env
# Brevo Configuration
BREVO_API_KEY=xkeysib-YOUR_API_KEY_HERE
BREVO_SENDER_EMAIL=hello@hosteed.com
BREVO_SENDER_NAME=Hosteed.com

# Webhook secret (à générer)
BREVO_WEBHOOK_SECRET=<à_générer>

# Feature flag pour migration progressive
EMAIL_PROVIDER=brevo  # 'brevo' | 'legacy'
```

### 1.3 Validation Zod pour la configuration

Créer `src/lib/config/email.config.ts`:
```typescript
import { z } from 'zod'

const brevoConfigSchema = z.object({
  BREVO_API_KEY: z.string().startsWith('xkeysib-'),
  BREVO_SENDER_EMAIL: z.string().email(),
  BREVO_SENDER_NAME: z.string().min(1),
  BREVO_WEBHOOK_SECRET: z.string().optional(),
  EMAIL_PROVIDER: z.enum(['brevo', 'legacy']).default('brevo'),
})

export const emailConfig = brevoConfigSchema.parse({
  BREVO_API_KEY: process.env.BREVO_API_KEY,
  BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL,
  BREVO_SENDER_NAME: process.env.BREVO_SENDER_NAME,
  BREVO_WEBHOOK_SECRET: process.env.BREVO_WEBHOOK_SECRET,
  EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
})
```

---

## Phase 2: Architecture du Service Email (Jour 1-2)

### 2.1 Structure des fichiers

```
src/lib/services/email/
├── index.ts                    # Export public
├── brevo.client.ts             # Client Brevo singleton
├── email.service.ts            # Service principal unifié
├── email.types.ts              # Types TypeScript
├── template.loader.ts          # Chargeur de templates HTML locaux
└── webhooks/
    └── email-events.handler.ts # Handler pour webhooks
```

### 2.2 Client Brevo (`brevo.client.ts`)

```typescript
import { TransactionalEmailsApi, TransactionalEmailsApiApiKeys } from '@getbrevo/brevo'
import { emailConfig } from '@/lib/config/email.config'

class BrevoClient {
  private static instance: TransactionalEmailsApi | null = null

  static getInstance(): TransactionalEmailsApi {
    if (!this.instance) {
      this.instance = new TransactionalEmailsApi()
      this.instance.setApiKey(
        TransactionalEmailsApiApiKeys.apiKey,
        emailConfig.BREVO_API_KEY
      )
    }
    return this.instance
  }
}

export const brevoClient = BrevoClient.getInstance()
```

### 2.3 Types (`email.types.ts`)

```typescript
export interface EmailRecipient {
  email: string
  name?: string
}

export interface SendEmailParams {
  to: EmailRecipient | EmailRecipient[]
  subject: string
  htmlContent: string
  textContent?: string
  params?: Record<string, string | number | boolean>
  tags?: string[]
  replyTo?: EmailRecipient
  cc?: EmailRecipient[]
  bcc?: EmailRecipient[]
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

// Enum des templates locaux (fichiers HTML)
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
```

### 2.4 Chargeur de Templates (`template.loader.ts`)

```typescript
import fs from 'fs/promises'
import path from 'path'
import { EmailTemplate } from './email.types'

const TEMPLATES_DIR = 'public/templates/emails'

// Cache des templates en mémoire
const templateCache = new Map<string, string>()

export async function loadTemplate(
  template: EmailTemplate | string,
  variables: Record<string, string | number | boolean>
): Promise<string> {
  const templateName = typeof template === 'string' ? template : template
  const cacheKey = templateName

  // Charger depuis le cache ou le fichier
  let htmlContent = templateCache.get(cacheKey)

  if (!htmlContent) {
    const templatePath = path.join(process.cwd(), TEMPLATES_DIR, `${templateName}.html`)
    htmlContent = await fs.readFile(templatePath, 'utf8')

    // Cache en production uniquement
    if (process.env.NODE_ENV === 'production') {
      templateCache.set(cacheKey, htmlContent)
    }
  }

  // Remplacer les variables {{variable}}
  let processedHtml = htmlContent
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
    processedHtml = processedHtml.replace(regex, String(value))
  }

  // Gérer les conditions {{#if variable}}...{{/if}}
  processedHtml = processedHtml.replace(
    /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g,
    (_, variable, content) => {
      const value = variables[variable]
      return value && String(value).trim() !== '' ? content : ''
    }
  )

  return processedHtml
}

// Vider le cache (utile pour le dev)
export function clearTemplateCache(): void {
  templateCache.clear()
}
```

### 2.5 Service Email Principal (`email.service.ts`)

```typescript
import { SendSmtpEmail } from '@getbrevo/brevo'
import { brevoClient } from './brevo.client'
import { emailConfig } from '@/lib/config/email.config'
import { loadTemplate } from './template.loader'
import {
  SendEmailParams,
  EmailResult,
  EmailTemplate,
  EmailRecipient,
} from './email.types'

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

function normalizeRecipients(
  recipients: EmailRecipient | EmailRecipient[]
): EmailRecipient[] {
  return Array.isArray(recipients) ? recipients : [recipients]
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function sendEmail(params: SendEmailParams): Promise<EmailResult> {
  // Skip if email sending is disabled
  if (process.env.NEXT_PUBLIC_SEND_MAIL !== 'true') {
    console.log('[Email] Sending disabled, skipping:', params.subject)
    return { success: true, messageId: 'skipped' }
  }

  const message = new SendSmtpEmail()

  // Sender configuration
  message.sender = {
    name: emailConfig.BREVO_SENDER_NAME,
    email: emailConfig.BREVO_SENDER_EMAIL,
  }

  // Recipients
  message.to = normalizeRecipients(params.to)

  if (params.cc) {
    message.cc = params.cc
  }

  if (params.bcc) {
    message.bcc = params.bcc
  }

  if (params.replyTo) {
    message.replyTo = params.replyTo
  }

  // Subject and content
  message.subject = params.subject
  message.htmlContent = params.htmlContent

  if (params.textContent) {
    message.textContent = params.textContent
  }

  // Tags for tracking
  if (params.tags) {
    message.tags = params.tags
  }

  // Retry logic with exponential backoff
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await brevoClient.sendTransacEmail(message)

      console.log(`[Email] Sent successfully to ${message.to?.[0]?.email}`, {
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
      console.warn(`[Email] Attempt ${attempt}/${MAX_RETRIES} failed:`, error)

      if (attempt < MAX_RETRIES) {
        await delay(RETRY_DELAY_MS * Math.pow(2, attempt - 1))
      }
    }
  }

  console.error('[Email] All retries failed:', lastError)
  return {
    success: false,
    error: lastError?.message ?? 'Unknown error',
  }
}

// Send email using local HTML template
export async function sendTemplateEmail(
  template: EmailTemplate | string,
  to: EmailRecipient | EmailRecipient[],
  subject: string,
  variables: Record<string, string | number | boolean>,
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
    console.error(`[Email] Failed to load template ${template}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Template loading failed',
    }
  }
}

// Specialized email functions for common use cases
export const emailService = {
  // Account emails
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
      { userName: name, loginUrl: `${process.env.NEXTAUTH_URL}/auth` },
      { tags: ['account', 'welcome'] }
    )
  },

  async sendRoleUpdate(
    email: string,
    name: string,
    newRole: string,
    roleDescription: string,
    roleClass: string,
    roleEmoji: string
  ): Promise<EmailResult> {
    return sendTemplateEmail(
      EmailTemplate.ROLE_UPDATED,
      { email, name },
      'Mise à jour de votre rôle sur Hosteed',
      {
        userName: name,
        newRoleLabel: newRole,
        roleDescription,
        newRoleClass: roleClass,
        newRoleEmoji: roleEmoji,
        loginUrl: `${process.env.NEXTAUTH_URL}/auth`,
      },
      { tags: ['account', 'role-update'] }
    )
  },

  // Listing emails
  async sendListingPosted(
    email: string,
    name: string,
    listingTitle: string,
    listingUrl: string
  ): Promise<EmailResult> {
    return sendTemplateEmail(
      EmailTemplate.LISTING_POSTED,
      { email, name },
      'Votre annonce a été publiée - Hosteed',
      { userName: name, listingTitle, listingUrl },
      { tags: ['listing', 'posted'] }
    )
  },

  async sendListingApproved(
    email: string,
    name: string,
    listingTitle: string,
    listingUrl: string
  ): Promise<EmailResult> {
    return sendTemplateEmail(
      EmailTemplate.LISTING_APPROVED,
      { email, name },
      'Votre annonce a été approuvée - Hosteed',
      { userName: name, listingTitle, listingUrl },
      { tags: ['listing', 'approved'] }
    )
  },

  async sendListingRejected(
    email: string,
    name: string,
    listingTitle: string,
    rejectionReason: string
  ): Promise<EmailResult> {
    return sendTemplateEmail(
      EmailTemplate.LISTING_REJECTED,
      { email, name },
      'Votre annonce nécessite des modifications - Hosteed',
      { userName: name, listingTitle, rejectionReason },
      { tags: ['listing', 'rejected'] }
    )
  },

  async sendListingModified(
    email: string,
    name: string,
    listingTitle: string,
    listingUrl: string
  ): Promise<EmailResult> {
    return sendTemplateEmail(
      EmailTemplate.LISTING_MODIFIED,
      { email, name },
      'Votre annonce a été modifiée - Hosteed',
      { userName: name, listingTitle, listingUrl },
      { tags: ['listing', 'modified'] }
    )
  },

  // Booking emails
  async sendBookingConfirmation(
    email: string,
    name: string,
    bookingDetails: {
      listingTitle: string
      checkIn: string
      checkOut: string
      totalPrice: string
      bookingUrl: string
    }
  ): Promise<EmailResult> {
    return sendTemplateEmail(
      EmailTemplate.BOOKING_CONFIRMATION,
      { email, name },
      'Confirmation de votre réservation - Hosteed',
      { userName: name, ...bookingDetails },
      { tags: ['booking', 'confirmation'] }
    )
  },

  async sendNewBookingToHost(
    email: string,
    name: string,
    bookingDetails: {
      guestName: string
      listingTitle: string
      checkIn: string
      checkOut: string
      totalPrice: string
      bookingUrl: string
    }
  ): Promise<EmailResult> {
    return sendTemplateEmail(
      EmailTemplate.BOOKING_NEW_HOST,
      { email, name },
      'Nouvelle réservation reçue - Hosteed',
      { hostName: name, ...bookingDetails },
      { tags: ['booking', 'new-host'] }
    )
  },

  async sendBookingReminder(
    email: string,
    name: string,
    isHost: boolean,
    reminderDetails: {
      listingTitle: string
      checkIn: string
      guestName?: string
      hostName?: string
      bookingUrl: string
    }
  ): Promise<EmailResult> {
    const template = isHost
      ? EmailTemplate.BOOKING_REMINDER_HOST
      : EmailTemplate.BOOKING_REMINDER_CLIENT

    return sendTemplateEmail(
      template,
      { email, name },
      'Rappel: Arrivée demain - Hosteed',
      { userName: name, ...reminderDetails },
      { tags: ['booking', 'reminder', isHost ? 'host' : 'guest'] }
    )
  },

  async sendBookingCancellation(
    email: string,
    name: string,
    cancellationDetails: {
      listingTitle: string
      checkIn: string
      checkOut: string
      reason?: string
    }
  ): Promise<EmailResult> {
    return sendTemplateEmail(
      EmailTemplate.BOOKING_CANCELLATION,
      { email, name },
      'Annulation de réservation - Hosteed',
      { userName: name, ...cancellationDetails },
      { tags: ['booking', 'cancellation'] }
    )
  },

  async sendBookingRequestAccepted(
    email: string,
    name: string,
    bookingDetails: {
      listingTitle: string
      checkIn: string
      checkOut: string
      bookingUrl: string
    }
  ): Promise<EmailResult> {
    return sendTemplateEmail(
      EmailTemplate.BOOKING_REQUEST_ACCEPTED,
      { email, name },
      'Votre demande de réservation a été acceptée - Hosteed',
      { userName: name, ...bookingDetails },
      { tags: ['booking', 'accepted'] }
    )
  },

  // Payment emails
  async sendPaymentRequest(
    email: string,
    name: string,
    role: 'guest' | 'host' | 'admin',
    paymentDetails: {
      amount: string
      listingTitle: string
      paymentUrl: string
    }
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
      { userName: name, ...paymentDetails },
      { tags: ['payment', 'request', role] }
    )
  },

  async sendPaymentError(
    email: string,
    name: string,
    errorDetails: {
      amount: string
      listingTitle: string
      errorMessage: string
      retryUrl: string
    }
  ): Promise<EmailResult> {
    return sendTemplateEmail(
      EmailTemplate.PAYMENT_ERROR,
      { email, name },
      'Erreur de paiement - Hosteed',
      { userName: name, ...errorDetails },
      { tags: ['payment', 'error'] }
    )
  },

  // Review emails
  async sendReviewRequest(
    email: string,
    name: string,
    reviewDetails: {
      listingTitle: string
      hostName: string
      reviewUrl: string
    }
  ): Promise<EmailResult> {
    return sendTemplateEmail(
      EmailTemplate.REVIEW_REQUEST,
      { email, name },
      'Donnez votre avis sur votre séjour - Hosteed',
      { userName: name, ...reviewDetails },
      { tags: ['review', 'request'] }
    )
  },

  async sendNewReviewNotification(
    email: string,
    name: string,
    reviewDetails: {
      reviewerName: string
      listingTitle: string
      rating: number
      reviewUrl: string
    }
  ): Promise<EmailResult> {
    return sendTemplateEmail(
      EmailTemplate.REVIEW_NEW,
      { email, name },
      'Nouvel avis reçu - Hosteed',
      { userName: name, ...reviewDetails },
      { tags: ['review', 'new'] }
    )
  },

  async sendReviewValidationToAdmin(
    email: string,
    reviewDetails: {
      reviewerName: string
      listingTitle: string
      adminUrl: string
    }
  ): Promise<EmailResult> {
    return sendTemplateEmail(
      EmailTemplate.REVIEW_VALIDATION,
      { email },
      'Nouvel avis à valider - Hosteed',
      reviewDetails,
      { tags: ['review', 'admin', 'validation'] }
    )
  },

  // Admin emails
  async sendDisputeNotification(
    email: string,
    disputeDetails: {
      bookingId: string
      amount: string
      reason: string
      adminUrl: string
    }
  ): Promise<EmailResult> {
    return sendTemplateEmail(
      EmailTemplate.DISPUTE,
      { email },
      'Litige signalé - Hosteed',
      disputeDetails,
      { tags: ['admin', 'dispute'] }
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

  // Generic template send (for backward compatibility)
  async sendFromTemplate(
    templateName: string,
    email: string,
    subject: string,
    variables: Record<string, string | number | boolean>
  ): Promise<EmailResult> {
    return sendTemplateEmail(
      templateName,
      { email },
      subject,
      variables
    )
  },
}

export default emailService
```

### 2.6 Export public (`index.ts`)

```typescript
export { emailService, sendEmail, sendTemplateEmail } from './email.service'
export { loadTemplate, clearTemplateCache } from './template.loader'
export { brevoClient } from './brevo.client'
export * from './email.types'
```

---

## Phase 3: Webhooks pour Tracking (Jour 2-3)

### 3.1 Créer l'endpoint webhook

Créer `src/app/api/webhooks/brevo/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// Types pour les événements Brevo
interface BrevoWebhookEvent {
  event: 'sent' | 'delivered' | 'opened' | 'click' | 'soft_bounce' | 'hard_bounce' | 'invalid_email' | 'deferred' | 'complaint' | 'unsubscribed' | 'blocked' | 'error'
  email: string
  'message-id': string
  ts_event: number
  subject?: string
  tag?: string[]
  link?: string
  reason?: string
}

function verifyWebhookSignature(
  payload: string,
  signature: string | null
): boolean {
  if (!process.env.BREVO_WEBHOOK_SECRET || !signature) {
    return true
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.BREVO_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text()
    const signature = request.headers.get('x-brevo-signature')

    if (!verifyWebhookSignature(payload, signature)) {
      console.error('[Brevo Webhook] Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event: BrevoWebhookEvent = JSON.parse(payload)

    console.log(`[Brevo Webhook] Received: ${event.event} for ${event.email}`)

    // Store event in database
    await prisma.emailEvent.create({
      data: {
        messageId: event['message-id'],
        email: event.email,
        event: event.event,
        timestamp: new Date(event.ts_event * 1000),
        subject: event.subject,
        tags: event.tag ?? [],
        metadata: {
          link: event.link,
          reason: event.reason,
        },
      },
    })

    // Handle specific events
    switch (event.event) {
      case 'hard_bounce':
      case 'invalid_email':
        await prisma.user.updateMany({
          where: { email: event.email },
          data: { emailVerified: null, emailBounced: true },
        })
        console.log(`[Brevo Webhook] Marked ${event.email} as bounced`)
        break

      case 'complaint':
      case 'unsubscribed':
        await prisma.user.updateMany({
          where: { email: event.email },
          data: { emailOptOut: true },
        })
        console.log(`[Brevo Webhook] Marked ${event.email} as opted-out`)
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Brevo Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
```

### 3.2 Ajouter le modèle Prisma pour les événements

Ajouter dans `prisma/schema.prisma`:

```prisma
model EmailEvent {
  id        String   @id @default(cuid())
  messageId String
  email     String
  event     String
  timestamp DateTime
  subject   String?
  tags      String[]
  metadata  Json?
  createdAt DateTime @default(now())

  @@index([email])
  @@index([messageId])
  @@index([event])
  @@index([timestamp])
}
```

Ajouter ces champs au modèle `User` existant:
```prisma
model User {
  // ... champs existants ...
  emailBounced Boolean @default(false)
  emailOptOut  Boolean @default(false)
}
```

### 3.3 Configurer le webhook dans Brevo

```bash
curl --request POST \
  --url https://api.brevo.com/v3/webhooks \
  --header 'api-key: xkeysib-YOUR_API_KEY_HERE' \
  --header 'Content-Type: application/json' \
  --data '{
    "url": "https://hosteed.com/api/webhooks/brevo",
    "events": ["sent", "delivered", "opened", "click", "soft_bounce", "hard_bounce", "invalid_email", "complaint", "unsubscribed", "blocked", "error"],
    "description": "Hosteed email tracking webhook",
    "channel": "email"
  }'
```

---

## Phase 4: Migration des Appels (Jour 3-4)

### 4.1 Liste des fichiers à modifier

| Fichier | Fonction actuelle | Nouvelle fonction |
|---------|-------------------|-------------------|
| `src/lib/services/user.service.ts` | `sendEmailVerification()` | `emailService.sendVerificationEmail()` |
| `src/lib/services/payment.service.ts` | `sendEmailFromTemplate()` | `emailService.sendPaymentRequest()` |
| `src/lib/services/rents.service.ts` | `sendTemplatedMail()` | `emailService.sendBookingConfirmation()` |
| `src/lib/services/product.service.ts` | `sendEmailFromTemplate()` | `emailService.sendListingPosted()`, etc. |
| `src/lib/services/reviews.service.ts` | `SendMail()` | `emailService.sendReviewRequest()` |
| `src/lib/services/validation.service.ts` | `sendEmailFromTemplate()` | `emailService.sendListingApproved()`, etc. |
| `src/app/webhook/route.ts` | `SendMail()` | `emailService.sendDisputeNotification()` |
| `src/app/api/cron/route.ts` | `sendEmailFromTemplate()` | `emailService.sendBookingReminder()` |
| `src/app/api/admin/users/send-verification/route.ts` | Direct call | `emailService.sendVerificationEmail()` |

### 4.2 Exemple de migration

**Avant (user.service.ts):**
```typescript
import { SendMail } from './email.service'
import fs from 'fs'

export async function sendEmailVerification(user: User, token: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify?token=${token}`
  const htmlContent = fs.readFileSync('public/templates/emails/checkEmail.html', 'utf8')
    .replace('{{userName}}', user.name)
    .replace('{{verificationUrl}}', verificationUrl)

  await SendMail(user.email, 'Vérifiez votre email', htmlContent, true, true)
}
```

**Après:**
```typescript
import { emailService } from '@/lib/services/email'

export async function sendEmailVerification(user: User, token: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify?token=${token}`

  await emailService.sendVerificationEmail(
    user.email,
    user.name ?? 'Utilisateur',
    verificationUrl
  )
}
```

---

## Phase 5: Tests et Validation (Jour 4-5)

### 5.1 Tests unitaires

Créer `src/lib/services/email/__tests__/email.service.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendEmail, sendTemplateEmail, emailService } from '../email.service'
import { brevoClient } from '../brevo.client'
import { EmailTemplate } from '../email.types'

vi.mock('../brevo.client')

describe('Email Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SEND_MAIL = 'true'
  })

  describe('sendEmail', () => {
    it('sends email with HTML content', async () => {
      vi.mocked(brevoClient.sendTransacEmail).mockResolvedValue({
        body: { messageId: 'test-123' },
      } as any)

      const result = await sendEmail({
        to: { email: 'test@example.com', name: 'Test' },
        subject: 'Test Email',
        htmlContent: '<h1>Hello</h1>',
      })

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('test-123')
    })

    it('skips sending when disabled', async () => {
      process.env.NEXT_PUBLIC_SEND_MAIL = 'false'

      const result = await sendEmail({
        to: { email: 'test@example.com' },
        subject: 'Test',
        htmlContent: '<h1>Hello</h1>',
      })

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('skipped')
      expect(brevoClient.sendTransacEmail).not.toHaveBeenCalled()
    })

    it('retries on failure', async () => {
      vi.mocked(brevoClient.sendTransacEmail)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({ body: { messageId: 'test-123' } } as any)

      const result = await sendEmail({
        to: { email: 'test@example.com' },
        subject: 'Test',
        htmlContent: '<h1>Hello</h1>',
      })

      expect(result.success).toBe(true)
      expect(brevoClient.sendTransacEmail).toHaveBeenCalledTimes(3)
    })
  })
})
```

### 5.2 Tests d'intégration manuels

1. **Test Outlook/Microsoft 365:**
   - Créer un compte test Outlook
   - Envoyer un email de vérification
   - Vérifier la réception (inbox, pas spam)
   - Vérifier le rendu HTML

2. **Test emails scolaires:**
   - Tester avec une adresse @epitech.eu
   - Tester avec une adresse @edu.fr ou équivalent
   - Vérifier la délivrabilité

3. **Test Gmail:**
   - Vérifier la réception
   - Vérifier les headers SPF/DKIM

4. **Test webhooks:**
   - Utiliser ngrok pour exposer localhost
   - Vérifier la réception des événements

### 5.3 Checklist de validation

- [ ] Emails reçus dans Outlook personnel
- [ ] Emails reçus dans Outlook professionnel/scolaire
- [ ] Emails reçus dans Gmail
- [ ] Emails reçus dans Yahoo
- [ ] Pas de marquage spam
- [ ] Templates bien rendus (images, liens, styles)
- [ ] Variables correctement remplacées
- [ ] Webhooks fonctionnels
- [ ] Retry fonctionne sur erreur
- [ ] Logs corrects

---

## Phase 6: Nettoyage (Jour 5)

### 6.1 Fichiers à supprimer

Une fois la migration validée:

```
src/lib/services/email.service.ts          # Ancien service OVH
src/lib/services/email-brevo.service.ts    # Ancienne version Brevo SMTP
src/lib/services/hosteudEmail.service.ts   # Service multi-adresses
src/lib/services/sendTemplatedMail.ts      # Wrapper templates
```

### 6.2 Variables d'environnement à retirer

```env
# À supprimer de .env
EMAIL_LOGIN=...
EMAIL_PASSWORD=...
DKIM_PRIVATE_KEY=...
BREVO_EMAIL=...           # Remplacé par BREVO_SENDER_EMAIL
HOSTEED_CONTACT_EMAIL=...
HOSTEED_BOOKING_EMAIL=...
HOSTEED_HOST_EMAIL=...
HOSTEED_ADMIN_EMAIL=...
```

### 6.3 Templates HTML locaux

Les templates restent dans `public/templates/emails/` - aucune modification nécessaire.

---

## Récapitulatif des Livrables

### Nouveaux fichiers

```
src/lib/config/email.config.ts
src/lib/services/email/
├── index.ts
├── brevo.client.ts
├── email.service.ts
├── email.types.ts
├── template.loader.ts
└── __tests__/email.service.test.ts
src/app/api/webhooks/brevo/route.ts
```

### Modifications Prisma

- Nouveau modèle `EmailEvent`
- Champs `emailBounced` et `emailOptOut` sur `User`

### Configuration Brevo

- Email expéditeur vérifié: hello@hosteed.com
- Webhook configuré pour tracking

---

## Planning Estimé

| Phase | Description | Durée |
|-------|-------------|-------|
| 1 | Setup SDK et configuration | 0.5 jour |
| 2 | Architecture service | 1 jour |
| 3 | Webhooks tracking | 0.5 jour |
| 4 | Migration des appels | 1 jour |
| 5 | Tests et validation | 1.5 jours |
| 6 | Nettoyage | 0.5 jour |
| **Total** | | **5 jours** |

---

## Notes pour Outlook/Emails Scolaires

### Pourquoi Brevo améliore la délivrabilité

1. **Réputation IP**: Brevo maintient des IPs avec haute réputation auprès de Microsoft
2. **SPF/DKIM/DMARC**: Configuration automatique et optimisée
3. **Feedback loops**: Brevo gère les plaintes automatiquement
4. **Throttling intelligent**: Respect des limites des serveurs destinataires
5. **Warm-up automatique**: Pour les nouveaux domaines

### Bonnes pratiques additionnelles

1. **Subject lines**: Éviter les mots spam (gratuit, urgent, etc.)
2. **Ratio texte/image**: Au moins 60% texte
3. **Unsubscribe**: Lien obligatoire (géré automatiquement)
4. **Sender name**: Cohérent et reconnaissable (Hosteed.com)
5. **Volume**: Augmentation progressive

### Vérification DNS recommandée

Vérifier que ces enregistrements sont présents pour hosteed.com:
- SPF: `v=spf1 include:spf.brevo.com ~all`
- DKIM: Clé fournie par Brevo
- DMARC: `v=DMARC1; p=quarantine; rua=mailto:dmarc@hosteed.com`

---

## Commandes Utiles

```bash
# Installation
pnpm add @getbrevo/brevo

# Générer le client Prisma après ajout des modèles
pnpm prisma generate
pnpm prisma db push

# Lancer les tests
pnpm test

# Build pour vérifier les types
pnpm build
```
