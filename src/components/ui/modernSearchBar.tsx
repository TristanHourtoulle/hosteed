'use client'
import { useState, useEffect } from 'react'
import { Search, MapPin, Calendar as CalendarIcon, Users, Minus, Plus } from 'lucide-react'
import { Calendar } from './shadcnui/calendar'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Popover, PopoverContent, PopoverTrigger } from './shadcnui/popover'
import { Button } from './shadcnui/button'
import type { DateRange } from 'react-day-picker'
import { Card, CardContent, CardHeader, CardTitle } from './shadcnui/card'
import { toast } from 'sonner'
import FilterPopover from '@/components/host/FilterPopover'
import CityAutocomplete from './CityAutocomplete'
import { GooglePlacePrediction } from '@/lib/services/GoogleSuggestion.service'

interface FilterState {
  selectedSecurities: string[]
  selectedMeals: string[]
  selectedEquipments: string[]
  selectedServices: string[]
  selectedTypeRooms: string[]
  searchRadius: number
  arrivingDate: string
  leavingDate: string
  minPrice: string
  maxPrice: string
  minPeople: string
  maxPeople: string
  minRooms: string
  maxRooms: string
  minBathrooms: string
  maxBathrooms: string
  sizeMin: string
  sizeMax: string
  autoAcceptOnly: boolean
  certifiedOnly: boolean
  contractRequired: boolean
}

interface ModernSearchBarProps {
  onSearch?: (data: {
    location: string
    checkIn: string
    checkOut: string
    guests: number
    lat?: number
    lng?: number
  }) => void
  initialLocation?: string
  initialCheckIn?: string
  initialCheckOut?: string
  initialGuests?: number
  // Filter props
  filters?: FilterState
  onFiltersChange?: (filters: FilterState) => void
  securities?: Array<{ id: string; name: string }>
  meals?: Array<{ id: string; name: string }>
  equipments?: Array<{ id: string; name: string }>
  services?: Array<{ id: string; name: string }>
  typeRooms?: Array<{ id: string; name: string }>
}

