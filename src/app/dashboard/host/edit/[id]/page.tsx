'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { CACHE_TAGS } from '@/lib/cache/query-client'
import { useAuth } from '@/hooks/useAuth'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Edit3 } from 'lucide-react'
import { toast } from 'sonner'

import ErrorAlert, { ErrorDetails } from '@/components/ui/ErrorAlert'
import { parseCreateProductError, createValidationError } from '@/lib/utils/errorHandler'
import { invalidateClientCache } from '@/lib/cache/client-invalidation'

import { WizardStepper } from '@/app/createProduct/components/wizard/WizardStepper'
import { WizardNavigation } from '@/app/createProduct/components/wizard/WizardNavigation'
import { StepBasicInfo } from '@/app/createProduct/components/wizard/StepBasicInfo'
import { StepLocation } from '@/app/createProduct/components/wizard/StepLocation'
import { StepPricing } from '@/app/createProduct/components/wizard/StepPricing'
import { StepServices } from '@/app/createProduct/components/wizard/StepServices'
import { StepRulesAndMedia } from '@/app/createProduct/components/wizard/StepRulesAndMedia'

import {
  useProductData,
  useProductForm,
  useImageUpload,
} from '@/app/createProduct/hooks'
import { useProductWizardForm } from '@/app/createProduct/hooks/useProductWizardForm'
import type { FormData, ImageFile, SpecialPrice } from '@/app/createProduct/types'

interface ProductImage {
  id: string
  img: string
}

interface LoadedProduct {
  formData: FormData
  images: ImageFile[]
  specialPrices: SpecialPrice[]
}

/**
 * Fetch an existing product and transform it into the wizard form shape.
 * Cached under `CACHE_TAGS.product(id)` so the submit-time products
 * invalidation refetches it.
 */
async function fetchProductForEdit(productId: string): Promise<LoadedProduct> {
  const response = await fetch(`/api/products/${productId}`)
  if (!response.ok) {
    throw new Error('Produit non trouvé')
  }

  const product = await response.json()

  const formData: FormData = {
    name: product.name || '',
    description: product.description || '',
    address: product.address || '',
    completeAddress: product.completeAddress || '',
    placeId: product.placeId || '',
    latitude: product.latitude || 0,
    longitude: product.longitude || 0,
    phone: product.phone || '',
    phoneCountry: product.phoneCountry || 'MG',
    typeId: product.typeId || '',
    typeRentId: product.typeId || '', // Sync with typeId
    arriving: product.arriving?.toString() || '15',
    leaving: product.leaving?.toString() || '12',
    basePrice: product.basePrice || '',
    priceMGA: product.priceMGA || '',
    basePriceMGA: product.priceMGA || '', // Sync with priceMGA
    specialPrices: product.specialPrices || [],
    autoAccept: product.autoAccept || false,
    equipmentIds: product.equipments?.map((e: { id: string }) => e.id) || [],
    mealIds: product.mealsList?.map((m: { id: string }) => m.id) || [],
    securityIds: product.securities?.map((s: { id: string }) => s.id) || [],
    serviceIds: product.servicesList?.map((s: { id: string }) => s.id) || [],
    includedServiceIds: product.includedServices?.map((s: { id: string }) => s.id) || [],
    extraIds: product.extras?.map((e: { id: string }) => e.id) || [],
    highlightIds: product.highlights?.map((h: { id: string }) => h.id) || [],
    nearbyPlaces:
      product.nearbyPlaces?.map((p: { name: string; distance: number }) => ({
        name: p.name,
        distance: p.distance?.toString() || '',
        unit: p.distance && p.distance < 1000 ? 'mètres' : 'kilomètres',
      })) || [],
    proximityLandmarks: product.proximityLandmarks || [],
    transportation:
      product.transportOptions?.map((t: { name: string }) => t.name).join(', ') || '',
    room: product.room?.toString() || '',
    bathroom: product.bathroom?.toString() || '',
    surface: product.surface?.toString() || '',
    minPeople: product.minPeople?.toString() || '',
    maxPeople: product.maxPeople?.toString() || '',
    accessibility: product.accessibility || false,
    petFriendly: product.petFriendly || false,
    // Rules (rules is an array from Prisma, take first element)
    smokingAllowed: product.rules?.[0]?.smokingAllowed || false,
    petsAllowed: product.rules?.[0]?.petsAllowed || false,
    eventsAllowed: product.rules?.[0]?.eventsAllowed || false,
    selfCheckIn: product.rules?.[0]?.selfCheckIn || false,
    selfCheckInType: product.rules?.[0]?.selfCheckInType || '',
    // Property info
    hasStairs: product.propertyInfo?.hasStairs || false,
    hasElevator: product.propertyInfo?.hasElevator || false,
    hasHandicapAccess: product.propertyInfo?.hasHandicapAccess || false,
    hasPetsOnProperty: product.propertyInfo?.hasPetsOnProperty || false,
    additionalNotes: product.propertyInfo?.additionalNotes || '',
    isHotel: !!product.hotel,
    hotelName: product.hotel?.name || '',
    availableRooms: product.availableRooms?.toString() || '',
    roomTypes: [],
  }

  // Transform images to ImageFile format.
  // Mark existing images with isExisting flag to prevent re-upload.
  const images: ImageFile[] =
    product.img?.map((img: ProductImage, index: number) => ({
      id: img.id,
      file: null, // No file object for existing images
      preview: img.img, // URL of the existing image
      url: img.img, // Keep original URL
      isExisting: true, // Flag to prevent re-upload
      order: index,
    })) || []

  return {
    formData,
    images,
    specialPrices: product.specialPrices || [],
  }
}

