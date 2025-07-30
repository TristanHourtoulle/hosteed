'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, AlertCircle, Calendar, CreditCard, Home, FileText, Mail } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcnui/card'
import { Button } from '@/components/ui/shadcnui/button'

interface ReservationData {
  id: string
  productName: string
  arrivingDate: string
  leavingDate: string
  totalPrice: number
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [reservationData, setReservationData] = useState<ReservationData | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    const verifyPaymentAndCreateReservation = async () => {
      try {
        // Get URL parameters from Stripe redirect
        const sessionId = searchParams.get('session_id')
        const paymentIntent = searchParams.get('payment_intent')
        const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret')

        if (!sessionId && !paymentIntent) {
          throw new Error('Aucune information de paiement trouvée')
        }

        // Verify payment and ensure reservation exists
        const response = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            paymentIntent,
            paymentIntentClientSecret,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Erreur lors de la vérification du paiement')
        }

        if (result.success && result.reservation) {
          setReservationData(result.reservation)
          setStatus('success')
        } else {
          throw new Error('Réservation non trouvée')
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du paiement:', error)
        setErrorMessage(error instanceof Error ? error.message : 'Une erreur est survenue')
        setStatus('error')
      }
    }

    // Add a delay to show loading state
    const timer = setTimeout(() => {
      verifyPaymentAndCreateReservation()
    }, 1500)

