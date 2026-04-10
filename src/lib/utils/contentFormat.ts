/**
 * Detects whether a string contains HTML tags.
 * Used to differentiate between legacy Markdown content and new Tiptap HTML content.
 */
export function isHtmlContent(content: string): boolean {
  if (!content) return false
  return /<[a-z][\s\S]*>/i.test(content.trim())
}

/**
 * Strips HTML tags and common Markdown syntax from a string and returns a plain
 * text preview suitable for short descriptions (cards, tooltips, etc.).
 *
 * This is intentionally simple and safe for previews only — it is NOT a
 * sanitizer and must not be used to render trusted HTML back to the DOM.
 */
export function toPlainTextPreview(content: string | null | undefined): string {
  if (!content) return ''

  let text = content

  // Remove HTML tags
  text = text.replace(/<[^>]*>/g, ' ')

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")

  // Remove Markdown bold/italic/code/strikethrough markers
  text = text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/`([^`]+)`/g, '$1')

  // Remove Markdown headings (#, ##, ### ...)
  text = text.replace(/^#{1,6}\s+/gm, '')

  // Collapse whitespace
  text = text.replace(/\s+/g, ' ').trim()

  return text
}
