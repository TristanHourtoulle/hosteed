import { sendTemplateEmail } from '@/lib/services/email'

/**
 * Send an email based on an HTML template with dynamic variables
 * This is a backward-compatible wrapper that now uses Brevo instead of SMTP
 *
 * @param to Recipient email address
 * @param subject Email subject
 * @param templateName Template filename (e.g., 'annulation.html')
 * @param variables Variables to inject into the template
 * @param _forceScend Deprecated - kept for backward compatibility
 */
export async function sendTemplatedMail(
  to: string,
  subject: string,
  templateName: string,
  variables: Record<string, string | number>,
  _forceScend: boolean = false
) {
  // Remove .html extension if present (new service handles it)
  const template = templateName.replace(/\.html$/, '')

  const result = await sendTemplateEmail(
    template,
    { email: to },
    subject,
    variables
  )

  if (!result.success) {
    console.error(`[sendTemplatedMail] Failed to send "${templateName}" to ${to}:`, result.error)
    throw new Error(result.error ?? 'Email sending failed')
  }

  return result
}
