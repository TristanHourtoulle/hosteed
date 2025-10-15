'use client'

import { useEffect, useState, use } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  getRentById,
  changeRentStatus,
  approveRent,
  rejectRentRequest,
  RentWithDates,
} from '@/lib/services/rents.service'
import { getPayablePricesPerRent, createPayRequest } from '@/lib/services/payment.service'
import { RentStatus, PaymentStatus, PaymentMethod } from '@prisma/client'
import HostNavbar from '../../components/HostNavbar'
import RejectReservationModal from './RejectModal'
import StatusBadge from './StatusBadge'
import ActionButtons from './ActionButtons'
import ReservationDetailsCard from './ReservationDetailsCard'
import PaymentInfoCard from './PaymentInfoCard'
import PaymentRequestModal from './PaymentRequestModal'
import { PayablePrices } from './types'

export default function RentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { session, isLoading: isAuthLoading, isAuthenticated } = useAuth({ required: true, redirectTo: '/auth' })
  const [rent, setRent] = useState<RentWithDates | null>(null)
  const [prices, setPrices] = useState<PayablePrices | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [paymentType, setPaymentType] = useState<PaymentStatus | null>(null)
  const [notes, setNotes] = useState('')
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.SEPA_VIREMENT)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)

  const resolvedParams = use(params)

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (session?.user?.id) {
          const [rentData, pricesData] = await Promise.all([
            getRentById(resolvedParams.id),
            getPayablePricesPerRent(resolvedParams.id),
          ])
          if (rentData) {
            setRent(rentData)
          }
          if (pricesData) {
            setPrices(pricesData)
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchData()
    }
  }, [session, resolvedParams.id, isAuthenticated])

  const handleStatusChange = async (newStatus: RentStatus) => {
    try {
      setUpdating(true)
      await changeRentStatus(resolvedParams.id, newStatus)
      const updatedRent = await getRentById(resolvedParams.id)
      if (updatedRent) {
        setRent(updatedRent)
      }
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleApproveReservation = async () => {
    try {
      setUpdating(true)
      if (!rent?.stripeId) {
        throw new Error('Aucun paiement associé à cette réservation')
      }
      const result = await approveRent(resolvedParams.id)
      if (!result) {
        throw new Error("Erreur lors de l'approbation de la réservation")
      }
      if (result.success) {
        const updatedRent = await getRentById(resolvedParams.id)
        if (updatedRent) {
          setRent(updatedRent)
        }
      } else {
        throw new Error("Erreur lors de l'approbation de la réservation")
      }
    } catch (error) {
      console.error("Erreur lors de l'approbation de la réservation:", error)
    } finally {
      setUpdating(false)
    }
  }

  const handlePaymentRequest = async (type: PaymentStatus) => {
    setPaymentType(type)
    setShowModal(true)
  }

  const handleSubmitPaymentRequest = async () => {
    if (!paymentType || !session?.user?.id) return

    try {
      setUpdating(true)
      await createPayRequest(resolvedParams.id, paymentType, session.user.id, notes, method)
      const [rentData, pricesData] = await Promise.all([
        getRentById(resolvedParams.id),
        getPayablePricesPerRent(resolvedParams.id),
      ])
      if (rentData) {
        setRent(rentData)
      }
      if (pricesData) {
        setPrices(pricesData)
      }
      setShowModal(false)
      setNotes('')
      setMethod(PaymentMethod.SEPA_VIREMENT)
      setPaymentType(null)
    } catch (error) {
      console.error('Erreur lors de la demande de paiement:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setNotes('')
    setMethod(PaymentMethod.SEPA_VIREMENT)
    setPaymentType(null)
  }

  const handleRejectRequest = async (reason: string, message: string) => {
    if (!session?.user?.id) return

    setIsRejecting(true)
    try {
      const result = await rejectRentRequest(resolvedParams.id, session.user.id, reason, message)

      if (result.success) {
        const updatedRent = await getRentById(resolvedParams.id)
        if (updatedRent) {
          setRent(updatedRent)
        }
        setShowRejectModal(false)
        alert('La réservation a été refusée avec succès. Les administrateurs ont été notifiés.')
      } else {
        throw new Error(result.error || 'Erreur lors du refus de la réservation')
      }
    } catch (error) {
      console.error('Erreur lors du refus de la réservation:', error)
    } finally {
      setIsRejecting(false)
    }
  }

  if (isAuthLoading) {
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

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100'>
        <HostNavbar />
        <div className='flex items-center justify-center min-h-[calc(100vh-4rem)]'>
          <div className='bg-white p-8 rounded-2xl shadow-xl border border-gray-100'>
            <div className='flex flex-col items-center gap-4'>
              <div className='animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent'></div>
              <p className='text-gray-600 font-medium'>Chargement des détails...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!rent) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100'>
        <HostNavbar />
        <div className='container mx-auto px-4 py-8'>
          <div className='bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center'>
            <svg
              className='w-16 h-16 text-gray-400 mx-auto mb-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.220 0-4.239.691-5.927 1.866M12 21a9 9 0 110-18 9 9 0 010 18z'
              />
            </svg>
            <h2 className='text-xl font-bold text-gray-900 mb-2'>Réservation introuvable</h2>
            <p className='text-gray-600'>
              Cette réservation n&apos;existe pas ou vous n&apos;avez pas l&apos;autorisation de la
              consulter.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100'>
      <HostNavbar />

      <PaymentRequestModal
        isOpen={showModal}
        paymentType={paymentType}
        prices={prices}
        notes={notes}
        method={method}
        updating={updating}
        onClose={handleCloseModal}
        onNotesChange={setNotes}
        onMethodChange={setMethod}
        onSubmit={handleSubmitPaymentRequest}
      />

      <RejectReservationModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleRejectRequest}
        isLoading={isRejecting}
      />

      <div className='container mx-auto px-4 py-8 max-w-7xl'>
        {/* Header avec titre et actions */}
        <div className='mb-8'>
          <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6'>
            <div className='flex items-center gap-4'>
              <div className='bg-white p-3 rounded-2xl shadow-md'>
                <svg
                  className='w-8 h-8 text-blue-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                  />
                </svg>
              </div>
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>Détails de la réservation</h1>
                <p className='text-gray-600 mt-1'>Gérez votre réservation et vos paiements</p>
              </div>
            </div>

            <div className='flex items-center gap-3'>
              <StatusBadge status={rent.status} />
            </div>
          </div>

          <ActionButtons
            rent={rent}
            updating={updating}
            onStatusChange={handleStatusChange}
            onApproveReservation={handleApproveReservation}
            onShowRejectModal={() => setShowRejectModal(true)}
          />
        </div>

        {/* Main Content Grid */}
        <div className='grid grid-cols-1 xl:grid-cols-3 gap-8'>
          {/* Reservation Details Card */}
          <div className='xl:col-span-2'>
            <ReservationDetailsCard rent={rent} />
          </div>

          {/* Payment Information Card */}
          <div>
            <PaymentInfoCard
              rent={rent}
              prices={prices}
              updating={updating}
              onPaymentRequest={handlePaymentRequest}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
