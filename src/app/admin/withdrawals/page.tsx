'use client'

/**
 * Admin page — Withdrawal requests management.
 *
 * Allows ADMIN and HOST_MANAGER to:
 *  - View all withdrawal requests with filters
 *  - Approve / reject pending requests
 *  - Mark approved requests as paid
 *  - Validate payment accounts
 *  - Create a new withdrawal request on behalf of a host
 */

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import {
  WithdrawalStatus,
  PaymentMethod,
  type WithdrawalRequest as PrismaWithdrawalRequest,
  type PaymentAccount,
} from '@prisma/client'

import { Button } from '@/components/ui/shadcnui/button'
import { Input } from '@/components/ui/shadcnui/input'
import { Label } from '@/components/ui/shadcnui/label'
import { Textarea } from '@/components/ui/shadcnui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcnui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcnui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/shadcnui/dropdown-menu'
import {
  Wallet,
  Clock,
  CheckCircle2,
  Banknote,
  XCircle,
  ShieldCheck,
  Shield,
  MoreHorizontal,
  Loader2,
  UserPlus,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react'

import { PageHeader } from '@/components/admin/ui/PageHeader'
import { KpiCard, KpiMetric } from '@/components/admin/ui/KpiCard'
import { FilterBar } from '@/components/admin/ui/FilterBar'
import {
  DataTable,
  type DataTableColumn,
  type DataTableSort,
} from '@/components/admin/ui/DataTable'

type WithdrawalRequest = PrismaWithdrawalRequest & {
  user: { id: string; name: string | null; email: string }
  paymentAccount: PaymentAccount | null
  processor: { id: string; name: string | null; email: string } | null
}

type Host = {
  id: string
  name: string | null
  email: string
  roles: string
  createdAt: Date
}

type HostBalance = {
  totalEarned: number
  totalWithdrawn: number
  availableBalance: number
  amount50Percent: number
  amount100Percent: number
}

const STATUS_CONFIG: Record<
  WithdrawalStatus,
  { label: string; tone: string; icon: React.ComponentType<{ className?: string }> }
> = {
  PENDING: { label: 'En attente', tone: 'bg-amber-50 text-amber-700 ring-amber-200', icon: Clock },
  ACCOUNT_VALIDATION: {
    label: 'Validation compte',
    tone: 'bg-orange-50 text-orange-700 ring-orange-200',
    icon: ShieldAlert,
  },
  APPROVED: {
    label: 'Approuvée',
    tone: 'bg-blue-50 text-blue-700 ring-blue-200',
    icon: CheckCircle2,
  },
  PAID: { label: 'Payée', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200', icon: Banknote },
  REJECTED: { label: 'Rejetée', tone: 'bg-red-50 text-red-700 ring-red-200', icon: XCircle },
  CANCELLED: {
    label: 'Annulée',
    tone: 'bg-slate-100 text-slate-700 ring-slate-200',
    icon: XCircle,
  },
}

const STATUS_FILTERS: Array<{
  value: WithdrawalStatus | 'ALL'
  label: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { value: 'ALL', label: 'Toutes', icon: Wallet },
  { value: 'PENDING', label: 'En attente', icon: Clock },
  { value: 'ACCOUNT_VALIDATION', label: 'Validation compte', icon: ShieldAlert },
  { value: 'APPROVED', label: 'Approuvées', icon: CheckCircle2 },
  { value: 'PAID', label: 'Payées', icon: Banknote },
  { value: 'REJECTED', label: 'Rejetées', icon: XCircle },
]

const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  SEPA_VIREMENT: 'SEPA',
  PRIPEO: 'Pripeo',
  MOBILE_MONEY: 'Mobile Money',
  PAYPAL: 'PayPal',
  MONEYGRAM: 'MoneyGram',
  TAPTAP: 'TapTap',
  INTERNATIONAL: 'International',
  OTHER: 'Autre',
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(amount)
}

function StatusPill({ status }: { status: WithdrawalStatus }) {
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

export default function AdminWithdrawalsPage() {
  const {
    session,
    isLoading: isAuthLoading,
    isAuthenticated,
  } = useAuth({ required: true, redirectTo: '/auth' })
  const router = useRouter()

  const [requests, setRequests] = useState<WithdrawalRequest[]>([])
  const [hosts, setHosts] = useState<Host[]>([])
  const [loading, setLoading] = useState(true)
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<WithdrawalStatus | 'ALL'>('ALL')
  const [sort, setSort] = useState<DataTableSort | null>({ key: 'createdAt', direction: 'desc' })

  // Create-withdrawal modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedHost, setSelectedHost] = useState<string>('')
  const [hostBalance, setHostBalance] = useState<HostBalance | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: '',
    withdrawalType: 'PARTIAL_50' as 'PARTIAL_50' | 'FULL_100',
    paymentMethod: 'SEPA_VIREMENT' as PaymentMethod,
    notes: '',
  })
  const [paymentDetails, setPaymentDetails] = useState({
    accountHolderName: '',
    iban: '',
    cardNumber: '',
    cardEmail: '',
    mobileNumber: '',
    paypalUsername: '',
    paypalEmail: '',
    paypalPhone: '',
    paypalIban: '',
    moneygramFullName: '',
    moneygramPhone: '',
  })

  const canManage =
    session?.user.roles && ['ADMIN', 'HOST_MANAGER'].includes(session.user.roles as string)

  useEffect(() => {
    if (isAuthenticated && !canManage) {
      toast.error('Accès non autorisé')
      router.push('/')
    }
  }, [isAuthenticated, canManage, router])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const url =
        statusFilter === 'ALL'
          ? '/api/admin/withdrawals'
          : `/api/admin/withdrawals?status=${statusFilter}`
      const response = await fetch(url, { cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests)
      } else {
        toast.error('Erreur lors du chargement des demandes')
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
      toast.error('Erreur lors du chargement des demandes')
    } finally {
      setLoading(false)
    }
  }

  const fetchHosts = async () => {
    try {
      const response = await fetch('/api/admin/hosts', { cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        setHosts(data.hosts)
      }
    } catch (error) {
      console.error('Error fetching hosts:', error)
    }
  }

  const fetchHostBalance = async (hostId: string) => {
    try {
      const response = await fetch(`/api/admin/withdrawals/balance/${hostId}`, {
        cache: 'no-store',
      })
      if (response.ok) {
        const data = await response.json()
        setHostBalance(data)
      }
    } catch (error) {
      console.error('Error fetching host balance:', error)
      toast.error('Erreur lors du chargement du solde')
    }
  }

  useEffect(() => {
    if (canManage) {
      fetchRequests()
      fetchHosts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage, statusFilter])

  useEffect(() => {
    if (selectedHost) {
      fetchHostBalance(selectedHost)
    } else {
      setHostBalance(null)
    }
  }, [selectedHost])

  const handleApprove = async (requestId: string) => {
    if (!confirm('Approuver cette demande de retrait ?')) return
    try {
      const response = await fetch(`/api/admin/withdrawals/${requestId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes: 'Approuvé' }),
      })
      if (response.ok) {
        toast.success('Demande approuvée')
        await fetchRequests()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erreur lors de l'approbation")
      }
    } catch {
      toast.error("Erreur lors de l'approbation")
    }
  }

  const handleReject = async (requestId: string) => {
    const reason = prompt('Raison du refus :')
    if (!reason) return
    try {
      const response = await fetch(`/api/admin/withdrawals/${requestId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason: reason }),
      })
      if (response.ok) {
        toast.success('Demande rejetée')
        await fetchRequests()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors du refus')
      }
    } catch {
      toast.error('Erreur lors du refus')
    }
  }

  const handleMarkPaid = async (requestId: string) => {
    if (!confirm('Marquer cette demande comme payée ?')) return
    try {
      const response = await fetch(`/api/admin/withdrawals/${requestId}/mark-paid`, {
        method: 'PUT',
      })
      if (response.ok) {
        toast.success('Demande marquée comme payée')
        await fetchRequests()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur')
    }
  }

  const handleValidateAccount = async (accountId: string) => {
    if (!confirm('Valider ce compte de paiement ?')) return
    try {
      const response = await fetch(
        `/api/admin/withdrawals/payment-accounts/${accountId}/validate`,
        { method: 'PUT' }
      )
      if (response.ok) {
        toast.success('Compte validé')
        await fetchRequests()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur')
    }
  }

  const openCreateModal = () => {
    setSelectedHost('')
    setHostBalance(null)
    setWithdrawalForm({
      amount: '',
      withdrawalType: 'PARTIAL_50',
      paymentMethod: 'SEPA_VIREMENT',
      notes: '',
    })
    setPaymentDetails({
      accountHolderName: '',
      iban: '',
      cardNumber: '',
      cardEmail: '',
      mobileNumber: '',
      paypalUsername: '',
      paypalEmail: '',
      paypalPhone: '',
      paypalIban: '',
      moneygramFullName: '',
      moneygramPhone: '',
    })
    setShowCreateModal(true)
  }

  const handleCreateWithdrawal = async () => {
    if (!selectedHost) {
      toast.error('Veuillez sélectionner un hôte')
      return
    }
    if (!withdrawalForm.amount || parseFloat(withdrawalForm.amount) <= 0) {
      toast.error('Veuillez saisir un montant valide')
      return
    }
    if (!hostBalance || parseFloat(withdrawalForm.amount) > hostBalance.availableBalance) {
      toast.error('Le montant dépasse le solde disponible')
      return
    }
    setIsCreating(true)
    try {
      const response = await fetch('/api/admin/withdrawals/create-for-host', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostId: selectedHost,
          amount: parseFloat(withdrawalForm.amount),
          withdrawalType: withdrawalForm.withdrawalType,
          paymentMethod: withdrawalForm.paymentMethod,
          paymentDetails,
          notes: withdrawalForm.notes || `Demande créée par ${session?.user?.name || 'admin'}`,
        }),
      })
      if (response.ok) {
        toast.success('Demande de retrait créée')
        setShowCreateModal(false)
        await fetchRequests()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la création')
      }
    } catch {
      toast.error('Erreur lors de la création')
    } finally {
      setIsCreating(false)
    }
  }

  // Client-side search filter on the already-filtered requests
  const filteredRequests = useMemo(() => {
    if (!searchValue.trim()) return requests
    const q = searchValue.toLowerCase()
    return requests.filter(
      r =>
        r.user.name?.toLowerCase().includes(q) ||
        r.user.email.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
    )
  }, [requests, searchValue])

  // Stats (derived from loaded requests — this endpoint doesn't return aggregated stats)
  const stats = useMemo(() => {
    const byStatus: Record<string, number> = {
      PENDING: 0,
      ACCOUNT_VALIDATION: 0,
      APPROVED: 0,
      PAID: 0,
      REJECTED: 0,
      CANCELLED: 0,
    }
    let pendingAmount = 0
    let paidAmount = 0
    for (const r of requests) {
      byStatus[r.status] = (byStatus[r.status] || 0) + 1
      if (r.status === 'PENDING' || r.status === 'APPROVED') pendingAmount += r.amount
      if (r.status === 'PAID') paidAmount += r.amount
    }
    return { byStatus, pendingAmount, paidAmount, total: requests.length }
  }, [requests])

  const columns: DataTableColumn<WithdrawalRequest>[] = [
    {
      key: 'host',
      header: 'Hôte',
      sortable: true,
      sortAccessor: r => r.user.name || r.user.email,
      render: r => (
        <div className='min-w-0'>
          <p className='truncate text-sm font-semibold text-slate-900'>
            {r.user.name || '—'}
          </p>
          <p className='truncate text-xs text-slate-500'>{r.user.email}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Montant',
      sortable: true,
      sortAccessor: r => r.amount,
      align: 'right',
      render: r => (
        <div className='text-right'>
          <p className='text-sm font-bold tabular-nums text-slate-900'>
            {formatCurrency(r.amount)}
          </p>
          <p className='text-[10px] uppercase tracking-wide text-slate-500'>
            {r.withdrawalType === 'PARTIAL_50' ? 'Partiel 50%' : 'Complet 100%'}
          </p>
        </div>
      ),
      cellClassName: 'whitespace-nowrap',
    },
    {
      key: 'method',
      header: 'Méthode',
      render: r => (
        <div>
          <p className='text-sm text-slate-900'>{PAYMENT_METHOD_LABEL[r.paymentMethod]}</p>
          {r.paymentAccount && !r.paymentAccount.isValidated && (
            <p className='text-[10px] font-medium uppercase tracking-wide text-amber-600'>
              Non validé
            </p>
          )}
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
    {
      key: 'createdAt',
      header: 'Demandé le',
      sortable: true,
      sortAccessor: r => new Date(r.createdAt),
      render: r => (
        <p className='text-xs text-slate-500'>
          {new Date(r.createdAt).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </p>
      ),
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
          title='Gestion des retraits'
          subtitle='Approuvez, rejetez et suivez les demandes de retrait des hôtes. Vous pouvez aussi créer une demande au nom d’un hôte.'
          actions={
            <Button
              onClick={openCreateModal}
              className='gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:from-blue-700 hover:to-indigo-700'
            >
              <UserPlus className='h-4 w-4' />
              Nouvelle demande
            </Button>
          }
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
            value={stats.byStatus.PENDING ?? 0}
            hint='à traiter en priorité'
            icon={Clock}
            tone='amber'
          />
          <KpiCard
            label='Montant en attente'
            value={formatCurrency(stats.pendingAmount)}
            hint='pending + approuvées'
            icon={TrendingUp}
            tone='purple'
          />
          <KpiCard
            label='Montant payé'
            value={formatCurrency(stats.paidAmount)}
            hint='total déjà versé'
            icon={Banknote}
            tone='emerald'
          />
        </div>

        {/* Secondary metrics */}
        <div className='grid gap-3 sm:grid-cols-4'>
          <KpiMetric
            label='validation compte'
            value={stats.byStatus.ACCOUNT_VALIDATION ?? 0}
            icon={ShieldAlert}
            tone='slate'
          />
          <KpiMetric
            label='approuvées'
            value={stats.byStatus.APPROVED ?? 0}
            icon={CheckCircle2}
            tone='blue'
          />
          <KpiMetric
            label='payées'
            value={stats.byStatus.PAID ?? 0}
            icon={Banknote}
            tone='emerald'
          />
          <KpiMetric
            label='rejetées'
            value={stats.byStatus.REJECTED ?? 0}
            icon={XCircle}
            tone='red'
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
              </button>
            )
          })}
        </div>

        {/* Search */}
        <FilterBar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder='Rechercher par nom d’hôte ou email…'
        />

        {/* Data table */}
        <DataTable<WithdrawalRequest>
          columns={columns}
          rows={filteredRequests}
          getRowId={r => r.id}
          loading={loading}
          sort={sort}
          onSortChange={setSort}
          rowActions={request => {
            const canValidateAccount =
              request.status === 'ACCOUNT_VALIDATION' && request.paymentAccount
            const canApproveReject = request.status === 'PENDING'
            const canMarkPaid = request.status === 'APPROVED'

            if (!canValidateAccount && !canApproveReject && !canMarkPaid) {
              return <span className='text-xs text-slate-300'>—</span>
            }

            return (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-8 w-8 p-0'
                    aria-label='Actions retrait'
                  >
                    <MoreHorizontal className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-52'>
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {canValidateAccount && (
                    <DropdownMenuItem
                      onClick={() => handleValidateAccount(request.paymentAccount!.id)}
                      className='flex items-center gap-2 text-orange-700'
                    >
                      <ShieldCheck className='h-4 w-4' />
                      Valider le compte
                    </DropdownMenuItem>
                  )}
                  {canApproveReject && (
                    <>
                      <DropdownMenuItem
                        onClick={() => handleApprove(request.id)}
                        className='flex items-center gap-2 text-emerald-700'
                      >
                        <CheckCircle2 className='h-4 w-4' />
                        Approuver
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleReject(request.id)}
                        className='flex items-center gap-2 text-red-600 focus:text-red-600'
                      >
                        <XCircle className='h-4 w-4' />
                        Rejeter
                      </DropdownMenuItem>
                    </>
                  )}
                  {canMarkPaid && (
                    <DropdownMenuItem
                      onClick={() => handleMarkPaid(request.id)}
                      className='flex items-center gap-2 text-blue-700'
                    >
                      <Banknote className='h-4 w-4' />
                      Marquer comme payée
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )
          }}
          emptyState={{
            icon: Wallet,
            title: 'Aucune demande de retrait',
            subtitle:
              searchValue || statusFilter !== 'ALL'
                ? 'Essayez d’ajuster vos filtres.'
                : 'Aucun hôte n’a encore demandé de retrait. Vous pouvez en créer une depuis le bouton en haut.',
          }}
        />

        {/* Create withdrawal dialog */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
            <DialogHeader>
              <div className='flex items-start gap-3'>
                <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100'>
                  <UserPlus className='h-5 w-5' />
                </div>
                <div className='space-y-1'>
                  <DialogTitle className='text-lg'>Créer une demande de retrait</DialogTitle>
                  <DialogDescription className='text-sm text-slate-600'>
                    Créez une demande au nom d’un hôte. La demande sera automatiquement marquée
                    comme approuvée.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className='space-y-5 py-2'>
              {/* Host selector */}
              <div className='space-y-2'>
                <Label htmlFor='host'>Hôte *</Label>
                <Select value={selectedHost} onValueChange={setSelectedHost}>
                  <SelectTrigger id='host'>
                    <SelectValue placeholder='Choisir un hôte…' />
                  </SelectTrigger>
                  <SelectContent className='max-h-72'>
                    {hosts.map(host => (
                      <SelectItem key={host.id} value={host.id}>
                        <span className='flex flex-col'>
                          <span className='font-medium'>{host.name || host.email}</span>
                          <span className='text-xs text-slate-500'>{host.email}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Host balance info */}
              {hostBalance && (
                <div className='rounded-xl border border-blue-200 bg-blue-50/60 p-4'>
                  <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-blue-700'>
                    Solde de l’hôte
                  </p>
                  <div className='grid grid-cols-3 gap-3 text-sm'>
                    <div>
                      <p className='text-xs text-slate-600'>Total gagné</p>
                      <p className='font-bold text-slate-900 tabular-nums'>
                        {formatCurrency(hostBalance.totalEarned)}
                      </p>
                    </div>
                    <div>
                      <p className='text-xs text-slate-600'>Déjà retiré</p>
                      <p className='font-bold text-slate-900 tabular-nums'>
                        {formatCurrency(hostBalance.totalWithdrawn)}
                      </p>
                    </div>
                    <div>
                      <p className='text-xs text-slate-600'>Disponible</p>
                      <p className='font-bold text-emerald-600 tabular-nums'>
                        {formatCurrency(hostBalance.availableBalance)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Amount + type */}
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='amount'>Montant (€) *</Label>
                  <Input
                    id='amount'
                    type='number'
                    step='0.01'
                    min='0'
                    max={hostBalance?.availableBalance || 0}
                    value={withdrawalForm.amount}
                    onChange={e =>
                      setWithdrawalForm({ ...withdrawalForm, amount: e.target.value })
                    }
                    placeholder='0.00'
                  />
                  {hostBalance && (
                    <p className='text-xs text-slate-500'>
                      Max {formatCurrency(hostBalance.availableBalance)}
                    </p>
                  )}
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='type'>Type</Label>
                  <Select
                    value={withdrawalForm.withdrawalType}
                    onValueChange={value =>
                      setWithdrawalForm({
                        ...withdrawalForm,
                        withdrawalType: value as 'PARTIAL_50' | 'FULL_100',
                      })
                    }
                  >
                    <SelectTrigger id='type'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='PARTIAL_50'>Partiel 50% (selon contrat)</SelectItem>
                      <SelectItem value='FULL_100'>Complet 100%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Payment method */}
              <div className='space-y-2'>
                <Label htmlFor='paymentMethod'>Méthode de paiement *</Label>
                <Select
                  value={withdrawalForm.paymentMethod}
                  onValueChange={value =>
                    setWithdrawalForm({
                      ...withdrawalForm,
                      paymentMethod: value as PaymentMethod,
                    })
                  }
                >
                  <SelectTrigger id='paymentMethod'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[]).map(method => (
                      <SelectItem key={method} value={method}>
                        {PAYMENT_METHOD_LABEL[method]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment details — simplified: title holder + IBAN for SEPA, otherwise common fields */}
              {withdrawalForm.paymentMethod === 'SEPA_VIREMENT' && (
                <div className='grid gap-4 sm:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label htmlFor='holder'>Titulaire du compte</Label>
                    <Input
                      id='holder'
                      value={paymentDetails.accountHolderName}
                      onChange={e =>
                        setPaymentDetails({
                          ...paymentDetails,
                          accountHolderName: e.target.value,
                        })
                      }
                      placeholder='Jean Dupont'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='iban'>IBAN</Label>
                    <Input
                      id='iban'
                      value={paymentDetails.iban}
                      onChange={e =>
                        setPaymentDetails({ ...paymentDetails, iban: e.target.value })
                      }
                      placeholder='FR76…'
                    />
                  </div>
                </div>
              )}

              {(withdrawalForm.paymentMethod === 'PAYPAL' ||
                withdrawalForm.paymentMethod === 'MOBILE_MONEY' ||
                withdrawalForm.paymentMethod === 'MONEYGRAM') && (
                <div className='space-y-2'>
                  <Label htmlFor='contact'>Email / numéro de contact</Label>
                  <Input
                    id='contact'
                    value={paymentDetails.paypalEmail || paymentDetails.mobileNumber}
                    onChange={e =>
                      setPaymentDetails({
                        ...paymentDetails,
                        paypalEmail:
                          withdrawalForm.paymentMethod === 'PAYPAL'
                            ? e.target.value
                            : paymentDetails.paypalEmail,
                        mobileNumber:
                          withdrawalForm.paymentMethod !== 'PAYPAL'
                            ? e.target.value
                            : paymentDetails.mobileNumber,
                      })
                    }
                    placeholder={
                      withdrawalForm.paymentMethod === 'PAYPAL'
                        ? 'email@paypal.com'
                        : '+261 xx xx xx xx'
                    }
                  />
                </div>
              )}

              {/* Notes */}
              <div className='space-y-2'>
                <Label htmlFor='notes'>Notes (optionnel)</Label>
                <Textarea
                  id='notes'
                  rows={3}
                  value={withdrawalForm.notes}
                  onChange={e => setWithdrawalForm({ ...withdrawalForm, notes: e.target.value })}
                  placeholder='Notes internes visibles uniquement par les admins…'
                />
              </div>
            </div>

            <DialogFooter className='gap-2'>
              <Button
                variant='outline'
                onClick={() => setShowCreateModal(false)}
                disabled={isCreating}
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateWithdrawal}
                disabled={
                  isCreating ||
                  !selectedHost ||
                  !withdrawalForm.amount ||
                  parseFloat(withdrawalForm.amount) <= 0
                }
                className='gap-2 bg-blue-600 text-white hover:bg-blue-700'
              >
                {isCreating ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <ArrowRight className='h-4 w-4' />
                )}
                Créer la demande
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  )
}
