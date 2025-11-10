'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  getCitySuggestions,
  GooglePlacePrediction,
  googleSuggestionService,
} from '@/lib/services/GoogleSuggestion.service'
import { MapPin, Loader2 } from 'lucide-react'

interface CityAutocompleteProps {
  onCitySelect?: (city: GooglePlacePrediction, coordinates?: { lat: number; lng: number }) => void
  onInputChange?: (value: string) => void // Nouvelle prop pour la saisie libre
  placeholder?: string
  className?: string
  disabled?: boolean
  defaultValue?: string
  countryFilter?: string
  allowFreeInput?: boolean // Nouvelle prop pour permettre la saisie libre
}

export function CityAutocomplete({
  onCitySelect,
  onInputChange,
  placeholder = 'Rechercher une ville...',
  className = '',
  disabled = false,
  defaultValue = '',
  countryFilter,
  allowFreeInput = false,
}: CityAutocompleteProps) {
  const [inputValue, setInputValue] = useState(defaultValue)
  const [suggestions, setSuggestions] = useState<GooglePlacePrediction[]>([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const sessionTokenRef = useRef<string>('')
  const debounceTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Générer un token de session au montage du composant
  useEffect(() => {
    sessionTokenRef.current = googleSuggestionService.generateSessionToken()
  }, [])

  // Gérer la recherche avec debounce
  const searchCities = useCallback(
    async (input: string) => {
      if (input.length < 2) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      setLoading(true)
      try {
        let results = await getCitySuggestions({
          input,
          types: ['(cities)'],
          language: 'fr',
          country: countryFilter,
          sessionToken: sessionTokenRef.current,
        })

        // Si on a un filtre pays et peu de résultats, faire une recherche mondiale
        if (countryFilter && results.length < 3) {
          const globalResults = await getCitySuggestions({
            input,
            types: ['(cities)'],
            language: 'fr',
            // Pas de filtre pays pour la recherche mondiale
            sessionToken: sessionTokenRef.current,
          })

          // Combiner les résultats en priorisant le pays filtré
          const combinedResults = [...results]
          globalResults.forEach(globalResult => {
            if (!combinedResults.some(result => result.place_id === globalResult.place_id)) {
              combinedResults.push(globalResult)
            }
          })
          results = combinedResults
        }

        setSuggestions(results)
        setShowSuggestions(results.length > 0)
        setSelectedIndex(-1)
      } catch (error) {
        console.error('Erreur lors de la recherche de villes:', error)
        setSuggestions([])
        setShowSuggestions(false)
      } finally {
        setLoading(false)
      }
    },
    [countryFilter]
  )

  // Debounce la recherche
  const handleInputChange = useCallback(
    (value: string) => {
      setInputValue(value)

      // Si on permet la saisie libre, notifier le parent immédiatement
      if (allowFreeInput && onInputChange) {
        onInputChange(value)
      }

      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }

      debounceTimeoutRef.current = setTimeout(() => {
        searchCities(value)
      }, 300)
    },
    [searchCities, allowFreeInput, onInputChange]
  )

  // Gérer la sélection d'une ville
  const handleCitySelect = useCallback(
    async (city: GooglePlacePrediction) => {
      setInputValue(city.description)
      setShowSuggestions(false)
      setSuggestions([])
      setSelectedIndex(-1)

      // Récupérer les coordonnées GPS via l'API Google Places Details
      try {
        const details = await googleSuggestionService.getPlaceDetails({
          placeId: city.place_id,
          fields: ['geometry'],
          sessionToken: sessionTokenRef.current,
        })

        const coordinates = details?.geometry?.location
        if (onCitySelect) {
          onCitySelect(city, coordinates)
        }
      } catch (error) {
        console.error('Error fetching place details:', error)
        // Call onCitySelect without coordinates if error
        if (onCitySelect) {
          onCitySelect(city)
        }
      }

      // Si on permet la saisie libre, notifier aussi le parent
      if (allowFreeInput && onInputChange) {
        onInputChange(city.description)
      }
      // Générer un nouveau token de session pour la prochaine recherche
      sessionTokenRef.current = googleSuggestionService.generateSessionToken()
    },
    [onCitySelect, allowFreeInput, onInputChange]
  )

  // Gérer la navigation au clavier
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showSuggestions || suggestions.length === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
          break
        case 'Enter':
          e.preventDefault()
          if (selectedIndex >= 0) {
            handleCitySelect(suggestions[selectedIndex])
          }
          break
        case 'Escape':
          setShowSuggestions(false)
          setSelectedIndex(-1)
          inputRef.current?.blur()
          break
      }
    },
    [showSuggestions, suggestions, selectedIndex, handleCitySelect]
  )

  // Fermer les suggestions en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Nettoyer le timeout au démontage
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className={`relative ${className}`}>
      <div className='relative'>
        <input
          ref={inputRef}
          type='text'
          value={inputValue}
          onChange={e => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className='w-full text-sm text-gray-700 placeholder-gray-400 border-none outline-none bg-transparent truncate font-medium'
        />
        {loading && (
          <Loader2 className='absolute right-0 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 animate-spin' />
        )}
      </div>

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className='absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto'
        >
          {suggestions.map((city, index) => (
            <div
              key={city.place_id}
              className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                index === selectedIndex ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
              onClick={() => handleCitySelect(city)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className='flex items-center space-x-3'>
                <MapPin className='h-4 w-4 text-gray-400 flex-shrink-0' />
                <div className='flex-1 min-w-0'>
                  <div className='text-sm font-medium text-gray-900 truncate'>
                    {googleSuggestionService.extractCityName(city)}
                  </div>
                  <div className='text-sm text-gray-500 truncate'>
                    {googleSuggestionService.extractCountry(city)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Message d'erreur si pas de suggestions */}
      {showSuggestions && !loading && suggestions.length === 0 && inputValue.length >= 2 && (
        <div className='absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-4'>
          <div className='text-sm text-gray-500 text-center'>
            Aucune ville trouvée pour &quot;{inputValue}&quot;
          </div>
        </div>
      )}
    </div>
  )
}

export default CityAutocomplete
