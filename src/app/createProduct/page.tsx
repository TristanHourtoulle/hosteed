'use client'

import { useState, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Home,
  Users,
  Euro,
  Camera,
  ArrowLeft,
  Plus,
  Upload,
  X,
  Package,
  Highlighter,
  Star,
  FileText,
  UtensilsCrossed,
  Shield,
  Zap,
} from 'lucide-react'

// Import section components
import { BasicInfoSection, LocationContactSection, ServiceSelectionSection } from './components'

import { createProduct } from '@/lib/services/product.service'
import { googleSuggestionService } from '@/lib/services/GoogleSuggestion.service'
import CreateServiceModal from '@/components/ui/CreateServiceModal'
import CreateExtraModal from '@/components/ui/CreateExtraModal'
import CreateHighlightModal from '@/components/ui/CreateHighlightModal'
import CreateSpecialPriceModal from '@/components/ui/CreateSpecialPriceModal'
import BookingCostSummary from '@/components/ui/BookingCostSummary'
import SortableImageGrid from '@/components/ui/SortableImageGrid'
import ImageGalleryPreview from '@/components/ui/ImageGalleryPreview'
import ErrorAlert, { ErrorDetails } from '@/components/ui/ErrorAlert'
import { UserCombobox } from '@/components/ui/UserCombobox'
import { parseCreateProductError, createValidationError } from '@/lib/utils/errorHandler'
import SEOFieldsCard from '@/components/ui/SEOFieldsCard'

// Import types, utilities, and hooks
import type { NearbyPlace, ImageFile, TestBooking, SpecialPrice, FormData } from './types'
import { DayEnum } from '@prisma/client'
import { containerVariants, itemVariants } from './utils'
import { useProductData, useProductForm, useImageUpload } from './hooks'

