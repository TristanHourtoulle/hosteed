'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { isFullAdmin } from '@/hooks/useAdminAuth'
import { useAdminReservationsPaginated } from '@/hooks/useAdminPaginated'
import { useAdminReservationStatusChange } from '@/hooks/useAdminReservationMutations'
import Pagination from '@/components/ui/Pagination'
import Link from 'next/link'
import { motion, Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { Button } from '@/components/ui/shadcnui/button'
import { Input } from '@/components/ui/shadcnui/input'
import { Alert, AlertDescription } from '@/components/ui/shadcnui/alert'
import {
  Loader2,
  Search,
  CalendarDays,
  Mail,
  Eye,
  MoreVertical,
  MapPin,
  Users,
  Moon,
  CheckCircle,
  XCircle,
  LogIn,
  LogOut,
  Clock,
  Ban,
  CreditCard,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
} from '@/shadcnui'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/shadcnui/dropdown-menu'
import { Textarea } from '@/components/ui/shadcnui/textarea'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  WAITING: { label: 'En attente', color: 'text-yellow-800', bg: 'bg-yellow-100', icon: Clock },
  RESERVED: { label: 'Confirmée', color: 'text-blue-800', bg: 'bg-blue-100', icon: CheckCircle },
  CHECKIN: { label: 'Check-in', color: 'text-green-800', bg: 'bg-green-100', icon: LogIn },
  CHECKOUT: { label: 'Check-out', color: 'text-gray-800', bg: 'bg-gray-100', icon: LogOut },
  CANCEL: { label: 'Annulée', color: 'text-red-800', bg: 'bg-red-100', icon: Ban },
}

const PAYMENT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  NOT_PAID: { label: 'Non payé', color: 'text-gray-700', bg: 'bg-gray-100' },
  AUTHORIZED: { label: 'Autorisé', color: 'text-amber-700', bg: 'bg-amber-100' },
  CLIENT_PAID: { label: 'Payé', color: 'text-green-700', bg: 'bg-green-100' },
  MID_TRANSFER_REQ: { label: 'Transfert partiel demandé', color: 'text-orange-700', bg: 'bg-orange-100' },
  MID_TRANSFER_DONE: { label: 'Transfert partiel effectué', color: 'text-blue-700', bg: 'bg-blue-100' },
  REST_TRANSFER_REQ: { label: 'Transfert final demandé', color: 'text-orange-700', bg: 'bg-orange-100' },
  REST_TRANSFER_DONE: { label: 'Transfert final effectué', color: 'text-blue-700', bg: 'bg-blue-100' },
  FULL_TRANSFER_REQ: { label: 'Transfert total demandé', color: 'text-orange-700', bg: 'bg-orange-100' },
  FULL_TRANSFER_DONE: { label: 'Transfert total effectué', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  REFUNDED: { label: 'Remboursé', color: 'text-purple-700', bg: 'bg-purple-100' },
  DISPUTE: { label: 'Litige', color: 'text-red-700', bg: 'bg-red-100' },
}

const STATS_CARDS = [
  { key: 'total', label: 'Total', gradient: 'from-blue-500 to-blue-600', textMuted: 'text-blue-100', iconColor: 'text-blue-200' },
  { key: 'WAITING', label: 'En attente', gradient: 'from-yellow-400 to-yellow-500', textMuted: 'text-yellow-100', iconColor: 'text-yellow-200' },
  { key: 'RESERVED', label: 'Confirmées', gradient: 'from-blue-400 to-indigo-500', textMuted: 'text-blue-100', iconColor: 'text-blue-200' },
  { key: 'CHECKIN', label: 'Check-in', gradient: 'from-green-400 to-green-500', textMuted: 'text-green-100', iconColor: 'text-green-200' },
  { key: 'CHECKOUT', label: 'Check-out', gradient: 'from-gray-400 to-gray-500', textMuted: 'text-gray-100', iconColor: 'text-gray-200' },
  { key: 'CANCEL', label: 'Annulées', gradient: 'from-red-400 to-red-500', textMuted: 'text-red-100', iconColor: 'text-red-200' },
]

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || { label: status, color: 'text-gray-800', bg: 'bg-gray-100', icon: Clock }
  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
      <Icon className='h-3 w-3' />
      {config.label}
    </span>
  )
}

