import Link from 'next/link'
import Image from 'next/image'
import { Star, Users, Minus, Plus, Calendar as CalendarIcon } from 'lucide-react'
import { Equipment, Meals, Services, User } from '@prisma/client'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/shadcnui/popover'
import { Button } from '@/components/ui/shadcnui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcnui/card'
import { Calendar } from '@/components/ui/shadcnui/calendar'
import { toast } from 'sonner'
import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { DateRange } from 'react-day-picker'
import { getProfileImageUrl } from '@/lib/utils'

interface Reviews {
  id: string
  title: string
  text: string
  grade: number
  welcomeGrade: number
  staff: number
  comfort: number
  equipment: number
  cleaning: number
  visitDate: Date
  publishDate: Date
  approved: boolean
}

interface Product {
  id: string
  name: string
  description: string
  basePrice: string
  equipments: Equipment[]
  servicesList: Services[]
  mealsList: Meals[]
  reviews: Reviews[]
  img: { img: string }[]
  address?: string
  room?: number
  bathroom?: number
  minPeople?: number
  maxPeople?: number
  sizeRoom?: number
  autoAccept?: boolean
  certified?: boolean
  contract?: boolean
  longitude?: number
  latitude?: number
  user: User[]
}

interface FormData {
  arrivingDate: string
  leavingDate: string
}

interface BookingCardProps {
  product: Product
  globalGrade: number
  formData: FormData
  handleDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  isAvailable: boolean
  today: string
}

