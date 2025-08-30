'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { MapPin, Loader2, X } from 'lucide-react'

interface GooglePlacePrediction {
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

interface GooglePlaceDetails {
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

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  countryFilter?: string
  onAddressSelect?: (address: string, placeId?: string) => void
}

export default function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Entrez une adresse...",
  className = "",
  countryFilter = "MG",
  onAddressSelect
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<GooglePlacePrediction[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [sessionToken, setSessionToken] = useState<string>('')
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('')

  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    setSessionToken(token)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Element) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Element)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

    // Recherche avec debounce
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }



    if (value.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    // Ne pas faire de recherche si une adresse est déjà sélectionnée
    if (selectedPlaceId) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        setIsLoading(true)

        const params = new URLSearchParams({
          input: value,
          types: 'address',
          language: 'fr',
          country: countryFilter,
          sessionToken
        })

        const response = await fetch(`/api/places/autocomplete?${params.toString()}`)
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`)
        }

        const data = await response.json()

        if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
          setSuggestions(data.predictions || [])
          setShowSuggestions((data.predictions || []).length > 0)
        } else {
          console.error('Erreur API:', data)
          setSuggestions([])
          setShowSuggestions(false)
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des suggestions:', error)
        setSuggestions([])
        setShowSuggestions(false)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, countryFilter, sessionToken, selectedPlaceId])



    const handleSuggestionClick = async (suggestion: GooglePlacePrediction) => {
    try {
      const params = new URLSearchParams({
        placeId: suggestion.place_id,
        fields: 'formatted_address,geometry',
        sessionToken
      })

      const response = await fetch(`/api/places/details?${params.toString()}`)
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      const data = await response.json()
      const placeDetails: GooglePlaceDetails = data.result

      if (placeDetails) {
        const fullAddress = placeDetails.formatted_address
        onChange(fullAddress)
        setSelectedPlaceId(suggestion.place_id)

        if (onAddressSelect) {
          onAddressSelect(fullAddress, suggestion.place_id)
        }
      } else {
        onChange(suggestion.description)
        if (onAddressSelect) {
          onAddressSelect(suggestion.description, suggestion.place_id)
        }
      }

      // Masquer définitivement les suggestions après sélection
      setShowSuggestions(false)
      setSuggestions([])

    } catch (error) {
      console.error('Erreur lors de la récupération des détails:', error)
      onChange(suggestion.description)
      if (onAddressSelect) {
        onAddressSelect(suggestion.description, suggestion.place_id)
      }
      setShowSuggestions(false)
      setSuggestions([])
    }
  }

  const clearInput = () => {
    onChange('')
    setSelectedPlaceId('')
    setSuggestions([])
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const formatSuggestion = (suggestion: GooglePlacePrediction) => {
    const mainText = suggestion.structured_formatting?.main_text || ''
    const secondaryText = suggestion.structured_formatting?.secondary_text || ''

    if (mainText && secondaryText) {
      return (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900">{mainText}</span>
          <span className="text-sm text-slate-500">{secondaryText}</span>
        </div>
      )
    }

    return <span className="text-slate-900">{suggestion.description}</span>
  }

  return (
    <div className={`relative z-50 ${className}`}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            // Si l'utilisateur modifie l'adresse sélectionnée, réinitialiser l'état
            if (selectedPlaceId) {
              setSelectedPlaceId('')
            }
            onChange(e.target.value)
          }}
          placeholder={placeholder}
          className={`pl-10 pr-10 ${selectedPlaceId ? 'border-green-500 bg-green-50' : ''}`}
          onFocus={() => {
            // Si on clique sur le champ et qu'une adresse est sélectionnée, permettre la modification
            if (selectedPlaceId) {
              setSelectedPlaceId('')
            }
            if (suggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
        />

        {value && (
          <button
            type="button"
            onClick={clearInput}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
          </button>
        )}
      </div>
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-[99999] w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-2xl max-h-60 overflow-y-auto"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
          }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span className="ml-2 text-sm text-slate-600">Recherche en cours...</span>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="py-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.place_id}-${index}`}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none transition-colors border-b border-slate-100 last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      {formatSuggestion(suggestion)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : value.length >= 3 ? (
            <div className="px-4 py-3 text-sm text-slate-500 text-center">
              Aucune adresse trouvée
            </div>
          ) : null}
        </div>
      )}

      {isLoading && !showSuggestions && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        </div>
      )}
    </div>
  )
}
