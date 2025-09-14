'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { CheckRentIsAvailable } from '@/lib/services/rents.service'
import { findProductById } from '@/lib/services/product.service'
import { findUserById } from '@/lib/services/user.service'
import { MapPin, Star, CreditCard, Shield, ArrowLeft, Check } from 'lucide-react'
import { Button } from '@/components/ui/shadcnui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcnui/card'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'
import Image from 'next/image'
import ExtraSelectionStep from '@/components/booking/ExtraSelectionStep'
import PhoneInput from '@/components/ui/PhoneInput'

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
  phoneCountry: string
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
  const [step, setStep] = useState(2) // 2: extras selection, 3: personal info, 4: payment (étape dates supprimée)

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
    phoneCountry: 'MG',
    specialRequests: '',
  })

  // États pour les extras
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>([])
  const [extrasCost, setExtrasCost] = useState(0)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productData = await findProductById(id as string)
        if (productData) {
          setProduct(productData as unknown as Product)
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
    if (session?.user?.id) {
      const fetchUserData = async () => {
        try {
          const userData = await findUserById(session.user.id)
          if (userData) {
            setFormData(prev => ({
              ...prev,
              email: userData.email || '',
              firstName: userData.name || '',
              lastName: userData.lastname || '',
            }))
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des données utilisateur:', error)
          // Fallback sur les données de session
          const nameParts = session.user.name?.split(' ') || []
          const firstName = nameParts[0] || ''
          const lastName = nameParts.slice(1).join(' ') || ''

          setFormData(prev => ({
            ...prev,
            email: session.user.email || '',
            firstName: firstName,
            lastName: lastName,
          }))
        }
      }

      fetchUserData()
    }
  }, [session])

  useEffect(() => {
    const checkAvailability = async () => {
      if (formData.arrivingDate && formData.leavingDate) {
        const arrivingDate = new Date(formData.arrivingDate)
        const leavingDate = new Date(formData.leavingDate)

        arrivingDate.setHours(Number(product?.arriving) || 14, 0, 0, 0)
        leavingDate.setHours(Number(product?.leaving) || 11, 0, 0, 0)

        await CheckRentIsAvailable(id as string, arrivingDate, leavingDate)
      }
    }

    checkAvailability()
  }, [formData.arrivingDate, formData.leavingDate, id, product?.arriving, product?.leaving])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const calculateNights = () => {
    if (!formData.arrivingDate || !formData.leavingDate) return 0
    const from = new Date(formData.arrivingDate)
    const to = new Date(formData.leavingDate)
    return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
  }

  const calculateTotalPrice = () => {
    if (!product || !formData.arrivingDate || !formData.leavingDate) return 0

    const nights = calculateNights()
    if (nights <= 0) return 0

    const basePrice = parseFloat(product.basePrice) * nights
    const subtotal = basePrice + extrasCost
    const commission = (subtotal * product.commission) / 100

    return Math.round(subtotal + commission)
  }

  const getAverageRating = () => {
    if (!product?.reviews?.length) return 0
    const total = product.reviews.reduce((sum, review) => sum + review.grade, 0)
    return total / product.reviews.length
  }

  const handleNextStep = () => {
    if (step === 2) {
      // Étape des extras - pas de validation particulière, on peut continuer
      setStep(3)
    } else if (step === 3) {
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
        toast.error('Veuillez remplir tous les champs obligatoires')
        return
      }
      setStep(4)
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
            productId: String(id),
            userId: String(session.user.id),
            userEmail: String(formData.email),
            productName: String(product.name),
            arrivingDate: String(formData.arrivingDate),
            leavingDate: String(formData.leavingDate),
            peopleNumber: String(formData.peopleNumber),
            firstName: String(formData.firstName),
            lastName: String(formData.lastName),
            phone: String(formData.phone),
            specialRequests: String(formData.specialRequests),
            selectedExtras: JSON.stringify(selectedExtraIds),
            prices: String(total),
          },
        }),
      })

      const data = await response.json()
      if (data.url) {
        if (typeof window !== 'undefined') {
          window.location.href = data.url
        }
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
  const serviceFee = 0
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
              <span className='hidden sm:inline'>{step > 2 ? 'Étape précédente' : 'Retour'}</span>
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
                    {stepNum < step - 1 ? <Check className='w-3 h-3 sm:w-4 sm:h-4' /> : stepNum}
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
            {step === 2 && (
              <ExtraSelectionStep
                productId={id as string}
                numberOfDays={calculateNights()}
                guestCount={formData.peopleNumber}
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
                      <PhoneInput
                        value={formData.phone}
                        defaultCountry={formData.phoneCountry}
                        onChange={(phoneNumber, countryCode) => {
                          setFormData(prev => ({
                            ...prev,
                            phone: phoneNumber,
                            phoneCountry: countryCode
                          }))
                        }}
                        placeholder="XX XX XX XX"
                        required
                        className="w-full"
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
                        {formData.arrivingDate && formData.leavingDate && (
                          <>
                            {format(new Date(formData.arrivingDate), 'dd MMM', { locale: fr })} -{' '}
                            {format(new Date(formData.leavingDate), 'dd MMM', { locale: fr })}
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

                    {extrasCost > 0 && (
                      <div className='flex justify-between items-start'>
                        <span className='text-gray-600 text-sm sm:text-base flex-1 pr-2'>
                          Options supplémentaires
                        </span>
                        <span className='font-medium text-sm sm:text-base flex-shrink-0'>
                          +{extrasCost.toFixed(2)}€
                        </span>
                      </div>
                    )}
                    <div className='flex justify-between items-start'>
                      <span className='text-gray-600 text-sm sm:text-base flex-1 pr-2'>
                        Frais de service
                      </span>
                      <span className='font-medium text-sm sm:text-base flex-shrink-0'>
                        {serviceFee}€
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
                  {step < 4 ? (
                    <Button
                      onClick={handleNextStep}
                      disabled={
                        step === 3 &&
                        (!formData.firstName ||
                          !formData.lastName ||
                          !formData.email ||
                          !formData.phone)
                      }
                      className='w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 sm:py-4 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base'
                    >
                      {step === 2 ? 'Continuer' : step === 3 ? 'Finaliser' : 'Continuer'}
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