export default function EditProductPage() {
  const params = useParams()
  const productId = params.id as string
  const router = useRouter()
  const { session, isLoading: isAuthLoading } = useAuth({ required: true, redirectTo: '/auth' })

  // Load existing product data (cached under CACHE_TAGS.product(id))
  const productQuery = useQuery({
    queryKey: CACHE_TAGS.product(productId),
    queryFn: () => fetchProductForEdit(productId),
    enabled: !!productId,
  })
  const loadedFormData = productQuery.data?.formData
  const loadedImages = useMemo(() => productQuery.data?.images ?? [], [productQuery.data])
  const loadedSpecialPrices = useMemo(
    () => productQuery.data?.specialPrices ?? [],
    [productQuery.data]
  )
  const isLoadingProduct = productQuery.isLoading
  const loadError = productQuery.error
    ? productQuery.error instanceof Error
      ? productQuery.error.message
      : 'Erreur inconnue'
    : null

  // Preserve the loader's error behavior: notify then return to the dashboard.
  useEffect(() => {
    if (productQuery.error) {
      toast.error('Erreur lors du chargement du produit')
      router.push('/dashboard/host')
    }
  }, [productQuery.error, router])

  // Data & form hooks
  const productData = useProductData()
  const productForm = useProductForm(productData.types, loadedFormData)
  const imageUpload = useImageUpload(loadedImages)
  const wizard = useProductWizardForm()

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ErrorDetails | null>(null)
  const [specialPrices, setSpecialPrices] = useState<SpecialPrice[]>([])
  const [seoData, setSeoData] = useState<{
    metaTitle?: string
    metaDescription?: string
    keywords?: string
    slug?: string
  }>({ metaTitle: '', metaDescription: '', keywords: '', slug: '' })

  const { formData, setFormData, handleInputChange } = productForm

  // Sync loaded data
  useEffect(() => {
    if (loadedSpecialPrices.length > 0) {
      setSpecialPrices(loadedSpecialPrices)
    }
  }, [loadedSpecialPrices])

  useEffect(() => {
    if (loadedFormData && loadedFormData.name) {
      productForm.setFormData(loadedFormData)
    }
  }, [loadedFormData])

  useEffect(() => {
    if (loadedImages.length > 0) {
      imageUpload.setSelectedFiles(loadedImages)
    }
  }, [loadedImages])

  useEffect(() => {
    if (loadedFormData) {
      const formDataWithSEO = loadedFormData as typeof loadedFormData & {
        metaTitle?: string
        metaDescription?: string
        keywords?: string
        slug?: string
      }
      setSeoData({
        metaTitle: formDataWithSEO.metaTitle || '',
        metaDescription: formDataWithSEO.metaDescription || '',
        keywords: formDataWithSEO.keywords || '',
        slug: formDataWithSEO.slug || '',
      })
    }
  }, [loadedFormData])

  // Upload new images only
  const uploadImagesToServer = async (imageFiles: ImageFile[]): Promise<string[]> => {
    const files = imageFiles
      .filter(img => img.file !== null && !img.isExisting)
      .map(img => img.file!)

    if (files.length === 0) return []

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

    const uploadResult = await uploadResponse.json()
    return (
      uploadResult.images?.map(
        (img: { thumb: string; medium: string; full: string }) => img.full
      ) || []
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

  // Form submission for UPDATE
  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    if (!session?.user?.id) {
      setError(createValidationError('auth', 'Vous devez être connecté'))
      setIsLoading(false)
      return
    }

    try {
      const updateData = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        completeAddress: formData.completeAddress || null,
        longitude: formData.longitude || 0,
        latitude: formData.latitude || 0,
        basePrice: formData.basePrice,
        priceMGA: formData.priceMGA,
        room: formData.room ? Number(formData.room) : null,
        bathroom: formData.bathroom ? Number(formData.bathroom) : null,
        surface: formData.surface ? Number(formData.surface) : null,
        arriving: formData.arriving ? Number(formData.arriving) : 15,
        leaving: formData.leaving ? Number(formData.leaving) : 12,
        phone: formData.phone,
        phoneCountry: formData.phoneCountry || 'MG',
        minPeople: formData.minPeople ? Number(formData.minPeople) : null,
        maxPeople: formData.maxPeople ? Number(formData.maxPeople) : null,
        accessibility: formData.accessibility || false,
        petFriendly: formData.petFriendly || false,
        autoAccept: formData.autoAccept || false,
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
          distance: place.unit === 'minutes à pied'
            ? 0
            : place.unit === 'kilomètres'
              ? (place.distance ? Number(place.distance) * 1000 : 0)
              : (place.distance ? Number(place.distance) : 0),
          duration: place.unit === 'minutes à pied' ? (place.distance ? Number(place.distance) : 0) : 0,
          transport: place.unit === 'minutes à pied' ? 'à pied' : place.unit === 'kilomètres' ? 'voiture' : 'à pied',
        })),
        proximityLandmarks: formData.proximityLandmarks || [],
        isHotel: formData.isHotel,
        hotelInfo: formData.isHotel
          ? { name: formData.hotelName, availableRooms: Number(formData.availableRooms) }
          : null,
        specialPrices: specialPrices.map(sp => ({
          pricesMga: sp.pricesMga,
          pricesEuro: sp.pricesEuro,
          day: sp.day,
          startDate: sp.startDate,
          endDate: sp.endDate,
          activate: sp.activate,
        })),
        seoData,
        transportOptions: formData.transportation
          ? formData.transportation
              .split(',')
              .map((name: string) => ({ name: name.trim(), description: '' }))
              .filter((t: { name: string }) => t.name.length > 0)
          : [],
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
      }

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la mise a jour de l'annonce")
      }

      // Handle images
      const existingImages = imageUpload.selectedFiles.filter(img => img.isExisting && img.url)
      const newImages = imageUpload.selectedFiles.filter(img => !img.isExisting && img.file !== null)

      let newImageUrls: string[] = []
      if (newImages.length > 0) {
        newImageUrls = await uploadImagesToServer(newImages)
      }

      const allImageUrls = [
        ...existingImages.map(img => img.url!),
        ...newImageUrls,
      ]

      const imagesResponse = await fetch(`/api/products/${productId}/images`, {
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

      await invalidateClientCache.products(productId)
      toast.success('Annonce modifiée avec succès!')
      setTimeout(() => router.push('/dashboard/host'), 1500)
    } catch (err) {
      console.error('Error updating product:', err)
      setError(parseCreateProductError(err))
    } finally {
      setIsLoading(false)
    }
  }

  // Loading states
  if (isAuthLoading || isLoadingProduct) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-600 text-lg">Chargement...</p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Erreur</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">{loadError}</p>
            <Button onClick={() => router.push('/dashboard/host')} className="mt-4">
              Retour au tableau de bord
            </Button>
          </CardContent>
        </Card>
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
            <Edit3 className="h-4 w-4" />
            Modifier l&apos;annonce
          </div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700">
            Modifier votre annonce
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            Mettez à jour les informations de votre hébergement
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
            <StepPricing
              key="step-2"
              formData={formData}
              handleInputChange={handleInputChange}
              specialPrices={specialPrices}
              setSpecialPrices={setSpecialPrices}
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
              session={session}
              users={productData.users}
              assignToOtherUser={false}
              setAssignToOtherUser={() => {}}
              userSelected=""
              setUserSelected={() => {}}
            />
          )}
        </AnimatePresence>

        {/* Navigation - "Save" instead of "Create" */}
        <WizardNavigation
          isFirstStep={wizard.isFirstStep}
          isLastStep={wizard.isLastStep}
          isSubmitting={isLoading}
          isUploadingImages={imageUpload.isUploadingImages}
          onPrevious={wizard.prevStep}
          onNext={handleNext}
          onSubmit={handleSubmit}
          submitLabel="Sauvegarder les modifications"
          submittingLabel="Sauvegarde en cours..."
        />
      </motion.div>
    </div>
  )
}
