'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {



  Camera,
  ArrowLeft,
  Plus,
  Upload,
  X,
  Package,
  Highlighter,
  Star,

  UtensilsCrossed,
  Shield,
  Zap,
  Save,
} from 'lucide-react'

// Import section components from createProduct
import {
  BasicInfoSection,
  LocationContactSection,
  ServiceSelectionSection,
  ProductCharacteristicsForm,
  ProductPricingForm,
} from '@/app/createProduct/components'

import CreateServiceModal from '@/components/ui/CreateServiceModal'
import CreateExtraModal from '@/components/ui/CreateExtraModal'
import CreateHighlightModal from '@/components/ui/CreateHighlightModal'
import CreateSpecialPriceModal from '@/components/ui/CreateSpecialPriceModal'

import BookingCostSummary from '@/components/ui/BookingCostSummary'
import SortableImageGrid from '@/components/ui/SortableImageGrid'
import ImageGalleryPreview from '@/components/ui/ImageGalleryPreview'
import ErrorAlert, { ErrorDetails } from '@/components/ui/ErrorAlert'
import { parseCreateProductError, createValidationError } from '@/lib/utils/errorHandler'
import SEOFieldsCard from '@/components/ui/SEOFieldsCard'

// Import types, utilities, and hooks from createProduct
import type {
  ImageFile,
  TestBooking,
  FormData,
  SpecialPrice,
} from '@/app/createProduct/types'

import { containerVariants, itemVariants } from '@/app/createProduct/utils'
import {
  useProductData,
  useProductForm,
  useImageUpload,
  useProductLoader,
} from '@/app/createProduct/hooks'
import { toast } from 'sonner'

