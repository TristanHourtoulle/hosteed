'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { CityAutocomplete } from '@/components/ui/CityAutocomplete'
import { DatePickerWithRange } from '@/components/ui/date-range-picker'
import type { DateRange } from 'react-day-picker'

export default function HeroSearch() {
  const router = useRouter()
  const [location, setLocation] = useState('')
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [guests, setGuests] = useState(1)
  const [showGuestPicker, setShowGuestPicker] = useState(false)

  const handleSearch = () => {
    const params = new URLSearchParams()

    if (location) {
      params.set('location', location)
    }

    if (dateRange?.from) {
      params.set('checkIn', format(dateRange.from, 'yyyy-MM-dd'))
    }

    if (dateRange?.to) {
      params.set('checkOut', format(dateRange.to, 'yyyy-MM-dd'))
    }

    if (guests > 1) {
      params.set('guests', guests.toString())
    }

    router.push(`/host?${params.toString()}`)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className='w-full max-w-4xl mx-auto px-4'>
      <div className='bg-white rounded-full shadow-2xl p-2 flex flex-col md:flex-row gap-2 md:gap-0 md:divide-x divide-gray-200'>
        {/* Location Input */}
        <div className='flex-1 px-4 py-3 md:py-2'>
          <label className='block text-xs font-semibold text-gray-700 mb-1'>Localisation</label>
          <CityAutocomplete
            defaultValue={location}
            onCitySelect={(city) => setLocation(city.description)}
            onInputChange={setLocation}
            allowFreeInput={true}
            placeholder='Rechercher une localisation'
            className='border-0 focus:ring-0 p-0 text-sm placeholder:text-gray-400'
          />
        </div>

        {/* Date Range Picker */}
        <div className='flex-1 px-4 py-3 md:py-2'>
          <label className='block text-xs font-semibold text-gray-700 mb-1'>Date</label>
          <DatePickerWithRange
            value={dateRange}
            onChange={setDateRange}
            placeholder="Date d'arrivée - de départ"
            className='border-0 focus:ring-0 p-0 text-sm w-full'
          />
        </div>

        {/* Guest Picker */}
        <div className='flex-1 px-4 py-3 md:py-2 relative'>
          <label className='block text-xs font-semibold text-gray-700 mb-1'>Voyageurs</label>
          <button
            onClick={() => setShowGuestPicker(!showGuestPicker)}
            className='w-full text-left text-sm text-gray-700 focus:outline-none'
            onKeyPress={handleKeyPress}
          >
            {guests} {guests === 1 ? 'voyageur' : 'voyageurs'}
          </button>

          {showGuestPicker && (
            <div className='absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl p-4 z-50 border border-gray-200'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium'>Voyageurs</span>
                <div className='flex items-center gap-3'>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => setGuests(Math.max(1, guests - 1))}
                    className='h-8 w-8 rounded-full p-0'
                  >
                    -
                  </Button>
                  <span className='w-8 text-center font-medium'>{guests}</span>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => setGuests(Math.min(20, guests + 1))}
                    className='h-8 w-8 rounded-full p-0'
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search Button */}
        <div className='flex items-center justify-center px-2'>
          <Button
            onClick={handleSearch}
            size='lg'
            className='rounded-full h-12 w-12 md:h-14 md:w-14 bg-gradient-to-r from-[#015993] to-[#0379C7] hover:shadow-lg transition-all'
          >
            <Search className='h-5 w-5 text-white' />
          </Button>
        </div>
      </div>
    </div>
  )
}
