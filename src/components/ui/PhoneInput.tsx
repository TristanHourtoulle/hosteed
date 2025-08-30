'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/shadcnui/button'
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
  
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter countries based on search term
  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.dialCode.includes(searchTerm) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  return (
    <div className={`relative ${className}`}>
      <div className="flex">
        {/* Country Selector */}
        <div className="relative" ref={dropdownRef}>
          <Button
            type="button"
            variant="outline"
            className="rounded-r-none border-r-0 px-3 h-10 hover:bg-gray-50"
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled}
          >
            <span className="text-lg mr-1">{selectedCountry.flag}</span>
            <span className="text-sm font-medium">{selectedCountry.dialCode}</span>
            <ChevronDown className="ml-1 h-3 w-3 opacity-50" />
          </Button>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute top-full left-0 z-50 w-80 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-hidden">
              {/* Search */}
              <div className="p-3 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un pays..."
                    className="w-full pl-8 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Countries List */}
              <div className="max-h-60 overflow-y-auto">
                {filteredCountries.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500 text-center">
                    Aucun pays trouvé
                  </div>
                ) : (
                  filteredCountries.map((country) => (
                    <button
                      key={country.code}
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center justify-between"
                      onClick={() => handleCountrySelect(country)}
                    >
                      <div className="flex items-center">
                        <span className="text-lg mr-3">{country.flag}</span>
                        <span className="text-sm text-gray-900">{country.name}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 mr-2">{country.dialCode}</span>
                        {selectedCountry.code === country.code && (
                          <Check className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Phone Number Input */}
        <Input
          ref={inputRef}
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneNumberChange}
          placeholder={placeholder}
          className="rounded-l-none border-l-0 focus:ring-2 focus:ring-blue-500"
          required={required}
          disabled={disabled}
        />
      </div>

      {/* Helper text */}
      <div className="mt-1 text-xs text-gray-500">
        Format: {selectedCountry.dialCode} X XX XX XX XX
      </div>
    </div>
  )
}