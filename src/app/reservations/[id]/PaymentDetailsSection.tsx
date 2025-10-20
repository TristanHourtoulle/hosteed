'use client'

import { useEffect, useState } from 'react'
import { getPaymentDetailsForReservation } from './actions'
import PaymentDetailsCard from './PaymentDetailsCard'

interface PaymentDetails {
  totalPricesPayable: number
  availablePrice: number
  pendingPrice: number
  transferredPrice: number
  commission: number
}

interface PaymentDetailsSectionProps {
  reservationId: string
}

export default function PaymentDetailsSection({ reservationId }: PaymentDetailsSectionProps) {
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPaymentDetails() {
      try {
        setLoading(true)
        const details = await getPaymentDetailsForReservation(reservationId)
        setPaymentDetails(details)
      } catch (err) {
        console.error('Erreur lors de la récupération des détails de paiement:', err)
        setError('Impossible de charger les détails de paiement')
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentDetails()
  }, [reservationId])

  if (loading) {
    return (
      <div className='bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden'>
        <div className='p-6 flex items-center justify-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
          <span className='ml-2 text-gray-600'>Chargement des détails de paiement...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden'>
        <div className='p-6'>
          <p className='text-red-600'>{error}</p>
        </div>
      </div>
    )
  }

  if (!paymentDetails) {
    return null
  }

  return <PaymentDetailsCard paymentDetails={paymentDetails} />
}
