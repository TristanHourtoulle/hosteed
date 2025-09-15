'use server'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import Mail from 'nodemailer/lib/mailer'
import fs from 'fs'
import path from 'path'

// Types pour la configuration
interface EmailConfig {
  port: number
  secure: boolean
  requireTLS?: boolean
  tls: { rejectUnauthorized: boolean }
  priority: 'high' | 'normal' | 'low'
  headers: Record<string, string | undefined>
}

// Configuration adaptative selon les providers email
const getOptimalConfig = (email: string): EmailConfig => {
  const domain = email.split('@')[1]?.toLowerCase()

  // Configuration spécifique pour Outlook/Office365
  if (
    domain?.includes('outlook') ||
    domain?.includes('epitech') ||
    domain?.includes('microsoft') ||
    domain?.includes('hotmail')
  ) {
    return {
      port: 587,
      secure: false,
      requireTLS: true,
      tls: { rejectUnauthorized: true },
      priority: 'high',
      headers: {
        'X-Mailer': 'Hosteed Platform v1.0',
        'X-Priority': '2',
        'X-MS-Has-Attach': 'no',
        'List-Unsubscribe': '<mailto:hello@hosteed.com?subject=unsubscribe>',
        'Return-Path': process.env.EMAIL_LOGIN,
        'Reply-To': process.env.EMAIL_LOGIN,
      },
    }
  }

  // Configuration optimisée pour Gmail
  if (domain?.includes('gmail') || domain?.includes('googlemail')) {
    return {
      port: 465,
      secure: true,
      tls: { rejectUnauthorized: true },
      priority: 'normal',
      headers: {
        'X-Mailer': 'Hosteed Platform',
        'X-Priority': '3',
        'Return-Path': process.env.EMAIL_LOGIN,
        'Reply-To': process.env.EMAIL_LOGIN,
      },
    }
  }

  // Configuration pour iCloud et autres providers
  return {
    port: 587,
    secure: false,
    requireTLS: true,
    tls: { rejectUnauthorized: true },
    priority: 'normal',
    headers: {
      'X-Mailer': 'Hosteed Platform',
      'X-Priority': '3',
      'Return-Path': process.env.EMAIL_LOGIN,
      'Reply-To': process.env.EMAIL_LOGIN,
    },
  }
}

