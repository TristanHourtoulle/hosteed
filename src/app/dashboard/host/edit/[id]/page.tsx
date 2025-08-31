'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/shadcnui/button'
import { Input } from '@/components/ui/shadcnui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcnui/card'
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
} from 'lucide-react'
import React from 'react'
import { findProductById, resubmitProductWithChange, createDraftProduct, getDraftProduct } from '@/lib/services/product.service'
import { findAllTypeRent } from '@/lib/services/typeRent.service'
import { findAllEquipments } from '@/lib/services/equipments.service'
import { findAllMeals } from '@/lib/services/meals.service'
import { findAllServices } from '@/lib/services/services.service'
import { findAllSecurity } from '@/lib/services/security.services'
import { compressImages, formatFileSize } from '@/lib/utils/imageCompression'
import { ExtraPriceType } from '@prisma/client'
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
import { parseCreateProductError, createValidationError } from '@/lib/utils/errorHandler'

interface TypeRent {
  id: string
  name: string
  description?: string
}

interface Equipment {
  id: string
  name: string
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

interface Product {
  id: string
  name: string
  description: string
  address: string
  longitude: number
  latitude: number
  basePrice: string
  priceMGA: string
  room: number | null
  bathroom: number | null
  arriving: number
  leaving: number
  phone: string
  phoneCountry: string
  maxPeople: number | null
  surface: number | null
  accessibility: boolean
  petFriendly: boolean
  transportation: string | null
  typeId: string
  img: { img: string }[]
  equipments: { id: string }[]
  servicesList: { id: string }[]
  mealsList: { id: string }[]
  securities: { id: string }[]
  includedServices: { id: string }[]
  extras: { id: string }[]
  highlights: { id: string }[]
  nearbyPlaces: { name: string; distance: number; unit: string }[]
  autoAccept: boolean
  isHotel: boolean
  hotelName: string | null
  availableRooms: number | null
  validate: string
  isDraft?: boolean
  originalProductId?: string | null
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

interface FormData {
  name: string
  description: string
  address: string
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

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params) as { id: string }
  const router = useRouter()
  const { data: session } = useSession()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [error, setError] = useState<ErrorDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<ImageFile[]>([])
  const [showGalleryPreview, setShowGalleryPreview] = useState(false)
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

  const [product, setProduct] = useState<Product | null>(null)

  // Form data
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    address: '',
    phone: '',
    phoneCountry: 'MG',
    room: '',
    bathroom: '',
    arriving: '',
    leaving: '',
    basePrice: '',
    priceMGA: '',
    autoAccept: false,
    typeId: '',
    equipmentIds: [],
    mealIds: [],
    securityIds: [],
    serviceIds: [],
    includedServiceIds: [],
    extraIds: [],
    highlightIds: [],
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

  // Functions to load new data
  const loadIncludedServices = async (): Promise<IncludedService[]> => {
    try {
      const response = await fetch('/api/user/included-services')
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.error('Error loading included services:', error)
    }
    return []
  }

  const loadExtras = async (): Promise<ProductExtra[]> => {
    try {
      const response = await fetch('/api/user/extras')
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.error('Error loading extras:', error)
    }
    return []
  }

  const loadHighlights = async (): Promise<PropertyHighlight[]> => {
    try {
      const response = await fetch('/api/user/highlights')
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.error('Error loading highlights:', error)
    }
    return []
  }

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [productData, typesData, equipmentsData, mealsData, securitiesData, servicesData, includedServicesData, extrasData, highlightsData] =
          await Promise.all([
            findProductById(resolvedParams.id),
            findAllTypeRent(),
            findAllEquipments(),
            findAllMeals(),
            findAllSecurity(),
            findAllServices(),
            loadIncludedServices(),
            loadExtras(),
            loadHighlights(),
          ])

