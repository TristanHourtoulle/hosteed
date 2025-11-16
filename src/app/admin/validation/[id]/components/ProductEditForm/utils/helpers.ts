import { compressImages, formatFileSize } from '@/lib/utils/imageCompression'
import type { ImageFile, FormData, NearbyPlace } from '../types'
import type { ErrorDetails } from '@/components/ui/ErrorAlert'

// API functions for loading data
export const loadIncludedServices = async () => {
  const response = await fetch('/api/user/included-services')
  if (response.ok) {
    return await response.json()
  }
  return []
}

export const loadExtras = async () => {
  const response = await fetch('/api/user/extras')
  if (response.ok) {
    return await response.json()
  }
  return []
}

export const loadHighlights = async () => {
  const response = await fetch('/api/user/highlights')
  if (response.ok) {
    return await response.json()
  }
  return []
}

// Image handling functions
export const initializeExistingImages = (productImages: { img: string }[]): ImageFile[] => {
  if (!productImages || productImages.length === 0) return []

  return productImages.map((img, index) => ({
    file: new File([], `existing-${index}.jpg`),
    preview: img.img,
    id: `existing-${index}-${Date.now()}`,
  }))
}

export const validateImageFile = (file: File): ErrorDetails | null => {
  if (!file.type.startsWith('image/')) {
    return {
      type: 'file',
      title: 'Format de fichier non supporté',
      message: 'Seules les images sont acceptées.',
      details: [`Fichier rejeté: ${file.name}`, `Type détecté: ${file.type || 'inconnu'}`],
      suggestions: [
        'Utilisez uniquement des fichiers image (JPEG, PNG, WebP, GIF)',
        "Vérifiez l'extension de vos fichiers",
        'Évitez les documents ou vidéos',
      ],
    }
  }

  if (file.size > 50 * 1024 * 1024) {
    return {
      type: 'file',
      title: 'Image trop volumineuse',
      message: 'La taille de chaque image ne doit pas dépasser 50MB.',
      details: [
        `Fichier: ${file.name}`,
        `Taille: ${(file.size / (1024 * 1024)).toFixed(1)}MB`,
        'Limite: 50MB par image',
      ],
      suggestions: [
        'Réduisez la résolution de votre image',
        "Utilisez un outil de compression d'image en ligne",
        'Choisissez le format JPEG pour des images de plus petite taille',
      ],
    }
  }

  return null
}

export const validateImageCount = (
  currentCount: number,
  newCount: number
): ErrorDetails | null => {
  if (currentCount + newCount > 35) {
    return {
      type: 'file',
      title: "Trop d'images sélectionnées",
      message: 'Vous pouvez ajouter maximum 35 photos par annonce.',
      details: [
        `Images actuelles: ${currentCount}`,
        `Images à ajouter: ${newCount}`,
        `Total: ${currentCount + newCount}`,
        'Limite: 35 photos maximum',
      ],
      suggestions: [
        "Supprimez quelques images existantes avant d'en ajouter de nouvelles",
        'Sélectionnez vos meilleures photos pour mettre en valeur votre hébergement',
        "Vous pourrez ajouter d'autres photos après la création de l'annonce",
      ],
    }
  }

  return null
}

export const processImageFiles = async (files: File[]): Promise<ImageFile[]> => {
  const compressedFiles = await compressImages(files, {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    quality: 0.8,
  })

  // Log compression results
  compressedFiles.forEach((file, index) => {
    const originalSize = files[index].size
    console.log(
      `Compressed ${file.name}: ${formatFileSize(originalSize)} → ${formatFileSize(file.size)}`
    )
  })

  return compressedFiles.map((file, index) => ({
    file,
    preview: URL.createObjectURL(file),
    id: `img-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 11)}`,
  }))
}

export const convertFilesToBase64 = async (imageFiles: ImageFile[]): Promise<string[]> => {
  const files = imageFiles.filter(img => img.file !== null).map(img => img.file!)

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
        console.log(`Image ${index + 1} (${file.name}) final size: ${formatFileSize(file.size)}`)
        resolve(reader.result as string)
      }
      reader.onerror = () => reject(new Error(`Erreur de lecture de l'image: ${file.name}`))
      reader.readAsDataURL(file)
    })
  })

  return await Promise.all(promises)
}

export const removeFileById = (
  imageFiles: ImageFile[],
  id: string,
  setSelectedFiles: (files: ImageFile[]) => void
) => {
  const imageFile = imageFiles.find(img => img.id === id)
  if (imageFile?.preview && !imageFile.preview.startsWith('data:')) {
    URL.revokeObjectURL(imageFile.preview)
  }
  setSelectedFiles(imageFiles.filter(img => img.id !== id))
}

// Form validation functions
export const validateFormData = (formData: FormData): ErrorDetails | null => {
  if (!formData.name.trim()) {
    return {
      type: 'validation',
      title: 'Nom requis',
      message: "Le nom de l'hébergement est requis",
      details: ['Veuillez saisir un nom pour votre hébergement'],
      suggestions: ['Entrez un nom descriptif pour votre hébergement'],
      retryable: false,
    }
  }

  if (!formData.description.trim()) {
    return {
      type: 'validation',
      title: 'Description requise',
      message: 'La description est requise',
      details: ['Veuillez saisir une description pour votre hébergement'],
      suggestions: ['Décrivez votre hébergement en détail'],
      retryable: false,
    }
  }

  if (!formData.typeId) {
    return {
      type: 'validation',
      title: 'Type requis',
      message: "Veuillez sélectionner un type d'hébergement",
      details: ["Le type d'hébergement est obligatoire"],
      suggestions: ['Sélectionnez le type qui correspond le mieux à votre hébergement'],
      retryable: false,
    }
  }

  return null
}

// Nearby places management
export const addNearbyPlace = (
  currentPlaces: NearbyPlace[],
  newPlace: { name: string; distance: string; unit: 'mètres' | 'kilomètres' }
): NearbyPlace[] => {
  if (newPlace.name.trim()) {
    return [...currentPlaces, { ...newPlace }]
  }
  return currentPlaces
}

export const removeNearbyPlace = (places: NearbyPlace[], index: number): NearbyPlace[] => {
  return places.filter((_, i) => i !== index)
}