// Fonction de retry intelligent
async function retryEmailSend(
  transportOptions: Record<string, unknown>,
  mailOptions: Mail.Options,
  maxRetries: number = 3
): Promise<nodemailer.SentMessageInfo> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const transport = nodemailer.createTransport(transportOptions)
      const result = await transport.sendMail(mailOptions)
      transport.close()
      console.log(`✅ Email envoyé avec succès (tentative ${attempt})`)
      return result
    } catch (error) {
      lastError = error as Error
      console.warn(`⚠️ Tentative ${attempt}/${maxRetries} échouée:`, error)

      // Attendre avant de réessayer (backoff exponentiel)
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000 // 2s, 4s, 8s
        console.log(`⏳ Retry dans ${waitTime / 1000}s...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }

  throw lastError
}

export async function SendMail(
  email: string,
  name: string,
  message: string,
  isHtml: boolean = false,
  forceScend: boolean = false
) {
  // Check if email sending is disabled (except for forced sends like email verification)
  if (!forceScend && process.env.NEXT_PUBLIC_SEND_MAIL !== 'true') {
    console.log('EMAIL SKIPPED: NEXT_PUBLIC_SEND_MAIL is not true')
    return NextResponse.json({ message: 'Email sending disabled', skipped: true })
  }

  const config = getOptimalConfig(email)

  const transportConfig = {
    host: 'ssl0.ovh.net',
    port: config.port,
    secure: config.secure,
    requireTLS: config.requireTLS,
    tls: config.tls,
    auth: {
      user: process.env.EMAIL_LOGIN,
      pass: process.env.EMAIL_PASSWORD,
    },
    // DKIM avec clé générée manuellement
    dkim: {
      domainName: 'hosteed.com',
      keySelector: 'hosteed',
      privateKey: (() => {
        try {
          return fs.readFileSync(
            path.join(process.cwd(), 'dkim-keys', 'hosteed-private.pem'),
            'utf8'
          )
        } catch {
          console.warn('DKIM key not found, emails will be sent without DKIM signature')
          return ''
        }
      })(),
    },
    // Pool de connexions pour de meilleures performances
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  }

  const mailOptions: Mail.Options = {
    from: `"Hosteed Platform" <${process.env.EMAIL_LOGIN}>`,
    replyTo: process.env.EMAIL_LOGIN,
    to: email,
    subject: name,
    priority: config.priority,
    headers: {
      ...config.headers,
      'Message-ID': `<${Date.now()}-${Math.random().toString(36)}@hosteed.com>`,
      Date: new Date().toUTCString(),
      'X-Entity-Ref-ID': `hosteed-${Date.now()}`,
    } as Record<string, string>,
    ...(isHtml ? { html: message } : { text: message }),
  }

  try {
    console.log(`📧 Envoi email vers ${email} (provider: ${email.split('@')[1]})`)
    const result = await retryEmailSend(transportConfig, mailOptions)
    console.log('EMAIL ENVOYÉ AVEC SUCCÈS')
    return NextResponse.json({
      message: 'Email sent',
      messageId: result.messageId,
      provider: email.split('@')[1],
      config: config.port,
    })
  } catch (err) {
    console.error("ERREUR D'ENVOI D'EMAIL:", err)
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Erreur inconnue',
        details: err,
        email: email,
        provider: email.split('@')[1],
      },
      { status: 500 }
    )
  }
}

export async function sendEmailFromTemplate(
  templateName: string,
  email: string,
  subject: string,
  variables: Record<string, string>,
  forceScend: boolean = false
) {
  // Check if email sending is disabled (except for forced sends like email verification)
  if (!forceScend && process.env.NEXT_PUBLIC_SEND_MAIL !== 'true') {
    console.log(`EMAIL TEMPLATE ${templateName} SKIPPED: NEXT_PUBLIC_SEND_MAIL is not true`)
    return { success: true, message: 'Email sending disabled', skipped: true }
  }

  try {
    console.log(`📧 Préparation email template ${templateName} vers ${email}`)

    // Lire le template
    const templatePath = path.join(process.cwd(), 'public/templates/emails', `${templateName}.html`)
    let htmlContent = fs.readFileSync(templatePath, 'utf8')

    // Remplacer les variables
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      htmlContent = htmlContent.replace(regex, value || '')
    })

    // Gérer les conditions {{#if variable}}...{{/if}}
    htmlContent = htmlContent.replace(
      /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g,
      (_, variable, content) => {
        return variables[variable] && variables[variable].trim() !== '' ? content : ''
      }
    )

    // Configuration adaptative selon le provider
    const config = getOptimalConfig(email)

    const transportConfig = {
      host: 'ssl0.ovh.net',
      port: config.port,
      secure: config.secure,
      requireTLS: config.requireTLS,
      tls: config.tls,
      auth: {
        user: process.env.EMAIL_LOGIN,
        pass: process.env.EMAIL_PASSWORD,
      },
      // DKIM maintenant activé avec DNS configuré
      dkim: {
        domainName: 'hosteed.com',
        keySelector: 'hosteed',
        privateKey: (() => {
          try {
            return fs.readFileSync(
              path.join(process.cwd(), 'dkim-keys', 'hosteed-private.pem'),
              'utf8'
            )
          } catch {
            console.warn('DKIM key not found, emails will be sent without DKIM signature')
            return ''
          }
        })(),
      },
      // Pool de connexions pour de meilleures performances
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    }

    const mailOptions: Mail.Options = {
      from: `"Hosteed Platform" <${process.env.EMAIL_LOGIN}>`,
      replyTo: process.env.EMAIL_LOGIN,
      to: email,
      subject: subject,
      priority: config.priority,
      headers: {
        ...config.headers,
        'Message-ID': `<${Date.now()}-${Math.random().toString(36)}@hosteed.com>`,
        Date: new Date().toUTCString(),
        'X-Entity-Ref-ID': `hosteed-template-${templateName}-${Date.now()}`,
        'X-Template-Name': templateName,
      } as Record<string, string>,
      html: htmlContent,
    }

    console.log(
      `📧 Envoi template ${templateName} vers ${email} (provider: ${email.split('@')[1]})`
    )
    const result = await retryEmailSend(transportConfig, mailOptions)
    console.log(`EMAIL TEMPLATE ${templateName} ENVOYÉ AVEC SUCCÈS À ${email}`)

    return {
      success: true,
      message: 'Email sent',
      messageId: result.messageId,
      template: templateName,
      provider: email.split('@')[1],
      config: config.port,
    }
  } catch (err) {
    console.error(`ERREUR D'ENVOI D'EMAIL TEMPLATE ${templateName}:`, err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erreur inconnue',
      template: templateName,
      email: email,
      provider: email.split('@')[1],
    }
  }
}

export async function sendRoleUpdateNotification(
  userEmail: string,
  userName: string,
  newRole: string,
  forceScend: boolean = false
) {
  try {
    // Déterminer les informations du rôle
    const roleInfo = getRoleInfo(newRole)

    const variables = {
      userName: userName || 'Utilisateur',
      newRoleClass: roleInfo.class,
      newRoleEmoji: roleInfo.emoji,
      newRoleLabel: roleInfo.label,
      roleDescription: roleInfo.description,
      loginUrl: `${process.env.NEXTAUTH_URL || 'https://hosteed.fr'}/auth`,
    }

    const result = await sendEmailFromTemplate(
      'role-updated',
      userEmail,
      `🔄 Mise à jour de votre rôle sur Hosteed`,
      variables,
      forceScend
    )

    return result
  } catch (error) {
    console.error("Erreur lors de l'envoi de la notification de rôle:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

function getRoleInfo(role: string) {
  switch (role) {
    case 'ADMIN':
      return {
        class: 'admin',
        emoji: '👑',
        label: 'Administrateur',
        description:
          "Vous avez maintenant accès à toutes les fonctionnalités d'administration de la plateforme, y compris la gestion des utilisateurs, la modération du contenu et les paramètres système.",
      }
    case 'HOST':
      return {
        class: 'host',
        emoji: '🏠',
        label: 'Hôte',
        description:
          'Vous pouvez maintenant publier et gérer vos propres annonces de logement, recevoir des réservations et communiquer avec les voyageurs.',
      }
    case 'GUEST':
    default:
      return {
        class: 'guest',
        emoji: '👤',
        label: 'Invité',
        description:
          'Vous pouvez rechercher et réserver des logements, laisser des avis et communiquer avec les hôtes.',
      }
  }
}
