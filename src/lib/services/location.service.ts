/**
 * Service centralisé pour la gestion des localisations
 *
 * Ce service unifie toutes les fonctionnalités liées à la localisation:
 * - Extraction des composants d'adresse depuis Google Places API
 * - Formatage de l'affichage des localisations
 * - Parsing des adresses existantes pour la migration
 * - Utilitaires de recherche par localisation
 *
 * IMPORTANT: Ce service doit être utilisé par TOUS les composants qui manipulent
 * des localisations pour garantir la cohérence dans toute l'application.
 */

import {
  GooglePlaceDetails,
  GooglePlacePrediction,
  googleSuggestionService,
} from './GoogleSuggestion.service'

// ============================================
// TYPES
// ============================================

/**
 * Composants structurés d'une adresse
 */
export interface LocationComponents {
  /** Adresse complète formatée (ex: "Ambondrona, Nosy Be, Madagascar") */
  formattedAddress: string
  /** Quartier/sous-localité (ex: "Ambondrona") */
  neighborhood: string | null
  /** Ville/localité (ex: "Nosy Be") */
  city: string | null
  /** Région/État/Province (ex: "Diana") */
  region: string | null
  /** Pays (ex: "Madagascar") */
  country: string
  /** ID Google Places pour référence */
  googlePlaceId: string | null
  /** Coordonnées GPS */
  coordinates: {
    latitude: number
    longitude: number
  } | null
}

/**
 * Options pour le formatage de l'affichage de la localisation
 */
export interface LocationDisplayOptions {
  /** Inclure le quartier */
  includeNeighborhood?: boolean
  /** Inclure la ville */
  includeCity?: boolean
  /** Inclure la région */
  includeRegion?: boolean
  /** Inclure le pays */
  includeCountry?: boolean
  /** Séparateur entre les éléments (default: ", ") */
  separator?: string
  /** Texte par défaut si aucune donnée */
  fallback?: string
}

/**
 * Données de produit pour le formatage de la localisation
 */
export interface ProductLocationData {
  address?: string | null
  neighborhood?: string | null
  city?: string | null
  region?: string | null
  country?: string | null
}

// ============================================
// CLASSE PRINCIPALE
// ============================================

class LocationService {
  /**
   * Extrait les composants d'adresse depuis les détails d'un lieu Google Places
   *
   * @param placeDetails - Détails du lieu depuis Google Places API
   * @returns Composants structurés de l'adresse
   */
  extractComponentsFromPlaceDetails(placeDetails: GooglePlaceDetails): LocationComponents {
    const addressComponents = placeDetails.address_components || []

    const findComponent = (types: string[]): string | null => {
      for (const type of types) {
        const component = addressComponents.find(comp => comp.types.includes(type))
        if (component) {
          return component.long_name
        }
      }
      return null
    }

    // Extraction des composants avec plusieurs fallbacks
    const neighborhood = findComponent([
      'neighborhood',
      'sublocality_level_1',
      'sublocality',
      'route',
    ])

    const city = findComponent([
      'locality',
      'administrative_area_level_2',
      'postal_town',
      'sublocality_level_1',
    ])

    const region = findComponent([
      'administrative_area_level_1',
      'administrative_area_level_2',
    ])

    const country = findComponent(['country']) || 'Madagascar'

    return {
      formattedAddress: placeDetails.formatted_address,
      neighborhood,
      city,
      region,
      country,
      googlePlaceId: placeDetails.place_id,
      coordinates: placeDetails.geometry?.location
        ? {
            latitude: placeDetails.geometry.location.lat,
            longitude: placeDetails.geometry.location.lng,
          }
        : null,
    }
  }

  /**
   * Récupère les composants d'adresse depuis un place_id Google
   *
   * @param placeId - ID du lieu Google Places
   * @param sessionToken - Token de session optionnel pour le billing
   * @returns Composants structurés de l'adresse ou null si erreur
   */
  async getLocationComponentsFromPlaceId(
    placeId: string,
    sessionToken?: string
  ): Promise<LocationComponents | null> {
    try {
      const placeDetails = await googleSuggestionService.getPlaceDetails({
        placeId,
        fields: ['place_id', 'name', 'formatted_address', 'geometry', 'address_components', 'types'],
        sessionToken,
      })

      if (!placeDetails) {
        return null
      }

      return this.extractComponentsFromPlaceDetails(placeDetails)
    } catch (error) {
      console.error('Erreur lors de la récupération des composants de localisation:', error)
      return null
    }
  }

