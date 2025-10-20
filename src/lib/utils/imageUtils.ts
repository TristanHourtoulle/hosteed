/**
 * Utilitaires pour la gestion des images
 */

/**
 * Convertit une URL d'image thumbnail en URL full-size.
 * Les images sont stockées en 3 formats : thumb (petite), medium (moyenne), full (haute qualité).
 * Cette fonction tente de trouver l'image full en se basant sur le pattern de nommage.
 *
 * @param imageUrl - URL de l'image (peut être thumb, medium, Unsplash ou base64)
 * @returns URL de l'image en taille maximale
 *
 * @example
 * getFullSizeImageUrl('/uploads/products/abc/img_0_thumb_123_abc.webp')
 * // Returns: '/uploads/products/abc/img_0_full_123_xyz.webp'
 */
export function getFullSizeImageUrl(imageUrl: string): string {
  if (!imageUrl) return imageUrl

  // Pour les images migrées (/uploads/), utiliser la route API qui trouve le bon fichier
  if (imageUrl.startsWith('/uploads/')) {
    // Si c'est déjà une image full, la retourner telle quelle
    if (imageUrl.includes('_full_')) {
      return imageUrl
    }

    // Utiliser la route API pour servir l'image en taille full
    // Cette route trouvera automatiquement le bon fichier avec le bon hash
    return `/api/images/serve?url=${encodeURIComponent(imageUrl)}&size=full`
  }

  // Pour les URLs externes (Unsplash, etc.) ou base64, retourner tel quel
  return imageUrl
}

/**
 * Version async qui utilise l'API pour résoudre le vrai nom de fichier
 */
export async function getFullSizeImageUrlAsync(thumbUrl: string): Promise<string> {
  if (!thumbUrl || !thumbUrl.startsWith('/uploads/') || !thumbUrl.includes('_thumb_')) {
    return thumbUrl
  }

  try {
    const res = await fetch(`/api/images/full?thumb=${encodeURIComponent(thumbUrl)}`)
    if (res.ok) {
      const data = await res.json()
      return data.fullUrl
    }
  } catch (error) {
    console.error("Erreur lors de la résolution de l'image full:", error)
  }

  // Fallback
  return thumbUrl.replace('_thumb_', '_full_')
}