export default function ModernSearchBar({
  onSearch,
  initialLocation,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
  filters,
  onFiltersChange,
  securities = [],
  meals = [],
  equipments = [],
  services = [],
  typeRooms = [],
}: ModernSearchBarProps) {
  const [location, setLocation] = useState(initialLocation || '')
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: initialCheckIn ? new Date(initialCheckIn) : new Date(),
    to: initialCheckOut
      ? new Date(initialCheckOut)
      : new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // Demain par défaut
  })
  const [guests, setGuests] = useState(initialGuests || 1)

  // Sync internal state with props when they change
  useEffect(() => {
    setLocation(initialLocation || '')
  }, [initialLocation])

  useEffect(() => {
    if (initialCheckIn || initialCheckOut) {
      setDateRange({
        from: initialCheckIn ? new Date(initialCheckIn) : new Date(),
        to: initialCheckOut
          ? new Date(initialCheckOut)
          : new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
      })
    }
  }, [initialCheckIn, initialCheckOut])

  useEffect(() => {
    setGuests(initialGuests || 1)
  }, [initialGuests])

  const handleSearch = () => {
    if (onSearch) {
      const searchData: {
        location: string
        checkIn: string
        checkOut: string
        guests: number
        lat?: number
        lng?: number
      } = {
        location,
        checkIn: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : '',
        checkOut: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : '',
        guests,
      }
      // Add coordinates if available (from Google Places selection)
      if (coordinates) {
        searchData.lat = coordinates.lat
        searchData.lng = coordinates.lng
      }
      onSearch(searchData)
    }
  }

  // Gérer la sélection d'une ville depuis les suggestions (avec coordonnées GPS)
  const handleCitySelect = (city: GooglePlacePrediction, coords?: { lat: number; lng: number }) => {
    setLocation(city.description)
    setCoordinates(coords || null)

    // Auto-trigger search immediately with GPS coordinates (if available)
    // This bypasses the React state update delay
    if (onSearch && coords) {
      const searchData: {
        location: string
        checkIn: string
        checkOut: string
        guests: number
        lat?: number
        lng?: number
      } = {
        location: city.description,
        checkIn: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : '',
        checkOut: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : '',
        guests,
        lat: coords.lat,
        lng: coords.lng,
      }
      onSearch(searchData)
    }
  }

  // Gérer la saisie libre de localisation (pas de coordonnées GPS)
  const handleLocationChange = (value: string) => {
    setLocation(value)
    // Reset coordinates when user types manually (not from Google selection)
    setCoordinates(null)
  }

  return (
    <div className='w-full max-w-5xl mx-auto relative'>
      {/* Unified responsive design */}
      <div className='bg-white rounded-3xl md:rounded-full shadow-sm border border-gray-100 overflow-visible relative backdrop-blur-sm flex flex-col md:flex-row'>
        {/* Localisation avec suggestions */}
        <div className='flex-1 md:flex-[2] px-4 md:px-5 py-4 md:py-5 md:border-r border-gray-100 min-w-0'>
          <div className='flex items-center space-x-3 h-full md:h-16'>
            <div className='p-1.5 bg-blue-50 rounded-full'>
              <MapPin className='h-4 w-4 text-blue-600 flex-shrink-0' />
            </div>
            <div className='flex-1 min-w-0'>
              <div className='text-xs font-semibold text-gray-900 mb-0.5 uppercase tracking-wide'>
                Localisation
              </div>
              <CityAutocomplete
                onCitySelect={handleCitySelect}
                onInputChange={handleLocationChange}
                placeholder='Où souhaitez-vous aller ?'
                defaultValue={location}
                className='w-full'
                allowFreeInput={true} // Permet la saisie libre
                // Pas de countryFilter pour permettre toutes les suggestions
              />
            </div>
          </div>
        </div>

        {/* Dates (Arrivée et Départ) */}
        <div className='flex-1 md:flex-[1.3] px-4 md:px-5 py-4 md:py-5 md:border-r border-gray-100 min-w-0 relative'>
          <Popover>
            <PopoverTrigger asChild>
              <button className='w-full h-full text-left hover:bg-gray-50/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded-2xl md:rounded-none'>
                <div className='flex items-center space-x-3 h-full md:h-16'>
                  <div className='p-1.5 bg-green-50 rounded-full'>
                    <CalendarIcon className='h-4 w-4 text-green-600 flex-shrink-0' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='text-xs font-semibold text-gray-900 mb-0.5 uppercase tracking-wide'>
                      Dates de séjour
                    </div>
                    <div className='text-sm text-gray-700 font-medium'>
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, 'dd MMM', { locale: fr })} -{' '}
                            {format(dateRange.to, 'dd MMM', { locale: fr })}
                          </>
                        ) : (
                          format(dateRange.from, 'dd MMM', { locale: fr })
                        )
                      ) : (
                        <span className='text-gray-400'>Sélectionner les dates</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
              <Calendar
                initialFocus
                mode='range'
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                locale={fr}
                className='rounded-lg border'
                classNames={{
                  months: 'flex gap-4 flex-col md:flex-row relative',
                  month: 'flex flex-col w-full gap-4',
                  nav: 'flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between z-10',
                  button_previous:
                    'h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 flex items-center justify-center',
                  button_next:
                    'h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 flex items-center justify-center',
                  month_caption: 'flex items-center justify-center h-8 w-full px-8 relative',
                  caption_label: 'text-sm font-medium select-none',
                  table: 'w-full border-collapse mt-1',
                  weekdays: 'flex',
                  weekday:
                    'text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] select-none p-0 h-8 flex items-center justify-center',
                  week: 'flex w-full mt-1',
                  day: 'p-0 h-8 w-8 text-center text-sm relative hover:bg-accent rounded-md transition-colors flex items-center justify-center',
                  range_start: 'bg-primary text-primary-foreground rounded-md',
                  range_middle: 'bg-accent text-accent-foreground rounded-none',
                  range_end: 'bg-primary text-primary-foreground rounded-md',
                  today: 'bg-accent text-accent-foreground font-semibold',
                  outside: 'text-muted-foreground opacity-50',
                  disabled: 'text-muted-foreground opacity-25 cursor-not-allowed',
                }}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Voyageurs */}
        <div className='flex-1 md:flex-[0.8] px-4 md:px-6 py-4 md:py-5 min-w-0 relative'>
          <div className='flex items-center space-x-3 h-full md:h-16'>
            <div className='flex-1 min-w-0 w-full'>
              <Popover>
                <PopoverTrigger className='w-full h-full' asChild>
                  <button className='w-full h-full text-left hover:bg-gray-50/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded-2xl md:rounded-none'>
                    <div className='flex items-center space-x-3 h-full'>
                      <div className='p-1.5 bg-purple-50 rounded-full'>
                        <Users className='h-4 w-4 text-purple-600 flex-shrink-0' />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='text-xs font-semibold text-gray-900 mb-0.5 uppercase tracking-wide'>
                          Voyageurs
                        </div>
                        <div className='text-sm text-gray-700 font-medium'>
                          {guests} {guests === 1 ? 'voyageur' : 'voyageurs'}
                        </div>
                      </div>
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent className='w-full p-0' align='start'>
                  <Card className='w-full'>
                    <CardHeader>
                      <CardTitle>Voyageurs</CardTitle>
                    </CardHeader>
                    <CardContent className='flex items-center justify-center'>
                      <div className='flex items-center space-x-2'>
                        <Button
                          variant='outline'
                          size='icon'
                          className='rounded-full flex items-center justify-center'
                          onClick={() => {
                            if (guests > 1) {
                              setGuests(guests - 1)
                              return
                            }
                            toast.error('Vous ne pouvez pas avoir moins de 1 voyageur')
                          }}
                        >
                          <Minus className='h-4 w-4' />
                        </Button>
                        <span className='text-sm font-medium'>{guests}</span>
                        <Button
                          variant='outline'
                          size='icon'
                          className='rounded-full flex items-center justify-center'
                          onClick={() => {
                            setGuests(guests + 1)
                          }}
                        >
                          <Plus className='h-4 w-4' />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Boutons de recherche et filtre */}
        <div className='flex items-center gap-2 p-1.5 px-4 md:px-1.5 pb-4 md:pb-1.5'>
          <button
            type='button'
            onClick={handleSearch}
            className='flex-1 md:w-12 md:flex-none h-12 md:h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl md:rounded-full flex items-center justify-center text-white transition-all duration-200 shadow-lg hover:shadow-xl flex-shrink-0 transform hover:scale-105 font-medium'
          >
            <Search className='h-5 w-5 md:mr-0 mr-3' />
            <span className='md:hidden'>Rechercher</span>
          </button>

          {/* Filter Button - only show if filter props are provided */}
          {filters && onFiltersChange && (
            <div className='md:ml-2'>
              <FilterPopover
                filters={filters}
                onFiltersChange={onFiltersChange}
                securities={securities}
                meals={meals}
                equipments={equipments}
                services={services}
                typeRooms={typeRooms}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
