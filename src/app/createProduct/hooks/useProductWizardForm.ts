import { useState, useCallback } from 'react'
import { TOTAL_STEPS } from '../schemas/productFormSchema'
import type { ProductFormData } from '@/types/product-form'

export interface FieldError {
  field: string
  message: string
}

interface UseProductWizardFormReturn {
  currentStep: number
  totalSteps: number
  goToStep: (step: number) => void
  nextStep: () => boolean
  prevStep: () => void
  isFirstStep: boolean
  isLastStep: boolean
  stepValidation: boolean[]
  stepErrors: FieldError[]
  validateCurrentStep: (formData: ProductFormData) => { isValid: boolean; errors: FieldError[] }
  clearStepErrors: () => void
  hasFieldError: (field: string) => boolean
  getFieldError: (field: string) => string | undefined
}

function validateStep(step: number, formData: ProductFormData): { isValid: boolean; errors: FieldError[] } {
  const errors: FieldError[] = []

  if (step === 0) {
    if (!formData.name.trim()) errors.push({ field: 'name', message: 'Le nom est requis' })
    if (!formData.description.trim() || formData.description === '<p></p>') errors.push({ field: 'description', message: 'La description est requise' })
    if (!formData.typeId) errors.push({ field: 'typeId', message: "Le type d'hébergement est requis" })
    if (formData.isHotel) {
      if (!formData.hotelName || !formData.hotelName.trim()) errors.push({ field: 'hotelName', message: "Le nom de l'hôtel est requis" })
      if (!formData.availableRooms || Number(formData.availableRooms) <= 0) errors.push({ field: 'availableRooms', message: 'Le nombre de chambres doit être supérieur à 0' })
    }
  }

  if (step === 1) {
    if (!formData.address.trim()) errors.push({ field: 'address', message: "L'adresse est requise" })
    if (!formData.phone || formData.phone.length < 8) errors.push({ field: 'phone', message: 'Le numéro de téléphone est requis (min. 8 chiffres)' })
  }

  if (step === 2) {
    if (!formData.basePrice) errors.push({ field: 'basePrice', message: 'Le prix en EUR est requis' })
    if (!formData.priceMGA) errors.push({ field: 'priceMGA', message: 'Le prix en MGA est requis' })
  }

  // Steps 3 and 4 have no required fields

  return { isValid: errors.length === 0, errors }
}

export function useProductWizardForm(): UseProductWizardFormReturn {
  const [currentStep, setCurrentStep] = useState(0)
  const [stepValidation, setStepValidation] = useState<boolean[]>(
    Array(TOTAL_STEPS).fill(false)
  )
  const [stepErrors, setStepErrors] = useState<FieldError[]>([])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < TOTAL_STEPS) {
      setCurrentStep(step)
      setStepErrors([])
      scrollToTop()
    }
  }, [scrollToTop])

  const nextStep = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(prev => prev + 1)
      setStepErrors([])
      scrollToTop()
      return true
    }
    return false
  }, [currentStep, scrollToTop])

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
      setStepErrors([])
      scrollToTop()
    }
  }, [currentStep, scrollToTop])

  const validateCurrentStep = useCallback((formData: ProductFormData) => {
    const result = validateStep(currentStep, formData)
    setStepValidation(prev => {
      const updated = [...prev]
      updated[currentStep] = result.isValid
      return updated
    })
    setStepErrors(result.errors)
    return result
  }, [currentStep])

  const clearStepErrors = useCallback(() => {
    setStepErrors([])
  }, [])

  const hasFieldError = useCallback((field: string) => {
    return stepErrors.some(e => e.field === field)
  }, [stepErrors])

  const getFieldError = useCallback((field: string) => {
    return stepErrors.find(e => e.field === field)?.message
  }, [stepErrors])

  return {
    currentStep,
    totalSteps: TOTAL_STEPS,
    goToStep,
    nextStep,
    prevStep,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === TOTAL_STEPS - 1,
    stepValidation,
    stepErrors,
    validateCurrentStep,
    clearStepErrors,
    hasFieldError,
    getFieldError,
  }
}
