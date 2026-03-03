'use client'

import { useEffect, useState, useCallback } from 'react'
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
  Wallet,
  Building2,
} from 'lucide-react'
import { StatusBadge } from '@/components/reservations/StatusBadge'
import { StatusTimeline } from '@/components/reservations/StatusTimeline'
import { PricingRow } from '@/components/reservations/PricingRow'
import { AdminActionButtons } from './components/AdminActionButtons'
import { PAYMENT_LABELS } from '@/lib/constants/reservation'
import { formatDateLong } from '@/lib/utils/format'
import { formatCurrencySafe } from '@/lib/utils/formatNumber'

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

  const fetchData = useCallback(async () => {
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
      setError('Erreur lors du chargement de la réservation')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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
                    Créée le {formatDateLong(rent.createdAt)}
                  </p>
                </div>
                <div className='text-right'>
                  <p className='text-sm text-gray-500'>Montant total</p>
                  <p className='text-3xl font-bold text-gray-900'>
                    {formatCurrencySafe(rent.totalAmount)}
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
              <Card className='border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl py-0 gap-0'>
                <div className='px-6 py-4 border-b border-gray-100'>
                  <h2 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
                    <CalendarDays className='h-5 w-5 text-blue-600' />
                    Détails du séjour
                  </h2>
                </div>
                <CardContent className='p-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
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

                    <div className='space-y-3'>
                      <div className='flex items-center gap-6'>
                        <div className='flex items-center gap-2'>
                          <CalendarDays className='h-4 w-4 text-gray-400' />
                          <div>
                            <p className='text-xs text-gray-500'>Arrivée</p>
                            <p className='font-medium text-gray-800'>{formatDateLong(rent.arrivingDate)}</p>
                          </div>
                        </div>
                        <span className='text-gray-300'>&rarr;</span>
                        <div>
                          <p className='text-xs text-gray-500'>Départ</p>
                          <p className='font-medium text-gray-800'>{formatDateLong(rent.leavingDate)}</p>
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
                    <PricingRow
                      label={`${formatCurrencySafe(rent.basePricePerNight)} × ${rent.numberOfNights || '-'} nuit${(rent.numberOfNights || 0) > 1 ? 's' : ''}`}
                      value={formatCurrencySafe(rent.subtotal)}
                    />

                    {(rent.discountAmount !== null && rent.discountAmount !== undefined && rent.discountAmount > 0) && (
                      <PricingRow
                        label={`Réduction${rent.promotionApplied ? ' (promotion)' : ''}${rent.specialPriceApplied ? ' (prix spécial)' : ''}`}
                        value={`-${formatCurrencySafe(rent.discountAmount)}`}
                        color='text-green-600'
                        indent
                      />
                    )}
                    {(rent.totalSavings !== null && rent.totalSavings !== undefined && rent.totalSavings > 0 && rent.totalSavings !== rent.discountAmount) && (
                      <PricingRow
                        label='Économies totales'
                        value={formatCurrencySafe(rent.totalSavings)}
                        color='text-green-600'
                        indent
                      />
                    )}

                    {(rent.extrasTotal !== null && rent.extrasTotal !== undefined && rent.extrasTotal > 0) && (
                      <PricingRow label='Extras' value={formatCurrencySafe(rent.extrasTotal)} indent />
                    )}

                    <Separator className='my-2' />

                    <PricingRow label='Commission client' value={formatCurrencySafe(rent.clientCommission)} indent />
                    <PricingRow label='Commission hôte' value={formatCurrencySafe(rent.hostCommission)} indent />

                    <Separator className='my-2' />

                    <PricingRow label='Montant total client' value={formatCurrencySafe(rent.totalAmount)} bold />
                    <div className='flex items-center justify-between pt-1'>
                      <span className='text-sm text-gray-600'>Dont part plateforme</span>
                      <span className='text-sm font-medium text-indigo-600'>
                        {formatCurrencySafe(rent.platformAmount)}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-gray-600'>Dont part hôte</span>
                      <span className='text-sm font-medium text-emerald-600'>
                        {formatCurrencySafe(rent.hostAmount)}
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
                              {formatCurrencySafe(prices.availablePrice)}
                            </p>
                          </div>
                          <div className='rounded-xl bg-orange-50 border border-orange-100 p-3 text-center'>
                            <p className='text-xs text-orange-500 mb-1'>En attente</p>
                            <p className='text-lg font-bold text-orange-700'>
                              {formatCurrencySafe(prices.pendingPrice)}
                            </p>
                          </div>
                          <div className='rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center'>
                            <p className='text-xs text-emerald-500 mb-1'>Viré à l&apos;hôte</p>
                            <p className='text-lg font-bold text-emerald-700'>
                              {formatCurrencySafe(prices.transferredPrice)}
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
