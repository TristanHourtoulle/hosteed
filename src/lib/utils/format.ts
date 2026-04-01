/**
 * Shared date formatting utilities for French locale
 */

/**
 * Formats a date with long month name (e.g. "3 mars 2026") — used on detail pages
 * @param date - Date value to format (handles null, undefined, Date, and string)
 * @returns Formatted date string, or '-' if date is falsy
 */
export function formatDateLong(date: Date | string | null | undefined): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Formats a date with short month name (e.g. "3 mars 2026") — used on list pages
 * @param date - Date value to format (handles null, undefined, Date, and string)
 * @returns Formatted date string, or '-' if date is falsy
 */
export function formatDateShort(date: Date | string | null | undefined): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
