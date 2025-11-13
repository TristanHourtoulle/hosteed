import { DayEnum, ExtraPriceType } from '@prisma/client'

// ===== INTERFACES DE SUPPORT =====

export interface NearbyPlace {
  name: string
  distance: string
  unit: 'mètres' | 'kilomètres'
}

export interface ImageFile {
  file: File | null  // null for existing images from DB
  preview: string     // URL for existing images, base64 for new images
  id: string
  isExisting?: boolean  // true if image already exists in DB
  url?: string          // Original URL for existing images
}

export interface SpecialPrice {
  id: string
  pricesMga: string
  pricesEuro: string
  day: DayEnum[]
  startDate: Date | null
  endDate: Date | null
  activate: boolean
}

export interface TestBooking {
  startDate: Date
  endDate: Date
  guestCount: number
}

// ===== INTERFACE PRINCIPALE UNIFIÉE =====

/**
 * Type unifié pour les formulaires de création et édition de produits
 * Utilisé par : createProduct, host/edit, admin/validation
 */
export interface ProductFormData {
  // ===== INFORMATIONS DE BASE =====
  name: string
  description: string
  typeId: string

  // ===== LOCALISATION & CONTACT =====
  address: string           // Localisation Google Maps (visible sur l'annonce)
  completeAddress: string   // Adresse complète manuelle (mail de confirmation)
  placeId?: string          // Google Places ID
  latitude: number          // GPS latitude (récupéré via CityAutocomplete)
  longitude: number         // GPS longitude (récupéré via CityAutocomplete)
  phone: string
  phoneCountry: string

  // ===== CARACTÉRISTIQUES =====
  typeRentId: string        // Alias for typeId (backward compatibility)
  room: string              // Nombre de chambres
  bathroom: string          // Nombre de salles de bain
  surface: string           // Surface en m²
  minPeople: string         // Capacité minimum
  maxPeople: string         // Capacité maximum
  arriving: string          // Heure d'arrivée
  leaving: string           // Heure de départ

  // ===== TARIFICATION =====
  basePrice: string         // Prix de base en EUR
  priceMGA: string          // Prix en Ariary
  basePriceMGA: string      // Alias for priceMGA (backward compatibility)
  specialPrices: SpecialPrice[]  // Tarifs spéciaux (jours/périodes)
  autoAccept: boolean       // Acceptation automatique des réservations

  // ===== RELATIONS (IDs) =====
  equipmentIds: string[]        // Équipements disponibles
  mealIds: string[]             // Options de repas
  securityIds: string[]         // Équipements de sécurité
  serviceIds: string[]          // Services additionnels
  includedServiceIds: string[]  // Services inclus dans le prix
  extraIds: string[]            // Options payantes supplémentaires
  highlightIds: string[]        // Points forts de l'hébergement

  // ===== INFORMATIONS COMPLÉMENTAIRES =====
  accessibility: boolean        // Accessible PMR
  petFriendly: boolean         // Animaux acceptés
  nearbyPlaces: NearbyPlace[]  // Lieux à proximité
  proximityLandmarks: string[] // Points de repère (texte libre)
  transportation: string       // Moyens de transport disponibles

  // ===== CONFIGURATION HÔTEL =====
  isHotel: boolean
  hotelName: string
  availableRooms: string

  // ===== FLEXIBILITÉ =====
  [key: string]: unknown   // Pour extensions futures
}

// ===== TYPES UTILITAIRES =====

/**
 * Erreurs de validation par champ
 */
export type ProductFormErrors = Partial<Record<keyof ProductFormData, string>>

/**
 * État global du formulaire
 */
export interface ProductFormState {
  data: ProductFormData
  errors: ProductFormErrors
  isDirty: boolean
  isSubmitting: boolean
}

/**
 * Données initiales par défaut pour un formulaire vide
 */
export const DEFAULT_FORM_DATA: ProductFormData = {
  name: '',
  description: '',
  typeId: '',
  address: '',
  completeAddress: '',
  placeId: '',
  latitude: 0,
  longitude: 0,
  phone: '',
  phoneCountry: 'MG',
  typeRentId: '',
  room: '',
  bathroom: '',
  surface: '',
  minPeople: '',
  maxPeople: '',
  arriving: '',
  leaving: '',
  basePrice: '',
  priceMGA: '',
  basePriceMGA: '',
  specialPrices: [],
  autoAccept: false,
  equipmentIds: [],
  mealIds: [],
  securityIds: [],
  serviceIds: [],
  includedServiceIds: [],
  extraIds: [],
  highlightIds: [],
  accessibility: false,
  petFriendly: false,
  nearbyPlaces: [],
  proximityLandmarks: [],
  transportation: '',
  isHotel: false,
  hotelName: '',
  availableRooms: '',
}
