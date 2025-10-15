import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { FormData, ImageFile, SpecialPrice } from '../types'
import { validateProductForm, validateHasImages } from '../utils/validators'
import { calculateDistance } from '../utils/formHelpers'

interface SubmitOptions {
  formData: FormData
  images: ImageFile[]
  specialPrices: SpecialPrice[]
}

/**
 * Custom hook for handling product form submission
 */
export const useProductSubmit = () => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  /**
   * Prepare form data for submission
   */
  const prepareSubmissionData = (options: SubmitOptions) => {
    const { formData, images, specialPrices } = options

    // Convert nearby places to proper format
    const nearbyPlacesWithDistance = formData.nearbyPlaces.map(place => ({
      name: place.name,
      distance: calculateDistance(place),
    }))

    // Prepare payload
    const payload = {
      name: formData.name,
      description: formData.description,
      address: formData.address,
      placeId: formData.placeId,
      phone: formData.phone,
      phoneCountry: formData.phoneCountry,
      arriving: formData.arriving,
      leaving: formData.leaving,
      basePrice: parseFloat(formData.basePrice),
      priceMGA: parseFloat(formData.priceMGA),
      autoAccept: formData.autoAccept,
      typeId: formData.typeId,
      equipmentIds: formData.equipmentIds,
      mealIds: formData.mealIds,
      securityIds: formData.securityIds,
      serviceIds: formData.serviceIds,
      includedServiceIds: formData.includedServiceIds,
      extraIds: formData.extraIds,
      highlightIds: formData.highlightIds,
      nearbyPlaces: nearbyPlacesWithDistance,
      transportation: formData.transportation,
      images: images.map(img => img.preview),

      // Optional fields
      ...(formData.room && { room: parseInt(formData.room) }),
      ...(formData.bathroom && { bathroom: parseInt(formData.bathroom) }),
      ...(formData.surface && { surface: parseFloat(formData.surface) }),
      ...(formData.maxPeople && { maxPeople: parseInt(formData.maxPeople) }),

      accessibility: formData.accessibility,
      petFriendly: formData.petFriendly,

      // Hotel specific fields
      ...(formData.isHotel && {
        hotelName: formData.hotelName,
        availableRooms: parseInt(formData.availableRooms),
      }),

      // Special prices
      specialPrices: specialPrices.map(sp => ({
        pricesMga: sp.pricesMga,
        pricesEuro: sp.pricesEuro,
        day: sp.day,
        startDate: sp.startDate,
        endDate: sp.endDate,
        activate: sp.activate,
      })),
    }

    return payload
  }

  /**
   * Validate form before submission
   */
  const validateForm = (options: SubmitOptions): boolean => {
    const { formData, images } = options

    // Clear previous errors
    setErrors({})

    // Validate form data
    const formErrors = validateProductForm(formData)
    if (formErrors.length > 0) {
      const errorMap: Record<string, string> = {}
      formErrors.forEach(error => {
        errorMap[error.field] = error.message
        toast.error(error.message)
      })
      setErrors(errorMap)
      return false
    }

    // Validate images
    if (!validateHasImages(images)) {
      toast.error('Veuillez ajouter au moins une image')
      setErrors({ images: 'Au moins une image est requise' })
      return false
    }

    return true
  }

  /**
   * Submit the product form
   */
  const submitProduct = async (options: SubmitOptions): Promise<boolean> => {
    // Validate
    if (!validateForm(options)) {
      return false
    }

    setIsSubmitting(true)

    try {
      // Prepare data
      const payload = prepareSubmissionData(options)

      // Submit to API
      const response = await fetch('/api/user/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la création du produit')
      }

      await response.json()

      // Success
      toast.success('Produit créé avec succès! En attente de validation.')

      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard/host')
      }, 1500)

      return true
    } catch (error) {
      console.error('Error creating product:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création du produit')
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Clear errors for a specific field
   */
  const clearError = (field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }

  /**
   * Clear all errors
   */
  const clearAllErrors = () => {
    setErrors({})
  }

  return {
    isSubmitting,
    errors,
    submitProduct,
    clearError,
    clearAllErrors,
  }
}
