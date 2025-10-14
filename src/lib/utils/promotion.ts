import { ProductPromotion } from '@prisma/client'

/**
 * Appliquer une réduction en pourcentage sur un prix
 */
export function applyPromotionToPrice(
  price: number,
  discountPercentage: number
): number {
  return price * (1 - discountPercentage / 100)
}

/**
 * Vérifier si une promotion est active à une date donnée
 */
export function isPromotionActive(
  promotion: ProductPromotion,
  currentDate: Date = new Date()
): boolean {
  return (
    promotion.isActive &&
    currentDate >= promotion.startDate &&
    currentDate <= promotion.endDate
  )
}

/**
 * Formater le label de promotion pour affichage
 */
export function formatPromotionLabel(discountPercentage: number): string {
  return `-${Math.round(discountPercentage)}%`
}

/**
 * Calculer les économies réalisées avec une promotion
 */
export function calculateSavings(
  originalPrice: number,
  discountPercentage: number
): number {
  return originalPrice * (discountPercentage / 100)
}

/**
 * Calculer le nombre de jours restants avant la fin d'une promotion
 */
export function getDaysUntilEnd(endDate: Date): number {
  const now = new Date()
  const diff = endDate.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * Vérifier si une promotion expire bientôt (moins de 7 jours)
 */
export function isPromotionExpiringSoon(
  endDate: Date,
  threshold: number = 7
): boolean {
  const daysUntilEnd = getDaysUntilEnd(endDate)
  return daysUntilEnd > 0 && daysUntilEnd <= threshold
}

/**
 * Formater le message d'urgence pour une promotion
 */
export function getUrgencyMessage(endDate: Date): string | null {
  const days = getDaysUntilEnd(endDate)

  if (days < 0) return null
  if (days === 0) return "Se termine aujourd'hui"
  if (days === 1) return 'Se termine demain'
  if (days <= 7) return `Se termine dans ${days} jours`

  return null
}

/**
 * Enrichir un produit avec les données de promotion
 */
export function mergeProductWithPromotion<T extends { basePrice: string }>(
  product: T,
  promotion: ProductPromotion | null
): T & {
  hasActivePromotion: boolean
  originalBasePrice?: string
  discountedPrice?: string
  promotion?: ProductPromotion
  savings?: number
} {
  if (!promotion) {
    return {
      ...product,
      hasActivePromotion: false
    }
  }

  const basePrice = parseFloat(product.basePrice)
  const discountedPrice = applyPromotionToPrice(
    basePrice,
    promotion.discountPercentage
  )
  const savings = calculateSavings(basePrice, promotion.discountPercentage)

  return {
    ...product,
    hasActivePromotion: true,
    originalBasePrice: product.basePrice,
    discountedPrice: discountedPrice.toFixed(2),
    basePrice: discountedPrice.toFixed(2), // Remplacer le basePrice
    promotion,
    savings
  }
}

/**
 * Valider les données d'une promotion
 */
export function validatePromotionData(data: {
  discountPercentage: number
  startDate: Date
  endDate: Date
}): { valid: boolean; error?: string } {
  // Vérifier le pourcentage
  if (data.discountPercentage <= 0 || data.discountPercentage > 100) {
    return {
      valid: false,
      error: 'Le pourcentage de réduction doit être entre 1 et 100'
    }
  }

  // Vérifier que la date de fin est après la date de début
  if (data.endDate <= data.startDate) {
    return {
      valid: false,
      error: 'La date de fin doit être après la date de début'
    }
  }

  // Vérifier que la date de début est dans le futur ou aujourd'hui
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const startDate = new Date(data.startDate)
  startDate.setHours(0, 0, 0, 0)

  if (startDate < now) {
    return {
      valid: false,
      error: 'La date de début ne peut pas être dans le passé'
    }
  }

  return { valid: true }
}
