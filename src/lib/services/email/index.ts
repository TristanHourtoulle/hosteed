// Main email service exports
export { emailService, sendEmail, sendTemplateEmail } from './email.service'
export { loadTemplate, clearTemplateCache, getAvailableTemplates } from './template.loader'
export { getBrevoClient, resetBrevoClient } from './brevo.client'
export * from './email.types'
