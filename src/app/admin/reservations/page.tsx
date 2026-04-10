'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { isFullAdmin } from '@/hooks/useAdminAuth'
import { useAdminReservationsPaginated } from '@/hooks/useAdminPaginated'
import { useAdminReservationStatusChange } from '@/hooks/useAdminReservationMutations'
import Pagination from '@/components/ui/Pagination'
import { Button } from '@/components/ui/shadcnui/button'
import { Alert, AlertDescription } from '@/components/ui/shadcnui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
} from '@/shadcnui'
import { Textarea } from '@/components/ui/shadcnui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/shadcnui/dropdown-menu'
import {
  Loader2,
  CalendarDays,
  Clock,
  CheckCircle2,
  DoorOpen,
  DoorClosed,
  XCircle,
  Ban,
  MoreHorizontal,
  MapPin,
  Eye,
  Shield,
  ArrowRight,
  CreditCard,
  AlertCircle,
} from 'lucide-react'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { KpiCard, KpiMetric } from '@/components/admin/ui/KpiCard'
import { FilterBar } from '@/components/admin/ui/FilterBar'
import { DataTable, type DataTableColumn } from '@/components/admin/ui/DataTable'

type RentStatus = 'WAITING' | 'RESERVED' | 'CHECKIN' | 'CHECKOUT' | 'CANCEL'

type PaymentStatus =
  | 'NOT_PAID'
  | 'CLIENT_PAID'
  | 'MID_TRANSFER_REQ'
  | 'MID_TRANSFER_DONE'
  | 'REST_TRANSFER_REQ'
  | 'REST_TRANSFER_DONE'
  | 'FULL_TRANSFER_REQ'
  | 'FULL_TRANSFER_DONE'
  | 'REFUNDED'
  | 'DISPUTE'

interface AdminReservationRow {
  id: string
  arrivingDate: string
  leavingDate: string
  status: RentStatus
  payment: PaymentStatus
  totalAmount: number | null
  numberOfNights: number | null
  numberPeople: number | null
  createdAt: string
  accepted: boolean
  confirmed: boolean
  product: {
    id: string
    name: string
    address: string
    owner: { id: string; name: string | null; email: string }
  }
  user: {
    id: string
    name: string | null
    lastname: string | null
    email: string
  }
}

const STATUS_LABEL: Record<
  RentStatus,
  { label: string; tone: string; icon: React.ComponentType<{ className?: string }> }
> = {
  WAITING: {
    label: 'En attente',
    tone: 'bg-amber-50 text-amber-700 ring-amber-200',
    icon: Clock,
  },
  RESERVED: {
    label: 'Confirmée',
    tone: 'bg-blue-50 text-blue-700 ring-blue-200',
    icon: CheckCircle2,
  },
  CHECKIN: {
    label: 'Check-in',
    tone: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    icon: DoorOpen,
  },
  CHECKOUT: {
    label: 'Check-out',
    tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    icon: DoorClosed,
  },
  CANCEL: {
    label: 'Annulée',
    tone: 'bg-red-50 text-red-700 ring-red-200',
    icon: Ban,
  },
}

const PAYMENT_LABEL: Record<PaymentStatus, { label: string; tone: string }> = {
  NOT_PAID: { label: 'Non payé', tone: 'bg-slate-100 text-slate-700' },
  CLIENT_PAID: { label: 'Payé', tone: 'bg-emerald-50 text-emerald-700' },
  MID_TRANSFER_REQ: { label: '50% demandé', tone: 'bg-amber-50 text-amber-700' },
  MID_TRANSFER_DONE: { label: '50% versé', tone: 'bg-blue-50 text-blue-700' },
  REST_TRANSFER_REQ: { label: 'Solde demandé', tone: 'bg-amber-50 text-amber-700' },
  REST_TRANSFER_DONE: { label: 'Soldé', tone: 'bg-emerald-50 text-emerald-700' },
  FULL_TRANSFER_REQ: { label: '100% demandé', tone: 'bg-amber-50 text-amber-700' },
  FULL_TRANSFER_DONE: { label: '100% versé', tone: 'bg-emerald-50 text-emerald-700' },
  REFUNDED: { label: 'Remboursé', tone: 'bg-red-50 text-red-700' },
  DISPUTE: { label: 'Litige', tone: 'bg-red-50 text-red-700' },
}

