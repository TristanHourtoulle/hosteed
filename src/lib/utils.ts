import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Extract city and country from address for privacy protection
export function getCityFromAddress(address: string | null | undefined): string {
  if (!address) return 'Ville non spécifiée'

  // Split by comma and extract city and country
  const parts = address.split(',').map(part => part.trim())

  // If we have at least 3 parts (street, city, country), return city + country
  if (parts.length >= 3) {
    const city = parts[parts.length - 2]
    const country = parts[parts.length - 1]
    return `${city}, ${country}`
  }

  // If we have 2 parts, assume it's city, country
  if (parts.length === 2) {
    return address
  }

  // Fallback to first part
  return parts[0] || 'Ville non spécifiée'
}

export function calculateAverageRating(
  reviews: {
    grade: number
    welcomeGrade: number
    staff: number
    comfort: number
    equipment: number
    cleaning: number
  }[]
) {
  if (!reviews || reviews.length === 0) return null

  const totalRating = reviews.reduce((acc, review) => {
    const reviewAverage =
      (review.grade +
        review.welcomeGrade +
        review.staff +
        review.comfort +
        review.equipment +
        review.cleaning) /
      6
    return acc + reviewAverage
  }, 0)

  // Return as string with French decimal formatting (comma instead of dot)
  return (totalRating / reviews.length).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function getProfileImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl) return null

  // Handle base64 images
  if (imageUrl.startsWith('data:')) {
    return imageUrl
  }

  // Return regular URLs (like Google profile pictures) as is
  return imageUrl
}

// Check if a product is currently sponsored
export function isProductSponsored(
  promotedProducts?: Array<{
    id: string
    active: boolean
    start: Date
    end: Date
  }>
): boolean {
  if (!promotedProducts || promotedProducts.length === 0) return false

  const now = new Date()
  return promotedProducts.some(
    promo => promo.active && new Date(promo.start) <= now && new Date(promo.end) >= now
  )
}

// Sort products with sponsored ones first
export function sortProductsWithSponsoredFirst<
  T extends { PromotedProduct?: Array<{ id: string; active: boolean; start: Date; end: Date }> },
>(products: T[]): T[] {
  return products.sort((a, b) => {
    const aSponsored = isProductSponsored(a.PromotedProduct)
    const bSponsored = isProductSponsored(b.PromotedProduct)

    if (aSponsored && !bSponsored) return -1
    if (!aSponsored && bSponsored) return 1
    return 0
  })
}
