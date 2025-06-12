'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { CheckRentIsAvailable } from '@/lib/services/rents.service'
import { findProductById } from '@/lib/services/product.service'
import {
  Calendar as CalendarIcon,
  Users,
  MapPin,
  Star,
  CreditCard,
  Shield,
  ArrowLeft,
  Check,
} from 'lucide-react'
import { Calendar } from '@/components/ui/shadcnui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/shadcnui/popover'
import { Button } from '@/components/ui/shadcnui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcnui/card'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { DateRange } from 'react-day-picker'
import { toast } from 'sonner'
import Image from 'next/image'

interface Option {
  id: string
  name: string
  price: bigint
  type: bigint
}

interface Reviews {
  id: string
  grade: number
}

interface Product {
  id: string
  name: string
  basePrice: string
  options: Option[]
  commission: number
  arriving: number
  leaving: number
  address?: string
  maxPeople?: bigint | null
  reviews?: Reviews[]
  img?: {
    img: string
  }[]
}

interface FormData {
  peopleNumber: number
  arrivingDate: string
  leavingDate: string
  firstName: string
  lastName: string
  email: string
  phone: string
  specialRequests: string
}

export default function ReservationPage() {
  const { id } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [isAvailable, setIsAvailable] = useState<boolean>(true)
  const [step, setStep] = useState(1) // 1: dates & guests, 2: personal info, 3: payment

  // Get URL parameters
  const checkInParam = searchParams.get('checkIn')
  const checkOutParam = searchParams.get('checkOut')
  const guestsParam = searchParams.get('guests')

  const [formData, setFormData] = useState<FormData>({
    peopleNumber: guestsParam ? parseInt(guestsParam) : 1,
    arrivingDate: checkInParam || '',
    leavingDate: checkOutParam || '',
    firstName: '',
    lastName: '',
    email: session?.user?.email || '',
    phone: '',
    specialRequests: '',
  })

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: checkInParam ? new Date(checkInParam) : undefined,
    to: checkOutParam ? new Date(checkOutParam) : undefined,
  })

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productData = await findProductById(id as string)
        if (productData) {
          setProduct(productData)
        } else {
          setError('Produit non trouvé')
        }
      } catch (error) {
        setError('Erreur lors de la récupération du produit' + error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  useEffect(() => {
    if (session?.user?.email) {
      setFormData(prev => ({ ...prev, email: session.user.email || '' }))
    }
  }, [session])

  useEffect(() => {
    const checkAvailability = async () => {
      if (formData.arrivingDate && formData.leavingDate) {
        const arrivingDate = new Date(formData.arrivingDate)
        const leavingDate = new Date(formData.leavingDate)

        arrivingDate.setHours(Number(product?.arriving) || 14, 0, 0, 0)
        leavingDate.setHours(Number(product?.leaving) || 11, 0, 0, 0)

        const available = await CheckRentIsAvailable(id as string, arrivingDate, leavingDate)
        setIsAvailable(available.available)
      } else {
        setIsAvailable(true)
      }
    }

    checkAvailability()
  }, [formData.arrivingDate, formData.leavingDate, id, product?.arriving, product?.leaving])

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)

    if (range?.from) {
      setFormData(prev => ({
        ...prev,
        arrivingDate: format(range.from!, 'yyyy-MM-dd'),
      }))
    }

    if (range?.to) {
      setFormData(prev => ({
        ...prev,
        leavingDate: format(range.to!, 'yyyy-MM-dd'),
      }))
    }
  }

  const handleOptionChange = (optionId: string) => {
    setSelectedOptions(prev =>
      prev.includes(optionId) ? prev.filter(id => id !== optionId) : [...prev, optionId]
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const calculateNights = () => {
    if (!dateRange?.from || !dateRange?.to) return 0
    return Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))
  }

  const calculateTotalPrice = () => {
    if (!product || !dateRange?.from || !dateRange?.to) return 0

    const nights = calculateNights()
    if (nights <= 0) return 0

    const basePrice = parseFloat(product.basePrice) * nights
    const optionsPrice = product.options
      .filter(option => selectedOptions.includes(option.id))
      .reduce((sum, option) => sum + Number(option.price), 0)
    const subtotal = basePrice + optionsPrice
    const commission = (subtotal * product.commission) / 100

    return Math.round(subtotal + commission)
  }

  const getAverageRating = () => {
    if (!product?.reviews?.length) return 0
    const total = product.reviews.reduce((sum, review) => sum + review.grade, 0)
    return total / product.reviews.length
  }

  const handleNextStep = () => {
    if (step === 1) {
      if (!dateRange?.from || !dateRange?.to || !isAvailable) {
        toast.error('Veuillez sélectionner des dates valides')
        return
      }
      setStep(2)
    } else if (step === 2) {
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
        toast.error('Veuillez remplir tous les champs obligatoires')
        return
      }
      setStep(3)
    }
  }

  const handleSubmit = async () => {
    if (!session?.user?.id) {
      toast.error('Vous devez être connecté pour effectuer une réservation')
      return
    }

    if (!product) {
      toast.error('Impossible de trouver les informations du produit')
      return
    }

    try {
      const total = calculateTotalPrice()

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: total,
          productName: product.name,
          metadata: {
            productId: id,
            userId: session.user.id,
            userEmail: formData.email,
            productName: product.name,
            arrivingDate: formData.arrivingDate,
            leavingDate: formData.leavingDate,
            peopleNumber: formData.peopleNumber,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            specialRequests: formData.specialRequests,
            options: selectedOptions,
            prices: total,
          },
        }),
      })

      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error('Erreur lors de la création de la session de paiement')
      }
    } catch {
      toast.error('Une erreur est survenue lors de la création de la réservation')
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
          <p className='text-gray-600 mt-4'>Chargement...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <p className='text-red-600 text-lg'>{error || 'Hébergement non trouvé'}</p>
          <Button onClick={() => router.back()} className='mt-4'>
            <ArrowLeft className='w-4 h-4 mr-2' />
            Retour
          </Button>
        </div>
      </div>
    )
  }

  const nights = calculateNights()
  const subtotal = parseFloat(product.basePrice) * nights
  const optionsTotal = product.options
    .filter(option => selectedOptions.includes(option.id))
    .reduce((sum, option) => sum + Number(option.price), 0)
  const cleaningFee = 25
  const serviceFee = 0
  const taxes = Math.round(subtotal * 0.1)
  const total = calculateTotalPrice()

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16 sm:h-20'>
            <button
              onClick={() => (step > 1 ? setStep(step - 1) : router.back())}
              className='flex items-center text-gray-600 hover:text-gray-900 transition-colors'
            >
              <ArrowLeft className='w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2' />
              <span className='hidden sm:inline'>{step > 1 ? 'Étape précédente' : 'Retour'}</span>
              <span className='sm:hidden'>{step > 1 ? 'Précédent' : 'Retour'}</span>
            </button>

            {/* Progress Steps */}
            <div className='flex items-center space-x-2 sm:space-x-4'>
              {[1, 2, 3].map(stepNum => (
                <div key={stepNum} className='flex items-center'>
                  <div
                    className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                      stepNum < step
                        ? 'bg-green-500 text-white'
                        : stepNum === step
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {stepNum < step ? <Check className='w-3 h-3 sm:w-4 sm:h-4' /> : stepNum}
                  </div>
                  {stepNum < 3 && (
                    <div
                      className={`w-6 sm:w-12 h-1 mx-1 sm:mx-2 ${stepNum < step ? 'bg-green-500' : 'bg-gray-200'}`}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className='text-xs sm:text-sm text-gray-600'>
              <span className='hidden sm:inline'>Étape {step} sur 3</span>
              <span className='sm:hidden'>{step}/3</span>
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
                        <span className='text-sm font-medium'>{getAverageRating().toFixed(1)}</span>
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
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center text-lg sm:text-xl'>
                    <CalendarIcon className='w-5 h-5 mr-2' />
                    Dates et voyageurs
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-6'>
                  {/* Date Selection */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-3'>
                      Sélectionnez vos dates
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className='w-full p-3 sm:p-4 border border-gray-300 rounded-xl hover:border-blue-500 transition-colors text-left'>
                          <div className='flex items-center space-x-3'>
                            <CalendarIcon className='h-5 w-5 text-gray-400 flex-shrink-0' />
                            <div className='min-w-0 flex-1'>
                              <div className='text-sm font-medium text-gray-900'>
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
                                  'Sélectionner les dates'
                                )}
                              </div>
                              {nights > 0 && (
                                <div className='text-xs text-gray-500'>
                                  {nights} nuit{nights > 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        className='w-auto p-0 max-w-[95vw]'
                        align='start'
                        side='bottom'
                        sideOffset={4}
                      >
                        <div className='block sm:hidden'>
                          <Calendar
                            initialFocus
                            mode='range'
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={handleDateRangeChange}
                            numberOfMonths={1}
                            disabled={date => date < new Date(today)}
                            className='rounded-lg border'
                          />
                        </div>
                        <div className='hidden sm:block'>
                          <Calendar
                            initialFocus
                            mode='range'
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={handleDateRangeChange}
                            numberOfMonths={2}
                            disabled={date => date < new Date(today)}
                            className='rounded-lg border'
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Guest Selection */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-3'>
                      Nombre de voyageurs
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className='w-full p-3 sm:p-4 border border-gray-300 rounded-xl hover:border-blue-500 transition-colors text-left'>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center space-x-3 min-w-0 flex-1'>
                              <Users className='h-5 w-5 text-gray-400 flex-shrink-0' />
                              <span className='font-medium truncate'>
                                {formData.peopleNumber}{' '}
                                {formData.peopleNumber === 1 ? 'voyageur' : 'voyageurs'}
                              </span>
                            </div>
                            <span className='text-sm text-gray-500 flex-shrink-0 ml-2'>
                              Max {Number(product.maxPeople) || 8}
                            </span>
                          </div>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className='w-72 sm:w-80 p-0' align='start'>
                        <Card>
                          <CardHeader className='pb-4'>
                            <CardTitle className='text-lg'>Voyageurs</CardTitle>
                          </CardHeader>
                          <CardContent className='flex items-center justify-center space-x-4 pb-6'>
                            <Button
                              variant='outline'
                              size='icon'
                              className='rounded-full h-10 w-10'
                              onClick={() => {
                                if (formData.peopleNumber > 1) {
                                  setFormData(prev => ({
                                    ...prev,
                                    peopleNumber: prev.peopleNumber - 1,
                                  }))
                                }
                              }}
                            >
                              -
                            </Button>
                            <span className='text-xl font-medium w-16 text-center'>
                              {formData.peopleNumber}
                            </span>
                            <Button
                              variant='outline'
                              size='icon'
                              className='rounded-full h-10 w-10'
                              onClick={() => {
                                if (formData.peopleNumber < (product.maxPeople || 8)) {
                                  setFormData(prev => ({
                                    ...prev,
                                    peopleNumber: prev.peopleNumber + 1,
                                  }))
                                }
                              }}
                            >
                              +
                            </Button>
                          </CardContent>
                        </Card>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Options */}
                  {product.options && product.options.length > 0 && (
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-3'>
                        Options supplémentaires
                      </label>
                      <div className='space-y-3'>
                        {product.options.map(option => (
                          <div
                            key={option.id}
                            className='flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-blue-300 transition-colors'
                          >
                            <div className='flex items-center space-x-3'>
                              <input
                                type='checkbox'
                                id={`option-${option.id}`}
                                checked={selectedOptions.includes(option.id)}
                                onChange={() => handleOptionChange(option.id)}
                                className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                              />
                              <label htmlFor={`option-${option.id}`} className='font-medium'>
                                {option.name}
                              </label>
                            </div>
                            <span className='text-lg font-semibold text-gray-900'>
                              +{Number(option.price)}€
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!isAvailable && dateRange?.from && dateRange?.to && (
                    <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                      <p className='text-red-700 font-medium'>
                        Ces dates ne sont pas disponibles. Veuillez en choisir d&apos;autres.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg sm:text-xl'>Informations personnelles</CardTitle>
                </CardHeader>
                <CardContent className='p-4 sm:p-6'>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Prénom *
                      </label>
                      <input
                        type='text'
                        name='firstName'
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className='w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base'
                        required
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>Nom *</label>
                      <input
                        type='text'
                        name='lastName'
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className='w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base'
                        required
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Email *
                      </label>
                      <input
                        type='email'
                        name='email'
                        value={formData.email}
                        onChange={handleInputChange}
                        className='w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base'
                        required
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Téléphone *
                      </label>
                      <input
                        type='tel'
                        name='phone'
                        value={formData.phone}
                        onChange={handleInputChange}
                        className='w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base'
                        required
                      />
                    </div>
                  </div>

                  <div className='mt-6'>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Demandes spéciales (optionnel)
                    </label>
                    <textarea
                      name='specialRequests'
                      value={formData.specialRequests}
                      onChange={handleInputChange}
                      rows={4}
                      className='w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base resize-none'
                      placeholder='Toute demande particulière pour votre séjour...'
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 3 && (
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
                        {dateRange?.from && dateRange?.to && (
                          <>
                            {format(dateRange.from, 'dd MMM', { locale: fr })} -{' '}
                            {format(dateRange.to, 'dd MMM', { locale: fr })}
                          </>
                        )}
                      </span>
                    </div>
                    <div className='flex justify-between py-2'>
                      <span className='text-gray-600'>Voyageurs:</span>
                      <span className='font-medium'>{formData.peopleNumber}</span>
                    </div>
                    <div className='flex justify-between py-2'>
                      <span className='text-gray-600'>Contact:</span>
                      <span className='font-medium'>
                        {formData.firstName} {formData.lastName}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Summary Sidebar */}
          <div className='lg:col-span-1 order-1 lg:order-2'>
            <Card className='lg:sticky lg:top-6'>
              <CardHeader className='p-4 sm:p-6'>
                <CardTitle className='text-lg sm:text-xl'>
                  Récapitulatif de la réservation
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4 p-4 sm:p-6 pt-0'>
                {nights > 0 && (
                  <>
                    <div className='flex justify-between items-start'>
                      <span className='text-gray-600 text-sm sm:text-base flex-1 pr-2'>
                        {product.basePrice}€ × {nights} nuit{nights > 1 ? 's' : ''}
                      </span>
                      <span className='font-medium text-sm sm:text-base flex-shrink-0'>
                        {subtotal.toFixed(0)}€
                      </span>
                    </div>

                    {optionsTotal > 0 && (
                      <div className='flex justify-between items-start'>
                        <span className='text-gray-600 text-sm sm:text-base flex-1 pr-2'>
                          Options
                        </span>
                        <span className='font-medium text-sm sm:text-base flex-shrink-0'>
                          +{optionsTotal}€
                        </span>
                      </div>
                    )}

                    <div className='flex justify-between items-start'>
                      <span className='text-gray-600 text-sm sm:text-base flex-1 pr-2'>
                        Frais de nettoyage
                      </span>
                      <span className='font-medium text-sm sm:text-base flex-shrink-0'>
                        {cleaningFee}€
                      </span>
                    </div>

                    <div className='flex justify-between items-start'>
                      <span className='text-gray-600 text-sm sm:text-base flex-1 pr-2'>
                        Frais de service
                      </span>
                      <span className='font-medium text-sm sm:text-base flex-shrink-0'>
                        {serviceFee}€
                      </span>
                    </div>

                    <div className='flex justify-between items-start'>
                      <span className='text-gray-600 text-sm sm:text-base flex-1 pr-2'>Taxes</span>
                      <span className='font-medium text-sm sm:text-base flex-shrink-0'>
                        {taxes}€
                      </span>
                    </div>

                    <div className='border-t pt-4'>
                      <div className='flex justify-between text-lg sm:text-xl font-bold'>
                        <span>Total</span>
                        <span>{total}€</span>
                      </div>
                    </div>
                  </>
                )}

                <div className='pt-4'>
                  {step < 3 ? (
                    <Button
                      onClick={handleNextStep}
                      disabled={
                        (step === 1 && (!dateRange?.from || !dateRange?.to || !isAvailable)) ||
                        (step === 2 &&
                          (!formData.firstName ||
                            !formData.lastName ||
                            !formData.email ||
                            !formData.phone))
                      }
                      className='w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 sm:py-4 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base'
                    >
                      {step === 1 ? 'Continuer' : 'Finaliser'}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      className='w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 sm:py-4 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base'
                    >
                      <CreditCard className='w-4 h-4 mr-2' />
                      Procéder au paiement
                    </Button>
                  )}
                </div>

                <p className='text-xs text-gray-500 text-center leading-relaxed'>
                  Vous ne serez débité qu&apos;après confirmation de la réservation
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
