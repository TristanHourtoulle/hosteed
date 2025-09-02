'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AddressAutocomplete from '@/components/ui/AddressAutocomplete'
import {
  Home,
  MapPin,
  Users,
  Euro,
  Wifi,
  Camera,
  FileText,
  ArrowLeft,
  Plus,
  Upload,
  X,
  Zap,
  UtensilsCrossed,
  Shield,
  Star,
  Package,
  Highlighter,
  Save,
  Edit3,
} from 'lucide-react'
import { resubmitProductWithChange } from '@/lib/services/product.service'
import { findAllTypeRent } from '@/lib/services/typeRent.service'
import { findAllEquipments } from '@/lib/services/equipments.service'
import { findAllMeals } from '@/lib/services/meals.service'
import { findAllServices } from '@/lib/services/services.service'
import { findAllSecurity } from '@/lib/services/security.services'
import { ExtraPriceType, ProductValidation } from '@prisma/client'
import { TypeRentInterface } from '@/lib/interface/typeRentInterface'
import CreateServiceModal from '@/components/ui/CreateServiceModal'
import CreateExtraModal from '@/components/ui/CreateExtraModal'
import CreateHighlightModal from '@/components/ui/CreateHighlightModal'
import BookingCostSummary from '@/components/ui/BookingCostSummary'
import SortableImageGrid from '@/components/ui/SortableImageGrid'
import ImageGalleryPreview from '@/components/ui/ImageGalleryPreview'
import CommissionDisplay from '@/components/ui/CommissionDisplay'
import PhoneInput from '@/components/ui/PhoneInput'
import ErrorAlert, { ErrorDetails } from '@/components/ui/ErrorAlert'
import { compressImages, formatFileSize } from '@/lib/utils/imageCompression'

interface Equipment {
  id: string
  name: string
  icon: string
}

interface Meal {
  id: string
  name: string
}

interface Security {
  id: string
  name: string
}

interface Service {
  id: string
  name: string
}

interface IncludedService {
  id: string
  name: string
  description: string | null
  icon: string | null
  userId: string | null
}

interface ProductExtra {
  id: string
  name: string
  description: string | null
  priceEUR: number
  priceMGA: number
  type: ExtraPriceType
  userId: string | null
  createdAt?: Date
  updatedAt?: Date
}

interface PropertyHighlight {
  id: string
  name: string
  description: string | null
  icon: string | null
  userId: string | null
}

interface NearbyPlace {
  name: string
  distance: string
  unit: 'mètres' | 'kilomètres'
}

interface ImageFile {
  file: File
  preview: string
  id: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
}

interface Product {
  id: string
  name: string
  description: string
  address: string
  basePrice: string
  priceMGA?: string
  availableRooms?: number
  guest: number
  bedroom: number
  bed: number
  bathroom: number
  arriving: number
  leaving: number
  validate: ProductValidation
  img?: { img: string }[]
  user: {
    id: string
    name?: string | null
    lastname?: string | null
    email: string
  }[]
  type?: { id: string; name: string; description: string }
  equipments?: { id: string; name: string; icon: string }[]
  mealsList?: { id: string; name: string }[]
  servicesList?: { id: string; name: string }[]
  securities?: { id: string; name: string }[]
  includedServices?: { id: string; name: string; description: string | null; icon: string | null }[]
  extras?: { id: string; name: string; description: string | null; priceEUR: number; priceMGA: number; type: ExtraPriceType }[]
  highlights?: { id: string; name: string; description: string | null; icon: string | null }[]
}

interface ProductEditFormProps {
  product: Product
  onSave: (updatedProduct: Product) => void
  onCancel: () => void
}