export default function CreateProductPage() {
  const router = useRouter()
  const { session, isLoading: isAuthLoading } = useAuth({ required: true, redirectTo: '/auth' })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Custom hooks - managing all state and logic
  const productData = useProductData()
  const productForm = useProductForm(productData.types)
  const imageUpload = useImageUpload()

  // Local UI state (not in hooks)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ErrorDetails | null>(null)
  const [showGalleryPreview, setShowGalleryPreview] = useState(false)
  const [newPlace, setNewPlace] = useState<NearbyPlace>({
    name: '',
    distance: '',
    unit: 'mètres',
  })
  const [userSelected, setUserSelected] = useState('')
  const [assignToOtherUser, setAssignToOtherUser] = useState(false)

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
    specialPrices,
    users,
    setSpecialPrices,
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
  // Image handling - using imageUpload hook
  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await imageUpload.handleFileSelect(Array.from(e.target.files))
    }
  }

  // Upload images via API (WebP conversion + 3 sizes)
  const uploadImagesToServer = async (
    imageFiles: ImageFile[],
    productId: string
  ): Promise<string[]> => {
    // Filter only images with File objects (exclude potential null values)
    const files = imageFiles.filter(img => img.file !== null).map(img => img.file!)

    try {
      // Convert to base64 for API upload
      const base64Images: string[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            console.log(`Image ${i + 1} (${file.name}) size: ${(file.size / 1024).toFixed(2)}KB`)
            resolve(reader.result as string)
          }
          reader.onerror = () => reject(new Error(`Erreur de lecture de l'image: ${file.name}`))
          reader.readAsDataURL(file)
        })
        base64Images.push(base64)
      }

      // Upload to API (converts to WebP + generates 3 sizes)
      console.log(`📤 Uploading ${base64Images.length} images to server...`)
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

      const uploadData = await uploadResponse.json()
      console.log(`✅ Successfully uploaded ${uploadData.count} images`)

      // Return full URLs (high quality for display)
      return uploadData.images.map(
        (img: { thumb: string; medium: string; full: string }) => img.full
      )
    } catch (error) {
      console.error('Error uploading images:', error)
      throw error
    }
  }

  // Note: Object URLs are cleaned up manually in removeFileById when images are removed

  // Nearby places management
  const addNearbyPlace = () => {
    if (newPlace.name.trim()) {
      setFormData(prev => ({
        ...prev,
        nearbyPlaces: [...prev.nearbyPlaces, { ...newPlace }],
      }))
      setNewPlace({ name: '', distance: '', unit: 'mètres' })
    }
  }

  const removeNearbyPlace = (index: number) => {
    setFormData(prev => ({
      ...prev,
      nearbyPlaces: prev.nearbyPlaces.filter((_, i) => i !== index),
    }))
  }

  // Form submission avec validation basique
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!session?.user?.id) {
      setError(createValidationError('auth', 'Vous devez être connecté pour créer une annonce'))
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

    // Validation spécifique aux hôtels
    if (formData.isHotel) {
      if (!formData.hotelName.trim()) {
        setError(createValidationError('hotelName', "Le nom de l'hôtel est requis"))
        setIsLoading(false)
        return
      }

      if (!formData.availableRooms || Number(formData.availableRooms) <= 0) {
        setError(
          createValidationError(
            'availableRooms',
            'Le nombre de chambres disponibles doit être supérieur à 0'
          )
        )
        setIsLoading(false)
        return
      }
    }

    if (imageUpload.selectedFiles.length === 0) {
      setError(
        createValidationError('images', 'Veuillez ajouter au moins une photo de votre hébergement')
      )
      setIsLoading(false)
      return
    }

    try {
      // Récupérer les coordonnées géographiques si un placeId est disponible
      let latitude = 0
      let longitude = 0

      if (formData.placeId) {
        try {
          const placeDetails = await googleSuggestionService.getPlaceDetails({
            placeId: formData.placeId,
            fields: ['geometry'],
          })

          if (placeDetails?.geometry?.location) {
            latitude = placeDetails.geometry.location.lat
            longitude = placeDetails.geometry.location.lng
            console.log('Coordonnées récupérées:', { latitude, longitude })
          }
        } catch (error) {
          console.warn('Impossible de récupérer les coordonnées:', error)
        }
      }

      // Déterminer l'utilisateur final (admin peut assigner à un autre utilisateur)
      const finalUserId = assignToOtherUser && userSelected ? userSelected : session.user.id

      // Debug: Vérifier les prix spéciaux
      console.log('=== Frontend Debug ===')
      console.log('specialPrices state:', specialPrices)
      console.log('specialPrices length:', specialPrices.length)

      // Étape 1: Créer le produit SANS les images pour obtenir un ID
      const productData = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        longitude: longitude,
        latitude: latitude,
        basePrice: formData.basePrice,
        priceMGA: formData.priceMGA,
        room: formData.room ? Number(formData.room) : null,
        bathroom: formData.bathroom ? Number(formData.bathroom) : null,
        arriving: Number(formData.arriving),
        leaving: Number(formData.leaving),
        phone: formData.phone,
        phoneCountry: formData.phoneCountry || 'MG',
        maxPeople: formData.maxPeople ? Number(formData.maxPeople) : null,
        typeId: formData.typeId,
        userId: [finalUserId],
        equipments: formData.equipmentIds,
        services: formData.serviceIds,
        meals: formData.mealIds,
        securities: formData.securityIds,
        includedServices: formData.includedServiceIds,
        extras: formData.extraIds,
        highlights: formData.highlightIds,
        images: [], // Créer sans images d'abord
        nearbyPlaces: formData.nearbyPlaces.map(place => ({
          name: place.name,
          distance: place.distance ? Number(place.distance) : 0,
          duration: 0, // TODO: Calculer la durée si nécessaire
          transport: place.unit === 'kilomètres' ? 'voiture' : 'à pied',
        })),
        // Données spécifiques aux hôtels
        isHotel: formData.isHotel,
        hotelInfo: formData.isHotel
          ? {
              name: formData.hotelName,
              availableRooms: Number(formData.availableRooms),
            }
          : null,
        // Prix spéciaux
        specialPrices: specialPrices.map(sp => ({
          pricesMga: sp.pricesMga,
          pricesEuro: sp.pricesEuro,
          day: sp.day,
          startDate: sp.startDate,
          endDate: sp.endDate,
          activate: sp.activate,
        })),
        // Données SEO
        seoData: seoData,
      }

      const result = await createProduct(productData)

      if (!result) {
        throw new Error("Erreur lors de la création de l'annonce")
      }

      // Étape 2: Upload les images vers le serveur (WebP conversion + 3 sizes)
      const imageUrls = await uploadImagesToServer(imageUpload.selectedFiles, result.id)
      console.log('📸 Image URLs to save in DB:', imageUrls)

      // Étape 3: Mettre à jour le produit avec les URLs des images
      const updateResponse = await fetch(`/api/products/${result.id}/images`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // IMPORTANT: Include session cookies
        body: JSON.stringify({ imageUrls }),
      })

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json()
        console.error('❌ Erreur lors de la mise à jour des images:', errorData)
        // On continue quand même car le produit existe
      } else {
        const successData = await updateResponse.json()
        console.log('✅ Images successfully linked to product:', successData)
      }

      router.push('/dashboard/host')
    } catch (error) {
      console.error('Error creating product:', error)
      setError(parseCreateProductError(error))
    } finally {
      setIsLoading(false)
    }
  }

  // Afficher le loader pendant la vérification de la session
  if (isAuthLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center'>
        <div className='flex flex-col items-center gap-4'>
          <div className='w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin'></div>
          <p className='text-slate-600 text-lg'>Chargement...</p>
        </div>
      </div>
    )
  }

  // Ne pas afficher le formulaire si l'utilisateur n'est pas connecté (après vérification)
  if (!session) {
    return null // La redirection est gérée par useAuth
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
      <motion.div
        className='max-w-7xl mx-auto p-6 space-y-8'
        variants={containerVariants}
        initial='hidden'
        animate='visible'
      >
        {/* Header with breadcrumb */}
        <motion.div className='flex items-center gap-4' variants={itemVariants}>
          <Button variant='ghost' size='sm' className='text-slate-600 hover:text-slate-800'>
            <ArrowLeft className='h-4 w-4 mr-2' />
            Retour
          </Button>
        </motion.div>

        {/* Page Header */}
        <motion.div className='text-center space-y-4' variants={itemVariants}>
          <div className='inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium'>
            <Home className='h-4 w-4' />
            Créer une annonce
          </div>
          <h1 className='text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700'>
            Créer une nouvelle annonce
          </h1>
          <p className='text-slate-600 max-w-2xl mx-auto text-lg'>
            Remplissez les informations ci-dessous pour créer votre annonce
          </p>
        </motion.div>

        {error && (
          <motion.div variants={itemVariants}>
            <ErrorAlert
              error={error}
              onClose={() => setError(null)}
              onRetry={
                error.retryable
                  ? () => {
                      setError(null)
                      // Optionally trigger the last failed action again
                    }
                  : undefined
              }
            />
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className='space-y-8'>
          {/* Informations principales - Pleine largeur */}
          <BasicInfoSection
            formData={formData as never}
            types={types}
            handleInputChange={handleInputChange}
            setFormData={setFormData as never}
            itemVariants={itemVariants}
          />

          {/* Localisation et Contact - Pleine largeur */}
          <LocationContactSection
            formData={formData as never}
            setFormData={setFormData as never}
            itemVariants={itemVariants}
          />

          {/* Caractéristiques - Pleine largeur */}
          <motion.div variants={itemVariants}>
            <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm'>
              <CardHeader className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <div className='p-2 bg-purple-50 rounded-lg'>
                    <Users className='h-5 w-5 text-purple-600' />
                  </div>
                  <div>
                    <CardTitle className='text-xl'>Caractéristiques</CardTitle>
                    <p className='text-slate-600 text-sm mt-1'>Les détails de votre hébergement</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='grid grid-cols-2 gap-6'>
                  <div className='space-y-2'>
                    <label htmlFor='room' className='text-sm font-medium text-slate-700'>
                      Chambres
                    </label>
                    <Input
                      id='room'
                      name='room'
                      type='number'
                      min='1'
                      placeholder='1'
                      value={formData.room}
                      onChange={handleInputChange}
                      className='border-slate-200 focus:border-purple-300 focus:ring-purple-200'
                    />
                  </div>

                  <div className='space-y-2'>
                    <label htmlFor='bathroom' className='text-sm font-medium text-slate-700'>
                      Salles de bain
                    </label>
                    <Input
                      id='bathroom'
                      name='bathroom'
                      type='number'
                      min='1'
                      placeholder='1'
                      value={formData.bathroom}
                      onChange={handleInputChange}
                      className='border-slate-200 focus:border-purple-300 focus:ring-purple-200'
                    />
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-6'>
                  <div className='space-y-2'>
                    <label htmlFor='arriving' className='text-sm font-medium text-slate-700'>
                      Arrivée
                    </label>
                    <Input
                      id='arriving'
                      name='arriving'
                      type='number'
                      min='0'
                      max='23'
                      placeholder='14'
                      value={formData.arriving}
                      onChange={handleInputChange}
                      className='border-slate-200 focus:border-purple-300 focus:ring-purple-200'
                    />
                  </div>

                  <div className='space-y-2'>
                    <label htmlFor='leaving' className='text-sm font-medium text-slate-700'>
                      Départ
                    </label>
                    <Input
                      id='leaving'
                      name='leaving'
                      type='number'
                      min='0'
                      max='23'
                      placeholder='12'
                      value={formData.leaving}
                      onChange={handleInputChange}
                      className='border-slate-200 focus:border-purple-300 focus:ring-purple-200'
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Configuration Hôtel - Affiché uniquement si c'est un hôtel */}
          {formData.isHotel && (
            <motion.div variants={itemVariants}>
              <Card className='border-0 shadow-lg bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50'>
                <CardHeader className='space-y-2'>
                  <div className='flex items-center gap-2'>
                    <div className='p-2 bg-amber-100 rounded-lg'>
                      <Users className='h-5 w-5 text-amber-700' />
                    </div>
                    <div>
                      <CardTitle className='text-xl text-amber-900'>Configuration Hôtel</CardTitle>
                      <p className='text-amber-700 text-sm mt-1'>
                        Configuration spécifique pour la gestion hôtelière
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className='space-y-2'>
                      <label htmlFor='hotelName' className='text-sm font-medium text-amber-800'>
                        Nom de l&apos;hôtel
                      </label>
                      <Input
                        id='hotelName'
                        name='hotelName'
                        type='text'
                        placeholder='Ex: Hôtel des Jardins'
                        value={formData.hotelName}
                        onChange={handleInputChange}
                        className='border-amber-200 focus:border-amber-400 focus:ring-amber-200 bg-white/80'
                      />
                      <p className='text-xs text-amber-600'>
                        Nom officiel de l&apos;établissement hôtelier
                      </p>
                    </div>

                    <div className='space-y-2'>
                      <label
                        htmlFor='availableRooms'
                        className='text-sm font-medium text-amber-800'
                      >
                        Nombre de chambres disponibles
                      </label>
                      <Input
                        id='availableRooms'
                        name='availableRooms'
                        type='number'
                        min='1'
                        placeholder='Ex: 5'
                        value={formData.availableRooms}
                        onChange={handleInputChange}
                        className='border-amber-200 focus:border-amber-400 focus:ring-amber-200 bg-white/80'
                      />
                      <p className='text-xs text-amber-600'>
                        Nombre de chambres de ce type disponibles
                      </p>
                    </div>
                  </div>

                  <div className='bg-amber-100 border border-amber-200 rounded-lg p-4'>
                    <div className='flex items-start gap-3'>
                      <div className='p-1.5 bg-amber-200 rounded-full'>
                        <Home className='h-4 w-4 text-amber-700' />
                      </div>
                      <div className='flex-1'>
                        <h4 className='text-sm font-semibold text-amber-800 mb-1'>
                          Fonctionnement Hôtelier
                        </h4>
                        <p className='text-xs text-amber-700 leading-relaxed'>
                          Cette chambre représente un type de chambre dans votre hôtel. Si vous avez{' '}
                          <span className='font-semibold'>{formData.availableRooms || 'X'}</span>{' '}
                          chambres de ce type, plusieurs clients pourront réserver en même temps sur
                          les mêmes dates, tant que le nombre de chambres disponibles le permet.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Tarification - Pleine largeur */}
          <motion.div variants={itemVariants}>
            <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm'>
              <CardHeader className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <div className='p-2 bg-orange-50 rounded-lg'>
                    <Euro className='h-5 w-5 text-orange-600' />
                  </div>
                  <div>
                    <CardTitle className='text-xl'>Tarification</CardTitle>
                    <p className='text-slate-600 text-sm mt-1'>Définissez vos prix et conditions</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='space-y-2'>
                    <label htmlFor='basePrice' className='text-sm font-medium text-slate-700'>
                      Prix de base (€)
                    </label>
                    <Input
                      id='basePrice'
                      name='basePrice'
                      type='number'
                      min='0'
                      step='0.01'
                      placeholder='100.00'
                      value={formData.basePrice}
                      onChange={handleInputChange}
                      required
                      className='border-slate-200 focus:border-orange-300 focus:ring-orange-200'
                    />
                  </div>

                  <div className='space-y-2'>
                    <label htmlFor='priceMGA' className='text-sm font-medium text-slate-700'>
                      Prix en MGA
                    </label>
                    <Input
                      id='priceMGA'
                      name='priceMGA'
                      type='number'
                      min='0'
                      placeholder='400000'
                      value={formData.priceMGA}
                      onChange={handleInputChange}
                      required
                      className='border-slate-200 focus:border-orange-300 focus:ring-orange-200'
                    />
                  </div>
                </div>

                <div className='flex items-center space-x-2'>
                  <input
                    id='autoAccept'
                    name='autoAccept'
                    type='checkbox'
                    checked={formData.autoAccept}
                    onChange={handleInputChange}
                    className='w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500'
                  />
                  <label htmlFor='autoAccept' className='text-sm font-medium text-slate-700'>
                    Acceptation automatique des réservations
                  </label>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Équipements - Pleine largeur */}
          <ServiceSelectionSection
            title='Équipements disponibles'
            description='Sélectionnez les équipements disponibles dans votre hébergement'
            icon={Zap}
            iconColor='text-emerald-600'
            bgColor='bg-emerald-50'
            borderColor='border-emerald-500'
            services={equipments}
            selectedServiceIds={formData.equipmentIds}
            onServiceToggle={id => handleCheckboxChange('equipmentIds', id)}
            itemVariants={itemVariants}
          />

          {/* Repas - Pleine largeur */}
          <ServiceSelectionSection
            title='Services de restauration'
            description='Sélectionnez les services de repas proposés'
            icon={UtensilsCrossed}
            iconColor='text-orange-600'
            bgColor='bg-orange-50'
            borderColor='border-orange-500'
            services={meals}
            selectedServiceIds={formData.mealIds}
            onServiceToggle={id => handleCheckboxChange('mealIds', id)}
            itemVariants={itemVariants}
          />

          {/* Sécurité - Pleine largeur */}
          <ServiceSelectionSection
            title='Équipements de sécurité'
            description='Sélectionnez les équipements de sécurité disponibles'
            icon={Shield}
            iconColor='text-red-600'
            bgColor='bg-red-50'
            borderColor='border-red-500'
            services={securities}
            selectedServiceIds={formData.securityIds}
            onServiceToggle={id => handleCheckboxChange('securityIds', id)}
            itemVariants={itemVariants}
          />

          {/* Services additionnels - Pleine largeur */}
          <ServiceSelectionSection
            title='Services additionnels'
            description='Sélectionnez les services additionnels proposés'
            icon={Star}
            iconColor='text-blue-600'
            bgColor='bg-blue-50'
            borderColor='border-blue-500'
            services={services}
            selectedServiceIds={formData.serviceIds}
            onServiceToggle={id => handleCheckboxChange('serviceIds', id)}
            itemVariants={itemVariants}
          />

          {/* Services inclus, Extras et Points forts */}
          <motion.div variants={itemVariants}>
            <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm'>
              <CardHeader className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <div className='p-2 bg-indigo-50 rounded-lg'>
                    <Star className='h-5 w-5 text-indigo-600' />
                  </div>
                  <div>
                    <CardTitle className='text-xl'>Services et Options</CardTitle>
                    <p className='text-slate-600 text-sm mt-1'>
                      Sélectionnez les services inclus, extras payants et points forts de votre
                      hébergement
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='space-y-6'>
                {/* Affichage en colonne pour les nouvelles options */}
                <div className='flex flex-col gap-6'>
                  {/* Services inclus */}
                  <div className='border-2 border-slate-200 rounded-xl p-4 bg-white/50 backdrop-blur-sm flex flex-col h-full'>
                    <div className='flex items-center justify-between mb-4'>
                      <h4 className='font-medium text-slate-700 flex items-center gap-2'>
                        <Package className='h-4 w-4' />
                        Services inclus
                      </h4>
                      <Button
                        type='button'
                        size='sm'
                        variant='outline'
                        onClick={() => setServiceModalOpen(true)}
                        className='text-xs'
                      >
                        <Plus className='h-3 w-3 mr-1' />
                        Ajouter
                      </Button>
                    </div>
                    <div className='flex-1 space-y-2 content-start'>
                      {includedServices.map(service => (
                        <label
                          key={service.id}
                          className={`relative flex items-center p-2 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm ${
                            formData.includedServiceIds.includes(service.id)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 bg-white hover:border-blue-300'
                          }`}
                        >
                          <input
                            type='checkbox'
                            checked={formData.includedServiceIds.includes(service.id)}
                            onChange={() => handleCheckboxChange('includedServiceIds', service.id)}
                            className='sr-only'
                          />
                          <div className='flex items-center space-x-2 w-full'>
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                formData.includedServiceIds.includes(service.id)
                                  ? 'border-blue-500 bg-blue-500'
                                  : 'border-slate-300'
                              }`}
                            >
                              {formData.includedServiceIds.includes(service.id) && (
                                <svg
                                  className='w-2 h-2 text-white'
                                  fill='currentColor'
                                  viewBox='0 0 20 20'
                                >
                                  <path
                                    fillRule='evenodd'
                                    d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                                    clipRule='evenodd'
                                  />
                                </svg>
                              )}
                            </div>
                            <div className='flex-1 min-w-0'>
                              <div className='flex items-center gap-1 mb-1'>
                                <span className='text-xs font-medium text-slate-700 block truncate'>
                                  {service.name}
                                </span>
                                {service.userId && (
                                  <span className='text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium'>
                                    Personnel
                                  </span>
                                )}
                              </div>
                              {service.description && (
                                <span className='text-xs text-slate-500 block truncate'>
                                  {service.description}
                                </span>
                              )}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Extras payants */}
                  <div className='border-2 border-slate-200 rounded-xl p-4 bg-white/50 backdrop-blur-sm flex flex-col h-full'>
                    <div className='flex items-center justify-between mb-4'>
                      <h4 className='font-medium text-slate-700 flex items-center gap-2'>
                        <Plus className='h-4 w-4' />
                        Options payantes
                      </h4>
                      <Button
                        type='button'
                        size='sm'
                        variant='outline'
                        onClick={() => setExtraModalOpen(true)}
                        className='text-xs'
                      >
                        <Plus className='h-3 w-3 mr-1' />
                        Ajouter
                      </Button>
                    </div>
                    <div className='flex-1 space-y-2 content-start'>
                      {extras.map(extra => (
                        <label
                          key={extra.id}
                          className={`relative flex items-center p-2 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm ${
                            formData.extraIds.includes(extra.id)
                              ? 'border-green-500 bg-green-50'
                              : 'border-slate-200 bg-white hover:border-green-300'
                          }`}
                        >
                          <input
                            type='checkbox'
                            checked={formData.extraIds.includes(extra.id)}
                            onChange={() => handleCheckboxChange('extraIds', extra.id)}
                            className='sr-only'
                          />
                          <div className='flex items-center space-x-2 w-full'>
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                formData.extraIds.includes(extra.id)
                                  ? 'border-green-500 bg-green-500'
                                  : 'border-slate-300'
                              }`}
                            >
                              {formData.extraIds.includes(extra.id) && (
                                <svg
                                  className='w-2 h-2 text-white'
                                  fill='currentColor'
                                  viewBox='0 0 20 20'
                                >
                                  <path
                                    fillRule='evenodd'
                                    d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                                    clipRule='evenodd'
                                  />
                                </svg>
                              )}
                            </div>
                            <div className='flex-1 min-w-0'>
                              <div className='flex items-center gap-1 mb-1'>
                                <span className='text-xs font-medium text-slate-700 block truncate'>
                                  {extra.name}
                                </span>
                                {extra.userId && (
                                  <span className='text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium'>
                                    Personnel
                                  </span>
                                )}
                              </div>
                              <span className='text-xs text-green-600 block'>
                                {extra.priceEUR}€ / {extra.priceMGA.toLocaleString()}Ar
                              </span>
                              {extra.description && (
                                <span className='text-xs text-slate-500 block truncate'>
                                  {extra.description}
                                </span>
                              )}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Points forts */}
                  <div className='border-2 border-slate-200 rounded-xl p-4 bg-white/50 backdrop-blur-sm flex flex-col h-full'>
                    <div className='flex items-center justify-between mb-4'>
                      <h4 className='font-medium text-slate-700 flex items-center gap-2'>
                        <Highlighter className='h-4 w-4' />
                        Points forts
                      </h4>
                      <Button
                        type='button'
                        size='sm'
                        variant='outline'
                        onClick={() => setHighlightModalOpen(true)}
                        className='text-xs'
                      >
                        <Plus className='h-3 w-3 mr-1' />
                        Ajouter
                      </Button>
                    </div>
                    <div className='flex-1 space-y-2 content-start'>
                      {highlights.map(highlight => (
                        <label
                          key={highlight.id}
                          className={`relative flex items-center p-2 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm ${
                            formData.highlightIds.includes(highlight.id)
                              ? 'border-yellow-500 bg-yellow-50'
                              : 'border-slate-200 bg-white hover:border-yellow-300'
                          }`}
                        >
                          <input
                            type='checkbox'
                            checked={formData.highlightIds.includes(highlight.id)}
                            onChange={() => handleCheckboxChange('highlightIds', highlight.id)}
                            className='sr-only'
                          />
                          <div className='flex items-center space-x-2 w-full'>
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                formData.highlightIds.includes(highlight.id)
                                  ? 'border-yellow-500 bg-yellow-500'
                                  : 'border-slate-300'
                              }`}
                            >
                              {formData.highlightIds.includes(highlight.id) && (
                                <svg
                                  className='w-2 h-2 text-white'
                                  fill='currentColor'
                                  viewBox='0 0 20 20'
                                >
                                  <path
                                    fillRule='evenodd'
                                    d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                                    clipRule='evenodd'
                                  />
                                </svg>
                              )}
                            </div>
                            <div className='flex-1 min-w-0'>
                              <div className='flex items-center gap-1 mb-1'>
                                <span className='text-xs font-medium text-slate-700 block truncate'>
                                  {highlight.name}
                                </span>
                                {highlight.userId && (
                                  <span className='text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-medium'>
                                    Personnel
                                  </span>
                                )}
                              </div>
                              {highlight.description && (
                                <span className='text-xs text-slate-500 block truncate'>
                                  {highlight.description}
                                </span>
                              )}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Prix spéciaux */}
                  <div className='border-2 border-slate-200 rounded-xl p-4 bg-white/50 backdrop-blur-sm flex flex-col h-full'>
                    <div className='flex items-center justify-between mb-4'>
                      <h4 className='font-medium text-slate-700 flex items-center gap-2'>
                        <Euro className='h-4 w-4' />
                        Prix spéciaux
                      </h4>
                      <Button
                        type='button'
                        size='sm'
                        variant='outline'
                        onClick={() => setSpecialPriceModalOpen(true)}
                        className='text-xs'
                      >
                        <Plus className='h-3 w-3 mr-1' />
                        Ajouter
                      </Button>
                    </div>
                    <div className='flex-1 space-y-2 content-start'>
                      {specialPrices.map(specialPrice => (
                        <div
                          key={specialPrice.id}
                          className='relative flex items-center p-2 border rounded-lg bg-orange-50 border-orange-200'
                        >
                          <div className='flex items-center space-x-2 w-full'>
                            <div className='w-4 h-4 rounded-full border-2 border-orange-500 bg-orange-500 flex items-center justify-center flex-shrink-0'>
                              <Euro className='w-2 h-2 text-white' />
                            </div>
                            <div className='flex-1 min-w-0'>
                              <div className='flex items-center gap-1 mb-1'>
                                <span className='text-xs font-medium text-slate-700 block truncate'>
                                  {specialPrice.pricesEuro}€ / {specialPrice.pricesMga}Ar
                                </span>
                                <span
                                  className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                    specialPrice.activate
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {specialPrice.activate ? 'Actif' : 'Inactif'}
                                </span>
                              </div>
                              <div className='text-xs text-slate-500'>
                                {specialPrice.day.length > 0 && (
                                  <span className='block'>
                                    {specialPrice.day
                                      .map(day => {
                                        const dayNames: Record<DayEnum, string> = {
                                          Monday: 'Lun',
                                          Tuesday: 'Mar',
                                          Wednesday: 'Mer',
                                          Thursday: 'Jeu',
                                          Friday: 'Ven',
                                          Saturday: 'Sam',
                                          Sunday: 'Dim',
                                        }
                                        return dayNames[day]
                                      })
                                      .join(', ')}
                                  </span>
                                )}
                                {specialPrice.startDate && specialPrice.endDate && (
                                  <span className='block'>
                                    {new Date(specialPrice.startDate).toLocaleDateString('fr-FR')} -{' '}
                                    {new Date(specialPrice.endDate).toLocaleDateString('fr-FR')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {specialPrices.length === 0 && (
                        <div className='text-center py-4 text-slate-500 text-sm'>
                          Aucun prix spécial défini
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Aperçu des coûts */}
                {selectedExtras.length > 0 && formData.basePrice && (
                  <div className='mt-6'>
                    <h3 className='text-lg font-semibold mb-4 text-slate-700'>Aperçu des coûts</h3>
                    <BookingCostSummary
                      basePrice={parseFloat(formData.basePrice) || 0}
                      numberOfDays={numberOfDays}
                      guestCount={testBooking.guestCount}
                      selectedExtras={selectedExtras}
                      currency='EUR'
                      startDate={testBooking.startDate}
                      endDate={testBooking.endDate}
                      className='max-w-md'
                      showCommissions={false}
                    />
                    <p className='text-xs text-slate-500 mt-2'>
                      * Exemple calculé sur {numberOfDays} jour{numberOfDays > 1 ? 's' : ''} pour{' '}
                      {testBooking.guestCount} personne{testBooking.guestCount > 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Photos */}
          <motion.div variants={itemVariants}>
            <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm'>
              <CardHeader className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <div className='p-2 bg-pink-50 rounded-lg'>
                    <Camera className='h-5 w-5 text-pink-600' />
                  </div>
                  <div>
                    <CardTitle className='text-xl'>Photos de l&apos;hébergement</CardTitle>
                    <p className='text-slate-600 text-sm mt-1'>
                      Ajoutez des photos attrayantes de votre hébergement (maximum 35)
                      {imageUpload.selectedFiles.length > 0 && (
                        <span className='ml-2 font-medium text-blue-600'>
                          {imageUpload.selectedFiles.length} photo
                          {imageUpload.selectedFiles.length > 1 ? 's' : ''} sélectionnée
                          {imageUpload.selectedFiles.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    imageUpload.dragActive
                      ? 'border-pink-400 bg-pink-50'
                      : 'border-slate-300 hover:border-pink-300 hover:bg-pink-25'
                  }`}
                  onDragEnter={e => imageUpload.handleDrag(e, true)}
                  onDragLeave={e => imageUpload.handleDrag(e, false)}
                  onDragOver={e => imageUpload.handleDrag(e, true)}
                  onDrop={imageUpload.handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type='file'
                    multiple
                    accept='image/*'
                    onChange={handleFiles}
                    className='hidden'
                  />
                  <div className='space-y-4'>
                    <div className='mx-auto w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center'>
                      <Upload className='h-6 w-6 text-pink-600' />
                    </div>
                    <div>
                      <p className='text-sm font-medium text-slate-700'>
                        Glissez vos photos ici ou{' '}
                        <button
                          type='button'
                          onClick={() => fileInputRef.current?.click()}
                          className='text-pink-600 hover:text-pink-700 underline'
                        >
                          parcourez
                        </button>
                      </p>
                      <p className='text-xs text-slate-500 mt-1'>
                        PNG, JPG, JPEG, WEBP jusqu&apos;à 50MB chacune (compressées automatiquement)
                        {imageUpload.selectedFiles.length > 0 && (
                          <span className='block mt-1 text-green-600 font-medium'>
                            ✓ {imageUpload.selectedFiles.length}/35 photos sélectionnées
                          </span>
                        )}
                        {imageUpload.isUploadingImages && (
                          <span className='block mt-1 text-blue-600 font-medium animate-pulse'>
                            🔄 Compression en cours...
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <SortableImageGrid
                  images={imageUpload.selectedFiles}
                  onReorder={newOrder => imageUpload.setSelectedFiles(newOrder)}
                  onRemove={imageUpload.deleteImage}
                  onPreview={() => setShowGalleryPreview(true)}
                />

                <ImageGalleryPreview
                  images={imageUpload.selectedFiles}
                  isOpen={showGalleryPreview}
                  onClose={() => setShowGalleryPreview(false)}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Informations complémentaires */}
          <motion.div variants={itemVariants}>
            <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm'>
              <CardHeader className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <div className='p-2 bg-cyan-50 rounded-lg'>
                    <FileText className='h-5 w-5 text-cyan-600' />
                  </div>
                  <div>
                    <CardTitle className='text-xl'>Informations complémentaires</CardTitle>
                    <p className='text-slate-600 text-sm mt-1'>
                      Détails supplémentaires sur votre hébergement
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='space-y-2'>
                    <label htmlFor='surface' className='text-sm font-medium text-slate-700'>
                      Surface (m²)
                    </label>
                    <Input
                      id='surface'
                      name='surface'
                      type='number'
                      min='1'
                      placeholder='Ex: 85'
                      value={formData.surface}
                      onChange={handleInputChange}
                      className='border-slate-200 focus:border-cyan-300 focus:ring-cyan-200'
                    />
                  </div>

                  <div className='space-y-2'>
                    <label htmlFor='maxPeople' className='text-sm font-medium text-slate-700'>
                      Nombre max de personnes
                    </label>
                    <Input
                      id='maxPeople'
                      name='maxPeople'
                      type='number'
                      min='1'
                      placeholder='Ex: 6'
                      value={formData.maxPeople}
                      onChange={handleInputChange}
                      className='border-slate-200 focus:border-cyan-300 focus:ring-cyan-200'
                    />
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='flex items-center space-x-2'>
                    <input
                      id='accessibility'
                      name='accessibility'
                      type='checkbox'
                      checked={formData.accessibility}
                      onChange={handleInputChange}
                      className='w-4 h-4 text-cyan-600 bg-gray-100 border-gray-300 rounded focus:ring-cyan-500'
                    />
                    <label htmlFor='accessibility' className='text-sm font-medium text-slate-700'>
                      Accessible aux personnes à mobilité réduite
                    </label>
                  </div>

                  <div className='flex items-center space-x-2'>
                    <input
                      id='petFriendly'
                      name='petFriendly'
                      type='checkbox'
                      checked={formData.petFriendly}
                      onChange={handleInputChange}
                      className='w-4 h-4 text-cyan-600 bg-gray-100 border-gray-300 rounded focus:ring-cyan-500'
                    />
                    <label htmlFor='petFriendly' className='text-sm font-medium text-slate-700'>
                      Animaux acceptés
                    </label>
                  </div>
                </div>

                <div className='space-y-4'>
                  <label className='text-sm font-medium text-slate-700'>Lieux à proximité</label>

                  {/* Form to add new place */}
                  <div className='grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-lg'>
                    <Input
                      placeholder='Nom du lieu'
                      value={newPlace.name}
                      onChange={e => setNewPlace(prev => ({ ...prev, name: e.target.value }))}
                      className='border-slate-200'
                    />
                    <Input
                      placeholder='Distance'
                      value={newPlace.distance}
                      onChange={e => setNewPlace(prev => ({ ...prev, distance: e.target.value }))}
                      className='border-slate-200'
                    />
                    <select
                      value={newPlace.unit}
                      onChange={e =>
                        setNewPlace(prev => ({
                          ...prev,
                          unit: e.target.value as 'mètres' | 'kilomètres',
                        }))
                      }
                      className='px-3 py-2 border border-slate-200 rounded-md focus:border-cyan-300 focus:ring-cyan-200'
                    >
                      <option value='mètres'>mètres</option>
                      <option value='kilomètres'>kilomètres</option>
                    </select>
                    <Button
                      type='button'
                      onClick={addNearbyPlace}
                      className='bg-cyan-600 hover:bg-cyan-700 text-white'
                    >
                      <Plus className='h-4 w-4 mr-2' />
                      Ajouter
                    </Button>
                  </div>

                  {/* List of added places */}
                  {formData.nearbyPlaces.length > 0 && (
                    <div className='space-y-2'>
                      <h5 className='text-sm font-medium text-slate-600'>Lieux ajoutés :</h5>
                      <div className='grid gap-2'>
                        {formData.nearbyPlaces.map((place, index) => (
                          <div
                            key={index}
                            className='flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg'
                          >
                            <span className='text-sm text-slate-700'>
                              <strong>{place.name}</strong>
                              {place.distance && (
                                <span className='text-slate-500 ml-2'>
                                  à {place.distance} {place.unit}
                                </span>
                              )}
                            </span>
                            <Button
                              type='button'
                              variant='ghost'
                              size='sm'
                              onClick={() => removeNearbyPlace(index)}
                              className='text-red-600 hover:text-red-700 hover:bg-red-50'
                            >
                              <X className='h-4 w-4' />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className='space-y-2'>
                  <label htmlFor='transportation' className='text-sm font-medium text-slate-700'>
                    Moyens de transport (séparés par des virgules)
                  </label>
                  <Input
                    id='transportation'
                    name='transportation'
                    type='text'
                    placeholder='Ex: Métro, Bus, Parking gratuit'
                    value={formData.transportation}
                    onChange={handleInputChange}
                    className='border-slate-200 focus:border-cyan-300 focus:ring-cyan-200'
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Section Admin - Assigner à un autre utilisateur */}
          {session?.user?.roles === 'ADMIN' && (
            <motion.div variants={itemVariants}>
              <Card className='border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-3 text-orange-800'>
                    <Users className='h-5 w-5 text-orange-600' />
                    Administration - Assigner l&apos;annonce
                  </CardTitle>
                  <p className='text-sm text-orange-600'>
                    En tant qu&apos;administrateur, vous pouvez créer cette annonce pour un autre
                    utilisateur
                  </p>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-center space-x-2'>
                    <input
                      type='checkbox'
                      id='assignToOtherUser'
                      checked={assignToOtherUser}
                      onChange={e => setAssignToOtherUser(e.target.checked)}
                      className='rounded border-orange-300 focus:ring-orange-200'
                    />
                    <label
                      htmlFor='assignToOtherUser'
                      className='text-sm font-medium text-orange-700'
                    >
                      Assigner cette annonce à un autre utilisateur
                    </label>
                  </div>

                  {assignToOtherUser && (
                    <div className='space-y-2'>
                      <label htmlFor='userCombobox' className='text-sm font-medium text-orange-700'>
                        Sélectionner l&apos;utilisateur
                      </label>
                      <UserCombobox
                        users={users}
                        value={userSelected}
                        onValueChange={setUserSelected}
                        placeholder='Choisir un utilisateur...'
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Section SEO */}
          <motion.div variants={itemVariants}>
            <SEOFieldsCard
              seoData={seoData}
              onSeoChange={setSeoData}
              articleTitle={formData.name}
            />
          </motion.div>

          {/* Bouton de soumission */}
          <motion.div className='flex justify-center pt-8' variants={itemVariants}>
            <Button
              type='submit'
              disabled={isLoading || imageUpload.isUploadingImages}
              className='w-full max-w-md h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-lg shadow-lg hover:shadow-xl transition-all duration-200'
            >
              {imageUpload.isUploadingImages ? (
                <div className='flex items-center gap-2'>
                  <div className='w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin' />
                  Préparation des images...
                </div>
              ) : isLoading ? (
                <div className='flex items-center gap-2'>
                  <div className='w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin' />
                  Création en cours...
                </div>
              ) : (
                <div className='flex items-center gap-2'>
                  <Plus className='h-5 w-5' />
                  Créer l&apos;annonce
                </div>
              )}
            </Button>
          </motion.div>
        </form>

        {/* Modaux pour créer des services personnalisés */}
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
      </motion.div>
    </div>
  )
}
