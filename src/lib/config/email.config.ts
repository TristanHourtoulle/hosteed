import { z } from 'zod'

const brevoConfigSchema = z.object({
  apiKey: z.string().startsWith('xkeysib-', {
    message: 'BREVO_API_KEY must start with "xkeysib-"',
  }),
  senderEmail: z.string().email({
    message: 'BREVO_SENDER_EMAIL must be a valid email address',
  }),
  senderName: z.string().min(1, {
    message: 'BREVO_SENDER_NAME is required',
  }),
  webhookSecret: z.string().optional(),
  sendingEnabled: z.boolean(),
})

export type BrevoConfig = z.infer<typeof brevoConfigSchema>

function loadEmailConfig(): BrevoConfig {
  const config = {
    apiKey: process.env.BREVO_API_KEY ?? '',
    senderEmail: process.env.BREVO_SENDER_EMAIL ?? '',
    senderName: process.env.BREVO_SENDER_NAME ?? '',
    webhookSecret: process.env.BREVO_WEBHOOK_SECRET,
    sendingEnabled: process.env.NEXT_PUBLIC_SEND_MAIL === 'true',
  }

  // Validate only if sending is enabled
  if (config.sendingEnabled) {
    const result = brevoConfigSchema.safeParse(config)

    if (!result.success) {
      console.error('[Email Config] Validation failed:', result.error.format())
      throw new Error(
        `Email configuration is invalid: ${result.error.issues.map(i => i.message).join(', ')}`
      )
    }

    return result.data
  }

  // Return config without validation when sending is disabled
  return config as BrevoConfig
}

export const emailConfig = loadEmailConfig()