interface FormData {
  name: string
  description: string
  address: string
  placeId?: string
  phone: string
  phoneCountry: string
  room: string
  bathroom: string
  arriving: string
  leaving: string
  basePrice: string
  priceMGA: string
  autoAccept: boolean
  typeId: string
  equipmentIds: string[]
  mealIds: string[]
  securityIds: string[]
  serviceIds: string[]
  includedServiceIds: string[]
  extraIds: string[]
  highlightIds: string[]
  surface: string
  maxPeople: string
  accessibility: boolean
  petFriendly: boolean
  nearbyPlaces: NearbyPlace[]
  transportation: string
  isHotel: boolean
  hotelName: string
  availableRooms: string
}

export function ProductEditForm({ product, onSave, onCancel }: ProductEditFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [error, setError] = useState<ErrorDetails | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<ImageFile[]>([])
  const [showGalleryPreview, setShowGalleryPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [newPlace, setNewPlace] = useState({
    name: '',
    distance: '',
    unit: 'mètres' as 'mètres' | 'kilomètres',
  })

  // États pour les modaux de création personnalisée
  const [serviceModalOpen, setServiceModalOpen] = useState(false)
  const [extraModalOpen, setExtraModalOpen] = useState(false)
  const [highlightModalOpen, setHighlightModalOpen] = useState(false)

  // État pour simuler une réservation de test pour l'aperçu des coûts
  const [testBooking] = useState({
    startDate: new Date(),
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 jours plus tard
    guestCount: 2
  })

  const [formData, setFormData] = useState<FormData>({
    name: product.name,
    description: product.description,
    address: product.address,
    placeId: '',
    phone: '',
    phoneCountry: 'MG',
    room: product.bedroom?.toString() || '',
    bathroom: product.bathroom?.toString() || '',
    arriving: product.arriving?.toString() || '',
    leaving: product.leaving?.toString() || '',
    basePrice: product.basePrice,
    priceMGA: product.priceMGA || '',
    autoAccept: false,
    typeId: product.type?.id || '',
    equipmentIds: product.equipments?.map(e => e.id) || [],
    mealIds: product.mealsList?.map(m => m.id) || [],
    securityIds: product.securities?.map(s => s.id) || [],
    serviceIds: product.servicesList?.map(s => s.id) || [],
    includedServiceIds: product.includedServices?.map(s => s.id) || [],
    extraIds: product.extras?.map(e => e.id) || [],
    highlightIds: product.highlights?.map(h => h.id) || [],
    surface: '',
    maxPeople: '',
    accessibility: false,
    petFriendly: false,
    nearbyPlaces: [],
    transportation: '',
    isHotel: false,
    hotelName: '',
    availableRooms: '',
  })

  // Data from services
  const [types, setTypes] = useState<TypeRentInterface[]>([])
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [meals, setMeals] = useState<Meal[]>([])
  const [securities, setSecurities] = useState<Security[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [includedServices, setIncludedServices] = useState<IncludedService[]>([])
  const [extras, setExtras] = useState<ProductExtra[]>([])
  const [highlights, setHighlights] = useState<PropertyHighlight[]>([])

  // Calcul mémorisé pour les extras sélectionnés avec leurs données complètes
  const selectedExtras = useMemo(() => {
    return extras.filter(extra => formData.extraIds.includes(extra.id))
  }, [extras, formData.extraIds])

  // Calcul mémorisé pour le nombre de jours de la réservation de test
  const numberOfDays = useMemo(() => {
    return Math.ceil((testBooking.endDate.getTime() - testBooking.startDate.getTime()) / (1000 * 60 * 60 * 24))
  }, [testBooking.startDate, testBooking.endDate])

  // Functions to load new data
  const loadIncludedServices = async (): Promise<IncludedService[]> => {
    const response = await fetch('/api/user/included-services')
    if (response.ok) {
      return await response.json()
    }
    return []
  }

  const loadExtras = async (): Promise<ProductExtra[]> => {
    const response = await fetch('/api/user/extras')
    if (response.ok) {
      return await response.json()
    }
    return []
  }

  const loadHighlights = async (): Promise<PropertyHighlight[]> => {
    const response = await fetch('/api/user/highlights')
    if (response.ok) {
      return await response.json()
    }
    return []
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const [typesData, equipmentsData, mealsData, securitiesData, servicesData, includedServicesData, extrasData, highlightsData] =
          await Promise.all([
            findAllTypeRent(),
            findAllEquipments(),
            findAllMeals(),
            findAllSecurity(),
            findAllServices(),
            loadIncludedServices(),
            loadExtras(),
            loadHighlights(),
          ])

        setTypes(typesData || [])
        setEquipments(equipmentsData || [])
        setMeals(mealsData || [])
        setSecurities(securitiesData || [])
        setServices(servicesData || [])
        setIncludedServices(includedServicesData || [])
        setExtras(extrasData || [])
        setHighlights(highlightsData || [])
      } catch (error) {
        console.error('Error loading data:', error)
        setError({
          type: 'network',
          title: 'Erreur de chargement',
          message: 'Impossible de charger les données nécessaires à l\'édition.',
          details: [
            'Échec du chargement des types d\'hébergement, équipements ou services',
            'Vérifiez votre connexion internet'
          ],
          suggestions: [
            'Actualisez la page pour réessayer',
            'Vérifiez votre connexion internet',
            'Si le problème persiste, contactez le support'
          ],
          retryable: true
        })
      }
    }

    loadData()
  }, [])

  // Fonctions pour gérer les nouveaux services/extras/highlights créés
  const handleServiceCreated = (newService: IncludedService) => {
    setIncludedServices(prev => [...prev, newService])
  }

  const handleExtraCreated = (newExtra: ProductExtra) => {
    setExtras(prev => [...prev, newExtra])
  }

  const handleHighlightCreated = (newHighlight: PropertyHighlight) => {
    setHighlights(prev => [...prev, newHighlight])
  }

  // Initialize existing images
  useEffect(() => {
    if (product.img && product.img.length > 0) {
      const existingImages: ImageFile[] = product.img.map((img, index) => ({
        file: new File([], `existing-${index}.jpg`), // Placeholder file
        preview: img.img,
        id: `existing-${index}-${Date.now()}`
      }))
      setSelectedFiles(existingImages)
    }
  }, [product.img])

  // File handling functions
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles({
        target: { files: e.dataTransfer.files },
      } as React.ChangeEvent<HTMLInputElement>)
    }
  }

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)

      // Validation des fichiers
      for (const file of filesArray) {
        if (!file.type.startsWith('image/')) {
          setError({
            type: 'file',
            title: 'Format de fichier non supporté',
            message: 'Seules les images sont acceptées.',
            details: [
              `Fichier rejeté: ${file.name}`,
              `Type détecté: ${file.type || 'inconnu'}`
            ],
            suggestions: [
              'Utilisez uniquement des fichiers image (JPEG, PNG, WebP, GIF)',
              'Vérifiez l\'extension de vos fichiers',
              'Évitez les documents ou vidéos'
            ]
          })
          return
        }
        if (file.size > 50 * 1024 * 1024) {
          setError({
            type: 'file',
            title: 'Image trop volumineuse',
            message: 'La taille de chaque image ne doit pas dépasser 50MB.',
            details: [
              `Fichier: ${file.name}`,
              `Taille: ${(file.size / (1024 * 1024)).toFixed(1)}MB`,
              'Limite: 50MB par image'
            ],
            suggestions: [
              'Réduisez la résolution de votre image',
              'Utilisez un outil de compression d\'image en ligne',
              'Choisissez le format JPEG pour des images de plus petite taille'
            ]
          })
          return
        }
      }

      if (selectedFiles.length + filesArray.length > 35) {
        setError({
          type: 'file',
          title: 'Trop d\'images sélectionnées',
          message: 'Vous pouvez ajouter maximum 35 photos par annonce.',
          details: [
            `Images actuelles: ${selectedFiles.length}`,
            `Images à ajouter: ${filesArray.length}`,
            `Total: ${selectedFiles.length + filesArray.length}`,
            'Limite: 35 photos maximum'
          ],
          suggestions: [
            'Supprimez quelques images existantes avant d\'en ajouter de nouvelles',
            'Sélectionnez vos meilleures photos pour mettre en valeur votre hébergement',
            'Vous pourrez ajouter d\'autres photos après la création de l\'annonce'
          ]
        })
        return
      }

      try {
        setIsUploadingImages(true)
        setError(null) // Clear any previous errors

        // Compress images before adding them
        const compressedFiles = await compressImages(filesArray, {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          quality: 0.8,
        })

        // Create ImageFile objects with previews and unique IDs
        const imageFiles: ImageFile[] = compressedFiles.map((file, index) => ({
          file,
          preview: URL.createObjectURL(file),
          id: `img-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 11)}`
        }))

        setSelectedFiles(prev => [...prev, ...imageFiles])
        setError(null) // Clear any previous errors

        // Log compression results
        compressedFiles.forEach((file, index) => {
          const originalSize = filesArray[index].size
          console.log(
            `Compressed ${file.name}: ${formatFileSize(originalSize)} → ${formatFileSize(file.size)}`
          )
        })
      } catch (error) {
        console.error('Image compression failed:', error)
        setError({
          type: 'file',
          title: 'Erreur de compression',
          message: 'La compression automatique des images a échoué.',
          details: [
            'Certaines images peuvent être corrompues ou dans un format non supporté',
            `Erreur technique: ${error instanceof Error ? error.message : 'inconnue'}`
          ],
          suggestions: [
            'Vérifiez que vos images ne sont pas corrompues',
            'Essayez de compresser vos images manuellement avant de les télécharger',
            'Utilisez des formats d\'image standards (JPEG, PNG)',
            'Réduisez la résolution de vos images si elles sont très grandes'
          ],
          retryable: true
        })
      } finally {
        setIsUploadingImages(false)
      }
    }
  }

  const removeFileById = (id: string) => {
    const imageFile = selectedFiles.find(img => img.id === id)
    if (imageFile?.preview && !imageFile.preview.startsWith('data:')) {
      URL.revokeObjectURL(imageFile.preview)
    }
    setSelectedFiles(prev => prev.filter(img => img.id !== id))
  }

  // Convert files to base64 with compression
  const convertFilesToBase64 = async (imageFiles: ImageFile[]): Promise<string[]> => {
    const files = imageFiles.map(img => img.file)
    setIsUploadingImages(true)
    try {
      // First compress the images
      const compressedFiles = await compressImages(files, {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        quality: 0.8,
      })

      // Then convert to base64
      const promises = compressedFiles.map((file, index) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            console.log(
              `Image ${index + 1} (${file.name}) final size: ${formatFileSize(file.size)}`
            )
            resolve(reader.result as string)
          }
          reader.onerror = () => reject(new Error(`Erreur de lecture de l'image: ${file.name}`))
          reader.readAsDataURL(file)
        })
      })

      const results = await Promise.all(promises)
      return results
    } finally {
      setIsUploadingImages(false)
    }
  }

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target

    // Si on change le type d'hébergement, vérifier si c'est un hôtel
    if (name === 'typeId') {
      const selectedType = types.find(t => t.id === value)
      const isHotelType = Boolean(selectedType?.isHotelType)
      setFormData(prev => ({
        ...prev,
        [name]: value,
        isHotel: isHotelType,
        // Réinitialiser les champs hôtel si ce n'est pas un hôtel
        hotelName: isHotelType ? prev.hotelName : '',
        availableRooms: isHotelType ? prev.availableRooms : '',
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      }))
    }
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validation basique
    if (!formData.name.trim()) {
      setError({
        type: 'validation',
        title: 'Nom requis',
        message: "Le nom de l'hébergement est requis",
        details: ['Veuillez saisir un nom pour votre hébergement'],
        suggestions: ['Entrez un nom descriptif pour votre hébergement'],
        retryable: false
      })
      setIsLoading(false)
      return
    }

    if (!formData.description.trim()) {
      setError({
        type: 'validation',
        title: 'Description requise',
        message: 'La description est requise',
        details: ['Veuillez saisir une description pour votre hébergement'],
        suggestions: ['Décrivez votre hébergement en détail'],
        retryable: false
      })
      setIsLoading(false)
      return
    }

    if (!formData.typeId) {
      setError({
        type: 'validation',
        title: 'Type requis',
        message: "Veuillez sélectionner un type d'hébergement",
        details: ['Le type d\'hébergement est obligatoire'],
        suggestions: ['Sélectionnez le type qui correspond le mieux à votre hébergement'],
        retryable: false
      })
      setIsLoading(false)
      return
    }

    try {
      // Convertir les nouvelles images en base64
      let finalImages: string[] = []
      
      if (selectedFiles.length > 0) {
        // Séparer les images existantes des nouvelles
        const existingImages = selectedFiles.filter(img => img.id.startsWith('existing-'))
        const newImages = selectedFiles.filter(img => !img.id.startsWith('existing-'))
        
        // Garder les images existantes (déjà en base64)
        const existingImageUrls = existingImages.map(img => img.preview)
        
        // Convertir les nouvelles images en base64
        let newImageBase64: string[] = []
        if (newImages.length > 0) {
          setIsUploadingImages(true)
          newImageBase64 = await convertFilesToBase64(newImages)
          setIsUploadingImages(false)
        }
        
        // Combiner toutes les images
        finalImages = [...existingImageUrls, ...newImageBase64]
      }

      const updatedProduct = await resubmitProductWithChange(
        product.id,
        {
          name: formData.name,
          description: formData.description,
          address: formData.address,
          longitude: 0, // TODO: Récupérer les coordonnées réelles
          latitude: 0, // TODO: Récupérer les coordonnées réelles
          basePrice: formData.basePrice,
          room: formData.room ? parseInt(formData.room) : null,
          bathroom: formData.bathroom ? parseInt(formData.bathroom) : null,
          arriving: parseInt(formData.arriving),
          leaving: parseInt(formData.leaving),
          typeId: formData.typeId,
          securities: formData.securityIds,
          equipments: formData.equipmentIds,
          services: formData.serviceIds,
          meals: formData.mealIds,
          images: finalImages,
        },
        product.user[0]?.id // Utiliser l'ID du premier utilisateur comme hostId
      )

      if (updatedProduct) {
        onSave(updatedProduct as unknown as Product)
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du produit:', error)
      setError({
        type: 'general',
        title: 'Erreur de sauvegarde',
        message: 'Une erreur est survenue lors de la sauvegarde',
        details: ['Impossible de sauvegarder les modifications'],
        suggestions: ['Vérifiez votre connexion internet', 'Réessayez dans quelques instants'],
        retryable: true
      })
    } finally {
      setIsLoading(false)
    }
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
          <Button variant='ghost' size='sm' className='text-slate-600 hover:text-slate-800' onClick={onCancel}>
            <ArrowLeft className='h-4 w-4 mr-2' />
            Retour
          </Button>
        </motion.div>

        {/* Page Header */}
        <motion.div className='text-center space-y-4' variants={itemVariants}>
          <div className='inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium'>
            <Edit3 className='h-4 w-4' />
            Modifier l'annonce
          </div>
          <h1 className='text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700'>
            Modifier l'annonce
          </h1>
          <p className='text-slate-600 max-w-2xl mx-auto text-lg'>
            Modifiez les informations de votre hébergement
          </p>
        </motion.div>

        {error && (
          <motion.div variants={itemVariants}>
            <ErrorAlert 
              error={error}
              onClose={() => setError(null)}
              onRetry={error.retryable ? () => {
                setError(null)
                // Optionally trigger the last failed action again
              } : undefined}
            />
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className='space-y-8'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch'>
            {/* Colonne de gauche */}
            <div className='space-y-6 h-full'>
              {/* Informations principales */}
              <motion.div variants={itemVariants}>
                <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm'>
                  <CardHeader className='space-y-2'>
                    <div className='flex items-center gap-2'>
                      <div className='p-2 bg-blue-50 rounded-lg'>
                        <Home className='h-5 w-5 text-blue-600' />
                      </div>
                      <div>
                        <CardTitle className='text-xl'>Informations principales</CardTitle>
                        <p className='text-slate-600 text-sm mt-1'>
                          Les informations essentielles de votre hébergement
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className='space-y-6'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      <div className='space-y-2'>
                        <label htmlFor='name' className='text-sm font-medium text-slate-700'>
                          Nom de l&apos;hébergement
                        </label>
                        <Input
                          id='name'
                          name='name'
                          type='text'
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder='Ex: Villa avec vue sur mer'
                          className='border-slate-200 focus:border-blue-300 focus:ring-blue-200'
                        />
                      </div>

                      <div className='space-y-2'>
                        <label htmlFor='typeId' className='text-sm font-medium text-slate-700'>
                          Type d&apos;hébergement
                        </label>
                        <select
                          id='typeId'
                          name='typeId'
                          value={formData.typeId}
                          onChange={handleInputChange}
                          required
                          className='w-full px-3 py-2 border border-slate-200 rounded-md focus:border-blue-300 focus:ring-blue-200 focus:ring-2 focus:ring-opacity-50'
                        >
                          <option value=''>Sélectionnez un type</option>
                          {types.map(type => (
                            <option key={type.id} value={type.id}>
                              {type.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className='space-y-2'>
                      <label htmlFor='description' className='text-sm font-medium text-slate-700'>
                        Description détaillée
                      </label>
                      <textarea
                        id='description'
                        name='description'
                        rows={4}
                        placeholder='Décrivez votre hébergement en détail...'
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                        className='w-full px-3 py-2 border border-slate-200 rounded-md focus:border-blue-300 focus:ring-blue-200 focus:ring-2 focus:ring-opacity-50'
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Colonne de droite */}
            <div className='space-y-6 h-full'>
              {/* Caractéristiques */}
              <motion.div variants={itemVariants}>
                <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm'>
                  <CardHeader className='space-y-2'>
                    <div className='flex items-center gap-2'>
                      <div className='p-2 bg-purple-50 rounded-lg'>
                        <Users className='h-5 w-5 text-purple-600' />
                      </div>
                      <div>
                        <CardTitle className='text-xl'>Caractéristiques</CardTitle>
                        <p className='text-slate-600 text-sm mt-1'>
                          Les détails de votre hébergement
                        </p>
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

              {/* Tarification */}
              <motion.div variants={itemVariants}>
                <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm'>
                  <CardHeader className='space-y-2'>
                    <div className='flex items-center gap-2'>
                      <div className='p-2 bg-orange-50 rounded-lg'>
                        <Euro className='h-5 w-5 text-orange-600' />
                      </div>
                      <div>
                        <CardTitle className='text-xl'>Tarification</CardTitle>
                        <p className='text-slate-600 text-sm mt-1'>
                          Définissez vos prix et conditions
                        </p>
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

                    {/* Calcul des commissions */}
                    {formData.basePrice && (
                      <CommissionDisplay 
                        basePrice={parseFloat(formData.basePrice) || 0}
                        className="border-orange-200 bg-orange-50/30"
                      />
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>

          {/* Équipements et Services */}
          <motion.div variants={itemVariants}>
            <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm'>
              <CardHeader className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <div className='p-2 bg-emerald-50 rounded-lg'>
                    <Wifi className='h-5 w-5 text-emerald-600' />
                  </div>
                  <div>
                    <CardTitle className='text-xl'>Équipements et Services</CardTitle>
                    <p className='text-slate-600 text-sm mt-1'>
                      Sélectionnez les équipements disponibles dans votre hébergement
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='space-y-6'>
                {/* Grille 2x2 avec hauteur uniforme */}
                <div className='grid grid-cols-1 lg:grid-cols-2 grid-rows-2 gap-6 auto-rows-fr'>
                  {/* Équipements - Position 1 */}
                  <div className='border-2 border-slate-200 rounded-xl p-4 bg-white/50 backdrop-blur-sm flex flex-col h-full'>
                    <h4 className='font-medium text-slate-700 flex items-center gap-2 mb-4'>
                      <Zap className='h-4 w-4' />
                      Équipements disponibles
                    </h4>
                    <div className='flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 content-start'>
                      {equipments.map(equipment => (
                        <label
                          key={equipment.id}
                          className={`relative flex items-center p-2 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm ${
                            formData.equipmentIds.includes(equipment.id)
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-slate-200 bg-white hover:border-emerald-300'
                          }`}
                        >
                          <input
                            type='checkbox'
                            checked={formData.equipmentIds.includes(equipment.id)}
                            onChange={() => handleCheckboxChange('equipmentIds', equipment.id)}
                            className='sr-only'
                          />
                          <div className='flex items-center space-x-2 w-full'>
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                formData.equipmentIds.includes(equipment.id)
                                  ? 'border-emerald-500 bg-emerald-500'
                                  : 'border-slate-300'
                              }`}
                            >
                              {formData.equipmentIds.includes(equipment.id) && (
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
                            <span className='text-xs font-medium text-slate-700 truncate'>
                              {equipment.name}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Repas - Position 2 */}
                  <div className='border-2 border-slate-200 rounded-xl p-4 bg-white/50 backdrop-blur-sm flex flex-col h-full'>
                    <h4 className='font-medium text-slate-700 flex items-center gap-2 mb-4'>
                      <UtensilsCrossed className='h-4 w-4' />
                      Services de restauration
                    </h4>
                    <div className='flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 content-start'>
                      {meals.map(meal => (
                        <label
                          key={meal.id}
                          className={`relative flex items-center p-2 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm ${
                            formData.mealIds.includes(meal.id)
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-slate-200 bg-white hover:border-orange-300'
                          }`}
                        >
                          <input
                            type='checkbox'
                            checked={formData.mealIds.includes(meal.id)}
                            onChange={() => handleCheckboxChange('mealIds', meal.id)}
                            className='sr-only'
                          />
                          <div className='flex items-center space-x-2 w-full'>
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                formData.mealIds.includes(meal.id)
                                  ? 'border-orange-500 bg-orange-500'
                                  : 'border-slate-300'
                              }`}
                            >
                              {formData.mealIds.includes(meal.id) && (
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
                            <span className='text-xs font-medium text-slate-700 truncate'>
                              {meal.name}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Sécurité - Position 3 */}
                  <div className='border-2 border-slate-200 rounded-xl p-4 bg-white/50 backdrop-blur-sm flex flex-col h-full'>
                    <h4 className='font-medium text-slate-700 flex items-center gap-2 mb-4'>
                      <Shield className='h-4 w-4' />
                      Équipements de sécurité
                    </h4>
                    <div className='flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 content-start'>
                      {securities.map(security => (
                        <label
                          key={security.id}
                          className={`relative flex items-center p-2 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm ${
                            formData.securityIds.includes(security.id)
                              ? 'border-red-500 bg-red-50'
                              : 'border-slate-200 bg-white hover:border-red-300'
                          }`}
                        >
                          <input
                            type='checkbox'
                            checked={formData.securityIds.includes(security.id)}
                            onChange={() => handleCheckboxChange('securityIds', security.id)}
                            className='sr-only'
                          />
                          <div className='flex items-center space-x-2 w-full'>
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                formData.securityIds.includes(security.id)
                                  ? 'border-red-500 bg-red-500'
                                  : 'border-slate-300'
                              }`}
                            >
                              {formData.securityIds.includes(security.id) && (
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
                            <span className='text-xs font-medium text-slate-700 truncate'>
                              {security.name}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Services - Position 4 */}
                  <div className='border-2 border-slate-200 rounded-xl p-4 bg-white/50 backdrop-blur-sm flex flex-col h-full'>
                    <h4 className='font-medium text-slate-700 flex items-center gap-2 mb-4'>
                      <Star className='h-4 w-4' />
                      Services additionnels
                    </h4>
                    <div className='flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 content-start'>
                      {services.map(service => (
                        <label
                          key={service.id}
                          className={`relative flex items-center p-2 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm ${
                            formData.serviceIds.includes(service.id)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 bg-white hover:border-blue-300'
                          }`}
                        >
                          <input
                            type='checkbox'
                            checked={formData.serviceIds.includes(service.id)}
                            onChange={() => handleCheckboxChange('serviceIds', service.id)}
                            className='sr-only'
                          />
                          <div className='flex items-center space-x-2 w-full'>
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                formData.serviceIds.includes(service.id)
                                  ? 'border-blue-500 bg-blue-500'
                                  : 'border-slate-300'
                              }`}
                            >
                              {formData.serviceIds.includes(service.id) && (
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
                            <span className='text-xs font-medium text-slate-700 truncate'>
                              {service.name}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

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
                      Sélectionnez les services inclus, extras payants et points forts de votre hébergement
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='space-y-6'>
                {/* Grille 1x3 pour les nouvelles options */}
                <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
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
                </div>

                {/* Aperçu des coûts */}
                {(selectedExtras.length > 0 && formData.basePrice) && (
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
                      showCommissions={true}
                    />
                    <p className='text-xs text-slate-500 mt-2'>
                      * Exemple calculé sur {numberOfDays} jour{numberOfDays > 1 ? 's' : ''} pour {testBooking.guestCount} personne{testBooking.guestCount > 1 ? 's' : ''}
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
                      Modifiez les photos de votre hébergement (maximum 35)
                      {selectedFiles.length > 0 && (
                        <span className='ml-2 font-medium text-blue-600'>
                          {selectedFiles.length} photo{selectedFiles.length > 1 ? 's' : ''}{' '}
                          sélectionnée{selectedFiles.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? 'border-pink-400 bg-pink-50'
                      : 'border-slate-300 hover:border-pink-300 hover:bg-pink-25'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
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
                        {selectedFiles.length > 0 && (
                          <span className='block mt-1 text-green-600 font-medium'>
                            ✓ {selectedFiles.length}/35 photos sélectionnées
                          </span>
                        )}
                        {isUploadingImages && (
                          <span className='block mt-1 text-blue-600 font-medium animate-pulse'>
                            🔄 Compression en cours...
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <SortableImageGrid
                  images={selectedFiles}
                  onReorder={setSelectedFiles}
                  onRemove={removeFileById}
                  onPreview={() => setShowGalleryPreview(true)}
                />

                <ImageGalleryPreview
                  images={selectedFiles}
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

          {/* Bouton de soumission */}
          <motion.div className='flex justify-center gap-4 pt-8' variants={itemVariants}>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className='px-8 py-3'
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button
              type='submit'
              disabled={isLoading || isUploadingImages}
              className='px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200'
            >
              {isUploadingImages ? (
                <div className='flex items-center gap-2'>
                  <div className='w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin' />
                  Préparation des images...
                </div>
              ) : isLoading ? (
                <div className='flex items-center gap-2'>
                  <div className='w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin' />
                  Sauvegarde en cours...
                </div>
              ) : (
                <div className='flex items-center gap-2'>
                  <Save className='h-5 w-5' />
                  Sauvegarder les modifications
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
          title="Ajouter un service inclus personnalisé"
          description="Créez un service inclus spécifique à votre hébergement"
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
      </motion.div>
    </div>
  )
}
