'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { isFullAdmin } from '@/hooks/useAdminAuth'
import { getAllPaymentRequest } from '@/lib/services/payment.service'
import { PaymentStatus, PaymentReqStatus } from '@prisma/client'
import { formatCurrency } from '@/lib/utils/formatNumber'
import { Button } from '@/components/ui/shadcnui/button'
import {
  Banknote,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Wallet,
  Shield,
  Eye,
  CreditCard,
  Percent,
  Coins,
} from 'lucide-react'

import { PageHeader } from '@/components/admin/ui/PageHeader'
import { KpiCard } from '@/components/admin/ui/KpiCard'
import { FilterBar } from '@/components/admin/ui/FilterBar'
import {
  DataTable,
  type DataTableColumn,
  type DataTableSort,
} from '@/components/admin/ui/DataTable'

interface PayRequest {
  id: string
  userId: string
  PaymentRequest: PaymentStatus
  prices: string
  notes: string
  method: string
  status: PaymentReqStatus
  user: {
    name: string | null
    email: string
  }
  rent: {
    product: {
      name: string
    }
  }
}

const REQUEST_TYPE_CONFIG: Partial<
  Record<PaymentStatus, { label: string; tone: string; icon: React.ComponentType<{ className?: string }> }>
> = {
  FULL_TRANSFER_REQ: {
    label: 'Paiement intégral',
    tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    icon: Banknote,
  },
  MID_TRANSFER_REQ: {
    label: 'Paiement 50%',
    tone: 'bg-blue-50 text-blue-700 ring-blue-200',
    icon: Percent,
  },
  REST_TRANSFER_REQ: {
    label: 'Solde restant',
    tone: 'bg-amber-50 text-amber-700 ring-amber-200',
    icon: Coins,
  },
}

const STATUS_CONFIG: Record<
  PaymentReqStatus,
  { label: string; tone: string; icon: React.ComponentType<{ className?: string }> }
> = {
  RECEIVED: {
    label: 'En attente',
    tone: 'bg-amber-50 text-amber-700 ring-amber-200',
    icon: Clock,
  },
  DONE: {
    label: 'Terminé',
    tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    icon: CheckCircle2,
  },
  REFUSED: {
    label: 'Refusé',
    tone: 'bg-red-50 text-red-700 ring-red-200',
    icon: XCircle,
  },
}

const STATUS_FILTERS: Array<{
  value: PaymentReqStatus | 'ALL'
  label: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { value: 'ALL', label: 'Toutes', icon: Wallet },
  { value: PaymentReqStatus.RECEIVED, label: 'En attente', icon: Clock },
  { value: PaymentReqStatus.DONE, label: 'Terminées', icon: CheckCircle2 },
  { value: PaymentReqStatus.REFUSED, label: 'Refusées', icon: XCircle },
]

