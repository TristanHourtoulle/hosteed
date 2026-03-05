'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit3 } from 'lucide-react'
import { toast } from 'sonner'

import ErrorAlert, { ErrorDetails } from '@/components/ui/ErrorAlert'
import { parseCreateProductError, createValidationError } from '@/lib/utils/errorHandler'

import { WizardStepper } from '@/app/createProduct/components/wizard/WizardStepper'
import { WizardNavigation } from '@/app/createProduct/components/wizard/WizardNavigation'
import { StepBasicInfo } from '@/app/createProduct/components/wizard/StepBasicInfo'
import { StepLocation } from '@/app/createProduct/components/wizard/StepLocation'
import { StepPricing } from '@/app/createProduct/components/wizard/StepPricing'
import { StepServices } from '@/app/createProduct/components/wizard/StepServices'
import { StepRulesAndMedia } from '@/app/createProduct/components/wizard/StepRulesAndMedia'

import { useProductData, useProductForm, useImageUpload } from '@/app/createProduct/hooks'
import { useProductWizardForm } from '@/app/createProduct/hooks/useProductWizardForm'
import { generateImageId } from '@/app/createProduct/utils/formHelpers'
import type { ImageFile, ProductFormData } from '@/types/product-form'

import type { Product, ProductEditFormProps } from './ProductEditForm/types'

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`
}

function parseHour(timeStr: string): number {
  if (!timeStr) return 0
  const hour = parseInt(timeStr.split(':')[0])
  return isNaN(hour) ? 0 : hour
}

function buildInitialFormData(product: Product): ProductFormData {
  return {
    name: product.name,
    description: product.description,
    address: product.address,
    completeAddress: '',
    placeId: '',
    latitude: product.latitude || 0,
    longitude: product.longitude || 0,
    phone: product.phone || '',
    phoneCountry: product.phoneCountry || 'MG',
    typeId: product.type?.id || '',
    typeRentId: product.type?.id || '',
    room: product.room?.toString() || '',
    bathroom: product.bathroom?.toString() || '',
    arriving: product.arriving ? formatHour(product.arriving) : '',
    leaving: product.leaving ? formatHour(product.leaving) : '',
    basePrice: product.basePrice,
    priceMGA: product.priceMGA || '',
    basePriceMGA: product.priceMGA || '',
    specialPrices: [],
    autoAccept: false,
    equipmentIds: product.equipments?.map(e => e.id) || [],
    mealIds: product.mealsList?.map(m => m.id) || [],
    securityIds: product.securities?.map(s => s.id) || [],
    serviceIds: product.servicesList?.map(s => s.id) || [],
    includedServiceIds: product.includedServices?.map(s => s.id) || [],
    extraIds: product.extras?.map(e => e.id) || [],
    highlightIds: product.highlights?.map(h => h.id) || [],
    surface: product.surface?.toString() || '',
    minPeople: product.minPeople?.toString() || '',
    maxPeople: product.maxPeople?.toString() || '',
    accessibility: product.propertyInfo?.hasHandicapAccess || false,
    petFriendly: product.propertyInfo?.hasPetsOnProperty || false,
    nearbyPlaces:
      product.nearbyPlaces?.map(place => ({
        name: place.name,
        distance: place.distance || '',
        unit: (place.distance && parseFloat(place.distance) < 1000
          ? 'mètres'
          : 'kilomètres') as 'mètres' | 'kilomètres',
      })) || [],
    proximityLandmarks: [],
    transportation:
      product.transportOptions?.map(t => t.name).join(', ') || '',
    smokingAllowed: product.rules?.smokingAllowed || false,
    petsAllowed: product.rules?.petsAllowed || false,
    eventsAllowed: product.rules?.eventsAllowed || false,
    selfCheckIn: product.rules?.selfCheckIn || false,
    selfCheckInType: product.rules?.selfCheckInType || '',
    hasStairs: product.propertyInfo?.hasStairs || false,
    hasElevator: product.propertyInfo?.hasElevator || false,
    hasHandicapAccess: product.propertyInfo?.hasHandicapAccess || false,
    hasPetsOnProperty: product.propertyInfo?.hasPetsOnProperty || false,
    additionalNotes: product.propertyInfo?.additionalNotes || '',
    isHotel: !!(product.hotel && product.hotel.length > 0),
    hotelName:
      product.hotel && product.hotel.length > 0 ? product.hotel[0].name : '',
    availableRooms: product.availableRooms?.toString() || '',
  }
}

function buildExistingImages(product: Product): ImageFile[] {
  if (!product.img || product.img.length === 0) return []
  return product.img.map(img => ({
    file: null,
    preview: img.img,
    id: generateImageId(),
    isExisting: true,
    url: img.img,
  }))
}

export function ProductEditWizard({ product, onSave, onCancel }: ProductEditFormProps) {
  // Data & form hooks
  const productData = useProductData()
  const initialFormData = buildInitialFormData(product)
  const productForm = useProductForm(productData.types, initialFormData)
  const existingImages = buildExistingImages(product)
  const imageUpload = useImageUpload(existingImages)
  const wizard = useProductWizardForm()

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ErrorDetails | null>(null)
  const [seoData, setSeoData] = useState<{
    metaTitle?: string
    metaDescription?: string
    keywords?: string
    slug?: string
  }>({
    metaTitle: product.metaTitle || '',
    metaDescription: product.metaDescription || '',
    keywords: product.keywords || '',
    slug: product.slug || '',
  })

  const { formData, setFormData, handleInputChange } = productForm

  // Upload new images to server
  const uploadNewImagesToServer = async (
    imageFiles: ImageFile[],
    productId: string
  ): Promise<string[]> => {
    const newFiles = imageFiles.filter(img => img.file !== null)
    if (newFiles.length === 0) return []

    const base64Images: string[] = []
    for (const imgFile of newFiles) {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error(`Read error: ${imgFile.file!.name}`))
        reader.readAsDataURL(imgFile.file!)
      })
      base64Images.push(base64)
    }

    const uploadResponse = await fetch('/api/images/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        images: base64Images,
        entityType: 'products',
        entityId: productId,
      }),
    })

    if (!uploadResponse.ok) {
      const err = await uploadResponse.json()
      throw new Error(err.error || "Erreur lors de l'upload des images")
    }

    const uploadData = await uploadResponse.json()
    return uploadData.images.map(
      (img: { thumb: string; medium: string; full: string }) => img.full
    )
  }

  // Step navigation with validation
  const handleNext = () => {
    const result = wizard.validateCurrentStep(formData)
    if (!result.isValid) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    wizard.nextStep()
  }

  // Form submission - PUT instead of POST
  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Separate existing images from new uploads
      const existingImageUrls = imageUpload.selectedFiles
        .filter(img => img.isExisting && img.url)
        .map(img => img.url!)
      const newImageFiles = imageUpload.selectedFiles.filter(
        img => !img.isExisting && img.file !== null
      )

      // Upload new images
      let newImageUrls: string[] = []
      if (newImageFiles.length > 0) {
        newImageUrls = await uploadNewImagesToServer(newImageFiles, product.id)
      }

      const allImageUrls = [...existingImageUrls, ...newImageUrls]

      // Prepare update payload
      const updateData = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        completeAddress: formData.completeAddress || null,
        longitude: formData.longitude || product.longitude || 0,
        latitude: formData.latitude || product.latitude || 0,
        basePrice: formData.basePrice,
        priceMGA: formData.priceMGA || null,
        room: formData.room ? parseInt(formData.room) : null,
        bathroom: formData.bathroom ? parseInt(formData.bathroom) : null,
        surface: formData.surface ? Number(formData.surface) : null,
        minPeople: formData.minPeople ? Number(formData.minPeople) : null,
        maxPeople: formData.maxPeople ? Number(formData.maxPeople) : null,
        arriving: parseHour(formData.arriving),
        leaving: parseHour(formData.leaving),
        autoAccept: formData.autoAccept || false,
        phone: formData.phone,
        phoneCountry: formData.phoneCountry || 'MG',
        typeId: formData.typeId,
        equipmentIds: formData.equipmentIds,
        serviceIds: formData.serviceIds,
        mealIds: formData.mealIds,
        securityIds: formData.securityIds,
        includedServiceIds: formData.includedServiceIds,
        extraIds: formData.extraIds,
        highlightIds: formData.highlightIds,
        nearbyPlaces: formData.nearbyPlaces.map(place => ({
          name: place.name,
          distance: place.distance ? Number(place.distance) : 0,
          duration: 0,
          transport: place.unit === 'kilomètres' ? 'voiture' : 'à pied',
        })),
        isHotel: formData.isHotel,
        hotelInfo: formData.isHotel
          ? {
              name: formData.hotelName,
              availableRooms: Number(formData.availableRooms) || 0,
            }
          : undefined,
        transportOptions: formData.transportation
          ? formData.transportation
              .split(',')
              .map((name: string) => ({ name: name.trim(), description: '' }))
              .filter((t: { name: string }) => t.name.length > 0)
          : undefined,
        rules: {
          smokingAllowed: formData.smokingAllowed || false,
          petsAllowed: formData.petsAllowed || false,
          eventsAllowed: formData.eventsAllowed || false,
          selfCheckIn: formData.selfCheckIn || false,
          selfCheckInType: (formData.selfCheckInType as string) || undefined,
        },
        propertyInfo: {
          hasStairs: formData.hasStairs || false,
          hasElevator: formData.hasElevator || false,
          hasHandicapAccess: formData.hasHandicapAccess || false,
          hasPetsOnProperty: formData.hasPetsOnProperty || false,
          additionalNotes: (formData.additionalNotes as string) || undefined,
        },
        seoData: {
          metaTitle: seoData.metaTitle,
          metaDescription: seoData.metaDescription,
          keywords: seoData.keywords,
          slug: seoData.slug,
        },
      }

      // PUT to update the product
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Erreur lors de la mise à jour')
      }

      const updatedProduct = await response.json()

      // Update images
      if (allImageUrls.length > 0) {
        await fetch(`/api/products/${product.id}/images`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrls: allImageUrls }),
        })
      }

      toast.success('Annonce mise à jour avec succes!')
      onSave(updatedProduct as unknown as Product)
    } catch (err) {
      console.error('Error updating product:', err)
      setError(parseCreateProductError(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <motion.div
        className="max-w-4xl mx-auto p-6 space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Page Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            <Edit3 className="h-4 w-4" />
            Modifier l&apos;annonce
          </div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700">
            Modifier l&apos;annonce
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            Modifiez les informations de votre hébergement
          </p>
        </div>

        {/* Wizard Stepper */}
        <WizardStepper
          currentStep={wizard.currentStep}
          stepValidation={wizard.stepValidation}
        />

        {/* Error Alert */}
        {error && (
          <ErrorAlert
            error={error}
            onClose={() => setError(null)}
            onRetry={error.retryable ? () => setError(null) : undefined}
          />
        )}

        {/* Validation Errors */}
        {wizard.stepErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold text-red-700">
              Veuillez corriger les erreurs suivantes :
            </p>
            <ul className="list-disc list-inside space-y-1">
              {wizard.stepErrors.map(err => (
                <li key={err.field} className="text-sm text-red-600">
                  {err.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {wizard.currentStep === 0 && (
            <StepBasicInfo
              key="step-0"
              formData={formData}
              types={productData.types}
              handleInputChange={handleInputChange}
              setFormData={setFormData}
              hasFieldError={wizard.hasFieldError}
              getFieldError={wizard.getFieldError}
            />
          )}
          {wizard.currentStep === 1 && (
            <StepLocation
              key="step-1"
              formData={formData}
              setFormData={setFormData}
              handleInputChange={handleInputChange}
              hasFieldError={wizard.hasFieldError}
              getFieldError={wizard.getFieldError}
            />
          )}
          {wizard.currentStep === 2 && (
            <StepPricing
              key="step-2"
              formData={formData}
              handleInputChange={handleInputChange}
              specialPrices={productData.specialPrices}
              setSpecialPrices={productData.setSpecialPrices}
              extras={productData.extras}
              hasFieldError={wizard.hasFieldError}
              getFieldError={wizard.getFieldError}
            />
          )}
          {wizard.currentStep === 3 && (
            <StepServices
              key="step-3"
              formData={formData}
              setFormData={setFormData}
              equipments={productData.equipments}
              meals={productData.meals}
              securities={productData.securities}
              services={productData.services}
              includedServices={productData.includedServices}
              extras={productData.extras}
              highlights={productData.highlights}
              refreshIncludedServices={productData.refreshIncludedServices}
              refreshExtras={productData.refreshExtras}
              refreshHighlights={productData.refreshHighlights}
            />
          )}
          {wizard.currentStep === 4 && (
            <StepRulesAndMedia
              key="step-4"
              formData={formData}
              setFormData={setFormData}
              imageUpload={imageUpload}
              seoData={seoData}
              setSeoData={setSeoData}
              session={null}
              users={[]}
              assignToOtherUser={false}
              setAssignToOtherUser={() => {}}
              userSelected=""
              setUserSelected={() => {}}
            />
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="space-y-4">
          <WizardNavigation
            isFirstStep={wizard.isFirstStep}
            isLastStep={wizard.isLastStep}
            isSubmitting={isLoading}
            isUploadingImages={imageUpload.isUploadingImages}
            onPrevious={wizard.prevStep}
            onNext={handleNext}
            onSubmit={handleSubmit}
            submitLabel="Enregistrer les modifications"
            submittingLabel="Enregistrement..."
          />
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onCancel}
              className="text-sm text-slate-500 hover:text-slate-700 underline"
            >
              Annuler et revenir aux détails
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
