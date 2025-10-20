import { TypeRentInterface } from '@/lib/interface/typeRentInterface'
import { NearbyPlace } from '../types'

/**
 * Check if a type is a hotel type
 */
export const isHotelType = (typeId: string, types: TypeRentInterface[]): boolean => {
  const selectedType = types.find(t => t.id === typeId)
  return Boolean(selectedType?.isHotelType)
}

/**
 * Calculate distance from nearby place
 */
export const calculateDistance = (place: NearbyPlace): number => {
  const distance = parseFloat(place.distance)
  if (place.unit === 'kilomètres') {
    return distance * 1000 // Convert to meters
  }
  return distance
}

/**
 * Format distance for display
 */
export const formatDistance = (place: NearbyPlace): string => {
  return `${place.distance} ${place.unit}`
}

/**
 * Generate unique ID for images
 */
export const generateImageId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Check if all required fields are filled
 */
export const hasRequiredFields = (formData: {
  name?: string
  description?: string
  address?: string
  phone?: string
  typeId?: string
  basePrice?: string
  priceMGA?: string
}): boolean => {
  return !!(
    formData.name &&
    formData.description &&
    formData.address &&
    formData.phone &&
    formData.typeId &&
    formData.basePrice &&
    formData.priceMGA
  )
}

/**
 * Create Google Maps URL from address
 */
export const createMapsUrl = (address: string): string => {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}
