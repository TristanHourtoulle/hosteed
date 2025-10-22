/**
 * Generate product URL using slug with fallback to ID
 * @param product - Product object with optional slug and required id
 * @returns Product URL path
 */
export function getProductUrl(product: { slug?: string | null; id: string }): string {
  return `/host/${product.slug || product.id}`
}

/**
 * Generate product reservation URL using slug with fallback to ID
 * @param product - Product object with optional slug and required id
 * @returns Product reservation URL path
 */
export function getProductReservationUrl(product: { slug?: string | null; id: string }): string {
  return `/host/${product.slug || product.id}/reservation`
}
