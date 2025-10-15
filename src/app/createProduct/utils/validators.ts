import { FormData, ImageFile } from '../types'
import { MAX_FILE_SIZE, ACCEPTED_IMAGE_TYPES, MIN_PRICE, MAX_PRICE } from './constants'

export interface ValidationError {
  field: string
  message: string
}

/**
 * Validate product form data
 */
export const validateProductForm = (formData: FormData): ValidationError[] => {
  const errors: ValidationError[] = []

  // Required fields
  if (!formData.name.trim()) {
    errors.push({ field: 'name', message: 'Le nom est requis' })
  }

  if (!formData.description.trim()) {
    errors.push({ field: 'description', message: 'La description est requise' })
  }

  if (!formData.address.trim()) {
    errors.push({ field: 'address', message: "L'adresse est requise" })
  }

  if (!formData.phone.trim()) {
    errors.push({ field: 'phone', message: 'Le téléphone est requis' })
  }

  if (!formData.typeId) {
    errors.push({ field: 'typeId', message: "Le type d'hébergement est requis" })
  }

  // Price validation
  const basePrice = parseFloat(formData.basePrice)
  if (isNaN(basePrice) || basePrice < MIN_PRICE || basePrice > MAX_PRICE) {
    errors.push({ field: 'basePrice', message: `Le prix doit être entre ${MIN_PRICE}€ et ${MAX_PRICE}€` })
  }

  const priceMGA = parseFloat(formData.priceMGA)
  if (isNaN(priceMGA) || priceMGA < MIN_PRICE) {
    errors.push({ field: 'priceMGA', message: 'Le prix en MGA est requis' })
  }

  // Room validation
  const rooms = parseInt(formData.room)
  if (formData.room && (isNaN(rooms) || rooms < 1)) {
    errors.push({ field: 'room', message: 'Le nombre de chambres doit être au moins 1' })
  }

  // Bathroom validation
  const bathrooms = parseInt(formData.bathroom)
  if (formData.bathroom && (isNaN(bathrooms) || bathrooms < 1)) {
    errors.push({ field: 'bathroom', message: 'Le nombre de salles de bain doit être au moins 1' })
  }

  // Hotel specific validation
  if (formData.isHotel) {
    if (!formData.hotelName.trim()) {
      errors.push({ field: 'hotelName', message: "Le nom de l'hôtel est requis" })
    }

    const availableRooms = parseInt(formData.availableRooms)
    if (!formData.availableRooms || isNaN(availableRooms) || availableRooms < 1) {
      errors.push({ field: 'availableRooms', message: 'Le nombre de chambres disponibles est requis' })
    }
  }

  return errors
}

/**
 * Validate image files
 */
export const validateImages = (files: File[]): ValidationError[] => {
  const errors: ValidationError[] = []

  files.forEach((file, index) => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      errors.push({
        field: `image-${index}`,
        message: `${file.name}: Fichier trop volumineux (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`,
      })
    }

    // Check file type
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      errors.push({
        field: `image-${index}`,
        message: `${file.name}: Type de fichier non supporté. Utilisez JPG, PNG ou WebP`,
      })
    }
  })

  return errors
}

/**
 * Validate price value
 */
export const validatePrice = (price: string): boolean => {
  const numPrice = parseFloat(price)
  return !isNaN(numPrice) && numPrice >= MIN_PRICE && numPrice <= MAX_PRICE
}

/**
 * Validate phone number (basic validation)
 */
export const validatePhone = (phone: string): boolean => {
  return phone.trim().length >= 8
}

/**
 * Validate that at least one image is uploaded
 */
export const validateHasImages = (images: ImageFile[]): boolean => {
  return images.length > 0
}
