import { useState } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  createProductSchema,
  type CreateProductFormData,
  validateImages,
} from '@/lib/schemas/product.schema'
import { createProduct } from '@/lib/services/product.service'

// Hook personnalisé pour le formulaire de création de produit
export function useCreateProductForm() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [globalError, setGlobalError] = useState<string>('')

  // Configuration du formulaire avec react-hook-form et Zod
  const form = useForm<CreateProductFormData>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: '',
      description: '',
      address: '',
      phone: '',
      room: '',
      bathroom: '',
      arriving: '14',
      leaving: '12',
      basePrice: '',
      priceMGA: '',
      autoAccept: false,
      accessibility: false,
      petFriendly: false,
      typeId: '',
      equipmentIds: [],
      mealIds: [],
      securityIds: [],
      serviceIds: [],
      surface: '',
      maxPeople: '',
      transportation: '',
      nearbyPlaces: [],
    },
    mode: 'onChange', // Validation en temps réel
  })

  // Fonction de conversion d'images en base64
  const convertFilesToBase64 = async (files: File[]): Promise<string[]> => {
    setIsUploadingImages(true)
    try {
      const promises = files.map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
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

  // Validation des images
  const validateAndSetImages = (files: File[]): boolean => {
    const validation = validateImages(files)

    if (!validation.success) {
      const errorMessage = validation.error.issues.map(issue => issue.message).join(', ')
      setGlobalError(`Erreur images: ${errorMessage}`)
      return false
    }

    setSelectedFiles(files)
    setGlobalError('')
    return true
  }

  // Gestion de la soumission du formulaire
  const onSubmit: SubmitHandler<CreateProductFormData> = async data => {
    setIsLoading(true)
    setGlobalError('')

    try {
      // Vérification de la session
      if (!session?.user?.id) {
        setGlobalError('Vous devez être connecté pour créer une annonce')
        return
      }

      // Validation des images
      if (selectedFiles.length === 0) {
        setGlobalError('Veuillez ajouter au moins une photo de votre hébergement')
        return
      }

      // Conversion des images
      const base64Images = await convertFilesToBase64(selectedFiles)

      // Préparation des données pour l'API
      const productData = {
        name: data.name,
        description: data.description,
        address: data.address,
        longitude: 0, // Valeur par défaut
        latitude: 0, // Valeur par défaut
        basePrice: data.basePrice,
        priceMGA: data.priceMGA,
        room: data.room ? Number(data.room) : null,
        bathroom: data.bathroom ? Number(data.bathroom) : null,
        arriving: Number(data.arriving),
        leaving: Number(data.leaving),
        phone: data.phone || '',
        typeId: data.typeId,
        userId: [session.user.id],
        equipments: data.equipmentIds,
        services: data.serviceIds,
        meals: data.mealIds,
        securities: data.securityIds,
        images: base64Images,
        nearbyPlaces: data.nearbyPlaces.map(place => ({
          name: place.name,
          distance: place.distance ? Number(place.distance) : 0,
          duration: 0,
          transport: place.unit === 'kilomètres' ? 'voiture' : 'à pied',
        })),
      }

      console.log('🚀 Création du produit avec les données validées:', productData)

      // Appel de l'API
      const result = await createProduct(productData)

      if (result) {
        console.log('✅ Produit créé avec succès:', result.id)
        router.push('/dashboard')
      } else {
        throw new Error("Aucun résultat retourné par l'API")
      }
    } catch (error) {
      console.error('❌ Erreur lors de la création:', error)
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue lors de la création de l'annonce"
      setGlobalError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Fonction pour ajouter un lieu à proximité
  const addNearbyPlace = (place: {
    name: string
    distance: string
    unit: 'mètres' | 'kilomètres'
  }) => {
    const currentPlaces = form.getValues('nearbyPlaces')
    form.setValue('nearbyPlaces', [...currentPlaces, place], { shouldValidate: true })
  }

  // Fonction pour supprimer un lieu à proximité
  const removeNearbyPlace = (index: number) => {
    const currentPlaces = form.getValues('nearbyPlaces')
    form.setValue(
      'nearbyPlaces',
      currentPlaces.filter((_, i) => i !== index),
      { shouldValidate: true }
    )
  }

  // Fonction pour gérer les checkbox des équipements/services
  const toggleArrayValue = (
    fieldName: keyof Pick<
      CreateProductFormData,
      'equipmentIds' | 'mealIds' | 'securityIds' | 'serviceIds'
    >,
    value: string
  ) => {
    const currentValues = form.getValues(fieldName)
    const newValues = currentValues.includes(value)
      ? currentValues.filter(id => id !== value)
      : [...currentValues, value]

    form.setValue(fieldName, newValues, { shouldValidate: true })
  }

  return {
    // React Hook Form
    form,
    formState: form.formState,
    register: form.register,
    control: form.control,
    watch: form.watch,
    setValue: form.setValue,
    getValues: form.getValues,

    // États personnalisés
    isLoading,
    isUploadingImages,
    globalError,
    selectedFiles,

    // Fonctions
    onSubmit: form.handleSubmit(onSubmit),
    validateAndSetImages,
    addNearbyPlace,
    removeNearbyPlace,
    toggleArrayValue,

    // Utilitaires
    clearGlobalError: () => setGlobalError(''),
    isValid: form.formState.isValid,
    errors: form.formState.errors,
  }
}
