import { SendMail } from './email.service'
import fs from 'fs/promises'
import path from 'path'

/**
 * Envoie un email basé sur un template HTML avec variables dynamiques
 * @param to Destinataire
 * @param subject Sujet de l'email
 * @param templateName Nom du fichier template (ex: 'annulation.html')
 * @param variables Variables à injecter dans le template
 */
export async function sendTemplatedMail(
  to: string,
  subject: string,
  templateName: string,
  variables: Record<string, string | number>
) {
  const templatePath = path.join(process.cwd(), 'public/templates/emails', templateName)
  let html = await fs.readFile(templatePath, 'utf-8')
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\s*${key}\s*}}`, 'g')
    html = html.replace(regex, String(value))
  }
  // Envoi du mail avec le HTML généré
  return SendMail(to, subject, html, true)
}