        if (productData) {
          const convertedProduct = productData as unknown as Product
          
          // Check if this is an approved product with an existing draft
          if (convertedProduct.validate === 'ModificationPending' && !convertedProduct.isDraft) {
            // Find and redirect to the draft
            const draft = await getDraftProduct(resolvedParams.id)
            if (draft) {
              router.push(`/dashboard/host/edit/${draft.id}`)
              return
            }
          }
          
          setProduct(convertedProduct)
          
          // Convert existing images to ImageFile format
          const existingImages = convertedProduct.img?.map((img, index) => ({
            file: new File([], `existing-${index}.jpg`),
            preview: img.img,
            id: `existing-${index}-${Date.now()}`
          })) || []
          setSelectedFiles(existingImages)
          
          // Populate form data with existing product data
          setFormData({
            name: convertedProduct.name || '',
            description: convertedProduct.description || '',
            address: convertedProduct.address || '',
            phone: convertedProduct.phone || '',
            phoneCountry: convertedProduct.phoneCountry || 'MG',
            room: convertedProduct.room?.toString() || '',
            bathroom: convertedProduct.bathroom?.toString() || '',
            arriving: convertedProduct.arriving?.toString() || '',
            leaving: convertedProduct.leaving?.toString() || '',
            basePrice: convertedProduct.basePrice || '',
            priceMGA: convertedProduct.priceMGA || '',
            autoAccept: convertedProduct.autoAccept || false,
            typeId: convertedProduct.typeId || '',
            equipmentIds: convertedProduct.equipments?.map(e => e.id) || [],
            mealIds: convertedProduct.mealsList?.map(m => m.id) || [],
            securityIds: convertedProduct.securities?.map(s => s.id) || [],
            serviceIds: convertedProduct.servicesList?.map(s => s.id) || [],
            includedServiceIds: convertedProduct.includedServices?.map(s => s.id) || [],
            extraIds: convertedProduct.extras?.map(e => e.id) || [],
            highlightIds: convertedProduct.highlights?.map(h => h.id) || [],
            surface: convertedProduct.surface?.toString() || '',
            maxPeople: convertedProduct.maxPeople?.toString() || '',
            accessibility: convertedProduct.accessibility || false,
            petFriendly: convertedProduct.petFriendly || false,
            nearbyPlaces: convertedProduct.nearbyPlaces?.map(p => ({
              name: p.name,
              distance: p.distance.toString(),
              unit: p.unit as 'mètres' | 'kilomètres'
            })) || [],
            transportation: convertedProduct.transportation || '',
            isHotel: convertedProduct.isHotel || false,
            hotelName: convertedProduct.hotelName || '',
            availableRooms: convertedProduct.availableRooms?.toString() || '',
          })
        }