const STATUS_FILTERS: Array<{
  value: '' | RentStatus
  label: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { value: '', label: 'Toutes', icon: CalendarDays },
  { value: 'WAITING', label: 'En attente', icon: Clock },
  { value: 'RESERVED', label: 'Confirmées', icon: CheckCircle2 },
  { value: 'CHECKIN', label: 'Check-in', icon: DoorOpen },
  { value: 'CHECKOUT', label: 'Check-out', icon: DoorClosed },
  { value: 'CANCEL', label: 'Annulées', icon: Ban },
]

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function StatusPill({ status }: { status: RentStatus }) {
  const config = STATUS_LABEL[status]
  const Icon = config.icon
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${config.tone}`}
    >
      <Icon className='h-3 w-3' />
      {config.label}
    </span>
  )
}

function PaymentPill({ payment }: { payment: PaymentStatus }) {
  const config = PAYMENT_LABEL[payment]
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${config.tone}`}>
      {config.label}
    </span>
  )
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

  const openCancelDialog = (rentId: string) => {
    setCancelTargetId(rentId)
    setCancelReason('')
    setCancelDialogOpen(true)
  }

  const handleStatusAction = (rentId: string, status: Exclude<RentStatus, 'WAITING'>) => {
    if (status === 'CANCEL') {
      openCancelDialog(rentId)
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

  const totalRevenue = useMemo(
    () =>
      (reservations as AdminReservationRow[])
        .filter(
          r =>
            r.payment !== 'NOT_PAID' &&
            r.payment !== 'REFUNDED' &&
            r.payment !== 'DISPUTE' &&
            r.status !== 'CANCEL'
        )
        .reduce((sum, r) => sum + (r.totalAmount ?? 0), 0),
    [reservations]
  )

  const columns: DataTableColumn<AdminReservationRow>[] = [
    {
      key: 'reference',
      header: 'Référence',
      sortable: true,
      sortAccessor: r => new Date(r.createdAt),
      render: r => (
        <div className='min-w-0'>
          <p className='text-sm font-semibold text-slate-900'>#{r.id.slice(-6).toUpperCase()}</p>
          <p className='truncate text-xs text-slate-500'>Créée le {formatDate(r.createdAt)}</p>
        </div>
      ),
      cellClassName: 'whitespace-nowrap',
    },
    {
      key: 'guest',
      header: 'Voyageur',
      sortable: true,
      sortAccessor: r => (r.user.name || r.user.email).toLowerCase(),
      render: r => {
        const displayName = [r.user.name, r.user.lastname].filter(Boolean).join(' ') || '—'
        return (
          <div className='min-w-0'>
            <p className='truncate text-sm font-medium text-slate-900'>{displayName}</p>
            <p className='truncate text-xs text-slate-500'>{r.user.email}</p>
          </div>
        )
      },
    },
    {
      key: 'product',
      header: 'Hébergement',
      render: r => (
        <Link
          href={`/admin/validation/${r.product.id}`}
          className='group block min-w-0'
        >
          <p className='truncate text-sm font-medium text-slate-900 group-hover:text-blue-700'>
            {r.product.name}
          </p>
          <p className='flex items-center gap-1 truncate text-xs text-slate-500'>
            <MapPin className='h-3 w-3' />
            {r.product.address}
          </p>
        </Link>
      ),
    },
    {
      key: 'host',
      header: 'Hôte',
      render: r => {
        const hostName = r.product.owner.name || r.product.owner.email
        return (
          <p className='truncate text-sm text-slate-700' title={r.product.owner.email}>
            {hostName}
          </p>
        )
      },
    },
    {
      key: 'stay',
      header: 'Séjour',
      sortable: true,
      sortAccessor: r => new Date(r.arrivingDate),
      render: r => (
        <div className='min-w-0'>
          <p className='flex items-center gap-1 text-xs text-slate-900 whitespace-nowrap'>
            {formatDate(r.arrivingDate)}
            <ArrowRight className='h-3 w-3 text-slate-400' />
            {formatDate(r.leavingDate)}
          </p>
          <p className='text-xs text-slate-500'>
            {r.numberOfNights ?? '—'} nuits · {r.numberPeople ?? '—'} voyageur
            {(r.numberPeople ?? 0) > 1 ? 's' : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Montant',
      sortable: true,
      sortAccessor: r => r.totalAmount ?? 0,
      align: 'right',
      render: r => (
        <div className='text-right'>
          <p className='text-sm font-bold tabular-nums text-slate-900'>
            {r.totalAmount != null ? formatCurrency(r.totalAmount) : '—'}
          </p>
          <div className='mt-0.5 flex justify-end'>
            <PaymentPill payment={r.payment} />
          </div>
        </div>
      ),
      cellClassName: 'whitespace-nowrap',
    },
    {
      key: 'status',
      header: 'Statut',
      sortable: true,
      sortAccessor: r => r.status,
      render: r => <StatusPill status={r.status} />,
      cellClassName: 'whitespace-nowrap',
    },
  ]

  if (isAuthLoading || loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/40'>
        <div className='mx-auto max-w-7xl space-y-8 p-6'>
          <div className='space-y-3'>
            <div className='h-4 w-40 animate-pulse rounded bg-slate-200' />
            <div className='h-10 w-80 animate-pulse rounded bg-slate-200' />
            <div className='h-4 w-96 animate-pulse rounded bg-slate-200' />
          </div>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className='h-32 animate-pulse rounded-2xl border border-slate-200/80 bg-white'
              />
            ))}
          </div>
          <div className='h-16 animate-pulse rounded-2xl border border-slate-200/80 bg-white' />
          <div className='h-96 animate-pulse rounded-2xl border border-slate-200/80 bg-white' />
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/40'>
      <motion.div
        className='mx-auto max-w-7xl space-y-8 p-6'
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <PageHeader
          backHref='/admin'
          backLabel='Retour au panel admin'
          eyebrow='Espace administrateur'
          eyebrowIcon={Shield}
          title='Gestion des réservations'
          subtitle='Consultez, filtrez et gérez toutes les réservations de la plateforme. Les actions d’approbation, de check-in et d’annulation sont disponibles depuis le menu de chaque ligne.'
        />

        {hookError && (
          <Alert variant='destructive'>
            <AlertDescription>
              {hookError.message || 'Erreur lors du chargement des réservations'}
            </AlertDescription>
          </Alert>
        )}

        {/* KPI row */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <KpiCard
            label='Total'
            value={stats.total || 0}
            hint='réservations au total'
            icon={CalendarDays}
            tone='blue'
            loading={loading}
          />
          <KpiCard
            label='À traiter'
            value={(stats.WAITING || 0) as number}
            hint='en attente de confirmation'
            icon={Clock}
            tone='amber'
            loading={loading}
          />
          <KpiCard
            label='Confirmées'
            value={(stats.RESERVED || 0) as number}
            hint='prêtes pour le check-in'
            icon={CheckCircle2}
            tone='indigo'
            loading={loading}
          />
          <KpiCard
            label='Revenus (page)'
            value={formatCurrency(totalRevenue)}
            hint='sur la page actuelle, hors annulées'
            icon={CreditCard}
            tone='emerald'
            loading={loading}
          />
        </div>

        {/* Secondary metrics */}
        <div className='grid gap-3 sm:grid-cols-3'>
          <KpiMetric
            label='check-in'
            value={(stats.CHECKIN || 0) as number}
            icon={DoorOpen}
            tone='slate'
          />
          <KpiMetric
            label='check-out'
            value={(stats.CHECKOUT || 0) as number}
            icon={DoorClosed}
            tone='slate'
          />
          <KpiMetric
            label='annulées'
            value={(stats.CANCEL || 0) as number}
            icon={Ban}
            tone='red'
          />
        </div>

        {/* Status filter chips */}
        <div className='flex flex-wrap items-center gap-2'>
          {STATUS_FILTERS.map(filter => {
            const Icon = filter.icon
            const active =
              (filter.value === '' && !statusFilter) || statusFilter === filter.value
            return (
              <button
                key={filter.value || 'all'}
                onClick={() => handleStatusFilter(active ? '' : filter.value)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                }`}
              >
                <Icon className='h-3 w-3' />
                {filter.label}
              </button>
            )
          })}
        </div>

        {/* Filter bar */}
        <FilterBar
          searchValue={searchTerm}
          onSearchChange={handleSearch}
          searchPlaceholder='Rechercher par voyageur, hôte, hébergement…'
        />

        {/* Data table */}
        <DataTable<AdminReservationRow>
          columns={columns}
          rows={reservations as unknown as AdminReservationRow[]}
          getRowId={r => r.id}
          loading={loading}
          rowActions={reservation => {
            const canConfirm = reservation.status === 'WAITING'
            const canCheckIn = reservation.status === 'RESERVED'
            const canCheckOut = reservation.status === 'CHECKIN'
            const canCancel = !['CANCEL', 'CHECKOUT'].includes(reservation.status)
            return (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-8 w-8 p-0'
                    aria-label='Actions réservation'
                  >
                    <MoreHorizontal className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-52'>
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/reservations/${reservation.id}`}
                      className='flex items-center gap-2'
                    >
                      <Eye className='h-4 w-4' />
                      Voir le détail
                    </Link>
                  </DropdownMenuItem>
                  {canConfirm && (
                    <DropdownMenuItem
                      onClick={() => handleStatusAction(reservation.id, 'RESERVED')}
                      className='flex items-center gap-2 text-blue-700'
                    >
                      <CheckCircle2 className='h-4 w-4' />
                      Confirmer
                    </DropdownMenuItem>
                  )}
                  {canCheckIn && (
                    <DropdownMenuItem
                      onClick={() => handleStatusAction(reservation.id, 'CHECKIN')}
                      className='flex items-center gap-2 text-indigo-700'
                    >
                      <DoorOpen className='h-4 w-4' />
                      Marquer check-in
                    </DropdownMenuItem>
                  )}
                  {canCheckOut && (
                    <DropdownMenuItem
                      onClick={() => handleStatusAction(reservation.id, 'CHECKOUT')}
                      className='flex items-center gap-2 text-emerald-700'
                    >
                      <DoorClosed className='h-4 w-4' />
                      Marquer check-out
                    </DropdownMenuItem>
                  )}
                  {canCancel && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => openCancelDialog(reservation.id)}
                        className='flex items-center gap-2 text-red-600 focus:text-red-600'
                      >
                        <XCircle className='h-4 w-4' />
                        Annuler la réservation
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )
          }}
          emptyState={{
            icon: CalendarDays,
            title: 'Aucune réservation trouvée',
            subtitle:
              searchTerm || statusFilter
                ? 'Essayez d’ajuster votre recherche ou vos filtres.'
                : 'Aucune réservation n’a encore été effectuée sur la plateforme.',
          }}
        />

        {/* Footer: summary + pagination */}
        {!loading && reservations.length > 0 && (
          <div className='flex flex-col items-center gap-3 md:flex-row md:justify-between'>
            <p className='text-sm text-slate-500'>
              Affichage de {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} à{' '}
              {Math.min(
                pagination.currentPage * pagination.itemsPerPage,
                pagination.totalItems
              )}{' '}
              sur {pagination.totalItems} réservations
            </p>
            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={goToPage}
                showPrevNext={true}
                showNumbers={true}
                maxVisiblePages={5}
              />
            )}
          </div>
        )}

        {/* Cancel dialog */}
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <div className='flex items-start gap-3'>
                <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100'>
                  <AlertCircle className='h-5 w-5' />
                </div>
                <div className='space-y-1'>
                  <DialogTitle className='text-lg'>Annuler la réservation</DialogTitle>
                  <DialogDescription className='text-sm text-slate-600'>
                    Cette action annulera la réservation et effectuera un remboursement Stripe si
                    applicable. L’hôte et le voyageur seront notifiés.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className='space-y-4 py-2'>
              <div className='space-y-2'>
                <Label htmlFor='cancelReason'>Raison (optionnel)</Label>
                <Textarea
                  id='cancelReason'
                  placeholder='Expliquez la raison de l’annulation…'
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className='gap-2'>
              <Button
                variant='outline'
                onClick={() => setCancelDialogOpen(false)}
                disabled={statusMutation.isPending}
              >
                Retour
              </Button>
              <Button
                variant='destructive'
                onClick={handleConfirmCancel}
                disabled={statusMutation.isPending}
                className='gap-2'
              >
                {statusMutation.isPending ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <XCircle className='h-4 w-4' />
                )}
                Confirmer l’annulation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  )
}
