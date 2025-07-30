'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
} from 'lucide-react'

import { findAllTypeRent } from '@/lib/services/typeRent.service'
import { findAllEquipments } from '@/lib/services/equipments.service'
import { findAllMeals } from '@/lib/services/meals.service'
import { findAllServices } from '@/lib/services/services.service'
import { findAllSecurity } from '@/lib/services/security.services'
import { createProduct } from '@/lib/services/product.service'
import {UserInterface} from "@/lib/interface/userInterface";
import {findAllUser} from "@/lib/services/user.service";

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

interface FormData {
  name: string
  description: string
  address: string
  phone: string
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
  surface: string
  maxPeople: string
  accessibility: boolean
  petFriendly: boolean
  nearbyPlaces: NearbyPlace[]
  transportation: string
}

export default function CreateProductPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [newPlace, setNewPlace] = useState({
    name: '',
    distance: '',
    unit: 'mètres' as 'mètres' | 'kilomètres',
  })
  const [userSelected, setUserSelected] = useState('')
  const [assignToOtherUser, setAssignToOtherUser] = useState(false)

  // Form data
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    address: '',
    phone: '',
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
    surface: '',
    maxPeople: '',
    accessibility: false,
    petFriendly: false,
    nearbyPlaces: [],
    transportation: '',
  })

  // Data from services
  const [types, setTypes] = useState<TypeRent[]>([])
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [meals, setMeals] = useState<Meal[]>([])
  const [securities, setSecurities] = useState<Security[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [userList, setUserList] = useState<UserInterface[]>()

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [typesData, equipmentsData, mealsData, securitiesData, servicesData, userData] =
          await Promise.all([
            findAllTypeRent(),
            findAllEquipments(),
            findAllMeals(),
            findAllSecurity(),
            findAllServices(),
              findAllUser(),
          ])

        setTypes(typesData || [])
        setEquipments(equipmentsData || [])
        setMeals(mealsData || [])
        setSecurities(securitiesData || [])
        setServices(servicesData || [])
        setUserList((userData?.map(user => ({
          id: user.id,
          email: user.email,
          name: user.name,
          lastname: user.lastname || undefined,
          image: user.image || undefined,
          info: user.info || undefined,
          emailVerified: user.emailVerified || undefined,
          roles: user.roles
        })) as UserInterface[]) || [])
      } catch (error) {
        console.error('Error loading data:', error)
        setError('Erreur lors du chargement des données')
      }
    }

    loadData()
  }, [])
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

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)

      // Validation des fichiers
      for (const file of filesArray) {
        if (!file.type.startsWith('image/')) {
          setError('Veuillez sélectionner uniquement des images')
          return
        }
        if (file.size > 10 * 1024 * 1024) {
          // 10MB max
          setError('La taille de chaque image ne doit pas dépasser 10MB')
          return
        }
      }

      if (selectedFiles.length + filesArray.length > 10) {
        setError('Maximum 10 photos autorisées')
        return
      }

      setSelectedFiles(prev => [...prev, ...filesArray])
      setError('') // Clear any previous errors
    }
  }

  const removeFile = (index: number) => {
    const fileToRemove = selectedFiles[index]
    if (fileToRemove) {
      // Libérer la mémoire de l'URL d'objet
      const url = URL.createObjectURL(fileToRemove)
      URL.revokeObjectURL(url)
    }
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Convert files to base64
  const convertFilesToBase64 = (files: File[]): Promise<string[]> => {
    return Promise.all(
      files.map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
      })
    )
  }

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      selectedFiles.forEach(file => {
        const url = URL.createObjectURL(file)
        URL.revokeObjectURL(url)
      })
    }
  }, [selectedFiles])

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

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!session?.user?.id) {
      setError('Vous devez être connecté pour créer une annonce')
      setIsLoading(false)
      return
    }

    if (selectedFiles.length === 0) {
      setError('Veuillez ajouter au moins une photo de votre hébergement')
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
        longitude: 0, // Valeur par défaut puisqu'on supprime les champs
        latitude: 0, // Valeur par défaut puisqu'on supprime les champs
        basePrice: formData.basePrice,
        priceMGA: formData.priceMGA,
        room: formData.room ? Number(formData.room) : null,
        bathroom: formData.bathroom ? Number(formData.bathroom) : null,
        arriving: Number(formData.arriving),
        leaving: Number(formData.leaving),
        phone: formData.phone,
        typeId: formData.typeId,
        userId: userSelected != ''  ? [userSelected] : [session.user.id],
        equipments: formData.equipmentIds,
        services: formData.serviceIds,
        meals: formData.mealIds,
        securities: formData.securityIds,
        images: base64Images, // Utiliser les images converties en base64
        nearbyPlaces: formData.nearbyPlaces.map(place => ({
          name: place.name,
          distance: place.distance ? Number(place.distance) : 0,
          duration: 0, // TODO: Calculer la durée si nécessaire
          transport: place.unit === 'kilomètres' ? 'voiture' : 'à pied',
        })),
      }

      const result = await createProduct(productData)

      if (result) {
        router.push('/dashboard')
      } else {
        throw new Error("Erreur lors de la création de l'annonce")
      }
    } catch (error) {
      console.error('Error creating product:', error)
      setError("Erreur lors de la création de l'annonce")
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
          <p className='text-slate-600 mb-6'>Vous devez être connecté pour créer une annonce.</p>
          <Button onClick={() => router.push('/auth')} className='bg-blue-600 hover:bg-blue-700'>
            Se connecter
          </Button>
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
            <div className='max-w-2xl mx-auto p-4 bg-red-50 border border-red-200 rounded-lg'>
              <p className='text-red-700'>{error}</p>
            </div>
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
                          placeholder='Ex: Villa avec vue sur mer'
                          value={formData.name}
                          onChange={handleInputChange}
                          required
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
                        <Input
                          id='phone'
                          name='phone'
                          type='tel'
                          placeholder='+33 6 XX XX XX XX'
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                          className='border-slate-200 focus:border-green-300 focus:ring-green-200'
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
                      Ajoutez des photos attrayantes de votre hébergement (maximum 10)
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
                        PNG, JPG, JPEG, WEBP jusqu&apos;à 10MB chacune
                        {selectedFiles.length > 0 && (
                          <span className='block mt-1 text-green-600 font-medium'>
                            ✓ {selectedFiles.length}/10 photos sélectionnées
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedFiles.length > 0 && (
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                    {selectedFiles.map((file, index) => (
                      <div key={index} className='relative group'>
                        <Image
                          src={URL.createObjectURL(file)}
                          alt={`Aperçu ${index + 1}`}
                          width={200}
                          height={96}
                          className='w-full h-24 object-cover rounded-lg border border-slate-200'
                        />
                        <button
                          type='button'
                          onClick={() => removeFile(index)}
                          className='absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors'
                        >
                          <X className='h-3 w-3' />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
          <motion.div variants={itemVariants}>
            <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm'>
              <CardHeader className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <div className='p-2 bg-cyan-50 rounded-lg'>
                    <FileText className='h-5 w-5 text-cyan-600' />
                  </div>
                  <div>
                    <CardTitle className='text-xl'>Informations administrateur</CardTitle>
                    <p className='text-slate-600 text-sm mt-1'>
                      Assignement de l&apos;hébergement
                    </p>
                  </div>
                </div>
              </CardHeader>
                            <CardContent className='space-y-6'>
                <div className='space-y-4'>
                  <div className='flex items-center space-x-2'>
                    <input
                      id='assignToOtherUser'
                      type='checkbox'
                      checked={assignToOtherUser}
                      onChange={(e) => setAssignToOtherUser(e.target.checked)}
                      className='w-4 h-4 text-cyan-600 bg-gray-100 border-gray-300 rounded focus:ring-cyan-500'
                    />
                    <label htmlFor='assignToOtherUser' className='text-sm font-medium text-slate-700'>
                      Assigner à un autre utilisateur
                    </label>
                  </div>

                  {assignToOtherUser && (
                    <div className='space-y-2'>
                      <label htmlFor='userSelected' className='text-sm font-medium text-slate-700'>
                        Sélectionner l&apos;utilisateur
                      </label>
                      <select
                           id='userSelected'
                           value={userSelected}
                           onChange={(e) => setUserSelected(e.target.value)}
                           className='w-full px-3 py-2 border border-slate-200 rounded-md focus:border-cyan-300 focus:ring-cyan-200 focus:ring-2 focus:ring-opacity-50'
                        >
                          <option value=''>Sélectionnez un utilisateur</option>
                          {userList?.map(user => (
                             <option key={user.id} value={user.id}>
                               {user.name} {user.lastname} ({user.email})
                             </option>
                          ))}
                        </select>
                    </div>
                  )}
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
      </motion.div>
    </div>
  )
}
