'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { motion, AnimatePresence } from 'framer-motion'
import { Home } from 'lucide-react'
import { toast } from 'sonner'

import { createProduct } from '@/lib/services/product.service'
import { invalidateClientCache } from '@/lib/cache/client-invalidation'
import ErrorAlert, { ErrorDetails } from '@/components/ui/ErrorAlert'
import { parseCreateProductError, createValidationError } from '@/lib/utils/errorHandler'

import { WizardStepper } from './components/wizard/WizardStepper'
import { WizardNavigation } from './components/wizard/WizardNavigation'
import { StepBasicInfo } from './components/wizard/StepBasicInfo'
import { StepLocation } from './components/wizard/StepLocation'
import { StepPricing } from './components/wizard/StepPricing'
import { StepRoomTypes } from './components/wizard/StepRoomTypes'
import { StepServices } from './components/wizard/StepServices'
import { StepRulesAndMedia } from './components/wizard/StepRulesAndMedia'

import { useProductData, useProductForm, useImageUpload } from './hooks'
import { useProductWizardForm } from './hooks/useProductWizardForm'
import { getStepLabels } from './schemas/productFormSchema'
import { buildCreateProductPayload } from './utils/buildCreateProductPayload'
import { buildRoomTypesPayload } from './utils/roomTypeHelpers'
import {
  hasPendingRoomTypeImages,
  uploadRoomTypeImages,
} from './utils/uploadRoomTypeImages'
import { computePhotoBudget } from '@/lib/photos/photoBudget'
import type { ImageFile } from './types'
import type { RoomTypeFormData } from './types/roomType'

export default function CreateProductPage() {
  const router = useRouter()
  const { session, isLoading: isAuthLoading } = useAuth({ required: true, redirectTo: '/auth' })

  // Data & form hooks
  const productData = useProductData()
  const productForm = useProductForm(productData.types)

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ErrorDetails | null>(null)
  const [seoData, setSeoData] = useState<{
    metaTitle?: string
    metaDescription?: string
    keywords?: string
    slug?: string
  }>({ metaTitle: '', metaDescription: '', keywords: '', slug: '' })
  const [userSelected, setUserSelected] = useState('')
  const [assignToOtherUser, setAssignToOtherUser] = useState(false)

  const { formData, setFormData, handleInputChange } = productForm

  // The 20-photo cap is per listing, not per section: what the room types have
  // already taken is what the establishment can no longer have. Lifting the
  // budget here keeps both steps reading from one tally.
  const establishmentPhotoAllowance = computePhotoBudget({
    establishmentCount: 0,
    roomTypeCounts: formData.roomTypes.map(roomType => roomType.images.length),
  }).remaining

  const imageUpload = useImageUpload(undefined, { maxImages: establishmentPhotoAllowance })
  const wizard = useProductWizardForm(formData.isHotel)

  const setRoomTypes = (next: RoomTypeFormData[]) =>
    setFormData(prev => ({ ...prev, roomTypes: next }))

  // Upload images to server
  const uploadImagesToServer = async (imageFiles: ImageFile[], productId: string): Promise<string[]> => {
    const files = imageFiles.filter(img => img.file !== null).map(img => img.file!)
    const base64Images: string[] = []
    for (const file of files) {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error(`Erreur de lecture: ${file.name}`))
        reader.readAsDataURL(file)
      })
      base64Images.push(base64)
    }

    const uploadResponse = await fetch('/api/images/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: base64Images, entityType: 'products', entityId: productId }),
    })

    if (!uploadResponse.ok) {
      const err = await uploadResponse.json()
      throw new Error(err.error || "Erreur lors de l'upload des images")
    }

    const uploadData = await uploadResponse.json()
    return uploadData.images.map((img: { thumb: string; medium: string; full: string }) => img.full)
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

  // Form submission
  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    if (!session?.user?.id) {
      setError(createValidationError('auth', 'Vous devez être connecté pour créer une annonce'))
      setIsLoading(false)
      return
    }

    if (imageUpload.selectedFiles.length === 0) {
      setError(createValidationError('images', 'Veuillez ajouter au moins une photo'))
      setIsLoading(false)
      return
    }

    try {
      const finalUserId = assignToOtherUser && userSelected ? userSelected : session.user.id

      const productPayload = buildCreateProductPayload({
        formData,
        seoData,
        userId: finalUserId,
        specialPrices: productData.specialPrices,
      })

      const result = await createProduct(productPayload)
      if (!result) throw new Error("Erreur lors de la creation de l'annonce")

      // Room-type photos need the product id (upload folder + payload target),
      // so they can only be persisted once the listing exists. The urls ride
      // inside each room type's own payload entry, which is why no mapping of
      // upload results back to server-generated room-type ids is ever needed.
      if (formData.isHotel && hasPendingRoomTypeImages(formData.roomTypes)) {
        const withUrls = await uploadRoomTypeImages(formData.roomTypes, result.id)
        setRoomTypes(withUrls)

        const roomTypesResponse = await fetch(`/api/products/${result.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ roomTypes: buildRoomTypesPayload(withUrls) }),
        })

        if (!roomTypesResponse.ok) {
          const errorBody = await roomTypesResponse.json().catch(() => ({}))
          throw new Error(
            errorBody.error ||
              `Échec de l'enregistrement des photos des types de chambre (HTTP ${roomTypesResponse.status})`
          )
        }
      }

      const imageUrls = await uploadImagesToServer(imageUpload.selectedFiles, result.id)

      const updateResponse = await fetch(`/api/products/${result.id}/images`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ imageUrls }),
      })

      if (!updateResponse.ok) {
        const errorBody = await updateResponse.json().catch(() => ({}))
        throw new Error(
          errorBody.error ||
            `Échec de l'enregistrement des images (HTTP ${updateResponse.status})`
        )
      }

      await invalidateClientCache.products(result.id)
      toast.success('Annonce créée avec succès!')
      router.push('/dashboard/host')
    } catch (err) {
      console.error('Error creating product:', err)
      setError(parseCreateProductError(err))
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-600 text-lg">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

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
            <Home className="h-4 w-4" />
            Créer une annonce
          </div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700">
            Créer une nouvelle annonce
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            Remplissez les informations ci-dessous pour créer votre annonce
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
              {wizard.stepErrors.map((err) => (
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
            formData.isHotel ? (
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
            )
          )}
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
              session={session}
              users={productData.users}
              assignToOtherUser={assignToOtherUser}
              setAssignToOtherUser={setAssignToOtherUser}
              userSelected={userSelected}
              setUserSelected={setUserSelected}
            />
          )}
        </AnimatePresence>

        {/* Navigation */}
        <WizardNavigation
          isFirstStep={wizard.isFirstStep}
          isLastStep={wizard.isLastStep}
          isSubmitting={isLoading}
          isUploadingImages={imageUpload.isUploadingImages}
          onPrevious={wizard.prevStep}
          onNext={handleNext}
          onSubmit={handleSubmit}
        />
      </motion.div>
    </div>
  )
}