    return () => clearTimeout(timer)
  }, [searchParams])

  if (status === 'loading') {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center'>
        <Card className='w-full max-w-md'>
          <CardContent className='p-8'>
            <div className='text-center'>
              <div className='mx-auto mb-6 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
              </div>
              <h2 className='text-2xl font-bold text-gray-900 mb-2'>Vérification du paiement</h2>
              <p className='text-gray-600'>Confirmation de votre réservation en cours...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className='min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4'>
        <Card className='w-full max-w-lg'>
          <CardContent className='p-8'>
            <div className='text-center'>
              <div className='mx-auto mb-6 w-20 h-20 bg-red-100 rounded-full flex items-center justify-center'>
                <AlertCircle className='w-10 h-10 text-red-600' />
              </div>
              <h1 className='text-3xl font-bold text-gray-900 mb-4'>Erreur de paiement</h1>
              <p className='text-gray-600 mb-4 text-lg'>
                {errorMessage || 'Une erreur est survenue lors du traitement de votre paiement.'}
              </p>
              <p className='text-gray-600 mb-8 text-sm'>
                Veuillez réessayer ou contacter notre support si le problème persiste.
              </p>
              <div className='space-y-3'>
                <Button
                  asChild
                  className='w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                >
                  <Link href='/host'>
                    <Home className='w-4 h-4 mr-2' />
                    Retour aux hébergements
                  </Link>
                </Button>
                <Button variant='outline' className='w-full' asChild>
                  <Link href='/contact'>
                    <Mail className='w-4 h-4 mr-2' />
                    Contacter le support
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4'>
      <div className='w-full max-w-2xl space-y-6'>
        {/* Success Card */}
        <Card className='shadow-2xl border-0'>
          <CardContent className='p-0'>
            {/* Header */}
            <div className='bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-center text-white rounded-t-lg'>
              <div className='mx-auto mb-4 w-20 h-20 bg-white/20 rounded-full flex items-center justify-center'>
                <CheckCircle className='w-12 h-12 text-white' />
              </div>
              <h1 className='text-3xl font-bold mb-2'>Paiement réussi !</h1>
              <p className='text-green-100 text-lg'>
                Votre réservation a été confirmée avec succès
              </p>
            </div>

            {/* Content */}
            <div className='p-8'>
              <div className='text-center mb-8'>
                <p className='text-gray-700 text-lg leading-relaxed mb-6'>
                  Merci pour votre confiance ! Votre paiement a été traité avec succès.
                </p>

                {/* Reservation Details */}
                {reservationData && (
                  <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'>
                    <h3 className='font-semibold text-blue-800 mb-3'>
                      Détails de votre réservation
                    </h3>
                    <div className='text-left space-y-2 text-sm'>
                      <p>
                        <span className='font-medium'>Hébergement:</span>{' '}
                        {reservationData.productName}
                      </p>
                      <p>
                        <span className='font-medium'>Arrivée:</span>{' '}
                        {new Date(reservationData.arrivingDate).toLocaleDateString('fr-FR')}
                      </p>
                      <p>
                        <span className='font-medium'>Départ:</span>{' '}
                        {new Date(reservationData.leavingDate).toLocaleDateString('fr-FR')}
                      </p>
                      <p>
                        <span className='font-medium'>Total payé:</span>{' '}
                        {reservationData.totalPrice}€
                      </p>
                      <p>
                        <span className='font-medium'>Numéro de réservation:</span> #
                        {reservationData.id.slice(-8).toUpperCase()}
                      </p>
                    </div>
                  </div>
                )}

                {/* Host Confirmation Notice */}
                <div className='bg-amber-50 border border-amber-200 rounded-lg p-4'>
                  <div className='flex items-start space-x-3'>
                    <div className='flex-shrink-0'>
                      <div className='w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center'>
                        <span className='text-amber-600 text-sm font-bold'>!</span>
                      </div>
                    </div>
                    <div className='text-left'>
                      <h4 className='font-medium text-amber-800 mb-1'>Confirmation en attente</h4>
                      <p className='text-amber-700 text-sm'>
                        Votre paiement a été traité avec succès ! Votre demande de réservation a été
                        envoyée à l&apos;hôte. Vous recevrez une confirmation finale une fois que
                        l&apos;hôte aura validé votre réservation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className='bg-blue-50 rounded-xl p-6 mb-8'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                  <FileText className='w-5 h-5 mr-2 text-blue-600' />
                  Prochaines étapes
                </h3>
                <ul className='space-y-3 text-gray-700'>
                  <li className='flex items-start'>
                    <Mail className='w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0' />
                    <span>
                      Un email de confirmation vous a été envoyé avec tous les détails de votre
                      réservation
                    </span>
                  </li>
                  <li className='flex items-start'>
                    <Calendar className='w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0' />
                    <span>
                      Vous pouvez consulter et gérer vos réservations dans votre espace personnel
                    </span>
                  </li>
                  <li className='flex items-start'>
                    <CreditCard className='w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0' />
                    <span>Un reçu détaillé est disponible dans vos documents de réservation</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <Button
                  asChild
                  className='bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 font-medium'
                >
                  <Link href='/reservations'>
                    <Calendar className='w-4 h-4 mr-2' />
                    Mes réservations
                  </Link>
                </Button>
                <Button
                  variant='outline'
                  asChild
                  className='border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-blue-400 hover:text-blue-700 font-medium transition-all duration-200'
                >
                  <Link href='/host'>
                    <Home className='w-4 h-4 mr-2' />
                    Retour aux hébergements
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info Card */}
        <Card className='shadow-lg'>
          <CardHeader>
            <CardTitle className='text-center text-gray-800'>Besoin d&apos;aide ?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-center'>
              <p className='text-gray-600 mb-4'>
                Notre équipe support est disponible 24h/24 pour vous accompagner
              </p>
              <Button variant='outline' asChild>
                <Link href='/contact'>
                  <Mail className='w-4 h-4 mr-2' />
                  Contacter le support
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center'>
      <Card className='w-full max-w-md'>
        <CardContent className='p-8'>
          <div className='text-center'>
            <div className='mx-auto mb-6 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
            </div>
            <h2 className='text-2xl font-bold text-gray-900 mb-2'>Chargement...</h2>
            <p className='text-gray-600'>Préparation de votre page de confirmation...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentSuccessContent />
    </Suspense>
  )
}
