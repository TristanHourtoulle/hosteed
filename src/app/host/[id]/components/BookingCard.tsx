import Link from 'next/link'
import Image from 'next/image'
import { Star, Users, Minus, Plus, Calendar as CalendarIcon } from 'lucide-react'
import { Equipment, Meals, Services, User } from '@prisma/client'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/shadcnui/popover'
import { Button } from '@/components/ui/shadcnui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcnui/card'
import { Calendar } from '@/components/ui/shadcnui/calendar'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { DateRange } from 'react-day-picker'
import { getProfileImageUrl } from '@/lib/utils'
import { formatCurrency, formatNumber } from '@/lib/utils/formatNumber'
import { calculateBookingPrice, type BookingPriceResult } from '@/lib/services/booking-pricing.service'

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

interface ProductPromotion {
  id: string
  discountPercentage: number
  startDate: Date
  endDate: Date
  isActive: boolean
}

interface Product {
  id: string
  name: string
  description: string
  basePrice: string
  originalBasePrice?: string
  specialPriceApplied?: boolean
  specialPriceInfo?: {
    pricesMga: string
    pricesEuro: string
    day: string[]
    startDate: Date | null
    endDate: Date | null
  }
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
  owner: User
  typeId?: string // Property type ID for commission calculation
  type?: { id: string; name: string } // Property type relation
  promotions?: ProductPromotion[]
  extras?: { id: string; name: string; priceEUR: number }[] // Available extras
  includedServices?: { id: string; name: string }[] // Included services
  availableRooms?: number // For hotels
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
  const [guests, setGuests] = useState(product.minPeople || 1)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: formData.arrivingDate ? new Date(formData.arrivingDate) : undefined,
    to: formData.leavingDate ? new Date(formData.leavingDate) : undefined,
  })
  const [bookingPricing, setBookingPricing] = useState<BookingPriceResult | null>(null)

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
  const hasValidDates = dateRange?.from && dateRange?.to

  // ✨ NEW: Calculate booking price jour par jour (promotions + special prices)
  useEffect(() => {
    const fetchBookingPrice = async () => {
      if (!dateRange?.from || !dateRange?.to || nights <= 0) {
        setBookingPricing(null)
        return
      }

      try {
        const pricing = await calculateBookingPrice(
          product.id,
          dateRange.from,
          dateRange.to,
          product.owner?.id
        )
        setBookingPricing(pricing)
        console.log('💰 [BookingCard] Pricing calculated:', {
          subtotal: pricing.subtotal,
          totalSavings: pricing.totalSavings,
          promotionApplied: pricing.promotionApplied,
          specialPriceApplied: pricing.specialPriceApplied,
          averageNightlyPrice: pricing.averageNightlyPrice,
        })
      } catch (error) {
        console.error('Error calculating booking price:', error)
        setBookingPricing(null)
      }
    }

    fetchBookingPrice()
  }, [dateRange, product.id, product.owner?.id, nights])

  // Use booking pricing if available, otherwise fallback to simple calculation
  const effectiveBasePrice = bookingPricing?.averageNightlyPrice || parseFloat(product.basePrice)
  const subtotal = bookingPricing?.subtotal || effectiveBasePrice * nights
  const totalSavings = bookingPricing?.totalSavings || 0
  const hasPromotions = bookingPricing?.promotionApplied || false
  const hasSpecialPrices = bookingPricing?.specialPriceApplied || false
  const originalTotalPrice = subtotal + totalSavings

  // Note: Service fees are NOT shown in BookingCard, only in reservation page
  const total = subtotal

  return (
    <div className='sticky top-20'>
      <div className='bg-white border border-gray-200 rounded-2xl shadow-xl p-6'>
        <div className='flex flex-col gap-4 mb-6'>
          {/* Prix et notes sur la même ligne */}
          <div className='flex items-center justify-between'>
            <div className='flex flex-col gap-1'>
              {totalSavings > 0 && (
                <div className='flex items-center gap-2'>
                  <span className='text-sm text-gray-400 line-through'>
                    {formatCurrency(parseFloat(product.basePrice))}
                  </span>
                  <span className='bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-0.5 rounded-full text-xs font-bold'>
                    Réduction
                  </span>
                </div>
              )}
              <div className='flex items-baseline gap-2'>
                <span
                  className={`text-2xl font-semibold ${totalSavings > 0 ? 'text-green-600' : 'text-gray-900'}`}
                >
                  {formatCurrency(effectiveBasePrice)}
                </span>
                <span className='text-gray-600'>
                  {bookingPricing ? 'prix moyen / nuit' : 'par nuit'}
                </span>
              </div>
            </div>
            {product.reviews && product.reviews.length > 0 ? (
              <div className='flex items-center gap-1'>
                <Star className='h-4 w-4 fill-yellow-400 text-yellow-400' />
                <span className='text-sm font-medium'>{formatNumber(globalGrade, 1)}</span>
                <span className='text-sm text-gray-500'>
                  ({formatNumber(product.reviews.length)})
                </span>
              </div>
            ) : (
              <div className='flex items-center gap-1'>
                <Star className='h-4 w-4 text-gray-300' />
                <span className='text-sm text-gray-500'>(aucun avis)</span>
              </div>
            )}
          </div>

          {/* Badge de promotion/prix spécial si actif */}
          {totalSavings > 0 && (hasPromotions || hasSpecialPrices) && (
            <div className='bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg px-3 py-2'>
              <div className='flex flex-col gap-1'>
                <span className='text-sm text-green-700 font-medium'>
                  🎉 {hasPromotions && hasSpecialPrices
                    ? 'Promotions & Prix spéciaux actifs'
                    : hasPromotions
                      ? 'Promotion active'
                      : 'Prix spéciaux actifs'}
                </span>
                <span className='text-sm text-green-800 font-semibold'>
                  Économisez {formatCurrency(totalSavings, 'EUR', 0)} sur ce séjour
                </span>
              </div>
            </div>
          )}


          {/* Extras disponibles - Hint */}
          {product.extras && product.extras.length > 0 && (
            <div className='bg-blue-50 border border-blue-200 rounded-lg px-3 py-2'>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-blue-700 font-medium'>
                  ✨ {product.extras.length} option{product.extras.length > 1 ? 's' : ''}{' '}
                  supplémentaire{product.extras.length > 1 ? 's' : ''} disponible
                  {product.extras.length > 1 ? 's' : ''}
                </span>
              </div>
              <span className='text-xs text-blue-600 mt-1 block'>
                À ajouter lors de la réservation
              </span>
            </div>
          )}

          {/* Hotel info - Available rooms */}
          {product.availableRooms && product.availableRooms > 0 && (
            <div className='bg-purple-50 border border-purple-200 rounded-lg px-3 py-2'>
              <div className='flex items-center gap-2'>
                <span className='text-sm text-purple-700 font-medium'>
                  🏨 {product.availableRooms} chambre{product.availableRooms > 1 ? 's' : ''}{' '}
                  disponible{product.availableRooms > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}

          <div className='flex items-center gap-2'>
            <div className='relative h-10 w-10 rounded-full overflow-hidden'>
              {(() => {
                const imageUrl = product.owner?.image
                  ? getProfileImageUrl(product.owner.image)
                  : null
                return imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={`Photo de profil de ${product.owner?.name}`}
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
                    {product.owner?.name?.charAt(0).toUpperCase() || 'H'}
                  </div>
                )
              })()}
            </div>
            <div className='flex flex-col'>
              <span className='text-sm font-medium text-gray-900'>
                {product.owner?.name || 'Hosteed'}
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
                    {(product.minPeople || product.maxPeople) && (
                      <div className='text-xs text-gray-500'>
                        {product.minPeople && product.maxPeople
                          ? `${product.minPeople}-${product.maxPeople} voyageur${product.maxPeople > 1 ? 's' : ''}`
                          : product.maxPeople
                            ? `Max ${product.maxPeople} voyageur${product.maxPeople > 1 ? 's' : ''}`
                            : `Min ${product.minPeople} voyageur${product.minPeople! > 1 ? 's' : ''}`}
                      </div>
                    )}
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
                          const minGuests = product.minPeople || 1
                          if (guests > minGuests) {
                            setGuests(guests - 1)
                            return
                          }
                          toast.error(
                            `Nombre minimum de voyageurs: ${minGuests}`
                          )
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
                          const maxGuests = product.maxPeople || 1
                          if (guests < maxGuests) {
                            setGuests(guests + 1)
                          } else {
                            toast.error(`Nombre maximum de voyageurs: ${maxGuests}`)
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

        <div className='mt-4 p-3 bg-green-50 border border-green-200 rounded-lg'>
          <p className='text-center text-green-800 text-base font-medium'>
            Vous ne serez pas débité pour le moment
          </p>
        </div>

        {hasValidDates && isAvailable && (
          <div className='mt-6 pt-6 border-t border-gray-200'>
            <div className='space-y-3 text-sm'>
              {/* Afficher le prix d'origine si réductions */}
              {totalSavings > 0 && (
                <div className='flex justify-between items-center text-gray-400'>
                  <span className='line-through'>
                    {formatCurrency(parseFloat(product.basePrice))} × {formatNumber(nights)} nuit
                    {nights > 1 ? 's' : ''}
                  </span>
                  <span className='line-through'>{formatCurrency(originalTotalPrice, 'EUR', 0)}</span>
                </div>
              )}

              {/* Prix avec réductions */}
              <div className='flex justify-between items-center'>
                <span className={`text-gray-600 ${totalSavings > 0 ? 'font-medium text-green-700' : ''}`}>
                  {bookingPricing
                    ? `Prix moyen ${formatCurrency(effectiveBasePrice)} × ${formatNumber(nights)} nuit${nights > 1 ? 's' : ''}`
                    : `${formatCurrency(effectiveBasePrice)} × ${formatNumber(nights)} nuit${nights > 1 ? 's' : ''}`}
                  {totalSavings > 0 && (
                    <span className='ml-1 text-green-600 font-medium text-xs'>
                      (avec réductions)
                    </span>
                  )}
                </span>
                <span className={`font-medium ${totalSavings > 0 ? 'text-green-700' : 'text-gray-900'}`}>
                  {formatCurrency(subtotal, 'EUR', 0)}
                </span>
              </div>

              {/* Total */}
              <div className='border-t border-gray-200 pt-3 flex justify-between items-center font-semibold text-base'>
                <span>Total</span>
                <span>{formatCurrency(total, 'EUR', 0)}</span>
              </div>

              <div className='text-xs text-gray-500 text-center mt-2'>
                Les frais de service seront détaillés lors de la réservation
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
