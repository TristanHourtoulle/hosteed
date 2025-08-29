import { z } from 'zod'

// Schéma pour les lieux à proximité
export const nearbyPlaceSchema = z.object({
  name: z
    .string()
    .min(1, 'Le nom du lieu est obligatoire')
    .max(100, 'Le nom du lieu est trop long'),
  distance: z.string().min(1, 'La distance est obligatoire'),
  unit: z.enum(['mètres', 'kilomètres'], {
    errorMap: () => ({ message: 'L\'unité doit être "mètres" ou "kilomètres"' }),
  }),
})

// Schéma principal pour la création de produit
export const createProductSchema = z.object({
  // Informations de base
  name: z
    .string()
    .min(3, 'Le nom doit contenir au moins 3 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .trim(),

  description: z
    .string()
    .min(10, 'La description doit contenir au moins 10 caractères')
    .max(2000, 'La description ne peut pas dépasser 2000 caractères')
    .trim(),

  address: z
    .string()
    .min(5, "L'adresse doit contenir au moins 5 caractères")
    .max(200, "L'adresse ne peut pas dépasser 200 caractères")
    .trim(),

  phone: z.string().optional(),

  // Type d'hébergement
  typeId: z.string().min(1, "Veuillez sélectionner un type d'hébergement"),

  // Caractéristiques
  room: z.string().optional(),
  bathroom: z.string().optional(),

  // Horaires
  arriving: z.string(),
  leaving: z.string(),

  // Prix
  basePrice: z.string(),
  priceMGA: z.string(),

  // Options et équipements
  autoAccept: z.boolean(),
  accessibility: z.boolean(),
  petFriendly: z.boolean(),

  // IDs des relations (tableaux)
  equipmentIds: z.array(z.string()),
  mealIds: z.array(z.string()),
  securityIds: z.array(z.string()),
  serviceIds: z.array(z.string()),

  // Informations complémentaires
  surface: z.string().optional(),
  maxPeople: z.string().optional(),
  transportation: z.string().optional(),

  // Lieux à proximité
  nearbyPlaces: z.array(nearbyPlaceSchema),
})

// Type TypeScript dérivé du schéma
export type CreateProductFormData = z.infer<typeof createProductSchema>

// Schéma pour la validation des fichiers (images)
export const imageFileSchema = z.object({
  file: z
    .instanceof(File, { message: 'Fichier invalide' })
    .refine(file => file.size <= 10 * 1024 * 1024, {
      message: "La taille de l'image ne doit pas dépasser 10MB",
    })
    .refine(file => file.type.startsWith('image/'), {
      message: 'Le fichier doit être une image',
    })
    .refine(file => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type), {
      message: "Format d'image non supporté. Utilisez JPEG, PNG ou WebP",
    }),
})

// Validation pour les images multiples
export const imagesSchema = z
  .array(imageFileSchema)
  .min(1, 'Au moins une image est obligatoire')
  .max(35, 'Maximum 35 images autorisées')

// Fonction utilitaire pour valider les données du formulaire
export function validateProductForm(data: unknown) {
  return createProductSchema.safeParse(data)
}

// Fonction utilitaire pour valider les images
export function validateImages(files: File[]) {
  const fileObjects = files.map(file => ({ file }))
  return imagesSchema.safeParse(fileObjects)
}

// Messages d'erreur personnalisés
export const errorMessages = {
  required: 'Ce champ est obligatoire',
  email: 'Adresse email invalide',
  phone: 'Numéro de téléphone invalide',
  positive: 'Doit être un nombre positif',
  integer: 'Doit être un nombre entier',
  minLength: (min: number) => `Minimum ${min} caractères`,
  maxLength: (max: number) => `Maximum ${max} caractères`,
  invalidFormat: 'Format invalide',
  imageSize: 'Image trop volumineuse (max 10MB)',
  imageFormat: "Format d'image non supporté",
} as const