function PaymentBadge({ payment, status }: { payment: string; status: string }) {
  const effectivePayment = payment === 'NOT_PAID' && status === 'WAITING' ? 'AUTHORIZED' : payment
  const config = PAYMENT_CONFIG[effectivePayment] || { label: payment, color: 'text-gray-700', bg: 'bg-gray-100' }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
      <CreditCard className='h-3 w-3' />
      {config.label}
    </span>
  )
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatCurrency(amount: number | null) {
  if (amount === null || amount === undefined) return '-'
  return amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

export default function AdminReservationsPage() {
  const {
    session,
    isLoading: isAuthLoading,
    isAuthenticated,
  } = useAuth({ required: true, redirectTo: '/auth' })
  const router = useRouter()

  const {
    reservations,
    stats,
    pagination,
    loading,
    isFetching,
    error: hookError,
    searchTerm,
    statusFilter,
    handleSearch,
    handleStatusFilter,
    goToPage,
  } = useAdminReservationsPaginated()

  const statusMutation = useAdminReservationStatusChange()

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated && (!session?.user?.roles || !isFullAdmin(session.user.roles))) {
      router.push('/')
    }
  }, [isAuthenticated, session, router])

  const handleStatusAction = (rentId: string, status: 'RESERVED' | 'CHECKIN' | 'CHECKOUT' | 'CANCEL') => {
    if (status === 'CANCEL') {
      setCancelTargetId(rentId)
      setCancelReason('')
      setCancelDialogOpen(true)
      return
    }
    statusMutation.mutate({ rentId, status })
  }

  const handleConfirmCancel = () => {
    if (!cancelTargetId) return
    statusMutation.mutate(
      { rentId: cancelTargetId, status: 'CANCEL', reason: cancelReason || undefined },
      {
        onSuccess: () => {
          setCancelDialogOpen(false)
          setCancelTargetId(null)
          setCancelReason('')
        },
      }
    )
  }

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

  if (hookError) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8'>
        <div className='max-w-7xl mx-auto'>
          <Alert variant='destructive' className='rounded-2xl'>
            <AlertDescription>
              {hookError.message || 'Erreur lors du chargement des réservations'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'>
      <div className='container mx-auto p-6 space-y-8'>
        {/* Header */}
        <motion.div
          className='text-center space-y-4'
          variants={containerVariants}
          initial='hidden'
          animate='visible'
        >
          <motion.div
            variants={itemVariants}
            className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg mb-4'
          >
            <CalendarDays className='w-8 h-8 text-white' />
          </motion.div>
          <motion.h1
            variants={itemVariants}
            className='text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent'
          >
            Gestion des Réservations
          </motion.h1>
          <motion.p variants={itemVariants} className='text-gray-600 text-lg max-w-2xl mx-auto'>
            Consultez, filtrez et gérez toutes les réservations de la plateforme
          </motion.p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          variants={containerVariants}
          initial='hidden'
          animate='visible'
          className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'
        >
          {STATS_CARDS.map(({ key, label, gradient, textMuted, iconColor }) => {
            const isActive = (key === 'total' && !statusFilter) || statusFilter === key
            return (
              <motion.div key={key} variants={itemVariants}>
                <Card
                  className={`border-0 shadow-lg cursor-pointer transition-all duration-300 hover:shadow-xl ${
                    key === 'total' || isActive
                      ? `bg-gradient-to-r ${gradient} text-white`
                      : 'bg-white/80 backdrop-blur-sm hover:scale-[1.02]'
                  }`}
                  onClick={() => handleStatusFilter(key === 'total' ? '' : statusFilter === key ? '' : key)}
                >
                  <CardContent className='p-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className={`text-xs font-medium ${key === 'total' || isActive ? textMuted : 'text-gray-500'}`}>
                          {label}
                          {isActive && key !== 'total' && ' (Filtré)'}
                        </p>
                        <p className={`text-2xl font-bold ${key === 'total' || isActive ? '' : 'text-gray-900'}`}>
                          {stats[key] || 0}
                        </p>
                      </div>
                      <CalendarDays className={`h-6 w-6 ${key === 'total' || isActive ? iconColor : 'text-gray-300'}`} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Search */}
        <motion.div
          variants={containerVariants}
          initial='hidden'
          animate='visible'
          className='bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-0'
        >
          <motion.div variants={itemVariants} className='relative max-w-md'>
            {isFetching ? (
              <Loader2 className='absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 h-4 w-4 animate-spin' />
            ) : (
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
            )}
            <Input
              type='text'
              placeholder='Rechercher par voyageur, hôte, hébergement...'
              value={searchTerm}
              onChange={e => handleSearch(e.target.value)}
              className='pl-10 py-3 border-0 bg-gray-50 focus:bg-white transition-colors rounded-xl'
            />
          </motion.div>
        </motion.div>

        {/* Reservation Cards Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {reservations.map((reservation, index) => (
            <motion.div
              key={reservation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <Card className='group hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden'>
                <CardContent className='p-5 space-y-4'>
                  {/* Header: Product + Actions */}
                  <div className='flex items-start justify-between'>
                    <div className='flex-1 min-w-0'>
                      <Link
                        href={`/admin/reservations/${reservation.id}`}
                        className='font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors truncate block'
                      >
                        {reservation.product.name}
                      </Link>
                      {reservation.product.address && (
                        <p className='text-gray-500 text-sm flex items-center gap-1 mt-0.5'>
                          <MapPin className='h-3 w-3 flex-shrink-0' />
                          <span className='truncate'>{reservation.product.address}</span>
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity'
                        >
                          <MoreVertical className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end' className='rounded-xl'>
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/reservations/${reservation.id}`} className='flex items-center gap-2'>
                            <Eye className='h-4 w-4' />
                            Voir les détails
                          </Link>
                        </DropdownMenuItem>
                        {reservation.status === 'WAITING' && (
                          <DropdownMenuItem
                            onClick={() => handleStatusAction(reservation.id, 'RESERVED')}
                            className='flex items-center gap-2 text-green-600'
                          >
                            <CheckCircle className='h-4 w-4' />
                            Approuver
                          </DropdownMenuItem>
                        )}
                        {reservation.status === 'RESERVED' && (
                          <DropdownMenuItem
                            onClick={() => handleStatusAction(reservation.id, 'CHECKIN')}
                            className='flex items-center gap-2 text-blue-600'
                          >
                            <LogIn className='h-4 w-4' />
                            Check-in
                          </DropdownMenuItem>
                        )}
                        {reservation.status === 'CHECKIN' && (
                          <DropdownMenuItem
                            onClick={() => handleStatusAction(reservation.id, 'CHECKOUT')}
                            className='flex items-center gap-2 text-gray-600'
                          >
                            <LogOut className='h-4 w-4' />
                            Check-out
                          </DropdownMenuItem>
                        )}
                        {!['CHECKOUT', 'CANCEL'].includes(reservation.status) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleStatusAction(reservation.id, 'CANCEL')}
                              className='flex items-center gap-2 text-red-600'
                            >
                              <XCircle className='h-4 w-4' />
                              Annuler
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Status + Payment */}
                  <div className='flex flex-wrap items-center gap-2'>
                    <StatusBadge status={reservation.status} />
                    <PaymentBadge payment={reservation.payment} status={reservation.status} />
                  </div>

                  {/* Guest & Host */}
                  <div className='space-y-2 text-sm'>
                    <div className='flex items-center gap-2 text-gray-700'>
                      <Users className='h-4 w-4 text-gray-400 flex-shrink-0' />
                      <span className='font-medium'>Voyageur :</span>
                      <span className='truncate'>
                        {[reservation.user.name, reservation.user.lastname].filter(Boolean).join(' ') || reservation.user.email}
                      </span>
                    </div>
                    <div className='flex items-center gap-2 text-gray-700'>
                      <Mail className='h-4 w-4 text-gray-400 flex-shrink-0' />
                      <span className='font-medium'>Hôte :</span>
                      <span className='truncate'>
                        {reservation.product.owner.name || reservation.product.owner.email}
                      </span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className='flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2'>
                    <CalendarDays className='h-4 w-4 text-gray-400' />
                    <span>{formatDate(reservation.arrivingDate)}</span>
                    <span className='text-gray-400'>→</span>
                    <span>{formatDate(reservation.leavingDate)}</span>
                    {reservation.numberOfNights && (
                      <span className='ml-auto flex items-center gap-1 text-gray-500'>
                        <Moon className='h-3 w-3' />
                        {reservation.numberOfNights}n
                      </span>
                    )}
                  </div>

                  {/* Amount */}
                  <div className='flex items-center justify-between pt-2 border-t border-gray-100'>
                    <span className='text-sm text-gray-500'>Montant total</span>
                    <span className='text-lg font-bold text-gray-900'>
                      {formatCurrency(reservation.totalAmount)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {reservations.length === 0 && !loading && (
          <motion.div variants={itemVariants} className='text-center py-12'>
            <CalendarDays className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>Aucune réservation trouvée</h3>
            <p className='text-gray-500'>
              Essayez de modifier votre recherche ou vos filtres.
            </p>
          </motion.div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className='mt-8 flex justify-center'>
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={goToPage}
              showPrevNext={true}
              showNumbers={true}
              maxVisiblePages={5}
            />
          </div>
        )}

        {/* Results summary */}
        {reservations.length > 0 && (
          <div className='mt-4 text-center text-sm text-gray-500'>
            Affichage de {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} à{' '}
            {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} sur{' '}
            {pagination.totalItems} réservations
          </div>
        )}

        {/* Cancel Dialog */}
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogContent className='sm:max-w-md rounded-2xl'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2 text-xl'>
                <XCircle className='h-5 w-5 text-red-600' />
                Annuler la réservation
              </DialogTitle>
              <DialogDescription>
                Cette action annulera la réservation et effectuera un remboursement Stripe si applicable.
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4 py-4'>
              <div className='space-y-2'>
                <Label htmlFor='cancelReason'>Raison (optionnel)</Label>
                <Textarea
                  id='cancelReason'
                  placeholder="Indiquez la raison de l'annulation..."
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  className='rounded-xl'
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setCancelDialogOpen(false)}
                disabled={statusMutation.isPending}
                className='rounded-xl'
              >
                Retour
              </Button>
              <Button
                onClick={handleConfirmCancel}
                disabled={statusMutation.isPending}
                className='bg-red-600 hover:bg-red-700 text-white rounded-xl'
              >
                {statusMutation.isPending ? (
                  <>
                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                    Annulation...
                  </>
                ) : (
                  <>
                    <XCircle className='h-4 w-4 mr-2' />
                    Confirmer l&apos;annulation
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