  /**
   * Parse une adresse textuelle existante pour en extraire les composants
   * Utilisé pour la migration des données existantes
   *
   * @param address - Adresse complète sous forme de chaîne
   * @returns Composants parsés de l'adresse
   */
  parseExistingAddress(address: string): Partial<LocationComponents> {
    if (!address || address.trim() === '') {
      return {
        formattedAddress: '',
        neighborhood: null,
        city: null,
        region: null,
        country: 'Madagascar',
      }
    }

    const parts = address.split(',').map(part => part.trim()).filter(Boolean)

    // Cas typiques pour Madagascar:
    // 1 part: "Antananarivo" -> city
    // 2 parts: "Nosy Be, Madagascar" -> city, country
    // 3 parts: "Ambondrona, Nosy Be, Madagascar" -> neighborhood, city, country
    // 4+ parts: "Rue X, Ambondrona, Nosy Be, Madagascar" -> street..., neighborhood, city, country

    let neighborhood: string | null = null
    let city: string | null = null
    let region: string | null = null
    let country = 'Madagascar'

    if (parts.length === 1) {
      // Probablement juste une ville
      city = parts[0]
    } else if (parts.length === 2) {
      // Ville, Pays ou Quartier, Ville
      const lastPart = parts[parts.length - 1].toLowerCase()
      if (this.isCountry(lastPart)) {
        city = parts[0]
        country = parts[1]
      } else {
        neighborhood = parts[0]
        city = parts[1]
      }
    } else if (parts.length === 3) {
      // Quartier, Ville, Pays
      const lastPart = parts[parts.length - 1].toLowerCase()
      if (this.isCountry(lastPart)) {
        neighborhood = parts[0]
        city = parts[1]
        country = parts[2]
      } else {
        // Rue, Quartier, Ville
        neighborhood = parts[1]
        city = parts[2]
      }
    } else if (parts.length >= 4) {
      // Format complet: Rue, Quartier, Ville, Pays
      // ou: Rue, Quartier, Ville, Région, Pays
      const lastPart = parts[parts.length - 1].toLowerCase()
      if (this.isCountry(lastPart)) {
        country = parts[parts.length - 1]

        // Vérifier si l'avant-dernier est une région connue
        if (parts.length >= 5 && this.isMadagascarRegion(parts[parts.length - 2])) {
          region = parts[parts.length - 2]
          city = parts[parts.length - 3]
          neighborhood = parts[parts.length - 4]
        } else {
          city = parts[parts.length - 2]
          neighborhood = parts[parts.length - 3]
        }
      } else {
        // Pas de pays détecté, prendre les derniers éléments
        city = parts[parts.length - 1]
        neighborhood = parts[parts.length - 2]
      }
    }

    return {
      formattedAddress: address,
      neighborhood,
      city,
      region,
      country,
    }
  }

  /**
   * Formate la localisation pour l'affichage
   *
   * @param product - Données de localisation du produit
   * @param options - Options de formatage
   * @returns Chaîne formatée pour l'affichage
   */
  formatLocationDisplay(
    product: ProductLocationData,
    options: LocationDisplayOptions = {}
  ): string {
    const {
      includeNeighborhood = true,
      includeCity = true,
      includeRegion = false,
      includeCountry = true,
      separator = ', ',
      fallback = 'Localisation non spécifiée',
    } = options

    const parts: string[] = []

    // Si on a les nouveaux champs structurés, les utiliser
    if (product.neighborhood || product.city) {
      if (includeNeighborhood && product.neighborhood) {
        parts.push(product.neighborhood)
      }
      if (includeCity && product.city) {
        parts.push(product.city)
      }
      if (includeRegion && product.region) {
        parts.push(product.region)
      }
      if (includeCountry && product.country) {
        parts.push(product.country)
      }
    } else if (product.address) {
      // Fallback: parser l'adresse existante pour l'affichage
      const parsed = this.parseExistingAddress(product.address)
      if (includeNeighborhood && parsed.neighborhood) {
        parts.push(parsed.neighborhood)
      }
      if (includeCity && parsed.city) {
        parts.push(parsed.city)
      }
      if (includeRegion && parsed.region) {
        parts.push(parsed.region)
      }
      if (includeCountry && parsed.country) {
        parts.push(parsed.country)
      }
    }

    return parts.length > 0 ? parts.join(separator) : fallback
  }

