'use client'

import { useEffect, useState, use } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  getRentById,
  RentWithDates,
} from '@/lib/services/rents.service'
import {
  changeRentStatus,
  approveRent,
  rejectRentRequest,
} from '@/lib/services/rent-lifecycle.service'
import { getPayablePricesPerRent, createPayRequest } from '@/lib/services/payment.service'
import { RentStatus, PaymentStatus, PaymentMethod } from '@prisma/client'
import Link from 'next/link'
import { motion, Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { Alert, AlertDescription } from '@/components/ui/shadcnui/alert'
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Clock,
  CheckCircle,
  LogIn,
  LogOut,
  Ban,
} from 'lucide-react'
import HostNavbar from '../../components/HostNavbar'
import RejectReservationModal from './RejectModal'
import StatusBadge from './StatusBadge'
import ActionButtons from './ActionButtons'
import ReservationDetailsCard from './ReservationDetailsCard'
import PaymentInfoCard from './PaymentInfoCard'
import PricingDetailsCard from './PricingDetailsCard'
import PaymentRequestModal from './PaymentRequestModal'
import { PayablePrices } from './types'

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

function formatDate(date: Date | string | null | undefined) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatCurrency(amount: number | null | undefined) {
  if (amount === null || amount === undefined) return '-'
  return amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

const STATUS_TIMELINE = [
  { key: 'WAITING', label: 'En attente', icon: Clock },
  { key: 'RESERVED', label: 'Confirmée', icon: CheckCircle },
  { key: 'CHECKIN', label: 'Check-in', icon: LogIn },
  { key: 'CHECKOUT', label: 'Check-out', icon: LogOut },
]

const STATUS_ORDER: Record<string, number> = {
  WAITING: 0,
  RESERVED: 1,
  CHECKIN: 2,
  CHECKOUT: 3,
  CANCEL: -1,
}

function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  if (currentStatus === 'CANCEL') {
    return (
      <div className='flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3'>
        <Ban className='h-5 w-5 text-red-500' />
        <div>
          <p className='font-medium text-red-700'>Réservation annulée</p>
          <p className='text-sm text-red-500'>Cette réservation a été annulée.</p>
        </div>
      </div>
    )
  }

  const currentIndex = STATUS_ORDER[currentStatus] ?? 0

  return (
    <div className='flex items-start'>
      {STATUS_TIMELINE.map((step, index) => {
        const Icon = step.icon
        const isCompleted = index < currentIndex
        const isCurrent = index === currentIndex

        return (
          <div key={step.key} className='contents'>
            <div className='flex flex-col items-center gap-1.5 flex-shrink-0'>
              <div
                className={`rounded-full p-2.5 transition-colors ${
                  isCompleted
                    ? 'bg-green-100 text-green-600'
                    : isCurrent
                      ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-300'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                <Icon className='h-4 w-4' />
              </div>
              <span
                className={`text-xs font-medium whitespace-nowrap ${
                  isCompleted
                    ? 'text-green-600'
                    : isCurrent
                      ? 'text-blue-600'
                      : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < STATUS_TIMELINE.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-3 mt-[17px] rounded-full ${
                  index < currentIndex ? 'bg-green-300' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function RentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const {
    session,
    isLoading: isAuthLoading,
    isAuthenticated,
  } = useAuth({ required: true, redirectTo: '/auth' })
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

  const isAdminOrManager =
    session?.user?.roles === 'ADMIN' || session?.user?.roles === 'HOST_MANAGER'

  const fetchData = async () => {
    try {
      if (session?.user?.id) {
        const [rentData, pricesData] = await Promise.all([
          getRentById(resolvedParams.id),
          getPayablePricesPerRent(resolvedParams.id),
        ])
        if (rentData) setRent(rentData)
        if (pricesData) setPrices(pricesData)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchData()
    }
  }, [session, resolvedParams.id, isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = async (newStatus: RentStatus) => {
    try {
      setUpdating(true)
      await changeRentStatus(resolvedParams.id, newStatus)
      const [rentData, pricesData] = await Promise.all([
        getRentById(resolvedParams.id),
        getPayablePricesPerRent(resolvedParams.id),
      ])
      if (rentData) setRent(rentData)
      if (pricesData) setPrices(pricesData)
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
      if (!result || !result.success) {
        throw new Error("Erreur lors de l'approbation de la réservation")
      }
      const [rentData, pricesData] = await Promise.all([
        getRentById(resolvedParams.id),
        getPayablePricesPerRent(resolvedParams.id),
      ])
      if (rentData) setRent(rentData)
      if (pricesData) setPrices(pricesData)
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
      if (rentData) setRent(rentData)
      if (pricesData) setPrices(pricesData)
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
      const result = await rejectRentRequest(
        resolvedParams.id,
        session.user.id,
        reason,
        message
      )

      if (result.success) {
        const updatedRent = await getRentById(resolvedParams.id)
        if (updatedRent) setRent(updatedRent)
        setShowRejectModal(false)
      } else {
        throw new Error(result.error || 'Erreur lors du refus de la réservation')
      }
    } catch (error) {
      console.error('Erreur lors du refus de la réservation:', error)
    } finally {
      setIsRejecting(false)
    }
  }

  if (isAuthLoading || loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'>
        <HostNavbar />
        <div className='flex items-center justify-center min-h-[calc(100vh-4rem)]'>
          <div className='flex flex-col items-center gap-4'>
            <div className='w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin' />
            <p className='text-slate-600 text-lg'>Chargement...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!session) return null

  if (!rent) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'>
        <HostNavbar />
        <div className='container mx-auto p-6 max-w-6xl'>
          <Alert variant='destructive' className='rounded-2xl'>
            <AlertDescription>Réservation introuvable</AlertDescription>
          </Alert>
          <Link
            href='/dashboard/host/reservations'
            className='inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-800'
          >
            <ArrowLeft className='h-4 w-4' />
            Retour aux réservations
          </Link>
        </div>
      </div>
    )
  }

  const guestName =
    [rent.user?.name, rent.user?.lastname].filter(Boolean).join(' ') || rent.user?.email || '-'

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'>
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

      <div className='container mx-auto p-6 max-w-6xl space-y-6'>
        {/* Back Link */}
        <motion.div initial='hidden' animate='visible' variants={fadeIn}>
          <Link
            href='/dashboard/host/reservations'
            className='inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium'
          >
            <ArrowLeft className='h-4 w-4' />
            Retour aux réservations
          </Link>
        </motion.div>

        {/* Header Card */}
        <motion.div initial='hidden' animate='visible' variants={fadeIn}>
          <Card className='border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden'>
            <CardContent className='p-6 space-y-5'>
              <div className='flex flex-wrap items-start justify-between gap-4'>
                <div className='space-y-1'>
                  <div className='flex items-center gap-3'>
                    <h1 className='text-2xl font-bold text-gray-900'>
                      Réservation #{rent.id.slice(0, 8)}
                    </h1>
                    <StatusBadge status={rent.status} size='lg' />
                  </div>
                  <p className='text-sm text-gray-500'>Créée le {formatDate(rent.createdAt)}</p>
                </div>
                <div className='text-right'>
                  <p className='text-sm text-gray-500'>Montant total</p>
                  <p className='text-3xl font-bold text-gray-900'>
                    {formatCurrency(rent.totalAmount)}
                  </p>
                </div>
              </div>

              <StatusTimeline currentStatus={rent.status} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content: 2/3 + 1/3 layout */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Left Column: 2/3 */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Stay Details */}
            <motion.div initial='hidden' animate='visible' variants={fadeIn}>
              <ReservationDetailsCard rent={rent} showSensitiveInfo={isAdminOrManager} />
            </motion.div>

            {/* Pricing Breakdown */}
            <motion.div initial='hidden' animate='visible' variants={fadeIn}>
              <PricingDetailsCard rent={rent} />
            </motion.div>

            {/* Payment & Transfers */}
            <motion.div initial='hidden' animate='visible' variants={fadeIn}>
              <PaymentInfoCard
                rent={rent}
                prices={prices}
                updating={updating}
                onPaymentRequest={handlePaymentRequest}
                showSensitiveInfo={isAdminOrManager}
              />
            </motion.div>
          </div>

          {/* Right Column: 1/3 */}
          <div className='space-y-6'>
            {/* Actions */}
            <motion.div initial='hidden' animate='visible' variants={fadeIn}>
              <Card className='border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl py-0 gap-0'>
                <div className='px-6 py-4 border-b border-gray-100'>
                  <h2 className='text-lg font-semibold text-gray-800'>Actions</h2>
                </div>
                <CardContent className='p-4'>
                  <ActionButtons
                    rent={rent}
                    updating={updating}
                    onStatusChange={handleStatusChange}
                    onApproveReservation={handleApproveReservation}
                    onShowRejectModal={() => setShowRejectModal(true)}
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Guest Info */}
            <motion.div initial='hidden' animate='visible' variants={fadeIn}>
              <Card className='border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl py-0 gap-0'>
                <div className='px-6 py-4 border-b border-gray-100'>
                  <h2 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
                    <UserIcon className='h-5 w-5 text-blue-600' />
                    Voyageur
                  </h2>
                </div>
                <CardContent className='p-6 space-y-3'>
                  <div className='flex items-center gap-3'>
                    <div className='h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center'>
                      <UserIcon className='h-5 w-5 text-blue-600' />
                    </div>
                    <div>
                      <p className='font-medium text-gray-900'>{guestName}</p>
                      {rent.user?.lastname && (
                        <p className='text-sm text-gray-500'>{rent.user.roles}</p>
                      )}
                    </div>
                  </div>
                  {rent.user?.email && (
                    <div className='flex items-center gap-2 text-sm text-gray-600'>
                      <Mail className='h-4 w-4 text-gray-400' />
                      <a
                        href={`mailto:${rent.user.email}`}
                        className='text-blue-600 hover:underline'
                      >
                        {rent.user.email}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Legacy price for reference */}
        {rent.prices !== null && rent.prices !== undefined && (
          <div className='text-sm text-gray-400 text-center'>
            Prix legacy : {String(rent.prices)} EUR
          </div>
        )}
      </div>
    </div>
  )
}
