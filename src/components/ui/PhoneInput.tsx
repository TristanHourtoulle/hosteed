'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Search, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { COUNTRIES, DEFAULT_COUNTRY, type Country } from '@/lib/data/countryCodes'

interface PhoneInputProps {
  value?: string
  onChange?: (value: string, countryCode: string) => void
  placeholder?: string
  className?: string
  required?: boolean
  disabled?: boolean
  defaultCountry?: string // Code pays par défaut (MG, FR, etc.)
}

export default function PhoneInput({
  value = '',
  onChange,
  placeholder = 'Numéro de téléphone',
  className = '',
  required = false,
  disabled = false,
  defaultCountry = 'MG'
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(() => {
    return COUNTRIES.find(c => c.code === defaultCountry) || DEFAULT_COUNTRY
  })
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [phoneNumber, setPhoneNumber] = useState(value)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const [isMounted, setIsMounted] = useState(false)
  
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter countries based on search term
  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.dialCode.includes(searchTerm) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Set mounted state
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Update dropdown position when it opens or when scrolling
  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        setDropdownPosition({
          top: rect.bottom + 8, // Utiliser la position viewport directement + petit espacement
          left: rect.left,
          width: 320
        })
      }
    }

    updatePosition()

    if (isOpen) {
      // Mettre à jour la position lors du scroll et du resize
      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true)
        window.removeEventListener('resize', updatePosition)
      }
    }
  }, [isOpen])

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Handle country selection
  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country)
    setIsOpen(false)
    setSearchTerm('')
    
    // Trigger onChange with current phone number and new country
    if (onChange) {
      onChange(phoneNumber, country.code)
    }
  }

  // Handle phone number change
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhoneNumber = e.target.value
    setPhoneNumber(newPhoneNumber)
    
    if (onChange) {
      onChange(newPhoneNumber, selectedCountry.code)
    }
  }

  // Update internal state when value prop changes
  useEffect(() => {
    setPhoneNumber(value)
  }, [value])

  // Render dropdown with portal
  const renderDropdown = () => {
    if (!isOpen || !isMounted) return null

    return createPortal(
      <div
        ref={dropdownRef}
        className="fixed z-[99999] w-[320px] bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden"
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          width: `${dropdownPosition.width}px`
        }}
      >
        {/* Search */}
        <div className="p-3 border-b border-gray-100 bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un pays..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Countries List */}
        <div className="max-h-[280px] overflow-y-auto">
          {filteredCountries.length === 0 ? (
            <div className="px-4 py-8 text-sm text-gray-500 text-center">
              <div className="text-gray-400 mb-2">🔍</div>
              Aucun pays trouvé
            </div>
          ) : (
            filteredCountries.map((country) => (
              <button
                key={country.code}
                type="button"
                className={`
                  w-full px-4 py-2.5 text-left
                  hover:bg-blue-50 focus:bg-blue-50 focus:outline-none
                  flex items-center justify-between group
                  transition-colors
                  ${selectedCountry.code === country.code ? 'bg-blue-50' : ''}
                `}
                onClick={() => handleCountrySelect(country)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl leading-none">{country.flag}</span>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {country.name}
                    </span>
                    <span className="text-xs text-gray-500">{country.code}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">{country.dialCode}</span>
                  {selectedCountry.code === country.code && (
                    <div className="bg-blue-600 rounded-full p-0.5">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>,
      document.body
    )
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex">
        {/* Country Selector */}
        <div className="relative">
          <button
            ref={buttonRef}
            type="button"
            className={`
              flex items-center gap-1.5 px-3 h-11
              bg-gray-50 border border-gray-200 border-r-0
              rounded-l-lg
              hover:bg-gray-100 transition-colors
              focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
          >
            <span className="text-xl leading-none">{selectedCountry.flag}</span>
            <span className="text-sm font-medium text-gray-700">{selectedCountry.dialCode}</span>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Phone Number Input */}
        <Input
          ref={inputRef}
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneNumberChange}
          placeholder={placeholder}
          className="rounded-l-none rounded-r-lg border-l-0 h-11 focus:ring-2 focus:ring-blue-500 focus:z-10"
          required={required}
          disabled={disabled}
        />
      </div>

      {/* Helper text */}
      <div className="mt-2 text-xs text-gray-500">
        Format: {selectedCountry.dialCode} X XX XX XX XX
      </div>

      {/* Render dropdown portal */}
      {renderDropdown()}
    </div>
  )
}