function RequestTypePill({ type }: { type: PaymentStatus }) {
  const config = REQUEST_TYPE_CONFIG[type]
  if (!config) {
    return (
      <span className='inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200'>
        {type}
      </span>
    )
  }
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

function RequestStatusPill({ status }: { status: PaymentReqStatus }) {
  const config = STATUS_CONFIG[status]
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

export default function PaymentAdminPage() {
  const {
    session,
    isLoading: isAuthLoading,
    isAuthenticated,
  } = useAuth({ required: true, redirectTo: '/auth' })
  const router = useRouter()

  const [payRequests, setPayRequests] = useState<PayRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<PaymentReqStatus | 'ALL'>('ALL')
  const [searchValue, setSearchValue] = useState('')
  const [sort, setSort] = useState<DataTableSort | null>({ key: 'amount', direction: 'desc' })

  useEffect(() => {
    if (isAuthenticated && (!session?.user?.roles || !isFullAdmin(session.user.roles))) {
      router.push('/')
    }
  }, [isAuthenticated, session, router])

  useEffect(() => {
    const fetchPayRequests = async () => {
      try {
        const result = await getAllPaymentRequest()
        setPayRequests(result.payRequest)
      } catch (error) {
        console.error('Erreur lors du chargement des demandes de paiement:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPayRequests()
  }, [])

  const handleViewDetails = (requestId: string) => {
    router.push(`/admin/payment/${requestId}`)
  }

  const filteredRequests = useMemo(() => {
    let rows = payRequests
    if (statusFilter !== 'ALL') {
      rows = rows.filter(r => r.status === statusFilter)
    }
    if (searchValue.trim()) {
      const q = searchValue.toLowerCase()
      rows = rows.filter(
        r =>
          r.user.name?.toLowerCase().includes(q) ||
          r.user.email.toLowerCase().includes(q) ||
          r.rent?.product?.name?.toLowerCase().includes(q)
      )
    }
    return rows
  }, [payRequests, statusFilter, searchValue])

  const stats = useMemo(() => {
    const total = payRequests.length
    const pending = payRequests.filter(r => r.status === PaymentReqStatus.RECEIVED).length
    const done = payRequests.filter(r => r.status === PaymentReqStatus.DONE).length
    const refused = payRequests.filter(r => r.status === PaymentReqStatus.REFUSED).length

    const totalAmount = payRequests
      .filter(r => r.status !== PaymentReqStatus.REFUSED)
      .reduce((sum, r) => sum + Number(r.prices || 0), 0)
    const pendingAmount = payRequests
      .filter(r => r.status === PaymentReqStatus.RECEIVED)
      .reduce((sum, r) => sum + Number(r.prices || 0), 0)

    return { total, pending, done, refused, totalAmount, pendingAmount }
  }, [payRequests])

  const columns: DataTableColumn<PayRequest>[] = [
    {
      key: 'type',
      header: 'Type',
      render: r => (
        <div className='space-y-1'>
          <RequestTypePill type={r.PaymentRequest} />
          {r.notes && (
            <p className='line-clamp-1 text-xs text-slate-500' title={r.notes}>
              {r.notes}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Montant',
      sortable: true,
      sortAccessor: r => Number(r.prices || 0),
      align: 'right',
      render: r => (
        <p className='text-sm font-bold tabular-nums text-slate-900'>
          {formatCurrency(Number(r.prices || 0))}
        </p>
      ),
      cellClassName: 'whitespace-nowrap',
    },
    {
      key: 'host',
      header: 'Hôte',
      sortable: true,
      sortAccessor: r => (r.user.name || r.user.email).toLowerCase(),
      render: r => (
        <div className='min-w-0'>
          <p className='truncate text-sm font-semibold text-slate-900'>
            {r.user.name || 'Sans nom'}
          </p>
          <p className='truncate text-xs text-slate-500'>{r.user.email}</p>
        </div>
      ),
    },
    {
      key: 'product',
      header: 'Hébergement',
      render: r => (
        <p className='truncate text-sm text-slate-700' title={r.rent?.product?.name}>
          {r.rent?.product?.name ?? '—'}
        </p>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      sortable: true,
      sortAccessor: r => r.status,
      render: r => <RequestStatusPill status={r.status} />,
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
          title='Gestion des paiements'
          subtitle='Consultez et traitez les demandes de paiement des hôtes. Cliquez sur une ligne pour voir les détails et valider ou refuser le versement.'
        />

        {/* KPI row */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <KpiCard
            label='Total demandes'
            value={stats.total}
            hint='toutes statuts confondus'
            icon={Wallet}
            tone='blue'
          />
          <KpiCard
            label='En attente'
            value={stats.pending}
            hint='à traiter en priorité'
            icon={Clock}
            tone='amber'
          />
          <KpiCard
            label='Montant en attente'
            value={formatCurrency(stats.pendingAmount)}
            hint='demandes reçues non traitées'
            icon={TrendingUp}
            tone='purple'
          />
          <KpiCard
            label='Montant total'
            value={formatCurrency(stats.totalAmount)}
            hint='hors refusées'
            icon={CreditCard}
            tone='emerald'
          />
        </div>

        {/* Status filter chips */}
        <div className='flex flex-wrap items-center gap-2'>
          {STATUS_FILTERS.map(f => {
            const Icon = f.icon
            const active = statusFilter === f.value
            return (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                }`}
              >
                <Icon className='h-3 w-3' />
                {f.label}
                {f.value !== 'ALL' && (
                  <span
                    className={`ml-1 inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                      active ? 'bg-white/20' : 'bg-slate-100'
                    }`}
                  >
                    {f.value === PaymentReqStatus.RECEIVED
                      ? stats.pending
                      : f.value === PaymentReqStatus.DONE
                        ? stats.done
                        : stats.refused}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Search */}
        <FilterBar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder='Rechercher par hôte, email ou hébergement…'
        />

        {/* Data table */}
        <DataTable<PayRequest>
          columns={columns}
          rows={filteredRequests}
          getRowId={r => r.id}
          loading={loading}
          sort={sort}
          onSortChange={setSort}
          rowActions={request => (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => handleViewDetails(request.id)}
              className='gap-1 text-slate-600 hover:text-slate-900'
            >
              <Eye className='h-4 w-4' />
              Détails
            </Button>
          )}
          emptyState={{
            icon: Wallet,
            title: 'Aucune demande de paiement',
            subtitle:
              searchValue || statusFilter !== 'ALL'
                ? 'Essayez d’ajuster vos filtres.'
                : 'Aucune demande n’a encore été créée.',
          }}
        />
      </motion.div>
    </div>
  )
}
