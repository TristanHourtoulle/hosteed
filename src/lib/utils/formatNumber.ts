/**
 * Utility functions for formatting numbers with French locale
 * - Thousands separator: space (non-breaking)
 * - Decimal separator: comma
 *
 * Examples:
 * - 10000 → "10 000"
 * - 10000.50 → "10 000,50"
 * - 0.125 → "12,5 %" (as percentage)
 */

/**
 * Formats a number with French locale formatting (space for thousands, comma for decimals)
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 0 for integers, preserves decimals if provided)
 * @returns Formatted string with spaces every 3 digits
 *
 * @example
 * formatNumber(10000) // "10 000"
 * formatNumber(10000.5, 2) // "10 000,50"
 * formatNumber(1234567.89, 2) // "1 234 567,89"
 */
export function formatNumber(value: number, decimals?: number): string {
  return value.toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals ?? (Number.isInteger(value) ? 0 : 2),
  })
}

/**
 * Formats a currency amount with French locale and currency symbol
 * @param amount - The amount to format
 * @param currency - Currency code ('EUR' or 'MGA')
 * @param decimals - Number of decimal places (default: 2 for EUR, 0 for MGA)
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency(10000) // "10 000,00 €"
 * formatCurrency(10000, 'EUR') // "10 000,00 €"
 * formatCurrency(50000, 'MGA') // "50 000 Ar"
 * formatCurrency(1234.5, 'EUR', 2) // "1 234,50 €"
 */
export function formatCurrency(
  amount: number,
  currency: 'EUR' | 'MGA' = 'EUR',
  decimals?: number
): string {
  const defaultDecimals = currency === 'EUR' ? 2 : 0
  const numDecimals = decimals ?? defaultDecimals

  if (currency === 'EUR') {
    return amount.toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: numDecimals,
      maximumFractionDigits: numDecimals,
    })
  } else {
    // MGA (Ariary) - custom format as it's not widely supported in toLocaleString
    const formatted = formatNumber(amount, numDecimals)
    return `${formatted} Ar`
  }
}

/**
 * Formats a percentage value with French locale
 * @param value - The value as a decimal (e.g., 0.125 for 12.5%)
 * @param decimals - Number of decimal places (default: 1)
 * @param asDecimal - If true, treats value as already in percentage form (e.g., 12.5 instead of 0.125)
 * @returns Formatted percentage string
 *
 * @example
 * formatPercentage(0.125) // "12,5 %"
 * formatPercentage(0.5, 2) // "50,00 %"
 * formatPercentage(12.5, 1, true) // "12,5 %"
 */
export function formatPercentage(
  value: number,
  decimals: number = 1,
  asDecimal: boolean = false
): string {
  const percentValue = asDecimal ? value : value * 100
  return `${formatNumber(percentValue, decimals)} %`
}

/**
 * Formats a decimal number with French locale (comma as decimal separator)
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted decimal string
 *
 * @example
 * formatDecimal(10.5) // "10,50"
 * formatDecimal(1234.567, 1) // "1 234,6"
 */
export function formatDecimal(value: number, decimals: number = 2): string {
  return formatNumber(value, decimals)
}

/**
 * Formats a compact number for statistics (e.g., 1.2k, 3.5M)
 * @param value - The number to format
 * @returns Compact formatted string with French locale
 *
 * @example
 * formatCompactNumber(1234) // "1,2 k"
 * formatCompactNumber(1234567) // "1,2 M"
 */
export function formatCompactNumber(value: number): string {
  return value.toLocaleString('fr-FR', {
    notation: 'compact',
    compactDisplay: 'short',
  })
}
