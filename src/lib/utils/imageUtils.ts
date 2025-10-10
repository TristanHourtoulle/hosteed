/**
 * Utilitaires pour la gestion des images
 */

/**
 * Convertit une URL d'image thumbnail ou medium en URL full-size
 * pour éviter les images pixelisées.
 *
 * @param imageUrl - URL de l'image (peut être thumb, medium, full, Unsplash, ou base64)
 * @returns URL de l'image en taille maximale
 *
 * @example
 * getFullSizeImageUrl('/uploads/products/abc/img_0_thumb_123.webp')
 * // Returns: '/uploads/products/abc/img_0_full_123.webp'
 *
 * @example
 * getFullSizeImageUrl('https://images.unsplash.com/photo-123')
 * // Returns: 'https://images.unsplash.com/photo-123' (unchanged)
 */
export function getFullSizeImageUrl(imageUrl: string): string {
  if (!imageUrl) return imageUrl

  // For migrated images (/uploads/), replace _thumb_ and _medium_ with _full_
  if (imageUrl.startsWith('/uploads/')) {
    return imageUrl
      .replace('_thumb_', '_full_')
      .replace('_medium_', '_full_')
  }

  // For external URLs (Unsplash, etc.) or base64, use as-is
  return imageUrl
}