  /**
   * Formate la localisation pour les cartes produit (format court)
   * Affiche: "Quartier, Ville" ou "Ville, Pays" si pas de quartier
   *
   * @param product - Données de localisation du produit
   * @returns Chaîne formatée courte
   */
  formatShortLocation(product: ProductLocationData): string {
    // Si on a les nouveaux champs structurés
    if (product.neighborhood && product.city) {
      return `${product.neighborhood}, ${product.city}`
    }

    if (product.city && product.country) {
      return `${product.city}, ${product.country}`
    }

    if (product.city) {
      return product.city
    }

    // Fallback: parser l'adresse existante
    if (product.address) {
      const parsed = this.parseExistingAddress(product.address)
      if (parsed.neighborhood && parsed.city) {
        return `${parsed.neighborhood}, ${parsed.city}`
      }
      if (parsed.city && parsed.country) {
        return `${parsed.city}, ${parsed.country}`
      }
      if (parsed.city) {
        return parsed.city
      }
    }

    return 'Localisation non spécifiée'
  }

  /**
   * Formate la localisation complète avec pays
   *
   * @param product - Données de localisation du produit
   * @returns Chaîne formatée complète
   */
  formatFullLocation(product: ProductLocationData): string {
    return this.formatLocationDisplay(product, {
      includeNeighborhood: true,
      includeCity: true,
      includeRegion: false,
      includeCountry: true,
    })
  }

  /**
   * Construit une adresse complète à partir des composants
   *
   * @param components - Composants de l'adresse
   * @returns Adresse complète formatée
   */
  buildAddressFromComponents(components: Partial<LocationComponents>): string {
    const parts: string[] = []

    if (components.neighborhood) parts.push(components.neighborhood)
    if (components.city) parts.push(components.city)
    if (components.region) parts.push(components.region)
    if (components.country) parts.push(components.country)

    return parts.join(', ')
  }

  /**
   * Extrait le nom de ville depuis une prédiction Google
   *
   * @param prediction - Prédiction Google Places
   * @returns Nom de la ville
   */
  getCityFromPrediction(prediction: GooglePlacePrediction): string {
    return prediction.structured_formatting.main_text
  }

  /**
   * Vérifie si une chaîne est un nom de pays
   */
  private isCountry(value: string): boolean {
    const countries = [
      'madagascar',
      'france',
      'maurice',
      'mayotte',
      'reunion',
      'la réunion',
      'comores',
      'seychelles',
    ]
    return countries.includes(value.toLowerCase())
  }

  /**
   * Vérifie si une chaîne est une région de Madagascar
   */
  private isMadagascarRegion(value: string): boolean {
    const regions = [
      'diana',
      'sava',
      'itasy',
      'analamanga',
      'vakinankaratra',
      'bongolava',
      'sofia',
      'boeny',
      'betsiboka',
      'melaky',
      'alaotra-mangoro',
      'atsinanana',
      'analanjirofo',
      'amoron\'i mania',
      'haute matsiatra',
      'vatovavy-fitovinany',
      'ihorombe',
      'atsimo-atsinanana',
      'atsimo-andrefana',
      'androy',
      'anosy',
      'menabe',
    ]
    return regions.includes(value.toLowerCase())
  }
}

// ============================================
// EXPORT SINGLETON
// ============================================

export const locationService = new LocationService()

// ============================================
// EXPORTS UTILITAIRES POUR USAGE DIRECT
// ============================================

/**
 * Formate la localisation pour l'affichage sur les cartes produit
 * Utiliser cette fonction dans ProductCard, VirtualizedProductList, etc.
 */
export const formatProductLocation = (product: ProductLocationData): string => {
  return locationService.formatShortLocation(product)
}

/**
 * Formate la localisation complète avec pays
 * Utiliser dans les pages de détail produit
 */
export const formatFullProductLocation = (product: ProductLocationData): string => {
  return locationService.formatFullLocation(product)
}

/**
 * Extrait les composants d'adresse depuis un place_id Google
 * Utiliser dans AddressAutocomplete lors de la sélection
 */
export const getLocationComponents = async (
  placeId: string,
  sessionToken?: string
): Promise<LocationComponents | null> => {
  return locationService.getLocationComponentsFromPlaceId(placeId, sessionToken)
}

/**
 * Parse une adresse existante pour en extraire les composants
 * Utiliser pour la migration des données
 */
export const parseAddress = (address: string): Partial<LocationComponents> => {
  return locationService.parseExistingAddress(address)
}

/**
 * Construit une adresse complète à partir des composants
 */
export const buildAddress = (components: Partial<LocationComponents>): string => {
  return locationService.buildAddressFromComponents(components)
}

export default locationService
