// Types pour l'API Google Places Autocomplete
export interface GooglePlacePrediction {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
  types: string[]
  matched_substrings: Array<{
    length: number
    offset: number
  }>
}

export interface GooglePlaceDetails {
  place_id: string
  name: string
  formatted_address: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
    viewport: {
      northeast: {
        lat: number
        lng: number
      }
      southwest: {
        lat: number
        lng: number
      }
    }
  }
  address_components: Array<{
    long_name: string
    short_name: string
    types: string[]
  }>
  types: string[]
}

export interface GoogleSuggestionOptions {
  input: string
  types?: string[]
  language?: string
  country?: string
  sessionToken?: string
}

export interface GooglePlaceDetailsOptions {
  placeId: string
  fields?: string[]
  sessionToken?: string
}

/**
 * Service pour gérer les suggestions de villes via l'API Google Places Autocomplete
 * Utilise les routes API Next.js pour contourner les problèmes CORS
 */
export class GoogleSuggestionService {
  private baseUrl = '/api/places'
  async getCitySuggestions(options: GoogleSuggestionOptions): Promise<GooglePlacePrediction[]> {
    try {
      const { input, types = ['(cities)'], language = 'fr', country, sessionToken } = options

      const params = new URLSearchParams({
        input,
        types: types.join('|'),
        language,
        ...(country && { country }),
        ...(sessionToken && { sessionToken }),
      })

      const response = await fetch(`${this.baseUrl}/autocomplete?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      const data = await response.json()

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(
          `Erreur Google Places API: ${data.status} - ${data.error_message || 'Erreur inconnue'}`
        )
      }

      return data.predictions || []
    } catch (error) {
      console.error('Erreur lors de la récupération des suggestions de villes:', error)
      throw new Error('Impossible de récupérer les suggestions de villes')
    }
  }

  async getPlaceDetails(options: GooglePlaceDetailsOptions): Promise<GooglePlaceDetails | null> {
    try {
      const {
        placeId,
        fields = [
          'place_id',
          'name',
          'formatted_address',
          'geometry',
          'address_components',
          'types',
        ],
        sessionToken,
      } = options

      const params = new URLSearchParams({
        placeId,
        fields: fields.join(','),
        ...(sessionToken && { sessionToken }),
      })

      const response = await fetch(`${this.baseUrl}/details?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      const data = await response.json()

      if (data.status !== 'OK') {
        throw new Error(
          `Erreur Google Places API: ${data.status} - ${data.error_message || 'Erreur inconnue'}`
        )
      }

      return data.result || null
    } catch (error) {
      console.error('Erreur lors de la récupération des détails du lieu:', error)
      throw new Error('Impossible de récupérer les détails du lieu')
    }
  }

  async getCitySuggestionsByCountry(
    input: string,
    countryCode: string
  ): Promise<GooglePlacePrediction[]> {
    return this.getCitySuggestions({
      input,
      types: ['(cities)'],
      country: countryCode,
      language: 'fr',
    })
  }

  async getSuggestionsByType(input: string, types: string[]): Promise<GooglePlacePrediction[]> {
    return this.getCitySuggestions({
      input,
      types,
      language: 'fr',
    })
  }

  generateSessionToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  extractCityName(prediction: GooglePlacePrediction): string {
    return prediction.structured_formatting.main_text
  }

  extractCountry(prediction: GooglePlacePrediction): string {
    return prediction.structured_formatting.secondary_text
  }

  isCity(prediction: GooglePlacePrediction): boolean {
    return (
      prediction.types.includes('locality') ||
      prediction.types.includes('administrative_area_level_1') ||
      prediction.types.includes('sublocality')
    )
  }
}

export const googleSuggestionService = new GoogleSuggestionService()

export const getCitySuggestions = (options: GoogleSuggestionOptions) =>
  googleSuggestionService.getCitySuggestions(options)

export const getPlaceDetails = (options: GooglePlaceDetailsOptions) =>
  googleSuggestionService.getPlaceDetails(options)

export const getCitySuggestionsByCountry = (input: string, countryCode: string) =>
  googleSuggestionService.getCitySuggestionsByCountry(input, countryCode)
