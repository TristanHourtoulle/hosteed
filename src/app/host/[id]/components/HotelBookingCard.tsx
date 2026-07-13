'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Users, Minus, Plus, Calendar as CalendarIcon, Star } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/shadcnui/popover'
import { Button } from '@/components/ui/shadcnui/button'
import { Calendar } from '@/components/ui/shadcnui/calendar'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { formatNumber } from '@/lib/utils/formatNumber'
import { BookingCostSummary } from '@/components/ui/BookingCostSummary'
import { RoomTypesSection } from './RoomTypesSection'
import { useHotelBookingSelection } from '@/hooks/useHotelBookingSelection'
import type { RoomTypeView } from '@/types/roomType'

interface HotelBookingCardProps {
  product: {
    id: string
    name: string
    owner?: { id?: string }
    minPeople?: number
    maxPeople?: number
    reviews?: { id: string }[]
  }
  roomTypes: RoomTypeView[]
  globalGrade: number
  today: string
}

/**
 * Right-hand booking panel for hotel (multi-room-type) products. Replaces the
 * single-price {@link BookingCard} with a date range + per-type multi-select
 * whose quantities drive a live, server-priced cost summary and the
 * reservation deep-link.
 */
export default function HotelBookingCard({
  product,
  roomTypes,
  globalGrade,
  today,
}: HotelBookingCardProps) {
  const [guests, setGuests] = useState(product.minPeople || 1)

  const {
    selection,
    setQuantity,
    dateRange,
    setDateRange,
    availabilities,
    nights,
    pricing,
    roomLines,
    totalRooms,
    canReserve,
    reservationHref,
  } = useHotelBookingSelection({
    productId: product.id,
    roomTypes,
    ownerId: product.owner?.id,
    guestCount: guests,
  })

  const hasValidDates = Boolean(dateRange?.from && dateRange?.to && nights > 0)

  return (
    <div className='sticky top-20'>
      <div className='bg-white border border-gray-200 rounded-2xl shadow-xl p-6 space-y-5'>
        <div className='flex items-center justify-between'>
          <div>
            <span className='text-2xl font-semibold text-gray-900'>
              {roomTypes.length} type{roomTypes.length > 1 ? 's' : ''} de chambre
              {roomTypes.length > 1 ? 's' : ''}
            </span>
          </div>
          {product.reviews && product.reviews.length > 0 && (
            <div className='flex items-center gap-1'>
              <Star className='h-4 w-4 fill-yellow-400 text-yellow-400' />
              <span className='text-sm font-medium'>{formatNumber(globalGrade, 1)}</span>
              <span className='text-sm text-gray-500'>({formatNumber(product.reviews.length)})</span>
            </div>
          )}
        </div>

        <div className='border border-gray-300 rounded-xl overflow-hidden'>
          {/* Date range */}
          <div className='border-b border-gray-300'>
            <Popover>
              <PopoverTrigger asChild>
                <button className='w-full p-4 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset'>
                  <div className='flex items-center space-x-3'>
                    <div className='p-1.5 bg-green-50 rounded-full'>
                      <CalendarIcon className='h-4 w-4 text-green-600' />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='text-xs font-semibold text-gray-700 mb-1'>DATES DE SÉJOUR</div>
                      <div className='text-sm text-gray-900 font-medium'>
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
                  disabled={date => date < new Date(today)}
                  className='rounded-lg border'
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Guests */}
          <div className='p-4'>
            <label className='block text-xs font-semibold text-gray-700 mb-2'>VOYAGEURS</label>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Users className='h-4 w-4 text-gray-400' />
                <span className='text-sm font-medium'>
                  {guests} {guests === 1 ? 'voyageur' : 'voyageurs'}
                </span>
              </div>
              <div className='flex items-center gap-3'>
                <Button
                  type='button'
                  variant='outline'
                  size='icon'
                  className='rounded-full h-8 w-8'
                  aria-label='Retirer un voyageur'
                  disabled={guests <= (product.minPeople || 1)}
                  onClick={() => setGuests(g => Math.max(product.minPeople || 1, g - 1))}
                >
                  <Minus className='h-4 w-4' />
                </Button>
                <span className='w-6 text-center font-medium'>{guests}</span>
                <Button
                  type='button'
                  variant='outline'
                  size='icon'
                  className='rounded-full h-8 w-8'
                  aria-label='Ajouter un voyageur'
                  disabled={!!product.maxPeople && guests >= product.maxPeople}
                  onClick={() =>
                    setGuests(g => (product.maxPeople ? Math.min(product.maxPeople, g + 1) : g + 1))
                  }
                >
                  <Plus className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Room-type multi-select */}
        <RoomTypesSection
          roomTypes={roomTypes}
          availabilities={availabilities}
          selection={selection}
          onSelectionChange={next => {
            // Reconcile the diff through the availability-capped setter.
            const ids = new Set([...Object.keys(next), ...Object.keys(selection)])
            ids.forEach(id => {
              if ((next[id] ?? 0) !== (selection[id] ?? 0)) {
                setQuantity(id, next[id] ?? 0)
              }
            })
          }}
          heading={false}
        />

        {/* Live cost summary */}
        {totalRooms > 0 && hasValidDates && roomLines.length > 0 && (
          <BookingCostSummary
            basePrice={0}
            numberOfDays={nights}
            guestCount={guests}
            selectedExtras={[]}
            startDate={dateRange!.from!}
            endDate={dateRange!.to!}
            roomLines={roomLines}
            subtotalOverride={pricing?.subtotal}
          />
        )}

        <Link
          href={canReserve ? reservationHref : '#'}
          aria-disabled={!canReserve}
          className={`w-full block text-center py-3 px-6 rounded-xl font-medium transition-all shadow-lg ${
            canReserve
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed pointer-events-none'
          }`}
          onClick={e => {
            if (!canReserve) e.preventDefault()
          }}
        >
          {!hasValidDates
            ? 'Sélectionnez des dates'
            : totalRooms === 0
              ? 'Sélectionnez une chambre'
              : 'Réserver'}
        </Link>

        <div className='p-3 bg-green-50 border border-green-200 rounded-lg'>
          <p className='text-center text-green-800 text-sm font-medium'>
            Vous ne serez pas débité pour le moment
          </p>
        </div>
      </div>
    </div>
  )
}
