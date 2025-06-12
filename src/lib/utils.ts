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