export default function EditProductPage() {
  const params = useParams()
  const productId = params.id as string
  const router = useRouter()
  const { session, isLoading: isAuthLoading } = useAuth({ required: true, redirectTo: '/auth' })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load existing product data
  const {
    formData: loadedFormData,
    images: loadedImages,
    specialPrices: loadedSpecialPrices,
    isLoading: isLoadingProduct,
    error: loadError,
  } = useProductLoader(productId)

  // Custom hooks - managing all state and logic
  const productData = useProductData()
  const productForm = useProductForm(productData.types, loadedFormData)
  const imageUpload = useImageUpload(loadedImages)

  // Local UI state (not in hooks)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ErrorDetails | null>(null)
  const [showGalleryPreview, setShowGalleryPreview] = useState(false)

  // Modal states
  const [serviceModalOpen, setServiceModalOpen] = useState(false)
  const [extraModalOpen, setExtraModalOpen] = useState(false)
  const [highlightModalOpen, setHighlightModalOpen] = useState(false)
  const [specialPriceModalOpen, setSpecialPriceModalOpen] = useState(false)

  // Test booking for cost preview
  const [testBooking] = useState<TestBooking>({
    startDate: new Date(),
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    guestCount: 2,
  })

  // Special prices state
  const [specialPrices, setSpecialPrices] = useState<SpecialPrice[]>([])

  // SEO data state
  const [seoData, setSeoData] = useState<{
    metaTitle?: string
    metaDescription?: string
    keywords?: string
    slug?: string
  }>({
    metaTitle: '',
    metaDescription: '',
    keywords: '',
    slug: '',
  })

  // Update special prices when loaded
  useEffect(() => {
    if (loadedSpecialPrices.length > 0) {
      setSpecialPrices(loadedSpecialPrices)
    }
  }, [loadedSpecialPrices])

  // Update form data when product is loaded
  useEffect(() => {
    if (loadedFormData && loadedFormData.name) {
      console.log('📍 Loading product data with GPS:', {
        latitude: loadedFormData.latitude,
        longitude: loadedFormData.longitude,
        arriving: loadedFormData.arriving,
        leaving: loadedFormData.leaving,
      })
      productForm.setFormData(loadedFormData)
    }
  }, [loadedFormData])

  // Update images when loaded
  useEffect(() => {
    if (loadedImages.length > 0) {
      imageUpload.setSelectedFiles(loadedImages)
    }
  }, [loadedImages])

  // Update SEO data when product is loaded
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

  // Destructure for easier access
  const { formData, setFormData, handleInputChange } = productForm
  const {
    types,
    equipments,
    meals,
    securities,
    services,
    includedServices,
    extras,
    highlights,
    // users,
    refreshIncludedServices,
    refreshExtras,
    refreshHighlights,
  } = productData

  // Handlers for modals
  const handleServiceCreated = () => {
    refreshIncludedServices()
  }

  const handleExtraCreated = () => {
    refreshExtras()
  }

  const handleHighlightCreated = () => {
    refreshHighlights()
  }

  const handleSpecialPriceCreated = (newSpecialPrice: Omit<SpecialPrice, 'id'>) => {
    const specialPriceWithId: SpecialPrice = {
      ...newSpecialPrice,
      id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    }
    setSpecialPrices(prev => [...prev, specialPriceWithId])
    // Sync with formData
    setFormData(prev => ({
      ...prev,
      specialPrices: [...prev.specialPrices, specialPriceWithId],
    }))
  }

  const handleRemoveSpecialPrice = (id: string) => {
    setSpecialPrices(prev => prev.filter(sp => sp.id !== id))
    // Sync with formData
    setFormData(prev => ({
      ...prev,
      specialPrices: prev.specialPrices.filter(sp => sp.id !== id),
    }))
  }

  // Calcul mémorisé pour les extras sélectionnés avec leurs données complètes
  const selectedExtras = useMemo(() => {
    return extras.filter(extra => formData.extraIds.includes(extra.id))
  }, [extras, formData.extraIds])

  // Calcul mémorisé pour le nombre de jours de la réservation de test
  const numberOfDays = useMemo(() => {
    return Math.ceil(
      (testBooking.endDate.getTime() - testBooking.startDate.getTime()) / (1000 * 60 * 60 * 24)
    )
  }, [testBooking.startDate, testBooking.endDate])

  // Handle checkbox changes for arrays
  const handleCheckboxChange = (field: keyof FormData, id: string) => {
    setFormData(prev => {
      const currentArray = prev[field] as string[]
      const isChecked = currentArray.includes(id)

      return {
        ...prev,
        [field]: isChecked ? currentArray.filter(item => item !== id) : [...currentArray, id],
      }
    })
  }

  // File handling
  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await imageUpload.handleFileSelect(Array.from(e.target.files))
    }
  }

  // Upload new images via API
  const uploadImagesToServer = async (
    imageFiles: ImageFile[],
    productId: string
  ): Promise<string[]> => {
    // Filter only NEW images (with File objects, not existing URLs)
    const files = imageFiles
      .filter(img => img.file !== null && !img.isExisting)
      .map(img => img.file!)

    if (files.length === 0) {
      console.log('⏭️  No new images to upload')
      return []
    }

    try {
      console.log(`📤 Converting ${files.length} new images to base64...`)
      const base64Images: string[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            console.log(
              `  ✓ Image ${i + 1}/${files.length} (${file.name}) - ${(file.size / 1024).toFixed(2)}KB`
            )
            resolve(reader.result as string)
          }
          reader.onerror = () => reject(new Error(`Erreur de lecture de l'image: ${file.name}`))
          reader.readAsDataURL(file)
        })
        base64Images.push(base64)
      }

      console.log('📡 Uploading to server (WebP conversion + 3 sizes)...')
      const uploadResponse = await fetch('/api/images/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: base64Images,
          entityType: 'products',
          entityId: productId,
        }),
      })

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json()
        throw new Error(error.error || "Erreur lors de l'upload des images")
      }

      const uploadResult = await uploadResponse.json()
      console.log(`✅ Successfully uploaded ${uploadResult.count || files.length} new images`)

      // Return full URLs (high quality)
      return (
        uploadResult.images?.map(
          (img: { thumb: string; medium: string; full: string }) => img.full
        ) ||
        uploadResult.urls ||
        []
      )
    } catch (error) {
      console.error('❌ Error uploading images:', error)
      throw error
    }
  }

  // Handle form submission for UPDATE
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!session?.user?.id) {
      setError(createValidationError('auth', 'Vous devez être connecté pour modifier une annonce'))
      setIsLoading(false)
      return
    }

    // Validation basique
    if (!formData.name.trim()) {
      setError(createValidationError('name', "Le nom de l'hébergement est requis"))
      setIsLoading(false)
      return
    }

    if (!formData.description.trim()) {
      setError(createValidationError('description', 'La description est requise'))
      setIsLoading(false)
      return
    }

    if (!formData.typeId) {
      setError(createValidationError('typeId', "Veuillez sélectionner un type d'hébergement"))
      setIsLoading(false)
      return
    }

    try {
      // Les coordonnées GPS sont déjà disponibles dans formData
      // (récupérées lors de la sélection dans CityAutocomplete)
      console.log('📍 Current formData GPS before submission:', {
        latitude: formData.latitude,
        longitude: formData.longitude,
        arriving: formData.arriving,
        leaving: formData.leaving,
      })

      if (formData.latitude === 0 || formData.longitude === 0) {
        console.warn('⚠️ Coordonnées GPS manquantes pour le produit')
      }

      // Étape 1: Mettre à jour le produit
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
          distance: place.distance ? Number(place.distance) : 0,
          duration: 0,
          transport: place.unit === 'kilomètres' ? 'voiture' : 'à pied',
        })),
        proximityLandmarks: formData.proximityLandmarks || [],
        isHotel: formData.isHotel,
        hotelInfo: formData.isHotel
          ? {
              name: formData.hotelName,
              availableRooms: Number(formData.availableRooms),
            }
          : null,
        // Special prices
        specialPrices: specialPrices.map(sp => ({
          pricesMga: sp.pricesMga,
          pricesEuro: sp.pricesEuro,
          day: sp.day,
          startDate: sp.startDate,
          endDate: sp.endDate,
          activate: sp.activate,
        })),
        // SEO data
        seoData: seoData,
      }

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour de l'annonce")
      }

      // Étape 2: Gérer les images (nouvelles + existantes)
      // Séparer les images existantes (déjà en DB) des nouvelles images à uploader
      const existingImages = imageUpload.selectedFiles.filter(img => img.isExisting && img.url)
      const newImages = imageUpload.selectedFiles.filter(
        img => !img.isExisting && img.file !== null
      )

      console.log(`📊 Images: ${existingImages.length} existantes, ${newImages.length} nouvelles`)

      // Uploader uniquement les nouvelles images
      let newImageUrls: string[] = []
      if (newImages.length > 0) {
        console.log('📤 Upload des nouvelles images...')
        newImageUrls = await uploadImagesToServer(newImages, productId)
      }

      // Combiner les URLs : images existantes + nouvelles images
      const allImageUrls = [
        ...existingImages.map(img => img.url!), // URLs des images existantes
        ...newImageUrls, // URLs des nouvelles images uploadées
      ]

      console.log(`✅ Total images après mise à jour: ${allImageUrls.length}`)

      // Mettre à jour le produit avec TOUTES les URLs (existantes + nouvelles)
      const updateImagesResponse = await fetch(`/api/products/${productId}/images`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrls: allImageUrls }),
      })

      if (!updateImagesResponse.ok) {
        console.error('Erreur lors de la mise à jour des images, mais le produit a été modifié')
      }

      toast.success('Annonce modifiée avec succès!')

      // Rediriger vers le tableau de bord
      setTimeout(() => {
        router.push('/dashboard/host')
      }, 1500)
    } catch (error) {
      console.error('Error updating product:', error)
      const parsedError = parseCreateProductError(error)
      setError(parsedError)
    } finally {
      setIsLoading(false)
    }
  }

  // Loading states
  if (isAuthLoading || isLoadingProduct) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='flex flex-col items-center gap-4'>
          <div className='w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin'></div>
          <p className='text-slate-600 text-lg'>Chargement...</p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Card className='max-w-md'>
          <CardHeader>
            <CardTitle className='text-red-600'>Erreur</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-slate-600'>{loadError}</p>
            <Button onClick={() => router.push('/dashboard/host')} className='mt-4'>
              Retour au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4 sm:px-6 lg:px-8'>
      <motion.div
        className='max-w-7xl mx-auto'
        initial='hidden'
        animate='visible'
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div variants={itemVariants} className='mb-8'>
          <Button
            variant='ghost'
            onClick={() => router.back()}
            className='mb-4 text-slate-600 hover:text-slate-900'
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Retour
          </Button>
          <h1 className='text-4xl font-bold text-slate-900 mb-2'>Modifier votre annonce</h1>
          <p className='text-slate-600'>Mettez à jour les informations de votre hébergement</p>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div variants={itemVariants} className='mb-6'>
            <ErrorAlert error={error} onClose={() => setError(null)} />
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className='space-y-8'>
          {/* Basic Info Section */}
          <BasicInfoSection
            formData={formData}
            handleInputChange={handleInputChange}
            setFormData={setFormData}
            types={types}
            itemVariants={itemVariants}
          />

          {/* Location & Contact Section */}
          <LocationContactSection
            formData={formData}
            setFormData={setFormData}
            itemVariants={itemVariants}
          />

          {/* Product Characteristics Form */}
          <ProductCharacteristicsForm
            formData={formData}
            onInputChange={handleInputChange}
            itemVariants={itemVariants}
          />

          {/* Product Pricing Form */}
          <ProductPricingForm
            formData={formData}
            onInputChange={handleInputChange}
            onSpecialPriceCreated={handleSpecialPriceCreated}
            onRemoveSpecialPrice={handleRemoveSpecialPrice}
            itemVariants={itemVariants}
          />

          {/* Images Section */}
          <motion.div variants={itemVariants}>
            <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm'>
              <CardHeader className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <div className='p-2 bg-purple-100 rounded-lg'>
                    <Camera className='h-5 w-5 text-purple-600' />
                  </div>
                  <div>
                    <CardTitle className='text-xl'>Photos</CardTitle>
                    <p className='text-slate-600 text-sm mt-1'>
                      Ajoutez ou modifiez des photos de votre hébergement (max 15)
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    imageUpload.dragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-300 hover:border-blue-400'
                  }`}
                  onDragEnter={e => imageUpload.handleDrag(e, true)}
                  onDragLeave={e => imageUpload.handleDrag(e, false)}
                  onDragOver={e => imageUpload.handleDrag(e, true)}
                  onDrop={imageUpload.handleDrop}
                >
                  <Upload className='mx-auto h-12 w-12 text-slate-400' />
                  <p className='mt-2 text-sm text-slate-600'>Glissez-déposez vos images ici, ou</p>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => fileInputRef.current?.click()}
                    className='mt-2'
                  >
                    Parcourir
                  </Button>
                  <input
                    ref={fileInputRef}
                    type='file'
                    accept='image/*'
                    multiple
                    onChange={handleFiles}
                    className='hidden'
                  />
                  <p className='mt-2 text-xs text-slate-500'>
                    {imageUpload.selectedFiles.length}/15 images
                  </p>
                </div>

                {imageUpload.selectedFiles.length > 0 && (
                  <div className='mt-6'>
                    <div className='flex justify-between items-center mb-4'>
                      <p className='text-sm text-slate-600'>
                        {imageUpload.selectedFiles.length} image(s) sélectionnée(s)
                      </p>
                      <div className='flex gap-2'>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={() => setShowGalleryPreview(true)}
                        >
                          <Camera className='h-4 w-4 mr-2' />
                          Prévisualiser
                        </Button>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={imageUpload.clearAllImages}
                        >
                          <X className='h-4 w-4 mr-2' />
                          Tout supprimer
                        </Button>
                      </div>
                    </div>
                    <SortableImageGrid
                      images={imageUpload.selectedFiles}
                      onReorder={newImages => imageUpload.setSelectedFiles(newImages)}
                      onRemove={imageUpload.deleteImage}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Service Selection Sections */}
          <ServiceSelectionSection
            title='Équipements'
            description='Sélectionnez les équipements disponibles'
            icon={Zap}
            iconColor='text-yellow-600'
            bgColor='bg-yellow-100'
            borderColor='border-yellow-600'
            services={equipments}
            selectedServiceIds={formData.equipmentIds}
            onServiceToggle={id => handleCheckboxChange('equipmentIds', id)}
            itemVariants={itemVariants}
          />

          <ServiceSelectionSection
            title='Repas'
            description='Sélectionnez les options de repas'
            icon={UtensilsCrossed}
            iconColor='text-orange-600'
            bgColor='bg-orange-100'
            borderColor='border-orange-600'
            services={meals}
            selectedServiceIds={formData.mealIds}
            onServiceToggle={id => handleCheckboxChange('mealIds', id)}
            itemVariants={itemVariants}
          />

          <ServiceSelectionSection
            title='Sécurité'
            description='Sélectionnez les équipements de sécurité'
            icon={Shield}
            iconColor='text-red-600'
            bgColor='bg-red-100'
            borderColor='border-red-600'
            services={securities}
            selectedServiceIds={formData.securityIds}
            onServiceToggle={id => handleCheckboxChange('securityIds', id)}
            itemVariants={itemVariants}
          />

          <ServiceSelectionSection
            title='Services'
            description='Sélectionnez les services disponibles'
            icon={Star}
            iconColor='text-blue-600'
            bgColor='bg-blue-100'
            borderColor='border-blue-600'
            services={services}
            selectedServiceIds={formData.serviceIds}
            onServiceToggle={id => handleCheckboxChange('serviceIds', id)}
            itemVariants={itemVariants}
          />

          {/* Services inclus */}
          <motion.div variants={itemVariants}>
            <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm'>
              <CardHeader className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <div className='p-2 bg-green-100 rounded-lg'>
                      <Package className='h-5 w-5 text-green-600' />
                    </div>
                    <div>
                      <CardTitle className='text-xl'>Services inclus</CardTitle>
                      <p className='text-slate-600 text-sm mt-1'>Services inclus dans le prix</p>
                    </div>
                  </div>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => setServiceModalOpen(true)}
                  >
                    <Plus className='h-4 w-4 mr-2' />
                    Créer
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
                  {includedServices.map(service => (
                    <label
                      key={service.id}
                      className={`relative flex items-center p-2 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm ${
                        formData.includedServiceIds.includes(service.id)
                          ? 'border-green-600 bg-green-100'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <input
                        type='checkbox'
                        checked={formData.includedServiceIds.includes(service.id)}
                        onChange={() => handleCheckboxChange('includedServiceIds', service.id)}
                        className='sr-only'
                      />
                      <span className='text-xs font-medium text-slate-700 truncate'>
                        {service.name}
                      </span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Extras */}
          <motion.div variants={itemVariants}>
            <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm'>
              <CardHeader className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <div className='p-2 bg-pink-100 rounded-lg'>
                      <Plus className='h-5 w-5 text-pink-600' />
                    </div>
                    <div>
                      <CardTitle className='text-xl'>Extras</CardTitle>
                      <p className='text-slate-600 text-sm mt-1'>
                        Services supplémentaires payants
                      </p>
                    </div>
                  </div>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => setExtraModalOpen(true)}
                  >
                    <Plus className='h-4 w-4 mr-2' />
                    Créer
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
                  {extras.map(extra => (
                    <label
                      key={extra.id}
                      className={`relative flex items-center p-2 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm ${
                        formData.extraIds.includes(extra.id)
                          ? 'border-pink-600 bg-pink-100'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <input
                        type='checkbox'
                        checked={formData.extraIds.includes(extra.id)}
                        onChange={() => handleCheckboxChange('extraIds', extra.id)}
                        className='sr-only'
                      />
                      <span className='text-xs font-medium text-slate-700 truncate'>
                        {extra.name}
                      </span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Highlights */}
          <motion.div variants={itemVariants}>
            <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm'>
              <CardHeader className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <div className='p-2 bg-indigo-100 rounded-lg'>
                      <Highlighter className='h-5 w-5 text-indigo-600' />
                    </div>
                    <div>
                      <CardTitle className='text-xl'>Points forts</CardTitle>
                      <p className='text-slate-600 text-sm mt-1'>Les atouts de votre hébergement</p>
                    </div>
                  </div>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => setHighlightModalOpen(true)}
                  >
                    <Plus className='h-4 w-4 mr-2' />
                    Créer
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
                  {highlights.map(highlight => (
                    <label
                      key={highlight.id}
                      className={`relative flex items-center p-2 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm ${
                        formData.highlightIds.includes(highlight.id)
                          ? 'border-indigo-600 bg-indigo-100'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <input
                        type='checkbox'
                        checked={formData.highlightIds.includes(highlight.id)}
                        onChange={() => handleCheckboxChange('highlightIds', highlight.id)}
                        className='sr-only'
                      />
                      <span className='text-xs font-medium text-slate-700 truncate'>
                        {highlight.name}
                      </span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Booking Cost Summary */}
          <motion.div variants={itemVariants}>
            <BookingCostSummary
              basePrice={parseFloat(formData.basePrice) || 0}
              numberOfDays={numberOfDays}
              guestCount={testBooking.guestCount}
              selectedExtras={selectedExtras}
              startDate={testBooking.startDate}
              endDate={testBooking.endDate}
              currency='EUR'
            />
          </motion.div>

          {/* SEO Section */}
          <motion.div variants={itemVariants}>
            <SEOFieldsCard
              seoData={seoData}
              onSeoChange={setSeoData}
              articleTitle={formData.name}
            />
          </motion.div>

          {/* Submit Button */}
          <motion.div variants={itemVariants} className='flex justify-end gap-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type='submit' disabled={isLoading} className='min-w-[200px]'>
              {isLoading ? (
                <div className='flex items-center gap-2'>
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                  <span>Modification...</span>
                </div>
              ) : (
                <>
                  <Save className='mr-2 h-4 w-4' />
                  Enregistrer les modifications
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </motion.div>

      {/* Modals */}
      <CreateServiceModal
        isOpen={serviceModalOpen}
        onClose={() => setServiceModalOpen(false)}
        onServiceCreated={handleServiceCreated}
        title='Ajouter un service inclus personnalisé'
        description='Créez un service inclus spécifique à votre hébergement'
      />
      <CreateExtraModal
        isOpen={extraModalOpen}
        onClose={() => setExtraModalOpen(false)}
        onExtraCreated={handleExtraCreated}
      />
      <CreateHighlightModal
        isOpen={highlightModalOpen}
        onClose={() => setHighlightModalOpen(false)}
        onHighlightCreated={handleHighlightCreated}
      />
      <CreateSpecialPriceModal
        isOpen={specialPriceModalOpen}
        onClose={() => setSpecialPriceModalOpen(false)}
        onSpecialPriceCreated={handleSpecialPriceCreated}
      />

      {/* Gallery Preview */}
      <ImageGalleryPreview
        images={imageUpload.selectedFiles}
        isOpen={showGalleryPreview}
        onClose={() => setShowGalleryPreview(false)}
      />
    </div>
  )
}
