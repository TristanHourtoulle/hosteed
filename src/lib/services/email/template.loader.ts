import fs from 'fs/promises'
import path from 'path'
import { EmailTemplate, TemplateVariables } from './email.types'

const TEMPLATES_DIR = 'public/templates/emails'

// In-memory template cache for production
const templateCache = new Map<string, string>()

export async function loadTemplate(
  template: EmailTemplate | string,
  variables: TemplateVariables
): Promise<string> {
  const templateName = typeof template === 'string' ? template : template

  // Try to load from cache first
  let htmlContent = templateCache.get(templateName)

  if (!htmlContent) {
    const templatePath = path.join(
      process.cwd(),
      TEMPLATES_DIR,
      `${templateName}.html`
    )

    try {
      htmlContent = await fs.readFile(templatePath, 'utf8')
    } catch (error) {
      throw new Error(
        `Failed to load email template "${templateName}": ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }

    // Cache in production only
    if (process.env.NODE_ENV === 'production') {
      templateCache.set(templateName, htmlContent)
    }
  }

  return processTemplateVariables(htmlContent, variables)
}

function processTemplateVariables(
  html: string,
  variables: TemplateVariables
): string {
  let processed = html

  // Replace simple variables: {{variableName}}
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${escapeRegex(key)}\\s*}}`, 'g')
    processed = processed.replace(regex, String(value))
  }

  // Handle conditional blocks: {{#if variableName}}content{{/if}}
  processed = processed.replace(
    /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g,
    (_, variable: string, content: string) => {
      const value = variables[variable]
      const hasValue = value !== undefined && value !== null && String(value).trim() !== ''
      return hasValue ? content : ''
    }
  )

  return processed
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Clear template cache (useful for development or testing)
export function clearTemplateCache(): void {
  templateCache.clear()
}

// Get list of all available templates
export async function getAvailableTemplates(): Promise<string[]> {
  const templatesPath = path.join(process.cwd(), TEMPLATES_DIR)

  try {
    const files = await fs.readdir(templatesPath)
    return files
      .filter(file => file.endsWith('.html'))
      .map(file => file.replace('.html', ''))
  } catch {
    return []
  }
}
