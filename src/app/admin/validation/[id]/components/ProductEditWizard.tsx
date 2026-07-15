'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit3 } from 'lucide-react'

import ErrorAlert, { ErrorDetails } from '@/components/ui/ErrorAlert'
import { parseCreateProductError } from '@/lib/utils/errorHandler'
import { useMutationWithCache } from '@/hooks/useMutationWithCache'
import { CACHE_TAGS } from '@/lib/cache/query-client'

import { WizardStepper } from '@/app/createProduct/components/wizard/WizardStepper'
import { WizardNavigation } from '@/app/createProduct/components/wizard/WizardNavigation'
import { StepBasicInfo } from '@/app/createProduct/components/wizard/StepBasicInfo'
import { StepLocation } from '@/app/createProduct/components/wizard/StepLocation'
import { StepPricing } from '@/app/createProduct/components/wizard/StepPricing'
import { StepRoomTypes } from '@/app/createProduct/components/wizard/StepRoomTypes'
import { StepServices } from '@/app/createProduct/components/wizard/StepServices'
import { StepRulesAndMedia } from '@/app/createProduct/components/wizard/StepRulesAndMedia'

import { useProductData, useProductForm, useImageUpload } from '@/app/createProduct/hooks'
import { useProductWizardForm } from '@/app/createProduct/hooks/useProductWizardForm'
import { getStepLabels } from '@/app/createProduct/schemas/productFormSchema'
import { generateImageId } from '@/app/createProduct/utils/formHelpers'
import {
  hasPendingRoomTypeImages,
  uploadRoomTypeImages,
} from '@/app/createProduct/utils/uploadRoomTypeImages'
import { computePhotoBudget } from '@/lib/photos/photoBudget'
import type { ImageFile } from '@/types/product-form'
import type { RoomTypeFormData } from '@/app/createProduct/types/roomType'

import type { Product, ProductEditFormProps } from './ProductEditForm/types'
import { buildInitialFormData, buildUpdatePayload } from './ProductEditWizard.helpers'

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
  // Establishment photos and room-type photos share the listing's 20-photo
  // budget: the establishment's own cap is whatever the room types left.
  const establishmentPhotoAllowance = computePhotoBudget({
    establishmentCount: 0,
    roomTypeCounts: productForm.formData.roomTypes.map(roomType => roomType.images.length),
  }).remaining
  const imageUpload = useImageUpload(existingImages, { maxImages: establishmentPhotoAllowance })
  const wizard = useProductWizardForm(productForm.formData.isHotel)

  // UI state
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

  const setRoomTypes = (next: RoomTypeFormData[]) =>
    setFormData(prev => ({ ...prev, roomTypes: next }))

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

  // Form submission - PUT instead of POST, wrapped so the product cache and the
  // validation datasets are invalidated on success.
  const saveMutation = useMutationWithCache<Product, void>({
    mutationFn: async (): Promise<Product> => {
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

      // Room-type photos must be persisted before the PUT: their urls travel
      // inside the room-type payload that `syncRoomTypes` reconciles.
      let roomTypesForPayload = formData.roomTypes
      if (formData.isHotel && hasPendingRoomTypeImages(formData.roomTypes)) {
        roomTypesForPayload = await uploadRoomTypeImages(formData.roomTypes, product.id)
        setRoomTypes(roomTypesForPayload)
      }

      // Prepare update payload (hydrated room types are reconciled server-side)
      const updateData = buildUpdatePayload(
        { ...formData, roomTypes: roomTypesForPayload },
        seoData,
        product
      )

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
        const imagesResponse = await fetch(`/api/products/${product.id}/images`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ imageUrls: allImageUrls }),
        })

        if (!imagesResponse.ok) {
          const errorBody = await imagesResponse.json().catch(() => ({}))
          throw new Error(
            errorBody.error ||
              `Échec de l'enregistrement des images (HTTP ${imagesResponse.status})`
          )
        }
      }

      return updatedProduct as unknown as Product
    },
    invalidateKeys: [
      CACHE_TAGS.product(product.id),
      CACHE_TAGS.productValidation(product.id),
      CACHE_TAGS.productsValidation,
    ],
    successMessage: 'Annonce mise à jour avec succes!',
    onSuccess: updatedProduct => {
      onSave(updatedProduct)
    },
    onError: err => {
      setError(parseCreateProductError(err))
    },
  })

  const isLoading = saveMutation.isPending

  const handleSubmit = () => {
    setError(null)
    saveMutation.mutate()
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
          labels={getStepLabels(formData.isHotel)}
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
          {wizard.currentStep === 2 &&
            (formData.isHotel ? (
              <StepRoomTypes
                key="step-2"
                roomTypes={formData.roomTypes}
                setRoomTypes={setRoomTypes}
                meals={productData.meals}
                includedServices={productData.includedServices}
                extras={productData.extras}
                establishmentPhotoCount={imageUpload.selectedFiles.length}
                getFieldError={wizard.getFieldError}
              />
            ) : (
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
            ))}
          {wizard.currentStep === 3 && (
            <StepServices
              key="step-3"
              formData={formData}
              setFormData={setFormData}
              isHotel={formData.isHotel}
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
