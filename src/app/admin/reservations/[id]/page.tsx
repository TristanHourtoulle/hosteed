'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { isFullAdmin } from '@/hooks/useAdminAuth'
import { getRentById, RentWithDatesAndReviews } from '@/lib/services/rents.service'
import { getPayablePricesPerRent } from '@/lib/services/payment.service'
import Link from 'next/link'
import { motion, Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { Alert, AlertDescription } from '@/components/ui/shadcnui/alert'
import { Separator } from '@/components/ui/shadcnui/separator'
import {
  ArrowLeft,
  CalendarDays,
  Users,
  Mail,
  MapPin,
  Moon,
  CreditCard,
  Home,
  User as UserIcon,
  Tag,
  Percent,
  Wallet,
  Building2,
  Clock,
  CheckCircle,
  LogIn,
  LogOut,
  Ban,
  ExternalLink,
} from 'lucide-react'
import { StatusBadge } from './components/StatusBadge'
import { AdminActionButtons } from './components/AdminActionButtons'

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

interface PayablePrices {
  totalPricesPayable: number
  availablePrice: number
  pendingPrice: number
  transferredPrice: number
  commission: number
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

const PAYMENT_LABELS: Record<string, { label: string; color: string }> = {
  NOT_PAID: { label: 'Non payé', color: 'text-gray-600' },
  CLIENT_PAID: { label: 'Payé par le client', color: 'text-green-600' },
  MID_TRANSFER_REQ: { label: 'Transfert partiel demandé', color: 'text-orange-600' },
  MID_TRANSFER_DONE: { label: 'Transfert partiel effectué', color: 'text-blue-600' },
  REST_TRANSFER_REQ: { label: 'Transfert final demandé', color: 'text-orange-600' },
  REST_TRANSFER_DONE: { label: 'Transfert final effectué', color: 'text-blue-600' },
  FULL_TRANSFER_REQ: { label: 'Transfert total demandé', color: 'text-orange-600' },
  FULL_TRANSFER_DONE: { label: 'Transfert total effectué', color: 'text-emerald-600' },
  REFUNDED: { label: 'Remboursé', color: 'text-purple-600' },
  DISPUTE: { label: 'Litige', color: 'text-red-600' },
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

function PricingRow({
  label,
  value,
  bold,
  color,
  indent,
}: {
  label: string
  value: string
  bold?: boolean
  color?: string
  indent?: boolean
}) {
  return (
    <div className={`flex items-center justify-between py-1.5 ${indent ? 'pl-4' : ''}`}>
      <span className={`text-sm ${bold ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
        {label}
      </span>
      <span className={`text-sm font-medium ${color || (bold ? 'text-gray-900' : 'text-gray-800')}`}>
        {value}
      </span>
    </div>
  )
}

export default function ReservationDetailsPage() {
  const { session, isLoading: isAuthLoading, isAuthenticated } = useAuth({ required: true, redirectTo: '/auth' })
  const router = useRouter()
  const params = useParams()

  const [rent, setRent] = useState<RentWithDatesAndReviews | null>(null)
  const [prices, setPrices] = useState<PayablePrices | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated && (!session?.user?.roles || !isFullAdmin(session.user.roles))) {
      router.push('/')
    }
  }, [isAuthenticated, session, router])

  const fetchData = async () => {
    if (!params.id) return
    try {
      setLoading(true)
      const [rentData, pricesData] = await Promise.all([
        getRentById(params.id as string),
        getPayablePricesPerRent(params.id as string),
      ])
      if (rentData) setRent(rentData)
      else setError('Réservation introuvable')
      if (pricesData) setPrices(pricesData)
    } catch (err) {
      console.error('Error fetching reservation:', err)
      setError('Erreur lors du chargement de la réservation')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [params.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isAuthLoading || loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='flex flex-col items-center gap-4'>
          <div className='w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin' />
          <p className='text-slate-600 text-lg'>Chargement...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  if (error || !rent) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8'>
        <div className='max-w-4xl mx-auto'>
          <Alert variant='destructive' className='rounded-2xl'>
            <AlertDescription>{error || 'Réservation introuvable'}</AlertDescription>
          </Alert>
          <Link href='/admin/reservations' className='inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-800'>
            <ArrowLeft className='h-4 w-4' />
            Retour aux réservations
          </Link>
        </div>
      </div>
    )
  }

  const paymentInfo = rent.payment === 'NOT_PAID' && rent.status === 'WAITING'
    ? { label: 'Autorisé (en attente de capture)', color: 'text-amber-600' }
    : PAYMENT_LABELS[rent.payment] || { label: rent.payment, color: 'text-gray-600' }

  const guestName = [rent.user.name, rent.user.lastname].filter(Boolean).join(' ') || rent.user.email

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'>
      <div className='container mx-auto p-6 max-w-6xl space-y-6'>

        {/* Back Link */}
        <motion.div initial='hidden' animate='visible' variants={fadeIn}>
          <Link
            href='/admin/reservations'
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
                  <p className='text-sm text-gray-500'>
                    Créée le {formatDate(rent.createdAt)}
                  </p>
                </div>
                <div className='text-right'>
                  <p className='text-sm text-gray-500'>Montant total</p>
                  <p className='text-3xl font-bold text-gray-900'>
                    {formatCurrency(rent.totalAmount)}
                  </p>
                </div>
              </div>

              {/* Status Timeline */}
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
              <Card className='border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl py-0 gap-0'>
                <div className='px-6 py-4 border-b border-gray-100'>
                  <h2 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
                    <CalendarDays className='h-5 w-5 text-blue-600' />
                    Détails du séjour
                  </h2>
                </div>
                <CardContent className='p-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    {/* Property */}
                    <div className='space-y-3'>
                      <div className='flex items-start gap-3'>
                        <Home className='h-5 w-5 text-gray-400 mt-0.5' />
                        <div>
                          <p className='text-xs text-gray-500 uppercase tracking-wide'>Hébergement</p>
                          <Link href='/admin/products' className='text-blue-600 hover:underline font-medium'>
                            {rent.product.name}
                          </Link>
                        </div>
                      </div>
                      {rent.product.address && (
                        <div className='flex items-start gap-3'>
                          <MapPin className='h-5 w-5 text-gray-400 mt-0.5' />
                          <div>
                            <p className='text-xs text-gray-500 uppercase tracking-wide'>Adresse</p>
                            <p className='text-gray-800'>{rent.product.address}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Stay Info */}
                    <div className='space-y-3'>
                      <div className='flex items-center gap-6'>
                        <div className='flex items-center gap-2'>
                          <CalendarDays className='h-4 w-4 text-gray-400' />
                          <div>
                            <p className='text-xs text-gray-500'>Arrivée</p>
                            <p className='font-medium text-gray-800'>{formatDate(rent.arrivingDate)}</p>
                          </div>
                        </div>
                        <span className='text-gray-300'>→</span>
                        <div>
                          <p className='text-xs text-gray-500'>Départ</p>
                          <p className='font-medium text-gray-800'>{formatDate(rent.leavingDate)}</p>
                        </div>
                      </div>
                      <div className='flex items-center gap-6'>
                        {rent.numberOfNights && (
                          <div className='flex items-center gap-2'>
                            <Moon className='h-4 w-4 text-gray-400' />
                            <span className='text-gray-800'>
                              {rent.numberOfNights} nuit{rent.numberOfNights > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                        <div className='flex items-center gap-2'>
                          <Users className='h-4 w-4 text-gray-400' />
                          <span className='text-gray-800'>
                            {Number(rent.numberPeople)} personne{Number(rent.numberPeople) > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Pricing Breakdown */}
            <motion.div initial='hidden' animate='visible' variants={fadeIn}>
              <Card className='border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl py-0 gap-0'>
                <div className='px-6 py-4 border-b border-gray-100'>
                  <h2 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
                    <Wallet className='h-5 w-5 text-blue-600' />
                    Détail des prix
                  </h2>
                </div>
                <CardContent className='p-6'>
                  <div className='space-y-1'>
                    {/* Base */}
                    <PricingRow
                      label={`${formatCurrency(rent.basePricePerNight)} × ${rent.numberOfNights || '-'} nuit${(rent.numberOfNights || 0) > 1 ? 's' : ''}`}
                      value={formatCurrency(rent.subtotal)}
                    />

                    {/* Discounts */}
                    {(rent.discountAmount !== null && rent.discountAmount !== undefined && rent.discountAmount > 0) && (
                      <PricingRow
                        label={`Réduction${rent.promotionApplied ? ' (promotion)' : ''}${rent.specialPriceApplied ? ' (prix spécial)' : ''}`}
                        value={`-${formatCurrency(rent.discountAmount)}`}
                        color='text-green-600'
                        indent
                      />
                    )}
                    {(rent.totalSavings !== null && rent.totalSavings !== undefined && rent.totalSavings > 0 && rent.totalSavings !== rent.discountAmount) && (
                      <PricingRow
                        label='Économies totales'
                        value={formatCurrency(rent.totalSavings)}
                        color='text-green-600'
                        indent
                      />
                    )}

                    {/* Extras */}
                    {(rent.extrasTotal !== null && rent.extrasTotal !== undefined && rent.extrasTotal > 0) && (
                      <PricingRow label='Extras' value={formatCurrency(rent.extrasTotal)} indent />
                    )}

                    <Separator className='my-2' />

                    {/* Commissions */}
                    <PricingRow
                      label='Commission client'
                      value={formatCurrency(rent.clientCommission)}
                      indent
                    />
                    <PricingRow
                      label='Commission hôte'
                      value={formatCurrency(rent.hostCommission)}
                      indent
                    />

                    <Separator className='my-2' />

                    {/* Totals */}
                    <PricingRow
                      label='Montant total client'
                      value={formatCurrency(rent.totalAmount)}
                      bold
                    />
                    <div className='flex items-center justify-between pt-1'>
                      <span className='text-sm text-gray-600'>
                        Dont part plateforme
                      </span>
                      <span className='text-sm font-medium text-indigo-600'>
                        {formatCurrency(rent.platformAmount)}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-gray-600'>
                        Dont part hôte
                      </span>
                      <span className='text-sm font-medium text-emerald-600'>
                        {formatCurrency(rent.hostAmount)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Payment & Transfers */}
            <motion.div initial='hidden' animate='visible' variants={fadeIn}>
              <Card className='border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl py-0 gap-0'>
                <div className='px-6 py-4 border-b border-gray-100'>
                  <h2 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
                    <CreditCard className='h-5 w-5 text-blue-600' />
                    Paiement & transferts
                  </h2>
                </div>
                <CardContent className='p-6'>
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-gray-600'>Statut du paiement</span>
                      <span className={`text-sm font-semibold ${paymentInfo.color}`}>
                        {paymentInfo.label}
                      </span>
                    </div>

                    {prices && (
                      <>
                        <Separator />
                        <div className='grid grid-cols-2 gap-4'>
                          <div className='rounded-xl bg-blue-50 border border-blue-100 p-3 text-center'>
                            <p className='text-xs text-blue-500 mb-1'>Disponible</p>
                            <p className='text-lg font-bold text-blue-700'>
                              {formatCurrency(prices.availablePrice)}
                            </p>
                          </div>
                          <div className='rounded-xl bg-orange-50 border border-orange-100 p-3 text-center'>
                            <p className='text-xs text-orange-500 mb-1'>En attente</p>
                            <p className='text-lg font-bold text-orange-700'>
                              {formatCurrency(prices.pendingPrice)}
                            </p>
                          </div>
                          <div className='rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center'>
                            <p className='text-xs text-emerald-500 mb-1'>Viré à l&apos;hôte</p>
                            <p className='text-lg font-bold text-emerald-700'>
                              {formatCurrency(prices.transferredPrice)}
                            </p>
                          </div>
                          <div className='rounded-xl bg-gray-50 border border-gray-200 p-3 text-center'>
                            <p className='text-xs text-gray-500 mb-1'>Commission</p>
                            <p className='text-lg font-bold text-gray-700'>
                              {prices.commission}%
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column: 1/3 */}
          <div className='space-y-6'>

            {/* Actions */}
            <motion.div initial='hidden' animate='visible' variants={fadeIn}>
              <Card className='border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl py-0 gap-0'>
                <div className='px-6 py-4 border-b border-gray-100'>
                  <h2 className='text-lg font-semibold text-gray-800'>
                    Actions
                  </h2>
                </div>
                <CardContent className='p-4'>
                  <AdminActionButtons
                    rentId={rent.id}
                    status={rent.status}
                    payment={rent.payment}
                    hostId={rent.product.owner?.id || ''}
                    hostAmount={rent.hostAmount !== null && rent.hostAmount !== undefined ? Number(rent.hostAmount) : null}
                    hasContract={!!rent.product?.contract}
                    onStatusChanged={fetchData}
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Guest */}
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
                      <p className='text-sm text-gray-500'>{rent.user.roles}</p>
                    </div>
                  </div>
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <Mail className='h-4 w-4 text-gray-400' />
                    <a href={`mailto:${rent.user.email}`} className='text-blue-600 hover:underline'>
                      {rent.user.email}
                    </a>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Host */}
            <motion.div initial='hidden' animate='visible' variants={fadeIn}>
              <Card className='border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl py-0 gap-0'>
                <div className='px-6 py-4 border-b border-gray-100'>
                  <h2 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
                    <Building2 className='h-5 w-5 text-blue-600' />
                    Hôte
                  </h2>
                </div>
                <CardContent className='p-6 space-y-3'>
                  <div className='flex items-center gap-3'>
                    <div className='h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center'>
                      <Building2 className='h-5 w-5 text-indigo-600' />
                    </div>
                    <p className='font-medium text-gray-900'>
                      {rent.product.owner?.name || '-'}
                    </p>
                  </div>
                  {rent.product.owner?.email && (
                    <div className='flex items-center gap-2 text-sm text-gray-600'>
                      <Mail className='h-4 w-4 text-gray-400' />
                      <a href={`mailto:${rent.product.owner.email}`} className='text-blue-600 hover:underline'>
                        {rent.product.owner.email}
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