export default function BookingCard({
  product,
  globalGrade,
  formData,
  handleDateChange,
  isAvailable,
  today,
}: BookingCardProps) {
  const [guests, setGuests] = useState(1)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: formData.arrivingDate ? new Date(formData.arrivingDate) : undefined,
    to: formData.leavingDate ? new Date(formData.leavingDate) : undefined,
  })

  // Update parent component when date range changes
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)

    // Create synthetic events to update parent state
    if (range?.from) {
      const arrivingEvent = {
        target: {
          name: 'arrivingDate',
          value: format(range.from, 'yyyy-MM-dd'),
        },
      } as React.ChangeEvent<HTMLInputElement>
      handleDateChange(arrivingEvent)
    }

    if (range?.to) {
      const leavingEvent = {
        target: {
          name: 'leavingDate',
          value: format(range.to, 'yyyy-MM-dd'),
        },
      } as React.ChangeEvent<HTMLInputElement>
      handleDateChange(leavingEvent)
    }
  }

  const calculateNights = () => {
    if (dateRange?.from && dateRange?.to) {
      return Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))
    }
    return 0
  }

  const nights = calculateNights()
  const subtotal = parseFloat(product.basePrice) * nights
  const cleaningFee = 25
  const serviceFee = 0
  const taxes = Math.round(parseFloat(product.basePrice) * 0.1)
  const total = subtotal + cleaningFee + serviceFee + taxes

  const hasValidDates = dateRange?.from && dateRange?.to

  return (
    <div className='sticky top-20'>
      <div className='bg-white border border-gray-200 rounded-2xl shadow-xl p-6'>
        <div className='flex flex-col gap-4 mb-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-baseline gap-2'>
              <span className='text-2xl font-semibold text-gray-900'>{product.basePrice}€</span>
              <span className='text-gray-600'>par nuit</span>
            </div>
            {product.reviews && product.reviews.length > 0 ? (
              <div className='flex items-center gap-1'>
                <Star className='h-4 w-4 fill-yellow-400 text-yellow-400' />
                <span className='text-sm font-medium'>{globalGrade.toFixed(1)}</span>
                <span className='text-sm text-gray-500'>({product.reviews.length})</span>
              </div>
            ) : (
              <div className='flex items-center gap-1'>
                <Star className='h-4 w-4 text-gray-300' />
                <span className='text-sm text-gray-500'>(aucun avis)</span>
              </div>
            )}
          </div>
          <div className='flex items-center gap-2'>
            <div className='relative h-10 w-10 rounded-full overflow-hidden'>
              {(() => {
                const imageUrl = product.user[0]?.image
                  ? getProfileImageUrl(product.user[0].image)
                  : null
                return imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={`Photo de profil de ${product.user[0]?.name}`}
                    fill
                    className='object-cover'
                  />
                ) : (
                  <div
                    className='h-full w-full flex items-center justify-center text-white text-sm font-medium'
                    style={{
                      background: `linear-gradient(45deg, #FF512F, #DD2476)`,
                    }}
                  >
                    {product.user[0]?.name?.charAt(0).toUpperCase() || 'H'}
                  </div>
                )
              })()}
            </div>
            <div className='flex flex-col'>
              <span className='text-sm font-medium text-gray-900'>
                {product.user[0]?.name || 'Hosteed'}
              </span>
              <span className='text-xs text-gray-500'>Hôte</span>
            </div>
          </div>
        </div>

        <div className='border border-gray-300 rounded-xl overflow-hidden mb-6'>
          {/* Date Range Selector */}
          <div className='border-b border-gray-300'>
            <Popover>
              <PopoverTrigger asChild>
                <button className='w-full p-4 text-left hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset'>
                  <div className='flex items-center space-x-3'>
                    <div className='p-1.5 bg-green-50 rounded-full'>
                      <CalendarIcon className='h-4 w-4 text-green-600 flex-shrink-0' />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='text-xs font-semibold text-gray-700 mb-1'>
                        DATES DE SÉJOUR
                      </div>
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
                  onSelect={handleDateRangeChange}
                  numberOfMonths={2}
                  disabled={date => date < new Date(today)}
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

          {/* Guest Selector */}
          <div className='p-4'>
            <label className='block text-xs font-semibold text-gray-700 mb-2'>VOYAGEURS</label>
            <Popover>
              <PopoverTrigger asChild>
                <button className='w-full text-left hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded-lg p-2'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <Users className='h-4 w-4 text-gray-400' />
                      <span className='text-sm font-medium'>
                        {guests} {guests === 1 ? 'voyageur' : 'voyageurs'}
                      </span>
                    </div>
                    <div className='text-xs text-gray-500'>
                      Max {product.maxPeople || 8} voyageurs
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
                    <div className='flex items-center space-x-3'>
                      <Button
                        variant='outline'
                        size='icon'
                        className='rounded-full flex items-center justify-center h-8 w-8'
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
                      <span className='text-lg font-medium w-8 text-center'>{guests}</span>
                      <Button
                        variant='outline'
                        size='icon'
                        className='rounded-full flex items-center justify-center h-8 w-8'
                        onClick={() => {
                          if (guests < (product.maxPeople || 8)) {
                            setGuests(guests + 1)
                          } else {
                            toast.error(`Nombre maximum de voyageurs: ${product.maxPeople || 8}`)
                          }
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

        {!isAvailable && hasValidDates && (
          <div className='bg-red-50 border border-red-200 rounded-lg p-3 mb-4'>
            <p className='text-red-700 text-sm'>
              Ce logement n&apos;est pas disponible pour les dates sélectionnées.
            </p>
          </div>
        )}

        <Link
          href={
            hasValidDates
              ? `/host/${product.id}/reservation?checkIn=${formData.arrivingDate}&checkOut=${formData.leavingDate}&guests=${guests}`
              : `/host/${product.id}/reservation`
          }
          className={`w-full block text-center py-3 px-6 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${
            !isAvailable || !hasValidDates
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
          }`}
          onClick={e => {
            if (!isAvailable || !hasValidDates) {
              e.preventDefault()
            }
          }}
        >
          {!hasValidDates ? 'Sélectionnez des dates' : !isAvailable ? 'Non disponible' : 'Réserver'}
        </Link>

        <p className='text-center text-gray-600 text-sm mt-4'>
          Vous ne serez pas débité pour le moment
        </p>

        {hasValidDates && isAvailable && (
          <div className='mt-6 pt-6 border-t border-gray-200'>
            <div className='space-y-3 text-sm'>
              <div className='flex justify-between items-center'>
                <span className='text-gray-600 underline decoration-dotted cursor-help'>
                  {product.basePrice}€ × {nights} nuit{nights > 1 ? 's' : ''}
                </span>
                <span className='text-gray-900 font-medium'>{subtotal.toFixed(0)}€</span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-gray-600 underline decoration-dotted cursor-help'>
                  Frais de nettoyage
                </span>
                <span className='text-gray-900 font-medium'>{cleaningFee}€</span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-gray-600 underline decoration-dotted cursor-help'>
                  Frais de service Hosteed
                </span>
                <span className='text-gray-900 font-medium'>{serviceFee}€</span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-gray-600'>Taxes et frais</span>
                <span className='text-gray-900 font-medium'>{taxes}€</span>
              </div>
              <div className='border-t border-gray-200 pt-3 flex justify-between items-center font-semibold text-base'>
                <span>Total</span>
                <span>{total.toFixed(0)}€</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
