'use client'

import { useState, useEffect } from 'react'
import { createProduct } from '@/lib/services/product.service'
import { findAllTypeRent } from '@/lib/services/typeRent.service'
import { findAllSecurity } from '@/lib/services/security.services'
import { findAllMeals } from '@/lib/services/meals.service'
import { findAllEquipments } from '@/lib/services/equipments.service'
import { findAllServices } from '@/lib/services/services.service'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/shadcnui/card'
import { Input } from '@/components/ui/shadcnui/input'
import { Button } from '@/components/ui/shadcnui/button'
import { Alert } from '@/components/ui/shadcnui/alert'
import { Label } from '@/components/ui/shadcnui/label'
import { Separator } from '@/components/ui/shadcnui/separator'

interface TypeRent {
  id: string
  name: string
}

interface Security {
  id: string
  name: string
}

interface Meals {
  id: string
  name: string
}

interface Equipments {
  id: string
  name: string
}

interface Services {
  id: string
  name: string
}

export default function CreateProduct() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [types, setTypes] = useState<TypeRent[]>([])
  const [securities, setSecurities] = useState<Security[]>([])
  const [meals, setMeals] = useState<Meals[]>([])
  const [equipments, setEquipments] = useState<Equipments[]>([])
  const [services, setServices] = useState<Services[]>([])
  const [images, setImages] = useState<File[]>([])
  const [previewImages, setPreviewImages] = useState<string[]>([])

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    longitude: 0,
    latitude: 0,
    basePrice: '',
    priceMGA: '',
    room: 1,
    bathroom: 1,
    arriving: 14,
    leaving: 12,
    phone: '',
    typeId: '',
    selectedSecurities: [] as string[],
    selectedMeals: [] as string[],
    selectedEquipments: [] as string[],
    selectedServices: [] as string[],
    nearbyPlaces: [] as { name: string; distance: number; duration: number; transport: string }[],
    transportOptions: [] as { name: string; description: string }[],
    propertyInfo: {
      hasStairs: false,
      hasElevator: false,
      hasHandicapAccess: false,
      hasPetsOnProperty: false,
      additionalNotes: '',
    },
    cancellationPolicy: {
      freeCancellationHours: 24,
      partialRefundPercent: 50,
      additionalTerms: '',
    },
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [typesList, securitiesList, mealsList, equipmentsList, servicesList] =
          await Promise.all([
            findAllTypeRent(),
            findAllSecurity(),
            findAllMeals(),
            findAllEquipments(),
            findAllServices(),
          ])

        if (typesList) setTypes(typesList)
        if (securitiesList) setSecurities(securitiesList)
        if (mealsList) setMeals(mealsList)
        if (equipmentsList) setEquipments(equipmentsList)
        if (servicesList) setServices(servicesList)
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
        setError('Erreur lors du chargement des données')
      }
    }

    fetchData()
  }, [])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files)
      setImages(prev => [...prev, ...newImages])

      // Créer les prévisualisations
      const newPreviews = await Promise.all(newImages.map(file => URL.createObjectURL(file)))
      setPreviewImages(prev => [...prev, ...newPreviews])
    }
  }

  const handleCheckboxChange = (
    type: 'securities' | 'meals' | 'equipments' | 'services',
    id: string
  ) => {
    setFormData(prev => {
      const selectedArray = prev[
        `selected${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof typeof prev
      ] as string[]
      const newSelected = selectedArray.includes(id)
        ? selectedArray.filter(item => item !== id)
        : [...selectedArray, id]

      return {
        ...prev,
        [`selected${type.charAt(0).toUpperCase() + type.slice(1)}`]: newSelected,
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Convertir les images en base64 côté client
      const base64Images = await Promise.all(
        images.map(file => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => {
              if (typeof reader.result === 'string') {
                resolve(reader.result)
              } else {
                reject(new Error('Erreur lors de la conversion en base64'))
              }
            }
            reader.onerror = error => reject(error)
          })
        })
      )
      if (!session?.user?.id) {
        setError('No userID available')
        return
      }
      const product = await createProduct({
        ...formData,
        images: base64Images,
        securities: formData.selectedSecurities,
        meals: formData.selectedMeals,
        equipments: formData.selectedEquipments,
        services: formData.selectedServices,
        userId: [session.user.id],
      })

      if (product) {
        router.push('/host')
      } else {
        setError('Erreur lors de la création du produit')
      }
    } catch (error) {
      console.error('Erreur lors de la création:', error)
      setError('Erreur lors de la création du produit')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl'>
        <div className='space-y-8'>
          {/* Header */}
          <div className='text-center'>
            <h1 className='text-3xl font-bold text-gray-900'>Créer une nouvelle annonce</h1>
            <p className='mt-2 text-gray-600'>
              Remplissez les informations ci-dessous pour créer votre annonce
            </p>
          </div>

          {error && (
            <Alert variant='destructive' className='mx-auto max-w-2xl'>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className='space-y-8 max-w-4xl mx-auto py-8 px-4'>
            {/* Informations principales */}
            <Card>
              <CardHeader>
                <CardTitle>Informations principales</CardTitle>
                <CardDescription>
                  Les informations essentielles de votre hébergement
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='space-y-2'>
                    <Label htmlFor='name'>Nom de l'hébergement</Label>
                    <Input
                      id='name'
                      name='name'
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder='Ex: Villa avec vue sur mer'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='typeId'>Type d'hébergement</Label>
                    <select
                      id='typeId'
                      name='typeId'
                      value={formData.typeId}
                      onChange={handleInputChange}
                      required
                      className='flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
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
                  <Label htmlFor='description'>Description détaillée</Label>
                  <textarea
                    id='description'
                    name='description'
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    placeholder='Décrivez votre hébergement en détail...'
                    className='flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
                  />
                </div>
              </CardContent>
            </Card>

            {/* Localisation et Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Localisation et Contact</CardTitle>
                <CardDescription>
                  Où se trouve votre hébergement et comment vous joindre
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='space-y-2'>
                    <Label htmlFor='address'>Adresse complète</Label>
                    <Input
                      id='address'
                      name='address'
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      placeholder='Numéro, rue, code postal, ville'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='phone'>Téléphone de contact</Label>
                    <Input
                      id='phone'
                      name='phone'
                      type='tel'
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      placeholder='+33 6 XX XX XX XX'
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Caractéristiques */}
            <Card>
              <CardHeader>
                <CardTitle>Caractéristiques</CardTitle>
                <CardDescription>Les détails de votre hébergement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
                  <div className='space-y-2'>
                    <Label htmlFor='room'>Chambres</Label>
                    <Input
                      id='room'
                      name='room'
                      type='number'
                      value={formData.room}
                      onChange={handleInputChange}
                      required
                      min='1'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='bathroom'>Salles de bain</Label>
                    <Input
                      id='bathroom'
                      name='bathroom'
                      type='number'
                      value={formData.bathroom}
                      onChange={handleInputChange}
                      required
                      min='1'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='arriving'>Arrivée</Label>
                    <Input
                      id='arriving'
                      name='arriving'
                      type='number'
                      value={formData.arriving}
                      onChange={handleInputChange}
                      required
                      min='0'
                      max='23'
                      placeholder='14'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='leaving'>Départ</Label>
                    <Input
                      id='leaving'
                      name='leaving'
                      type='number'
                      value={formData.leaving}
                      onChange={handleInputChange}
                      required
                      min='0'
                      max='23'
                      placeholder='12'
                    />
                  </div>
                </div>

                <Separator className='my-6' />

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='space-y-2'>
                    <Label htmlFor='basePrice'>Prix par nuit</Label>
                    <div className='relative'>
                      <Input
                        id='basePrice'
                        name='basePrice'
                        type='text'
                        value={formData.basePrice}
                        onChange={handleInputChange}
                        required
                        placeholder='100'
                        className='pl-8'
                      />
                      <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500'>
                        €
                      </span>
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='basePrice'>Prix par nuit en MGA</Label>
                    <div className='relative'>
                      <Input
                          id='basePrice'
                          name='basePrice'
                          type='text'
                          value={formData.basePrice}
                          onChange={handleInputChange}
                          required
                          placeholder='100'
                          className='pl-8'
                      />
                      <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500'>
                        Ar
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Options et Services */}
            <Card>
              <CardHeader>
                <CardTitle>Options et Services</CardTitle>
                <CardDescription>Ce que propose votre hébergement</CardDescription>
              </CardHeader>
              <CardContent className='space-y-8'>
                {/* Sécurité */}
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <Label className='text-lg font-semibold'>Sécurité</Label>
                  </div>
                  <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                    {securities.map(security => (
                      <label
                        key={security.id}
                        className='flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-blue-500 transition-colors cursor-pointer'
                      >
                        <input
                          type='checkbox'
                          checked={formData.selectedSecurities.includes(security.id)}
                          onChange={() => handleCheckboxChange('securities', security.id)}
                          className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                        />
                        <span className='text-sm font-medium'>{security.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Repas */}
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <Label className='text-lg font-semibold'>Options de repas</Label>
                  </div>
                  <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                    {meals.map(meal => (
                      <label
                        key={meal.id}
                        className='flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-blue-500 transition-colors cursor-pointer'
                      >
                        <input
                          type='checkbox'
                          checked={formData.selectedMeals.includes(meal.id)}
                          onChange={() => handleCheckboxChange('meals', meal.id)}
                          className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                        />
                        <span className='text-sm font-medium'>{meal.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Équipements */}
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <Label className='text-lg font-semibold'>Équipements</Label>
                  </div>
                  <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                    {equipments.map(equipment => (
                      <label
                        key={equipment.id}
                        className='flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-blue-500 transition-colors cursor-pointer'
                      >
                        <input
                          type='checkbox'
                          checked={formData.selectedEquipments.includes(equipment.id)}
                          onChange={() => handleCheckboxChange('equipments', equipment.id)}
                          className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                        />
                        <span className='text-sm font-medium'>{equipment.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Services */}
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <Label className='text-lg font-semibold'>Services</Label>
                  </div>
                  <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                    {services.map(service => (
                      <label
                        key={service.id}
                        className='flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-blue-500 transition-colors cursor-pointer'
                      >
                        <input
                          type='checkbox'
                          checked={formData.selectedServices.includes(service.id)}
                          onChange={() => handleCheckboxChange('services', service.id)}
                          className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                        />
                        <span className='text-sm font-medium'>{service.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle>Photos de l'hébergement</CardTitle>
                <CardDescription>
                  Ajoutez des photos attrayantes de votre hébergement
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='flex items-center justify-center w-full'>
                  <label className='flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300'>
                    <div className='flex flex-col items-center justify-center pt-5 pb-6'>
                      <svg
                        className='w-8 h-8 mb-4 text-gray-500'
                        aria-hidden='true'
                        xmlns='http://www.w3.org/2000/svg'
                        fill='none'
                        viewBox='0 0 20 16'
                      >
                        <path
                          stroke='currentColor'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth='2'
                          d='M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2'
                        />
                      </svg>
                      <p className='mb-2 text-sm text-gray-500'>
                        <span className='font-semibold'>Cliquez pour ajouter</span> ou glissez et
                        déposez
                      </p>
                      <p className='text-xs text-gray-500'>PNG, JPG (MAX. 800x400px)</p>
                    </div>
                    <Input
                      type='file'
                      multiple
                      accept='image/*'
                      onChange={handleImageChange}
                      className='hidden'
                    />
                  </label>
                </div>

                <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                  {previewImages.map((preview, index) => (
                    <div
                      key={index}
                      className='relative group rounded-lg overflow-hidden shadow-sm'
                    >
                      <Image
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        width={200}
                        height={128}
                        className='w-full h-32 object-cover group-hover:opacity-75 transition-opacity'
                      />
                      <Button
                        type='button'
                        variant='destructive'
                        size='sm'
                        className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity'
                        onClick={() => {
                          setImages(prev => prev.filter((_, i) => i !== index))
                          setPreviewImages(prev => prev.filter((_, i) => i !== index))
                        }}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Nearby Places */}
            <Card>
              <CardHeader>
                <CardTitle>Lieux à proximité</CardTitle>
                <CardDescription>
                  Ajoutez les points d&apos;intérêt proches de votre hébergement
                </CardDescription>
              </CardHeader>
              <CardContent>
                {formData.nearbyPlaces.map((place, index) => (
                  <div key={index} className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                    <div>
                      <Label htmlFor={`place-name-${index}`}>Nom du lieu</Label>
                      <Input
                        id={`place-name-${index}`}
                        value={place.name}
                        onChange={e => {
                          const newPlaces = [...formData.nearbyPlaces]
                          newPlaces[index].name = e.target.value
                          setFormData(prev => ({ ...prev, nearbyPlaces: newPlaces }))
                        }}
                        placeholder='ex: Plage, Restaurant...'
                      />
                    </div>
                    <div>
                      <Label htmlFor={`place-distance-${index}`}>Distance (en mètres)</Label>
                      <Input
                        id={`place-distance-${index}`}
                        type='number'
                        value={place.distance}
                        onChange={e => {
                          const newPlaces = [...formData.nearbyPlaces]
                          newPlaces[index].distance = parseInt(e.target.value)
                          setFormData(prev => ({ ...prev, nearbyPlaces: newPlaces }))
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`place-duration-${index}`}>Durée (en minutes)</Label>
                      <Input
                        id={`place-duration-${index}`}
                        type='number'
                        value={place.duration}
                        onChange={e => {
                          const newPlaces = [...formData.nearbyPlaces]
                          newPlaces[index].duration = parseInt(e.target.value)
                          setFormData(prev => ({ ...prev, nearbyPlaces: newPlaces }))
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`place-transport-${index}`}>Moyen de transport</Label>
                      <Input
                        id={`place-transport-${index}`}
                        value={place.transport}
                        onChange={e => {
                          const newPlaces = [...formData.nearbyPlaces]
                          newPlaces[index].transport = e.target.value
                          setFormData(prev => ({ ...prev, nearbyPlaces: newPlaces }))
                        }}
                        placeholder='ex: à pied, en voiture...'
                      />
                    </div>
                  </div>
                ))}
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      nearbyPlaces: [
                        ...prev.nearbyPlaces,
                        { name: '', distance: 0, duration: 0, transport: '' },
                      ],
                    }))
                  }}
                >
                  Ajouter un lieu
                </Button>
              </CardContent>
            </Card>

            {/* Transport Options */}
            <Card>
              <CardHeader>
                <CardTitle>Options de transport</CardTitle>
                <CardDescription>Indiquez les moyens de transport disponibles</CardDescription>
              </CardHeader>
              <CardContent>
                {formData.transportOptions.map((option, index) => (
                  <div key={index} className='grid grid-cols-1 gap-4 mb-4'>
                    <div>
                      <Label htmlFor={`transport-name-${index}`}>Type de transport</Label>
                      <Input
                        id={`transport-name-${index}`}
                        value={option.name}
                        onChange={e => {
                          const newOptions = [...formData.transportOptions]
                          newOptions[index].name = e.target.value
                          setFormData(prev => ({ ...prev, transportOptions: newOptions }))
                        }}
                        placeholder='ex: Parking gratuit, Taxi...'
                      />
                    </div>
                    <div>
                      <Label htmlFor={`transport-description-${index}`}>
                        Description (optionnel)
                      </Label>
                      <Input
                        id={`transport-description-${index}`}
                        value={option.description}
                        onChange={e => {
                          const newOptions = [...formData.transportOptions]
                          newOptions[index].description = e.target.value
                          setFormData(prev => ({ ...prev, transportOptions: newOptions }))
                        }}
                        placeholder='Détails supplémentaires...'
                      />
                    </div>
                  </div>
                ))}
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      transportOptions: [...prev.transportOptions, { name: '', description: '' }],
                    }))
                  }}
                >
                  Ajouter une option de transport
                </Button>
              </CardContent>
            </Card>

            {/* Property Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informations sur la propriété</CardTitle>
                <CardDescription>
                  Détails sur l&apos;accessibilité et les caractéristiques
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-2 gap-4 mb-4'>
                  <div className='flex items-center gap-2'>
                    <input
                      type='checkbox'
                      id='hasStairs'
                      checked={formData.propertyInfo.hasStairs}
                      onChange={e => {
                        setFormData(prev => ({
                          ...prev,
                          propertyInfo: { ...prev.propertyInfo, hasStairs: e.target.checked },
                        }))
                      }}
                    />
                    <Label htmlFor='hasStairs'>Escaliers</Label>
                  </div>
                  <div className='flex items-center gap-2'>
                    <input
                      type='checkbox'
                      id='hasElevator'
                      checked={formData.propertyInfo.hasElevator}
                      onChange={e => {
                        setFormData(prev => ({
                          ...prev,
                          propertyInfo: { ...prev.propertyInfo, hasElevator: e.target.checked },
                        }))
                      }}
                    />
                    <Label htmlFor='hasElevator'>Ascenseur</Label>
                  </div>
                  <div className='flex items-center gap-2'>
                    <input
                      type='checkbox'
                      id='hasHandicapAccess'
                      checked={formData.propertyInfo.hasHandicapAccess}
                      onChange={e => {
                        setFormData(prev => ({
                          ...prev,
                          propertyInfo: {
                            ...prev.propertyInfo,
                            hasHandicapAccess: e.target.checked,
                          },
                        }))
                      }}
                    />
                    <Label htmlFor='hasHandicapAccess'>Accès handicapé</Label>
                  </div>
                  <div className='flex items-center gap-2'>
                    <input
                      type='checkbox'
                      id='hasPetsOnProperty'
                      checked={formData.propertyInfo.hasPetsOnProperty}
                      onChange={e => {
                        setFormData(prev => ({
                          ...prev,
                          propertyInfo: {
                            ...prev.propertyInfo,
                            hasPetsOnProperty: e.target.checked,
                          },
                        }))
                      }}
                    />
                    <Label htmlFor='hasPetsOnProperty'>Animaux sur la propriété</Label>
                  </div>
                </div>
                <div>
                  <Label htmlFor='additionalNotes'>Notes supplémentaires</Label>
                  <Input
                    id='additionalNotes'
                    value={formData.propertyInfo.additionalNotes}
                    onChange={e => {
                      setFormData(prev => ({
                        ...prev,
                        propertyInfo: { ...prev.propertyInfo, additionalNotes: e.target.value },
                      }))
                    }}
                    placeholder='Autres informations importantes...'
                  />
                </div>
              </CardContent>
            </Card>

            {/* Cancellation Policy */}
            <Card>
              <CardHeader>
                <CardTitle>Politique d&apos;annulation</CardTitle>
                <CardDescription>Définissez les conditions d&apos;annulation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <Label htmlFor='freeCancellationHours'>
                      Délai d&apos;annulation gratuite (heures)
                    </Label>
                    <Input
                      id='freeCancellationHours'
                      type='number'
                      value={formData.cancellationPolicy.freeCancellationHours}
                      onChange={e => {
                        setFormData(prev => ({
                          ...prev,
                          cancellationPolicy: {
                            ...prev.cancellationPolicy,
                            freeCancellationHours: parseInt(e.target.value),
                          },
                        }))
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor='partialRefundPercent'>Pourcentage de remboursement</Label>
                    <Input
                      id='partialRefundPercent'
                      type='number'
                      value={formData.cancellationPolicy.partialRefundPercent}
                      onChange={e => {
                        setFormData(prev => ({
                          ...prev,
                          cancellationPolicy: {
                            ...prev.cancellationPolicy,
                            partialRefundPercent: parseInt(e.target.value),
                          },
                        }))
                      }}
                    />
                  </div>
                </div>
                <div className='mt-4'>
                  <Label htmlFor='additionalTerms'>Conditions supplémentaires</Label>
                  <Input
                    id='additionalTerms'
                    value={formData.cancellationPolicy.additionalTerms}
                    onChange={e => {
                      setFormData(prev => ({
                        ...prev,
                        cancellationPolicy: {
                          ...prev.cancellationPolicy,
                          additionalTerms: e.target.value,
                        },
                      }))
                    }}
                    placeholder="Autres conditions d'annulation..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit button */}
            <div className='flex justify-end'>
              <Button type='submit' disabled={loading} className='px-8 py-2 text-lg'>
                {loading ? (
                  <div className='flex items-center space-x-2'>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                    <span>Création en cours...</span>
                  </div>
                ) : (
                  "Créer l'annonce"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
