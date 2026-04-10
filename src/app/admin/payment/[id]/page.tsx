'use client'

import { useEffect, useState, use, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  getPaymentRequestById,
  approvePaymentRequest,
  rejectPaymentRequest,
  requestPaymentInfo,
} from '@/lib/services/payment.service'
import { PaymentStatus, PaymentMethod, PaymentReqStatus } from '@prisma/client'
import { formatCurrency } from '@/lib/utils/formatNumber'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { KpiCard } from '@/components/admin/ui/KpiCard'
import { Button } from '@/components/ui/shadcnui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcnui/dialog'
import {
  Shield,
  Banknote,
  Percent,
  Coins,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Loader2,
  CreditCard,
  User as UserIcon,
  Mail,
  Home,
  MapPin,
  Calendar,
  History,
  AlertTriangle,
  Wallet,
  FileText,
  Send,
} from 'lucide-react'

interface PayRequestDetails {
  id: string
  userId: string
  PaymentRequest: PaymentStatus
  prices: string
  notes: string
  method: PaymentMethod
  status: PaymentReqStatus
  createdAt: string
  updatedAt: string
  user: {
    name: string | null
    email: string
  }
  rent: {
    id: string
    product: {
      name: string
      address: string
    }
    checkIn: string
    checkOut: string
    totalPrice: number
  }
  history?: Array<{
    id: string
    action: string
    note: string
    createdAt: string
    adminUser?: {
      name: string | null
      email: string
    }
  }>
}

type ActionType = 'approve' | 'reject' | 'request_info'

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  SEPA_VIREMENT: 'Virement SEPA',
  PRIPEO: 'Pripeo',
  MOBILE_MONEY: 'Mobile Money',
  PAYPAL: 'PayPal',
  MONEYGRAM: 'MoneyGram',
  TAPTAP: 'Taptap',
  INTERNATIONAL: 'Virement International',
  OTHER: 'Autre',
}

const REQUEST_TYPE_CONFIG: Partial<
  Record<
    PaymentStatus,
    {
      label: string
      tone: string
      icon: React.ComponentType<{ className?: string }>
    }
  >
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
  {
    label: string
    tone: string
    icon: React.ComponentType<{ className?: string }>
  }
> = {
  RECEIVED: {
    label: 'En attente',
    tone: 'bg-amber-50 text-amber-700 ring-amber-200',
    icon: Clock,
  },
  DONE: {
    label: 'Terminée',
    tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    icon: CheckCircle2,
  },
  REFUSED: {
    label: 'Refusée',
    tone: 'bg-red-50 text-red-700 ring-red-200',
    icon: XCircle,
  },
}

const ACTION_CONFIG: Record<
  ActionType,
  {
    title: string
    description: string
    buttonLabel: string
    icon: React.ComponentType<{ className?: string }>
    iconBg: string
    iconText: string
    submitButtonClass: string
  }
> = {
  approve: {
    title: 'Approuver la demande',
    description:
      "Le paiement sera approuvé et l'hôte sera notifié par email.",
    buttonLabel: 'Approuver',
    icon: CheckCircle2,
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-600',
    submitButtonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  reject: {
    title: 'Refuser la demande',
    description:
      "Cette action ne peut pas être annulée. L'hôte sera notifié par email.",
    buttonLabel: 'Refuser',
    icon: XCircle,
    iconBg: 'bg-red-50',
    iconText: 'text-red-600',
    submitButtonClass: 'bg-red-600 hover:bg-red-700 text-white',
  },
  request_info: {
    title: 'Demander des informations',
    description:
      "L'hôte recevra un email avec votre demande d'informations supplémentaires.",
    buttonLabel: 'Envoyer la demande',
    icon: MessageSquare,
    iconBg: 'bg-blue-50',
    iconText: 'text-blue-600',
    submitButtonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
}

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
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ring-1 ${config.tone}`}
    >
      <Icon className='h-3.5 w-3.5' />
      {config.label}
    </span>
  )
}

const INFO_TILE_TONE: Record<
  'blue' | 'indigo' | 'emerald' | 'amber' | 'red' | 'slate',
  { bg: string; text: string }
> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
  red: { bg: 'bg-red-50', text: 'text-red-600' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-600' },
}

function InfoTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'slate',
}: {
  label: string
  value: string
  hint?: string
  icon: React.ComponentType<{ className?: string }>
  tone?: keyof typeof INFO_TILE_TONE
}) {
  const toneClass = INFO_TILE_TONE[tone]
  return (
    <div className='rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm'>
      <div className='flex items-start justify-between gap-4'>
        <div className='min-w-0 space-y-1'>
          <p className='text-sm font-medium text-slate-500'>{label}</p>
          <p
            className={`text-lg font-semibold leading-tight ${toneClass.text}`}
          >
            {value}
          </p>
          {hint && <p className='text-xs text-slate-500'>{hint}</p>}
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClass.bg} ${toneClass.text}`}
        >
          <Icon className='h-5 w-5' />
        </div>
      </div>
    </div>
  )
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <div className='rounded-2xl border border-slate-200/80 bg-white shadow-sm'>
      <div className='flex items-center gap-3 border-b border-slate-100 px-6 py-4'>
        <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600'>
          <Icon className='h-4 w-4' />
        </div>
        <h2 className='text-sm font-semibold uppercase tracking-wide text-slate-500'>
          {title}
        </h2>
      </div>
      <div className='p-6'>{children}</div>
    </div>
  )
}

function InfoRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div>
      <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>
        {label}
      </p>
      <div className='mt-1 text-sm text-slate-900'>{value}</div>
    </div>
  )
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function PaymentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [payRequest, setPayRequest] = useState<PayRequestDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [actionType, setActionType] = useState<ActionType>('approve')
  const [actionNote, setActionNote] = useState('')
  const [noteError, setNoteError] = useState<string | null>(null)

  const fetchPayRequestDetails = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getPaymentRequestById(resolvedParams.id)
      setPayRequest(result)
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error)
    } finally {
      setLoading(false)
    }
  }, [resolvedParams.id])

  useEffect(() => {
    fetchPayRequestDetails()
  }, [fetchPayRequestDetails])

  const openModal = (action: ActionType) => {
    setActionType(action)
    setActionNote('')
    setNoteError(null)
    setShowModal(true)
  }

  const closeModal = () => {
    if (updating) return
    setShowModal(false)
    setActionNote('')
    setNoteError(null)
  }

  const handleAction = async () => {
    if (!payRequest) return

    if (
      (actionType === 'reject' || actionType === 'request_info') &&
      !actionNote.trim()
    ) {
      setNoteError(
        actionType === 'reject'
          ? 'Veuillez fournir une raison pour le refus.'
          : 'Veuillez spécifier quelles informations sont nécessaires.'
      )
      return
    }

    try {
      setUpdating(true)

      if (actionType === 'approve') {
        await approvePaymentRequest(payRequest.id)
      } else if (actionType === 'reject') {
        await rejectPaymentRequest(payRequest.id, actionNote)
      } else if (actionType === 'request_info') {
        await requestPaymentInfo(payRequest.id, actionNote)
      }

      await fetchPayRequestDetails()
      setShowModal(false)
      setActionNote('')
      setNoteError(null)
    } catch (error) {
      console.error("Erreur lors de l'action:", error)
      setNoteError("Une erreur s'est produite lors du traitement de la demande.")
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/40'>
        <div className='mx-auto max-w-6xl space-y-8 p-6'>
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
          <div className='grid gap-6 lg:grid-cols-3'>
            <div className='h-96 animate-pulse rounded-2xl border border-slate-200/80 bg-white lg:col-span-2' />
            <div className='h-96 animate-pulse rounded-2xl border border-slate-200/80 bg-white' />
          </div>
        </div>
      </div>
    )
  }

  if (!payRequest) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/40'>
        <div className='mx-auto max-w-4xl space-y-8 p-6'>
          <PageHeader
            backHref='/admin/payment'
            backLabel='Retour aux demandes'
            eyebrow='Espace administrateur'
            title='Demande introuvable'
            subtitle='Cette demande de paiement n’existe pas ou a été supprimée.'
          />
          <div className='rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-sm'>
            <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600'>
              <AlertTriangle className='h-8 w-8' />
            </div>
            <h2 className='mt-4 text-lg font-bold text-slate-900'>
              Demande introuvable
            </h2>
            <p className='mt-2 text-sm text-slate-500'>
              Vérifiez l’identifiant de la demande ou revenez à la liste.
            </p>
            <Button
              onClick={() => router.push('/admin/payment')}
              className='mt-6'
            >
              Retour à la liste
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const amount = Number(payRequest.prices || 0)
  const shortId = payRequest.id.slice(-6).toUpperCase()
  const actionConfig = ACTION_CONFIG[actionType]
  const ActionIcon = actionConfig.icon
  const isPending = payRequest.status === PaymentReqStatus.RECEIVED

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/40'>
      <div className='mx-auto max-w-6xl space-y-8 p-6'>
        <PageHeader
          backHref='/admin/payment'
          backLabel='Retour aux demandes'
          eyebrow='Espace administrateur'
          eyebrowIcon={Shield}
          title={`Demande #${shortId}`}
          subtitle='Consultez les détails de la demande de paiement et validez, refusez ou demandez des informations complémentaires.'
          actions={<RequestStatusPill status={payRequest.status} />}
        />

        {/* KPI summary row */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <KpiCard
            label='Montant'
            value={formatCurrency(amount)}
            hint='à verser à l’hôte'
            icon={Wallet}
            tone='emerald'
          />
          <InfoTile
            label='Type'
            value={
              REQUEST_TYPE_CONFIG[payRequest.PaymentRequest]?.label ??
              payRequest.PaymentRequest
            }
            hint='nature du versement'
            icon={CreditCard}
            tone='blue'
          />
          <InfoTile
            label='Méthode'
            value={PAYMENT_METHOD_LABELS[payRequest.method] ?? payRequest.method}
            hint='canal de paiement'
            icon={Banknote}
            tone='indigo'
          />
          <InfoTile
            label='Statut'
            value={STATUS_CONFIG[payRequest.status].label}
            hint={isPending ? 'à traiter en priorité' : 'demande clôturée'}
            icon={STATUS_CONFIG[payRequest.status].icon}
            tone={
              payRequest.status === PaymentReqStatus.DONE
                ? 'emerald'
                : payRequest.status === PaymentReqStatus.REFUSED
                  ? 'red'
                  : 'amber'
            }
          />
        </div>

        {/* Main grid */}
        <div className='grid gap-6 lg:grid-cols-3'>
          {/* Left column */}
          <div className='space-y-6 lg:col-span-2'>
            {/* Request info */}
            <SectionCard title='Informations de la demande' icon={FileText}>
              <div className='grid gap-5 sm:grid-cols-2'>
                <InfoRow
                  label='Type de paiement'
                  value={<RequestTypePill type={payRequest.PaymentRequest} />}
                />
                <InfoRow
                  label='Montant'
                  value={
                    <span className='text-2xl font-bold tabular-nums text-emerald-600'>
                      {formatCurrency(amount)}
                    </span>
                  }
                />
                <InfoRow
                  label='Méthode de paiement'
                  value={
                    PAYMENT_METHOD_LABELS[payRequest.method] ?? payRequest.method
                  }
                />
                <InfoRow
                  label='Statut'
                  value={<RequestStatusPill status={payRequest.status} />}
                />
              </div>
              {payRequest.notes && (
                <div className='mt-6'>
                  <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>
                    Notes de l&apos;hôte
                  </p>
                  <div className='mt-2 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-700'>
                    {payRequest.notes}
                  </div>
                </div>
              )}
            </SectionCard>

            {/* Host info */}
            <SectionCard title='Hôte' icon={UserIcon}>
              <div className='flex items-start gap-4'>
                <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-lg font-bold text-white shadow-sm'>
                  {(payRequest.user.name || payRequest.user.email)
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='text-base font-semibold text-slate-900'>
                    {payRequest.user.name || 'Sans nom'}
                  </p>
                  <div className='mt-1 flex items-center gap-1.5 text-sm text-slate-600'>
                    <Mail className='h-3.5 w-3.5 text-slate-400' />
                    <a
                      href={`mailto:${payRequest.user.email}`}
                      className='hover:text-blue-600'
                    >
                      {payRequest.user.email}
                    </a>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Reservation info */}
            <SectionCard title='Réservation associée' icon={Home}>
              <div className='space-y-5'>
                <div>
                  <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>
                    Hébergement
                  </p>
                  <p className='mt-1 text-base font-semibold text-slate-900'>
                    {payRequest.rent.product.name}
                  </p>
                  <p className='mt-1 flex items-center gap-1.5 text-sm text-slate-500'>
                    <MapPin className='h-3.5 w-3.5' />
                    {payRequest.rent.product.address}
                  </p>
                </div>
                <div className='grid gap-4 sm:grid-cols-3'>
                  <div className='rounded-xl bg-slate-50 p-3'>
                    <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>
                      Arrivée
                    </p>
                    <p className='mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-900'>
                      <Calendar className='h-4 w-4 text-blue-600' />
                      {new Date(payRequest.rent.checkIn).toLocaleDateString(
                        'fr-FR',
                        { day: '2-digit', month: 'short', year: 'numeric' }
                      )}
                    </p>
                  </div>
                  <div className='rounded-xl bg-slate-50 p-3'>
                    <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>
                      Départ
                    </p>
                    <p className='mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-900'>
                      <Calendar className='h-4 w-4 text-blue-600' />
                      {new Date(payRequest.rent.checkOut).toLocaleDateString(
                        'fr-FR',
                        { day: '2-digit', month: 'short', year: 'numeric' }
                      )}
                    </p>
                  </div>
                  <div className='rounded-xl bg-slate-50 p-3'>
                    <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>
                      Prix total
                    </p>
                    <p className='mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-900'>
                      <Wallet className='h-4 w-4 text-emerald-600' />
                      {formatCurrency(payRequest.rent.totalPrice)}
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* History */}
            <SectionCard title='Historique des modifications' icon={History}>
              {payRequest.history && payRequest.history.length > 0 ? (
                <ul className='space-y-4'>
                  {payRequest.history.map(entry => (
                    <li
                      key={entry.id}
                      className='flex gap-4 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0'
                    >
                      <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600'>
                        <Clock className='h-4 w-4' />
                      </div>
                      <div className='min-w-0 flex-1'>
                        <div className='flex items-start justify-between gap-3'>
                          <p className='text-sm font-semibold text-slate-900'>
                            {entry.action}
                          </p>
                          <span className='shrink-0 text-xs text-slate-500'>
                            {formatDateTime(entry.createdAt)}
                          </span>
                        </div>
                        {entry.note && (
                          <p className='mt-1 text-sm text-slate-600'>
                            {entry.note}
                          </p>
                        )}
                        {entry.adminUser && (
                          <p className='mt-1 text-xs text-slate-500'>
                            Par {entry.adminUser.name || entry.adminUser.email}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className='flex flex-col items-center justify-center py-8 text-center'>
                  <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400'>
                    <History className='h-6 w-6' />
                  </div>
                  <p className='mt-3 text-sm text-slate-500'>
                    Aucun historique disponible pour le moment
                  </p>
                </div>
              )}
            </SectionCard>
          </div>

          {/* Right column — actions + summary */}
          <div className='space-y-6'>
            <SectionCard title='Actions' icon={CheckCircle2}>
              {isPending ? (
                <div className='space-y-3'>
                  <Button
                    onClick={() => openModal('approve')}
                    disabled={updating}
                    className='w-full justify-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700'
                  >
                    <CheckCircle2 className='h-4 w-4' />
                    Approuver la demande
                  </Button>
                  <Button
                    onClick={() => openModal('reject')}
                    disabled={updating}
                    variant='outline'
                    className='w-full justify-center gap-2 border-red-200 text-red-700 hover:bg-red-50'
                  >
                    <XCircle className='h-4 w-4' />
                    Refuser la demande
                  </Button>
                  <Button
                    onClick={() => openModal('request_info')}
                    disabled={updating}
                    variant='outline'
                    className='w-full justify-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50'
                  >
                    <MessageSquare className='h-4 w-4' />
                    Demander des infos
                  </Button>
                </div>
              ) : payRequest.status === PaymentReqStatus.DONE ? (
                <div className='rounded-xl border border-emerald-200 bg-emerald-50/60 p-4'>
                  <div className='flex items-center gap-2 text-emerald-800'>
                    <CheckCircle2 className='h-4 w-4' />
                    <span className='text-sm font-semibold'>
                      Demande approuvée
                    </span>
                  </div>
                  <p className='mt-1 text-xs text-emerald-700'>
                    Cette demande de paiement a été approuvée et traitée.
                  </p>
                </div>
              ) : (
                <div className='rounded-xl border border-red-200 bg-red-50/60 p-4'>
                  <div className='flex items-center gap-2 text-red-800'>
                    <XCircle className='h-4 w-4' />
                    <span className='text-sm font-semibold'>Demande refusée</span>
                  </div>
                  <p className='mt-1 text-xs text-red-700'>
                    Cette demande de paiement a été refusée.
                  </p>
                </div>
              )}
            </SectionCard>

            <SectionCard title='Résumé' icon={FileText}>
              <dl className='space-y-3 text-sm'>
                <div className='flex items-center justify-between'>
                  <dt className='text-slate-500'>ID demande</dt>
                  <dd className='font-mono text-xs text-slate-900'>
                    #{shortId}
                  </dd>
                </div>
                <div className='flex items-center justify-between'>
                  <dt className='text-slate-500'>Créée le</dt>
                  <dd className='font-medium text-slate-900'>
                    {payRequest.createdAt
                      ? formatDateTime(payRequest.createdAt)
                      : '—'}
                  </dd>
                </div>
                <div className='flex items-center justify-between'>
                  <dt className='text-slate-500'>Mise à jour</dt>
                  <dd className='font-medium text-slate-900'>
                    {payRequest.updatedAt
                      ? formatDateTime(payRequest.updatedAt)
                      : '—'}
                  </dd>
                </div>
              </dl>
            </SectionCard>
          </div>
        </div>
      </div>

      {/* Action modal */}
      <Dialog open={showModal} onOpenChange={open => !open && closeModal()}>
        <DialogContent className='sm:max-w-[520px]'>
          <DialogHeader>
            <div className='flex items-start gap-3'>
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-slate-100 ${actionConfig.iconBg} ${actionConfig.iconText}`}
              >
                <ActionIcon className='h-5 w-5' />
              </div>
              <div className='min-w-0 flex-1 space-y-1'>
                <DialogTitle className='text-lg'>
                  {actionConfig.title}
                </DialogTitle>
                <DialogDescription className='text-sm text-slate-600'>
                  {actionConfig.description}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className='space-y-4 py-2'>
            {/* Amount recap */}
            <div className='flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3'>
              <div className='min-w-0'>
                <p className='truncate text-sm font-semibold text-slate-900'>
                  {payRequest.user.name || payRequest.user.email}
                </p>
                <p className='truncate text-xs text-slate-500'>
                  {payRequest.rent.product.name}
                </p>
              </div>
              <p className='shrink-0 text-lg font-bold tabular-nums text-slate-900'>
                {formatCurrency(amount)}
              </p>
            </div>

            {/* Note textarea for reject / request_info */}
            {(actionType === 'reject' || actionType === 'request_info') && (
              <div>
                <label
                  htmlFor='action-note'
                  className='mb-2 block text-sm font-semibold text-slate-700'
                >
                  {actionType === 'reject'
                    ? 'Raison du refus'
                    : 'Informations demandées'}
                </label>
                <textarea
                  id='action-note'
                  value={actionNote}
                  onChange={e => {
                    setActionNote(e.target.value)
                    if (noteError) setNoteError(null)
                  }}
                  rows={4}
                  placeholder={
                    actionType === 'reject'
                      ? 'Expliquez clairement pourquoi cette demande est refusée…'
                      : 'Spécifiez quelles informations supplémentaires sont nécessaires…'
                  }
                  className='w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none ring-offset-0 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                />
                {noteError && (
                  <p className='mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600'>
                    <AlertTriangle className='h-3.5 w-3.5' />
                    {noteError}
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className='gap-2'>
            <Button
              variant='outline'
              onClick={closeModal}
              disabled={updating}
            >
              Annuler
            </Button>
            <Button
              onClick={handleAction}
              disabled={updating}
              className={`gap-2 ${actionConfig.submitButtonClass}`}
            >
              {updating ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Traitement…
                </>
              ) : (
                <>
                  {actionType === 'request_info' ? (
                    <Send className='h-4 w-4' />
                  ) : (
                    <ActionIcon className='h-4 w-4' />
                  )}
                  {actionConfig.buttonLabel}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
