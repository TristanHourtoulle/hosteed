// TODO: refactor this file because it's larger than 200 lines
'use client'

import { useState, useEffect, useRef } from 'react'
import { TypeRent } from '@prisma/client'

interface Suggestion {
  display_name: string
  lat: string
  lon: string
}

interface SearchBarProps {
  onSearch?: (params: {
    location: string
    type: string
    centerLat?: number
    centerLon?: number
    searchRadius?: number
  }) => void
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [location, setLocation] = useState('')
  const [type, setType] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const searchTimeout = useRef<NodeJS.Timeout | undefined>(undefined)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [typeRent, setTypeRent] = useState<TypeRent[]>([])
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    const fetchTypeRent = async () => {
      try {
        const response = await fetch('/api/types')
        if (response.ok) {
          const types = await response.json()
          setTypeRent(types)
        }
      } catch (error) {
        console.error('Error fetching types:', error)
      }
    }
    fetchTypeRent()
  }, [])

  useEffect(() => {
    setHasMounted(true)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Gestion du clic en dehors des suggestions
  useEffect(() => {
    if (!hasMounted) return

    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [hasMounted])

  // Debounce pour les suggestions
  useEffect(() => {
    if (!hasMounted) return
    if (location.length < 3) {
      setSuggestions([])
      return
    }

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }

    searchTimeout.current = setTimeout(async () => {
      try {
        setIsLoading(true)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=5`
        )
        const data = await response.json()
        setSuggestions(data)
        setShowSuggestions(true)
      } catch (error) {
        console.error('Erreur lors de la recherche de suggestions:', error)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current)
      }
    }
  }, [location, hasMounted])

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setLocation(suggestion.display_name)
    setShowSuggestions(false)
  }

  const handleSearch = () => {
    if (onSearch) {
      onSearch({
        location,
        type,
        searchRadius: 15, // Rayon de recherche par défaut de 15km
      })
    }
  }

  if (!hasMounted) {
    return (
      <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
        <div className='animate-pulse bg-gray-200 h-12 rounded-lg'></div>
      </div>
    )
  }

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '1rem',
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '1rem',
          width: '100%',
        }}
      >
        <div style={{ position: 'relative', flex: 2 }}>
          <input
            type='text'
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder='Entrez une adresse...'
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid #e2e8f0',
              fontSize: '1rem',
              outline: 'none',
              transition: 'border-color 0.2s',
              color: '#000000',
              backgroundColor: '#ffffff',
            }}
            onFocus={e => {
              e.target.style.borderColor = '#3b82f6'
            }}
            onBlur={e => {
              e.target.style.borderColor = '#e2e8f0'
            }}
          />
          {isLoading && (
            <div
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#000000',
              }}
            >
              Chargement...
            </div>
          )}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '0.375rem',
                marginTop: '0.25rem',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 10,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
            >
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  style={{
                    padding: '0.75rem',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    color: '#000000',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = '#f7fafc'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'white'
                  }}
                >
                  {suggestion.display_name}
                </div>
              ))}
            </div>
          )}
        </div>

        <select
          value={type}
          onChange={e => setType(e.target.value)}
          style={{
            padding: '0.75rem',
            borderRadius: '0.375rem',
            border: '1px solid #e2e8f0',
            fontSize: '1rem',
            outline: 'none',
            transition: 'border-color 0.2s',
            color: '#000000',
            backgroundColor: '#ffffff',
            flex: 1,
          }}
          onFocus={e => {
            e.target.style.borderColor = '#3b82f6'
          }}
          onBlur={e => {
            e.target.style.borderColor = '#e2e8f0'
          }}
        >
          <option value=''>Type de logement</option>
          {typeRent &&
            typeRent.map(rent => (
              <option key={rent.id} value={rent.id}>
                {rent.name}
              </option>
            ))}
        </select>

        <button
          onClick={handleSearch}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            borderRadius: '0.375rem',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
            transition: 'background-color 0.2s',
            flex: 1,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = '#2563eb'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = '#3b82f6'
          }}
        >
          Rechercher
        </button>
      </div>
    </div>
  )
}
