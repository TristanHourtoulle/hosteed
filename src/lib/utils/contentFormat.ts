/**
 * Detects whether a string contains HTML tags.
 * Used to differentiate between legacy Markdown content and new Tiptap HTML content.
 */
export function isHtmlContent(content: string): boolean {
  if (!content) return false
  return /<[a-z][\s\S]*>/i.test(content.trim())
}