        setTypes(typesData || [])
        setEquipments(equipmentsData || [])
        setMeals(mealsData || [])
        setSecurities(securitiesData || [])
        setServices(servicesData || [])
        setIncludedServices(includedServicesData || [])
        setExtras(extrasData || [])
        setHighlights(highlightsData || [])
      } catch (err) {
        console.error('Error loading data:', err)
        setError({
          type: 'network',
          title: 'Erreur de chargement',
          message: 'Impossible de charger les données du produit.',
          details: [
            'Échec du chargement des données du produit',
            'Vérifiez votre connexion internet'
          ],
          suggestions: [
            'Actualisez la page pour réessayer',
            'Vérifiez votre connexion internet',
            'Si le problème persiste, contactez le support'
          ],
          retryable: true
        })
      } finally {
        setLoading(false)
      }
    }

    if (session?.user) {
      loadData()
    }
  }, [session, resolvedParams.id])

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

  // Calcul mémorisé pour les extras sélectionnés avec leurs données complètes
  const selectedExtras = useMemo(() => {
    return extras.filter(extra => formData.extraIds.includes(extra.id))
  }, [extras, formData.extraIds])

  // Calcul mémorisé pour le nombre de jours de la réservation de test
  const numberOfDays = useMemo(() => {
    return Math.ceil((testBooking.endDate.getTime() - testBooking.startDate.getTime()) / (1000 * 60 * 60 * 24))
  }, [testBooking.startDate, testBooking.endDate])

  // Redirection si non connecté
  useEffect(() => {
    if (!session) {
      router.push('/auth')
    }
  }, [session, router])

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
            'Vous pourrez ajouter d\'autres photos après la modification de l\'annonce'
          ]
        })
        return
      }

      try {
        setIsUploadingImages(true)
        setError(null)

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
        setError(null)

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
    if (imageFile?.preview && !imageFile.preview.startsWith('data:') && !imageFile.preview.startsWith('http')) {
      URL.revokeObjectURL(imageFile.preview)
    }
    setSelectedFiles(prev => prev.filter(img => img.id !== id))
  }

  // Convert files to base64 with compression
  const convertFilesToBase64 = async (imageFiles: ImageFile[]): Promise<string[]> => {
    const results: string[] = []
    
    for (const imageFile of imageFiles) {
      // If it's an existing image (URL), keep as is
      if (imageFile.preview.startsWith('http') || imageFile.preview.startsWith('data:')) {
        results.push(imageFile.preview)
      } else {
        // If it's a new file, compress and convert
        try {
          const compressedFiles = await compressImages([imageFile.file], {
            maxSizeMB: 0.8,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            quality: 0.8,
          })
          
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = () => reject(new Error(`Erreur de lecture de l'image: ${compressedFiles[0].name}`))
            reader.readAsDataURL(compressedFiles[0])
          })
          
          results.push(base64)
        } catch (error) {
          console.error('Error processing image:', error)
          throw error
        }
      }
    }
    
    return results
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

  // Form submission avec validation basique
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

    // Validation spécifique aux hôtels
    if (formData.isHotel) {
      if (!formData.hotelName.trim()) {
        setError(createValidationError('hotelName', "Le nom de l'hôtel est requis"))
        setIsLoading(false)
        return
      }
      
      if (!formData.availableRooms || Number(formData.availableRooms) <= 0) {
        setError(createValidationError('availableRooms', 'Le nombre de chambres disponibles doit être supérieur à 0'))
        setIsLoading(false)
        return
      }
    }

    if (selectedFiles.length === 0) {
      setError(createValidationError('images', 'Veuillez ajouter au moins une photo de votre hébergement'))
      setIsLoading(false)
      return
    }

    try {
      // Convert images to base64
      setIsUploadingImages(true)
      const base64Images = await convertFilesToBase64(selectedFiles)
      setIsUploadingImages(false)

      // Préparer les données pour le service
      const productData = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        longitude: 0, // Valeur par défaut
        latitude: 0, // Valeur par défaut
        basePrice: formData.basePrice,
        priceMGA: formData.priceMGA,
        room: formData.room ? Number(formData.room) : null,
        bathroom: formData.bathroom ? Number(formData.bathroom) : null,
        arriving: Number(formData.arriving),
        leaving: Number(formData.leaving),
        phone: formData.phone,
        phoneCountry: formData.phoneCountry || 'MG',
        maxPeople: formData.maxPeople ? Number(formData.maxPeople) : null,
        surface: formData.surface ? Number(formData.surface) : null,
        accessibility: formData.accessibility,
        petFriendly: formData.petFriendly,
        transportation: formData.transportation,
        autoAccept: formData.autoAccept,
        typeId: formData.typeId,
        securities: formData.securityIds,
        equipments: formData.equipmentIds,
        services: formData.serviceIds,
        meals: formData.mealIds,
        includedServices: formData.includedServiceIds,
        extras: formData.extraIds,
        highlights: formData.highlightIds,
        images: base64Images,
        nearbyPlaces: formData.nearbyPlaces.map(place => ({
          name: place.name,
          distance: place.distance ? Number(place.distance) : 0,
          duration: 0,
          transport: place.unit === 'kilomètres' ? 'voiture' : 'à pied',
        })),
        // Données spécifiques aux hôtels
        isHotel: formData.isHotel,
        hotelInfo: formData.isHotel ? {
          name: formData.hotelName,
          availableRooms: Number(formData.availableRooms),
        } : null,
      }

      // Check if product is approved and needs draft creation
      if (product?.validate === 'Approve') {
        // Create a draft and redirect to edit the draft
        const draft = await createDraftProduct(resolvedParams.id)
        if (draft) {
          // Update the draft with the new data
          const result = await resubmitProductWithChange(
            draft.id,
            productData,
            session.user.id
          )
          if (result) {
            router.push('/dashboard/host?status=modification-pending')
          } else {
            throw new Error("Erreur lors de la mise à jour du brouillon")
          }
        } else {
          throw new Error("Erreur lors de la création du brouillon")
        }
      } else {
        // Normal update for non-approved products or drafts
        const result = await resubmitProductWithChange(
          resolvedParams.id,
          productData,
          session.user.id
        )
        if (result) {
          router.push('/dashboard/host')
        } else {
          throw new Error("Erreur lors de la mise à jour de l'annonce")
        }
      }
    } catch (error) {
      console.error('Error updating product:', error)
      setError(parseCreateProductError(error))
    } finally {
      setIsLoading(false)
      setIsUploadingImages(false)
    }
  }

  // Ne pas afficher le formulaire si l'utilisateur n'est pas connecté
  if (!session) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold text-slate-800 mb-4'>Connexion requise</h2>
          <p className='text-slate-600 mb-6'>Vous devez être connecté pour modifier une annonce.</p>
          <Button onClick={() => router.push('/auth')} className='bg-blue-600 hover:bg-blue-700'>
            Se connecter
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center'>
        <div className='flex items-center space-x-2'>
          <div className='w-4 h-4 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin' />
          <span className='text-slate-600'>Chargement...</span>
        </div>
      </div>
    )
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
          <Button 
            variant='ghost' 
            size='sm' 
            className='text-slate-600 hover:text-slate-800'
            onClick={() => router.push('/dashboard/host')}
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Retour
          </Button>
        </motion.div>

        {/* Page Header */}
        <motion.div className='text-center space-y-4' variants={itemVariants}>
          <div className='inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium'>
            <Home className='h-4 w-4' />
            Modifier une annonce
          </div>
          <h1 className='text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700'>
            Modifier votre annonce
          </h1>
          <p className='text-slate-600 max-w-2xl mx-auto text-lg'>
            Modifiez les informations de votre hébergement
          </p>
        </motion.div>

        {/* Validation status notification */}
        {product?.validate === 'Approve' && !product?.isDraft && (
          <motion.div variants={itemVariants}>
            <div className='bg-amber-50 border border-amber-200 rounded-lg p-4'>
              <div className='flex items-start'>
                <div className='flex-shrink-0'>
                  <svg className='h-5 w-5 text-amber-400' viewBox='0 0 20 20' fill='currentColor'>
                    <path fillRule='evenodd' d='M10 3a1 1 0 011 1v5.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 9.586V4a1 1 0 011-1z' clipRule='evenodd' />
                  </svg>
                </div>
                <div className='ml-3'>
                  <h3 className='text-sm font-medium text-amber-800'>
                    Modification d'une annonce approuvée
                  </h3>
                  <div className='mt-2 text-sm text-amber-700'>
                    <p>
                      Votre annonce est actuellement approuvée et active. Les modifications que vous apportez créeront une demande de validation qui sera examinée par un administrateur. 
                      Votre annonce actuelle restera active pendant le processus de validation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {product?.validate === 'ModificationPending' && !product?.isDraft && (
          <motion.div variants={itemVariants}>
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
              <div className='flex items-start'>
                <div className='flex-shrink-0'>
                  <svg className='h-5 w-5 text-blue-400' viewBox='0 0 20 20' fill='currentColor'>
                    <path fillRule='evenodd' d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z' clipRule='evenodd' />
                  </svg>
                </div>
                <div className='ml-3'>
                  <h3 className='text-sm font-medium text-blue-800'>
                    Modification en attente
                  </h3>
                  <div className='mt-2 text-sm text-blue-700'>
                    <p>
                      Une demande de modification est déjà en cours d'examen pour cette annonce. 
                      Vous éditez actuellement le brouillon de modification.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {product?.isDraft && (
          <motion.div variants={itemVariants}>
            <div className='bg-indigo-50 border border-indigo-200 rounded-lg p-4'>
              <div className='flex items-start'>
                <div className='flex-shrink-0'>
                  <svg className='h-5 w-5 text-indigo-400' viewBox='0 0 20 20' fill='currentColor'>
                    <path d='M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z' />
                  </svg>
                </div>
                <div className='ml-3'>
                  <h3 className='text-sm font-medium text-indigo-800'>
                    Brouillon de modification
                  </h3>
                  <div className='mt-2 text-sm text-indigo-700'>
                    <p>
                      Vous éditez un brouillon de modification. Ces changements seront soumis à validation une fois enregistrés.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div variants={itemVariants}>
            <ErrorAlert 
              error={error}
              onClose={() => setError(null)}
              onRetry={error.retryable ? () => {
                setError(null)
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

              {/* Localisation et Contact */}
              <motion.div variants={itemVariants}>
                <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm'>
                  <CardHeader className='space-y-2'>
                    <div className='flex items-center gap-2'>
                      <div className='p-2 bg-green-50 rounded-lg'>
                        <MapPin className='h-5 w-5 text-green-600' />
                      </div>
                      <div>
                        <CardTitle className='text-xl'>Localisation et Contact</CardTitle>
                        <p className='text-slate-600 text-sm mt-1'>
                          Où se trouve votre hébergement et comment vous joindre
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className='space-y-6'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      <div className='space-y-2'>
                        <label htmlFor='address' className='text-sm font-medium text-slate-700'>
                          Adresse complète
                        </label>
                        <Input
                          id='address'
                          name='address'
                          type='text'
                          placeholder='Numéro, rue, code postal, ville'
                          value={formData.address}
                          onChange={handleInputChange}
                          required
                          className='border-slate-200 focus:border-green-300 focus:ring-green-200'
                        />
                      </div>

                      <div className='space-y-2'>
                        <label htmlFor='phone' className='text-sm font-medium text-slate-700'>
                          Téléphone de contact
                        </label>
                        <PhoneInput
                          value={formData.phone}
                          defaultCountry={formData.phoneCountry}
                          onChange={(phoneNumber, countryCode) => {
                            setFormData(prev => ({
                              ...prev,
                              phone: phoneNumber,
                              phoneCountry: countryCode
                            }))
                          }}
                          placeholder="XX XX XX XX"
                          required
                          className="border-slate-200 focus:border-green-300 focus:ring-green-200"
                        />
                      </div>
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
                        </div>

                        <div className='space-y-2'>
                          <label htmlFor='availableRooms' className='text-sm font-medium text-amber-800'>
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
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

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
                      Ajoutez des photos attrayantes de votre hébergement (maximum 35)
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
          <motion.div className='flex justify-center pt-8' variants={itemVariants}>
            <Button
              type='submit'
              disabled={isLoading || isUploadingImages}
              className='w-full max-w-md h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-lg shadow-lg hover:shadow-xl transition-all duration-200'
            >
              {isUploadingImages ? (
                <div className='flex items-center gap-2'>
                  <div className='w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin' />
                  Préparation des images...
                </div>
              ) : isLoading ? (
                <div className='flex items-center gap-2'>
                  <div className='w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin' />
                  Modification en cours...
                </div>
              ) : (
                <div className='flex items-center gap-2'>
                  <Home className='h-5 w-5' />
                  Modifier l&apos;annonce
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