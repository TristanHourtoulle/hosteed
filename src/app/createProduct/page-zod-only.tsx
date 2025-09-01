'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { UserInterface } from '@/lib/interface/userInterface'
import { findAllUser } from '@/lib/services/user.service'
import { useCreateProductForm } from '@/hooks/useCreateProductForm'

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

export default function CreateProductPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Utilisation du hook Zod pour la validation
  const {
    form,
    formState,
    register,
    isLoading,
    isUploadingImages,
    globalError,
    selectedFiles,
    onSubmit,
    validateAndSetImages,
    addNearbyPlace,
    removeNearbyPlace,
    toggleArrayValue,
    clearGlobalError,
    errors,
  } = useCreateProductForm()

  // États pour les données de référence et l'interface
  const [dragActive, setDragActive] = useState(false)
  const [newPlace, setNewPlace] = useState({
    name: '',
    distance: '',
    unit: 'mètres' as 'mètres' | 'kilomètres',
  })
  const [userSelected, setUserSelected] = useState('')
  const [assignToOtherUser, setAssignToOtherUser] = useState(false)

  // Data from services
  const [types, setTypes] = useState<TypeRent[]>([])
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [meals, setMeals] = useState<Meal[]>([])
  const [securities, setSecurities] = useState<Security[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [userList, setUserList] = useState<UserInterface[]>()

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
        setUserList(
          (userData?.map(user => ({
            id: user.id,
            email: user.email,
            name: user.name,
            lastname: user.lastname || undefined,
            image: user.image || undefined,
            info: user.info || undefined,
            emailVerified: user.emailVerified || undefined,
            roles: user.roles,
          })) as UserInterface[]) || []
        )
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }

    loadData()
  }, [])
  
  useEffect(() => {
    if (!session) {
      router.push('/auth')
    }
  }, [session, router])

  // File handling adapté pour notre hook
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
      const filesArray = Array.from(e.dataTransfer.files)
      validateAndSetImages(filesArray)
    }
  }

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      validateAndSetImages(filesArray)
    }
  }

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    validateAndSetImages(newFiles)
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

  // Gestion des lieux à proximité adaptée
  const handleAddNearbyPlace = () => {
    if (newPlace.name.trim()) {
      addNearbyPlace(newPlace)
      setNewPlace({ name: '', distance: '', unit: 'mètres' })
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
        className='container mx-auto px-4 py-8'
        variants={containerVariants}
        initial='hidden'
        animate='visible'
      >
        {/* Header */}
        <motion.div variants={itemVariants} className='text-center mb-12'>
          <div className='inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-slate-600 text-sm mb-6 border border-slate-200'>
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

        {/* Erreur globale */}
        {globalError && (
          <motion.div variants={itemVariants}>
            <div className='max-w-2xl mx-auto p-4 bg-red-50 border border-red-200 rounded-lg mb-8'>
              <p className='text-red-700'>{globalError}</p>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={clearGlobalError}
                className="mt-2"
              >
                Fermer
              </Button>
            </div>
          </motion.div>
        )}

        <form onSubmit={onSubmit} className='max-w-4xl mx-auto space-y-8'>
          {/* Informations principales */}
          <motion.div variants={itemVariants}>
            <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm'>
              <CardHeader className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <div className='p-2 bg-blue-50 rounded-lg'>
                    <Home className='h-5 w-5 text-blue-600' />
                  </div>
                  <CardTitle className='text-xl text-slate-800'>Informations principales</CardTitle>
                </div>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='space-y-2'>
                    <Label htmlFor='name' className='text-sm font-medium text-slate-700'>
                      Nom de l&apos;hébergement *
                    </Label>
                    <Input
                      id='name'
                      {...register('name')}
                      placeholder='Ex: Villa avec vue sur mer'
                      className={`${errors.name ? 'border-red-500' : ''}`}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='typeId' className='text-sm font-medium text-slate-700'>
                      Type d&apos;hébergement *
                    </Label>
                    <select
                      id='typeId'
                      {...register('typeId')}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 ${errors.typeId ? 'border-red-500' : 'border-slate-200'}`}
                    >
                      <option value=''>Sélectionnez un type</option>
                      {types.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                    {errors.typeId && (
                      <p className="text-sm text-red-600">{errors.typeId.message}</p>
                    )}
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='description' className='text-sm font-medium text-slate-700'>
                    Description *
                  </Label>
                  <Textarea
                    id='description'
                    {...register('description')}
                    placeholder='Décrivez votre hébergement en détail...'
                    rows={4}
                    className={`${errors.description ? 'border-red-500' : ''}`}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='address' className='text-sm font-medium text-slate-700'>
                    Adresse *
                  </Label>
                  <Input
                    id='address'
                    {...register('address')}
                    placeholder='Adresse complète'
                    className={`${errors.address ? 'border-red-500' : ''}`}
                  />
                  {errors.address && (
                    <p className="text-sm text-red-600">{errors.address.message}</p>
                  )}
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='phone' className='text-sm font-medium text-slate-700'>
                    Téléphone
                  </Label>
                  <Input
                    id='phone'
                    {...register('phone')}
                    placeholder='Ex: +33 6 12 34 56 78'
                    className={`${errors.phone ? 'border-red-500' : ''}`}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Caractéristiques */}
          <motion.div variants={itemVariants}>
            <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm'>
              <CardHeader className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <div className='p-2 bg-green-50 rounded-lg'>
                    <Users className='h-5 w-5 text-green-600' />
                  </div>
                  <CardTitle className='text-xl text-slate-800'>Caractéristiques</CardTitle>
                </div>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
                  <div className='space-y-2'>
                    <Label htmlFor='room' className='text-sm font-medium text-slate-700'>
                      Chambres
                    </Label>
                    <Input
                      id='room'
                      {...register('room')}
                      type='number'
                      placeholder='Nombre'
                      className={`${errors.room ? 'border-red-500' : ''}`}
                    />
                    {errors.room && (
                      <p className="text-sm text-red-600">{errors.room.message}</p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='bathroom' className='text-sm font-medium text-slate-700'>
                      Salles de bain
                    </Label>
                    <Input
                      id='bathroom'
                      {...register('bathroom')}
                      type='number'
                      placeholder='Nombre'
                      className={`${errors.bathroom ? 'border-red-500' : ''}`}
                    />
                    {errors.bathroom && (
                      <p className="text-sm text-red-600">{errors.bathroom.message}</p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='arriving' className='text-sm font-medium text-slate-700'>
                      Heure d&apos;arrivée
                    </Label>
                    <Input
                      id='arriving'
                      {...register('arriving')}
                      type='number'
                      min='0'
                      max='23'
                      placeholder='14'
                      className={`${errors.arriving ? 'border-red-500' : ''}`}
                    />
                    {errors.arriving && (
                      <p className="text-sm text-red-600">{errors.arriving.message}</p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='leaving' className='text-sm font-medium text-slate-700'>
                      Heure de départ
                    </Label>
                    <Input
                      id='leaving'
                      {...register('leaving')}
                      type='number'
                      min='0'
                      max='23'
                      placeholder='12'
                      className={`${errors.leaving ? 'border-red-500' : ''}`}
                    />
                    {errors.leaving && (
                      <p className="text-sm text-red-600">{errors.leaving.message}</p>
                    )}
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='space-y-2'>
                    <Label htmlFor='basePrice' className='text-sm font-medium text-slate-700'>
                      Prix de base (€) *
                    </Label>
                    <Input
                      id='basePrice'
                      {...register('basePrice')}
                      type='number'
                      step='0.01'
                      placeholder='50.00'
                      className={`${errors.basePrice ? 'border-red-500' : ''}`}
                    />
                    {errors.basePrice && (
                      <p className="text-sm text-red-600">{errors.basePrice.message}</p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='priceMGA' className='text-sm font-medium text-slate-700'>
                      Prix MGA *
                    </Label>
                    <Input
                      id='priceMGA'
                      {...register('priceMGA')}
                      type='number'
                      step='0.01'
                      placeholder='200000'
                      className={`${errors.priceMGA ? 'border-red-500' : ''}`}
                    />
                    {errors.priceMGA && (
                      <p className="text-sm text-red-600">{errors.priceMGA.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Équipements */}
          <motion.div variants={itemVariants}>
            <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm'>
              <CardHeader className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <div className='p-2 bg-purple-50 rounded-lg'>
                    <Wifi className='h-5 w-5 text-purple-600' />
                  </div>
                  <CardTitle className='text-xl text-slate-800'>Équipements</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                  {equipments.map(equipment => (
                    <div key={equipment.id} className='flex items-center space-x-2'>
                      <Checkbox
                        id={`equipment-${equipment.id}`}
                        checked={form.watch('equipmentIds').includes(equipment.id)}
                        onCheckedChange={(checked: boolean) => 
                          toggleArrayValue('equipmentIds', equipment.id)
                        }
                      />
                      <Label htmlFor={`equipment-${equipment.id}`} className='text-sm'>
                        {equipment.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Options */}
          <motion.div variants={itemVariants}>
            <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm'>
              <CardHeader className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <div className='p-2 bg-orange-50 rounded-lg'>
                    <Star className='h-5 w-5 text-orange-600' />
                  </div>
                  <CardTitle className='text-xl text-slate-800'>Options</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div className='flex items-center space-x-2'>
                    <Checkbox
                      id='autoAccept'
                      checked={form.watch('autoAccept')}
                      onCheckedChange={(checked: boolean) => 
                        form.setValue('autoAccept', !!checked, { shouldValidate: true })
                      }
                    />
                    <Label htmlFor='autoAccept'>Acceptation automatique</Label>
                  </div>

                  <div className='flex items-center space-x-2'>
                    <Checkbox
                      id='accessibility'
                      checked={form.watch('accessibility')}
                      onCheckedChange={(checked: boolean) => 
                        form.setValue('accessibility', !!checked, { shouldValidate: true })
                      }
                    />
                    <Label htmlFor='accessibility'>Accessible PMR</Label>
                  </div>

                  <div className='flex items-center space-x-2'>
                    <Checkbox
                      id='petFriendly'
                      checked={form.watch('petFriendly')}
                      onCheckedChange={(checked: boolean) => 
                        form.setValue('petFriendly', !!checked, { shouldValidate: true })
                      }
                    />
                    <Label htmlFor='petFriendly'>Animaux acceptés</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Upload d'images */}
          <motion.div variants={itemVariants}>
            <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm'>
              <CardHeader className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <div className='p-2 bg-indigo-50 rounded-lg'>
                    <Camera className='h-5 w-5 text-indigo-600' />
                  </div>
                  <CardTitle className='text-xl text-slate-800'>Photos de l&apos;hébergement</CardTitle>
                </div>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className='h-12 w-12 text-slate-400 mx-auto mb-4' />
                  <div className='space-y-2'>
                    <p className='text-lg font-medium text-slate-600'>
                      Glissez-déposez vos images ici
                    </p>
                    <p className='text-sm text-slate-500'>
                      ou cliquez pour sélectionner des fichiers
                    </p>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImages}
                    >
                      {isUploadingImages ? 'Téléchargement...' : 'Choisir des fichiers'}
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type='file'
                    multiple
                    accept='image/*'
                    onChange={handleFiles}
                    className='hidden'
                  />
                </div>

                {selectedFiles.length > 0 && (
                  <div>
                    <p className='text-sm text-slate-600 mb-4'>
                      {selectedFiles.length} image(s) sélectionnée(s)
                    </p>
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                      {selectedFiles.map((file, index) => (
                        <div key={index} className='relative group'>
                          <div className='aspect-square bg-slate-100 rounded-lg overflow-hidden'>
                            <Image
                              src={URL.createObjectURL(file)}
                              alt={`Preview ${index + 1}`}
                              width={200}
                              height={200}
                              className='w-full h-full object-cover'
                            />
                          </div>
                          <Button
                            type='button'
                            variant='destructive'
                            size='sm'
                            className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity'
                            onClick={() => removeFile(index)}
                          >
                            <X className='h-4 w-4' />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Boutons d'action */}
          <motion.div variants={itemVariants}>
            <div className='flex justify-between items-center'>
              <Button
                type='button'
                variant='outline'
                onClick={() => router.push('/dashboard')}
                className='flex items-center gap-2'
              >
                <ArrowLeft className='h-4 w-4' />
                Retour
              </Button>

              <div className='space-x-4'>
                <Button
                  type='submit'
                  disabled={isLoading || !formState.isValid}
                  className='bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg'
                >
                  {isLoading ? 'Création en cours...' : 'Créer l\'annonce'}
                </Button>
              </div>
            </div>
          </motion.div>

          {/* État du formulaire (debug) */}
          {process.env.NODE_ENV === 'development' && (
            <motion.div variants={itemVariants}>
              <Card className='border-0 shadow-lg bg-gray-50'>
                <CardHeader>
                  <CardTitle className='text-lg'>État de validation (dev)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-sm'>
                    Formulaire valide : {formState.isValid ? '✅ Oui' : '❌ Non'}
                  </p>
                  <p className='text-sm'>
                    Nombre d'erreurs : {Object.keys(errors).length}
                  </p>
                  <p className='text-sm'>
                    Images : {selectedFiles.length}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </form>
      </motion.div>
    </div>
  )
}
