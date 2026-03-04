'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/hooks/useAuth'
import { useBookingProduct, useBookingUser, useBookingPricing } from '@/hooks/useBookingData'
import { reservationFormSchema, type ReservationFormData } from '@/lib/zod/booking.schema'
import {
  MapPin,
  Star,
  CreditCard,
  Shield,
  ArrowLeft,
  Check,
  CalendarDays,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/shadcnui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcnui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/shadcnui/form'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'
import Image from 'next/image'
import ExtraSelectionStep from '@/components/booking/ExtraSelectionStep'
import PhoneInput from '@/components/ui/PhoneInput'
import { formatCurrency, formatCurrencySafe, formatNumber } from '@/lib/utils/formatNumber'

const RESERVATION_MESSAGES = {
  DATES_UNAVAILABLE_TOAST:
    "Ces dates ne sont plus disponibles. Veuillez sélectionner d'autres dates.",
  DATES_UNAVAILABLE_BANNER:
    "Ces dates ne sont plus disponibles. Veuillez retourner en arrière et choisir d'autres dates.",
  FILL_REQUIRED_FIELDS: 'Veuillez remplir tous les champs obligatoires',
  LOGIN_REQUIRED: 'Vous devez être connecté pour effectuer une réservation',
  PRODUCT_NOT_FOUND: 'Impossible de trouver les informations du produit',
  PAYMENT_SESSION_ERROR: 'Erreur lors de la création de la session de paiement',
  GENERIC_ERROR: 'Une erreur est survenue lors de la création de la réservation',
  AVAILABILITY_CHECK_ERROR: 'Impossible de vérifier la disponibilité. Veuillez réessayer.',
} as const

const INPUT_CLASSES =
  'w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base'

export default function ReservationPage() {
  const { id } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    session,
    isLoading: isAuthLoading,
    isAuthenticated,
  } = useAuth({ required: true, redirectTo: '/auth' })

  // URL parameters
  const checkInParam = searchParams.get('checkIn')
  const checkOutParam = searchParams.get('checkOut')
  const guestsParam = searchParams.get('guests')

  // Step management and extras state
  const [step, setStep] = useState(2)
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>([])
  const [extrasCost, setExtrasCost] = useState(0)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [showDailyBreakdown, setShowDailyBreakdown] = useState(false)

  // React Hook Form with Zod validation
  const form = useForm<ReservationFormData>({
    resolver: zodResolver(reservationFormSchema),
    defaultValues: {
      peopleNumber: guestsParam ? parseInt(guestsParam) : 1,
      arrivingDate: checkInParam || '',
      leavingDate: checkOutParam || '',
      firstName: '',
      lastName: '',
      email: session?.user?.email || '',
      phone: '',
      phoneCountry: 'MG',
      specialRequests: '',
    },
  })

  const watchedValues = form.watch()
  const {
    arrivingDate: watchedArrivingDate,
    leavingDate: watchedLeavingDate,
    peopleNumber: watchedPeopleNumber,
    firstName: watchedFirstName,
    lastName: watchedLastName,
    email: watchedEmail,
    phone: watchedPhone,
    specialRequests: watchedSpecialRequests,
  } = watchedValues

  // React Query: product data
  const {
    data: product,
    isLoading: isProductLoading,
    error: productError,
  } = useBookingProduct(id as string)

  // React Query: user data for form pre-fill
  const { data: userData } = useBookingUser(
    isAuthenticated ? session?.user?.id : undefined
  )

  // React Query: booking pricing
  const { data: pricingData } = useBookingPricing({
    productId: product?.id ?? '',
    startDate: watchedArrivingDate ? new Date(watchedArrivingDate) : null,
    endDate: watchedLeavingDate ? new Date(watchedLeavingDate) : null,
    guestCount: watchedPeopleNumber,
    extrasCost,
    ownerId: product?.owner?.id,
    typeId: product?.type?.id ?? product?.typeId,
  })

  // Pre-fill form from user data
  useEffect(() => {
    if (userData) {
      form.setValue('email', userData.email || '')
      form.setValue('firstName', userData.name || '')
      form.setValue('lastName', userData.lastname || '')
    } else if (isAuthenticated && session?.user) {
      // Fallback to session data
      const nameParts = session.user.name?.split(' ') || []
      form.setValue('email', session.user.email || '')
      form.setValue('firstName', nameParts[0] || '')
      form.setValue('lastName', nameParts.slice(1).join(' ') || '')
    }
  }, [userData, isAuthenticated, session, form])

  // Availability check via API route (not a server action)
  useEffect(() => {
    const checkAvailability = async () => {
      if (!watchedArrivingDate || !watchedLeavingDate || !product?.id) {
        setIsAvailable(null)
        return
      }

      setIsAvailable(null)
      const arrivingDate = new Date(watchedArrivingDate)
      const leavingDate = new Date(watchedLeavingDate)

      arrivingDate.setHours(Number(product.arriving) || 14, 0, 0, 0)
      leavingDate.setHours(Number(product.leaving) || 11, 0, 0, 0)

      try {
        const params = new URLSearchParams({
          productId: product.id,
          arrival: arrivingDate.toISOString(),
          leaving: leavingDate.toISOString(),
        })
        const response = await fetch(`/api/check-availability?${params}`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error?.message || 'Availability check failed')
        }

        setIsAvailable(result.available)
        if (!result.available) {
          toast.error(RESERVATION_MESSAGES.DATES_UNAVAILABLE_TOAST)
        }
      } catch {
        toast.error(RESERVATION_MESSAGES.AVAILABILITY_CHECK_ERROR)
        setIsAvailable(null)
      }
    }

    checkAvailability()
  }, [watchedArrivingDate, watchedLeavingDate, product?.id, product?.arriving, product?.leaving])

  const calculateNights = useCallback(() => {
    if (!watchedArrivingDate || !watchedLeavingDate) return 0
    const from = new Date(watchedArrivingDate)
    const to = new Date(watchedLeavingDate)
    return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
  }, [watchedArrivingDate, watchedLeavingDate])

  // Derived pricing state from React Query
  const bookingPricing = pricingData?.pricing ?? null
  const priceCalculation = pricingData?.priceCalculation ?? null
  const validationErrors = pricingData?.validationErrors ?? []

  const calculateTotalPrice = () => {
    if (priceCalculation) {
      return Math.round(priceCalculation.clientPays)
    }

    // Fallback to legacy calculation if commission service fails
    if (!product || !watchedArrivingDate || !watchedLeavingDate) return 0

    const nights = calculateNights()
    if (nights <= 0) return 0

    const activePromo =
      product.promotions && product.promotions.length > 0
        ? product.promotions.find(promo => {
            const now = new Date()
            return (
              promo.isActive && new Date(promo.startDate) <= now && new Date(promo.endDate) >= now
            )
          })
        : null

    const baseNightlyPrice = parseFloat(product.basePrice)
    const effectivePrice = activePromo
      ? baseNightlyPrice * (1 - activePromo.discountPercentage / 100)
      : baseNightlyPrice

    const basePrice = effectivePrice * nights
    const subtotal = basePrice + extrasCost
    const commission = (subtotal * (product.commission ?? 0)) / 100

    return Math.round(subtotal + commission)
  }

  const getAverageRating = () => {
    if (!product?.reviews?.length) return 0
    const total = product.reviews.reduce((sum, review) => sum + review.grade, 0)
    return total / product.reviews.length
  }

  const handleNextStep = async () => {
    if (step === 2) {
      setStep(3)
    } else if (step === 3) {
      const isValid = await form.trigger(['firstName', 'lastName', 'email', 'phone'])
      if (!isValid) {
        toast.error(RESERVATION_MESSAGES.FILL_REQUIRED_FIELDS)
        return
      }
      setStep(4)
    }
  }

  const handleSubmit = async () => {
    if (!session?.user?.id) {
      toast.error(RESERVATION_MESSAGES.LOGIN_REQUIRED)
      return
    }

    if (!product) {
      toast.error(RESERVATION_MESSAGES.PRODUCT_NOT_FOUND)
      return
    }

    if (calculateNights() <= 0) {
      toast.error('La date de départ doit être après la date d\'arrivée')
      return
    }

    try {
      // Amount is calculated server-side — only send booking parameters
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: product.name,
          metadata: {
            productId: product.id,
            userId: String(session.user.id),
            userEmail: String(watchedEmail),
            productName: String(product.name),
            arrivingDate: String(watchedArrivingDate),
            leavingDate: String(watchedLeavingDate),
            peopleNumber: String(watchedPeopleNumber),
            firstName: String(watchedFirstName),
            lastName: String(watchedLastName),
            phone: String(watchedPhone),
            specialRequests: String(watchedSpecialRequests),
            selectedExtras: JSON.stringify(
              selectedExtraIds.map(extraId => ({ extraId, quantity: 1 }))
            ),
          },
        }),
      })

      const data = await response.json()
      if (data.url) {
        if (typeof window !== 'undefined') {
          window.location.href = data.url
        }
      } else {
        toast.error(RESERVATION_MESSAGES.PAYMENT_SESSION_ERROR)
      }
    } catch {
      toast.error(RESERVATION_MESSAGES.GENERIC_ERROR)
    }
  }

  if (isAuthLoading || isProductLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='flex flex-col items-center gap-4'>
          <div className='w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin'></div>
          <p className='text-slate-600 text-lg'>Chargement...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (productError || !product) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <p className='text-red-600 text-lg'>
            {productError ? 'Erreur lors de la récupération du produit' : 'Hébergement non trouvé'}
          </p>
          <Button onClick={() => router.back()} className='mt-4'>
            <ArrowLeft className='w-4 h-4 mr-2' />
            Retour
          </Button>
        </div>
      </div>
    )
  }

  const nights = bookingPricing?.numberOfNights || calculateNights()
  const subtotal = bookingPricing?.subtotal || parseFloat(product.basePrice) * nights
  const totalSavings = bookingPricing?.totalSavings || 0
  const hasPromotions = bookingPricing?.promotionApplied || false
  const hasSpecialPrices = bookingPricing?.specialPriceApplied || false
  const serviceFee = priceCalculation ? Math.round(priceCalculation.clientCommission) : 0
  const total = calculateTotalPrice()

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16 sm:h-20'>
            <button
              onClick={() => (step > 2 ? setStep(step - 1) : router.back())}
              className='flex items-center text-gray-600 hover:text-gray-900 transition-colors'
            >
              <ArrowLeft className='w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2' />
              <span className='hidden sm:inline'>
                {step > 2 ? 'Étape précédente' : 'Retour'}
              </span>
              <span className='sm:hidden'>{step > 2 ? 'Précédent' : 'Retour'}</span>
            </button>

            {/* Progress Steps */}
            <div className='flex items-center space-x-2 sm:space-x-4'>
              {[1, 2, 3].map(stepNum => (
                <div key={stepNum} className='flex items-center'>
                  <div
                    className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                      stepNum < step - 1
                        ? 'bg-green-500 text-white'
                        : stepNum === step - 1
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {stepNum < step - 1 ? (
                      <Check className='w-3 h-3 sm:w-4 sm:h-4' />
                    ) : (
                      stepNum
                    )}
                  </div>
                  {stepNum < 3 && (
                    <div
                      className={`w-6 sm:w-12 h-1 mx-1 sm:mx-2 ${stepNum < step - 1 ? 'bg-green-500' : 'bg-gray-200'}`}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className='text-xs sm:text-sm text-gray-600'>
              <span className='hidden sm:inline'>Étape {step - 1} sur 3</span>
              <span className='sm:hidden'>{step - 1}/3</span>
            </div>
          </div>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8'>
          {/* Main Content */}
          <div className='lg:col-span-2 order-2 lg:order-1'>
            {/* Property Info */}
            <Card className='mb-6 sm:mb-8'>
              <CardContent className='p-4 sm:p-6'>
                <div className='flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4'>
                  {product.img?.[0] && (
                    <div className='flex-shrink-0 w-full sm:w-auto'>
                      <Image
                        src={product.img[0].img}
                        alt={product.name}
                        width={120}
                        height={80}
                        className='rounded-lg object-cover w-full sm:w-[120px] h-20 sm:h-20'
                      />
                    </div>
                  )}
                  <div className='flex-1 min-w-0'>
                    <h1 className='text-xl sm:text-2xl font-bold text-gray-900 mb-2'>
                      {product.name}
                    </h1>
                    {product.address && (
                      <div className='flex items-center text-gray-600 mb-2'>
                        <MapPin className='w-4 h-4 mr-1 flex-shrink-0' />
                        <span className='text-sm truncate'>{product.address}</span>
                      </div>
                    )}
                    {product.reviews && product.reviews.length > 0 && (
                      <div className='flex items-center'>
                        <Star className='w-4 h-4 fill-yellow-400 text-yellow-400 mr-1' />
                        <span className='text-sm font-medium'>
                          {formatNumber(getAverageRating(), 1)}
                        </span>
                        <span className='text-sm text-gray-500 ml-1'>
                          ({product.reviews.length} avis)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step Content */}
            {step === 2 && (
              <ExtraSelectionStep
                productId={product?.id ?? ''}
                numberOfDays={calculateNights()}
                guestCount={watchedPeopleNumber}
                currency='EUR'
                selectedExtraIds={selectedExtraIds}
                onSelectionChange={setSelectedExtraIds}
                onCostChange={setExtrasCost}
              />
            )}

            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg sm:text-xl'>Informations personnelles</CardTitle>
                </CardHeader>
                <CardContent className='p-4 sm:p-6'>
                  <Form {...form}>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6'>
                      <FormField
                        control={form.control}
                        name='firstName'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prénom *</FormLabel>
                            <FormControl>
                              <input type='text' {...field} className={INPUT_CLASSES} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name='lastName'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom *</FormLabel>
                            <FormControl>
                              <input type='text' {...field} className={INPUT_CLASSES} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name='email'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email *</FormLabel>
                            <FormControl>
                              <input type='email' {...field} className={INPUT_CLASSES} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name='phone'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Téléphone *</FormLabel>
                            <FormControl>
                              <PhoneInput
                                value={field.value}
                                defaultCountry={form.watch('phoneCountry')}
                                onChange={(phoneNumber, countryCode) => {
                                  form.setValue('phone', phoneNumber)
                                  form.setValue('phoneCountry', countryCode)
                                }}
                                placeholder='XX XX XX XX'
                                required
                                className='w-full'
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className='mt-6'>
                      <FormField
                        control={form.control}
                        name='specialRequests'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Demandes spéciales (optionnel)</FormLabel>
                            <FormControl>
                              <textarea
                                {...field}
                                rows={4}
                                className={`${INPUT_CLASSES} resize-none`}
                                placeholder='Toute demande particulière pour votre séjour...'
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </Form>
                </CardContent>
              </Card>
            )}

            {step === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center'>
                    <CreditCard className='w-5 h-5 mr-2' />
                    Finalisation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'>
                    <div className='flex items-start space-x-3'>
                      <Shield className='w-5 h-5 text-blue-600 mt-0.5' />
                      <div>
                        <h4 className='font-medium text-blue-900'>Paiement sécurisé</h4>
                        <p className='text-blue-700 text-sm mt-1'>
                          Votre paiement est sécurisé par Stripe. Vous serez redirigé vers une page
                          de paiement sécurisée.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='space-y-4'>
                    <div className='flex justify-between py-2'>
                      <span className='text-gray-600'>Dates:</span>
                      <span className='font-medium'>
                        {watchedArrivingDate && watchedLeavingDate && (
                          <>
                            {format(new Date(watchedArrivingDate), 'dd MMM', { locale: fr })} -{' '}
                            {format(new Date(watchedLeavingDate), 'dd MMM', { locale: fr })}
                          </>
                        )}
                      </span>
                    </div>
                    <div className='flex justify-between py-2'>
                      <span className='text-gray-600'>Voyageurs:</span>
                      <span className='font-medium'>{watchedPeopleNumber}</span>
                    </div>
                    <div className='flex justify-between py-2'>
                      <span className='text-gray-600'>Contact:</span>
                      <span className='font-medium'>
                        {watchedFirstName} {watchedLastName}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Summary Sidebar */}
          <div className='lg:col-span-1 order-1 lg:order-2'>
            <Card className='lg:sticky lg:top-6 gap-2 py-4'>
              <CardHeader className='px-4 sm:px-6'>
                <CardTitle className='text-lg sm:text-xl'>
                  Récapitulatif de la réservation
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4 px-4 sm:px-6'>
                {/* Dates unavailable warning */}
                {isAvailable === false && (
                  <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
                    <span className='text-red-700 text-sm font-medium'>
                      {RESERVATION_MESSAGES.DATES_UNAVAILABLE_BANNER}
                    </span>
                  </div>
                )}

                {/* Validation errors */}
                {validationErrors.length > 0 && (
                  <div className='bg-red-50 border border-red-200 rounded-lg p-3 space-y-2'>
                    <div className='flex items-start gap-2'>
                      <span className='text-red-600 font-medium text-sm'>
                        Réservation impossible
                      </span>
                    </div>
                    <ul className='space-y-1'>
                      {validationErrors.map((validationError, index) => (
                        <li key={index} className='text-red-700 text-sm'>
                          {validationError}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Booking details */}
                {watchedArrivingDate && watchedLeavingDate && (
                  <div className='bg-gray-50 rounded-lg p-3 space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Dates:</span>
                      <span className='font-medium'>
                        {format(new Date(watchedArrivingDate), 'dd MMM', { locale: fr })} -{' '}
                        {format(new Date(watchedLeavingDate), 'dd MMM', { locale: fr })}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Durée:</span>
                      <span className='font-medium'>
                        {nights} nuit{nights > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Voyageurs:</span>
                      <span className='font-medium'>
                        {watchedPeopleNumber} personne{watchedPeopleNumber > 1 ? 's' : ''}
                      </span>
                    </div>
                    {product.type?.name && (
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>Type:</span>
                        <span className='font-medium'>{product.type.name}</span>
                      </div>
                    )}
                  </div>
                )}

                {nights > 0 && (
                  <>
                    {/* Active discount badges */}
                    {totalSavings > 0 && (hasPromotions || hasSpecialPrices) && (
                      <div className='bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg px-3 py-2 mb-2'>
                        <div className='flex items-center justify-between'>
                          <span className='text-sm text-green-700 font-medium'>
                            {hasPromotions && hasSpecialPrices
                              ? 'Promotions & Prix spéciaux actifs'
                              : hasPromotions
                                ? 'Promotion active'
                                : 'Prix spéciaux actifs'}
                          </span>
                        </div>
                        <div className='text-xs text-green-600 mt-1'>
                          Vous économisez {formatCurrency(totalSavings, 'EUR', 0)} sur ce séjour
                        </div>
                      </div>
                    )}

                    {/* Per-day breakdown (collapsible) */}
                    {bookingPricing?.dailyBreakdown &&
                      bookingPricing.dailyBreakdown.length > 0 &&
                      (hasPromotions || hasSpecialPrices) && (
                        <div className='space-y-2'>
                          <button
                            type='button'
                            onClick={() => setShowDailyBreakdown(prev => !prev)}
                            className='flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors w-full'
                          >
                            <CalendarDays className='h-4 w-4' />
                            <span className='font-medium'>Détail par nuit</span>
                            {showDailyBreakdown ? (
                              <ChevronUp className='h-4 w-4 ml-auto' />
                            ) : (
                              <ChevronDown className='h-4 w-4 ml-auto' />
                            )}
                          </button>

                          {showDailyBreakdown && (
                            <div className='space-y-1.5 max-h-48 overflow-y-auto'>
                              {bookingPricing.dailyBreakdown.map((day, index) => (
                                <div
                                  key={index}
                                  className='flex items-center justify-between py-1.5 px-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors text-xs sm:text-sm'
                                >
                                  <span className='font-medium text-gray-800'>
                                    {new Date(day.date).toLocaleDateString('fr-FR', {
                                      weekday: 'short',
                                      day: 'numeric',
                                      month: 'short',
                                    })}
                                  </span>
                                  <div className='flex items-center gap-2'>
                                    {day.savings > 0 && (
                                      <>
                                        {day.promotionApplied && (
                                          <span className='text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium'>
                                            Promo
                                            {day.promotionDiscount
                                              ? ` -${day.promotionDiscount}%`
                                              : ''}
                                          </span>
                                        )}
                                        {day.specialPriceApplied && (
                                          <span className='text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium'>
                                            Prix spécial
                                          </span>
                                        )}
                                        <span className='text-xs text-gray-400 line-through'>
                                          {formatCurrencySafe(day.basePrice)}
                                        </span>
                                      </>
                                    )}
                                    {day.savings < 0 && day.specialPriceApplied && (
                                      <span className='text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium'>
                                        Tarif spécial
                                      </span>
                                    )}
                                    <span className='font-semibold text-gray-900'>
                                      {formatCurrencySafe(day.finalPrice)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                    {/* Base price */}
                    <div className='space-y-2'>
                      <div className='flex justify-between items-start'>
                        <div className='flex-1 pr-2'>
                          {totalSavings > 0 ? (
                            <div className='space-y-1'>
                              <div className='text-xs text-gray-400 line-through'>
                                Prix d&apos;origine :{' '}
                                {formatCurrency(subtotal + totalSavings, 'EUR', 0)}
                              </div>
                              <div className='text-sm sm:text-base text-green-600 font-medium'>
                                {nights} nuit{nights > 1 ? 's' : ''} (avec réductions)
                              </div>
                            </div>
                          ) : (
                            <span className='text-gray-600 text-sm sm:text-base'>
                              {formatCurrency(parseFloat(product.basePrice), 'EUR')} x {nights}{' '}
                              nuit
                              {nights > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <span className='font-medium text-sm sm:text-base flex-shrink-0'>
                          {formatCurrency(subtotal, 'EUR', 0)}
                        </span>
                      </div>
                    </div>

                    {/* Extra options */}
                    {extrasCost > 0 && (
                      <div className='space-y-2'>
                        <div className='flex justify-between items-start'>
                          <span className='text-gray-600 text-sm sm:text-base flex-1 pr-2'>
                            Options supplémentaires
                          </span>
                          <span className='font-medium text-sm sm:text-base flex-shrink-0'>
                            +{formatCurrency(extrasCost, 'EUR')}
                          </span>
                        </div>
                        <div className='text-xs text-gray-500 pl-4'>
                          Détails affichés dans l&apos;étape précédente
                        </div>
                      </div>
                    )}

                    {/* Service fees */}
                    <div className='bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2'>
                      <div className='flex justify-between items-start'>
                        <div className='flex-1 pr-2'>
                          <span className='text-blue-800 text-sm sm:text-base font-medium'>
                            Frais de service Hosteed
                          </span>
                          {priceCalculation?.breakdown && (
                            <div className='text-xs text-blue-600 mt-1'>
                              {priceCalculation.breakdown.clientCommissionRate > 0 && (
                                <div>
                                  {formatNumber(
                                    priceCalculation.breakdown.clientCommissionRate * 100,
                                    1
                                  )}
                                  % du montant
                                </div>
                              )}
                              {priceCalculation.breakdown.clientCommissionFixed > 0 && (
                                <div>
                                  {formatCurrency(
                                    priceCalculation.breakdown.clientCommissionFixed,
                                    'EUR'
                                  )}{' '}
                                  de frais fixes
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <span className='font-medium text-sm sm:text-base flex-shrink-0 text-blue-800'>
                          {formatCurrency(serviceFee, 'EUR', 0)}
                        </span>
                      </div>
                      <div className='text-xs text-blue-600'>
                        Ces frais permettent de faire vivre la plateforme et d&apos;assurer un
                        service de qualité
                      </div>
                    </div>

                    {/* Subtotal */}
                    <div className='flex justify-between items-center text-sm border-t pt-3'>
                      <span className='text-gray-600'>Sous-total</span>
                      <span className='font-medium'>
                        {formatCurrency(subtotal + extrasCost, 'EUR', 0)}
                      </span>
                    </div>

                    {/* Total */}
                    <div className='border-t-2 pt-4'>
                      <div className='flex justify-between text-lg sm:text-xl font-bold'>
                        <span>Total à payer</span>
                        <span className='text-green-600'>{formatCurrency(total, 'EUR', 0)}</span>
                      </div>
                    </div>
                  </>
                )}

                <div className='pt-4'>
                  {step < 4 ? (
                    <Button
                      onClick={handleNextStep}
                      disabled={
                        validationErrors.length > 0 ||
                        isAvailable === false ||
                        (step === 3 &&
                          (!watchedFirstName ||
                            !watchedLastName ||
                            !watchedEmail ||
                            !watchedPhone))
                      }
                      className='w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 sm:py-4 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
                    >
                      {step === 2 ? 'Continuer' : step === 3 ? 'Finaliser' : 'Continuer'}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={validationErrors.length > 0 || isAvailable === false}
                      className='w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 sm:py-4 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
                    >
                      <CreditCard className='w-4 h-4 mr-2' />
                      Procéder au paiement
                    </Button>
                  )}
                </div>
                <div className='p-3 bg-green-50 border border-green-200 rounded-lg'>
                  <p className='text-sm text-green-800 text-center leading-relaxed font-medium'>
                    Vous ne serez débité qu&apos;après confirmation de la réservation
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
