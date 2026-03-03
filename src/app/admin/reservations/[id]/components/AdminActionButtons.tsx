'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/shadcnui/button'
import { Textarea } from '@/components/ui/shadcnui/textarea'
import { useAdminReservationStatusChange } from '@/hooks/useAdminReservationMutations'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcnui/select'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import {
  CheckCircle,
  LogIn,
  LogOut,
  XCircle,
  Loader2,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  Banknote,
} from 'lucide-react'
import { createPayRequest } from '@/lib/services/payment.service'
import { PaymentStatus, PaymentMethod } from '@prisma/client'
import { toast } from 'sonner'

interface AdminActionButtonsProps {
  rentId: string
  status: string
  payment: string
  hostId: string
  hostAmount: number | null
  hasContract: boolean
  onStatusChanged?: () => void
}

interface ActionConfig {
  newStatus: 'RESERVED' | 'CHECKIN' | 'CHECKOUT'
  label: string
  description: string
  consequence: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  hoverColor: string
}

const ACTIONS_BY_STATUS: Record<string, ActionConfig[]> = {
  WAITING: [
    {
      newStatus: 'RESERVED',
      label: 'Approuver et capturer le paiement',
      description: 'Confirme la réservation auprès du voyageur.',
      consequence: 'Le montant sera débité de la carte du client via Stripe.',
      icon: CreditCard,
      color: 'bg-green-600',
      hoverColor: 'hover:bg-green-700',
    },
  ],
  RESERVED: [
    {
      newStatus: 'CHECKIN',
      label: 'Enregistrer le check-in',
      description: "Le voyageur est arrivé sur le lieu d'hébergement.",
      consequence: 'Le séjour est officiellement en cours.',
      icon: LogIn,
      color: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700',
    },
  ],
  CHECKIN: [
    {
      newStatus: 'CHECKOUT',
      label: 'Enregistrer le check-out',
      description: "Le voyageur a quitté le lieu d'hébergement.",
      consequence: "Le séjour est terminé. Les fonds seront libérés vers l'hôte.",
      icon: LogOut,
      color: 'bg-gray-600',
      hoverColor: 'hover:bg-gray-700',
    },
  ],
}

interface TransferConfig {
  type: PaymentStatus
  label: string
  description: string
  consequence: string
  color: string
  hoverColor: string
  amount: (hostAmount: number) => number
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'SEPA_VIREMENT', label: 'Virement SEPA' },
  { value: 'PAYPAL', label: 'PayPal' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
  { value: 'MONEYGRAM', label: 'MoneyGram' },
  { value: 'PRIPEO', label: 'Pripeo' },
]

function getAvailableTransfers(
  payment: string,
  status: string,
  hasContract: boolean
): TransferConfig[] {
  const transfers: TransferConfig[] = []

  if (
    payment === PaymentStatus.CLIENT_PAID &&
    (status === 'RESERVED' || status === 'CHECKIN' || status === 'CHECKOUT' || hasContract)
  ) {
    transfers.push({
      type: PaymentStatus.MID_TRANSFER_REQ,
      label: 'Verser 50% à l\u2019hôte',
      description: 'Déclenche un versement de la moitié du montant dû à l\u2019hôte.',
      consequence: 'L\u2019hôte recevra 50% du montant (hors commission) via la méthode choisie.',
      color: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700',
      amount: (h: number) => h / 2,
    })
    transfers.push({
      type: PaymentStatus.FULL_TRANSFER_REQ,
      label: 'Verser 100% à l\u2019hôte',
      description: 'Déclenche un versement intégral du montant dû à l\u2019hôte.',
      consequence: 'L\u2019hôte recevra la totalité du montant (hors commission) via la méthode choisie.',
      color: 'bg-emerald-600',
      hoverColor: 'hover:bg-emerald-700',
      amount: (h: number) => h,
    })
  }

  if (payment === PaymentStatus.MID_TRANSFER_DONE) {
    transfers.push({
      type: PaymentStatus.REST_TRANSFER_REQ,
      label: 'Verser le solde restant à l\u2019hôte',
      description: 'Déclenche le versement du solde restant (50%) à l\u2019hôte.',
      consequence: 'L\u2019hôte recevra le reste du montant dû via la méthode choisie.',
      color: 'bg-orange-600',
      hoverColor: 'hover:bg-orange-700',
      amount: (h: number) => h / 2,
    })
  }

  return transfers
}

function formatTransferAmount(amount: number | null | undefined) {
  if (amount === null || amount === undefined) return '-'
  return amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

export function AdminActionButtons({
  rentId,
  status,
  payment,
  hostId,
  hostAmount,
  hasContract,
  onStatusChanged,
}: AdminActionButtonsProps) {
  const mutation = useAdminReservationStatusChange()
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [confirmAction, setConfirmAction] = useState<ActionConfig | null>(null)
  const [transferAction, setTransferAction] = useState<TransferConfig | null>(null)
  const [transferMethod, setTransferMethod] = useState<PaymentMethod>('SEPA_VIREMENT')
  const [transferNotes, setTransferNotes] = useState('')
  const [transferPending, setTransferPending] = useState(false)

  const isTerminal = status === 'CHECKOUT' || status === 'CANCEL'
  const transfers = getAvailableTransfers(payment, status, hasContract)
  const isPendingTransfer =
    payment === PaymentStatus.MID_TRANSFER_REQ ||
    payment === PaymentStatus.REST_TRANSFER_REQ ||
    payment === PaymentStatus.FULL_TRANSFER_REQ

  if (isTerminal && transfers.length === 0 && !isPendingTransfer) {
    return (
      <div className='rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-500 text-center'>
        {status === 'CHECKOUT'
          ? 'Séjour terminé — aucune action disponible.'
          : 'Réservation annulée — aucune action disponible.'}
      </div>
    )
  }

  const actions = ACTIONS_BY_STATUS[status] || []

  const handleConfirmAction = () => {
    if (!confirmAction) return
    mutation.mutate(
      { rentId, status: confirmAction.newStatus },
      {
        onSuccess: () => {
          setConfirmAction(null)
          onStatusChanged?.()
        },
      }
    )
  }

  const handleConfirmCancel = () => {
    mutation.mutate(
      { rentId, status: 'CANCEL', reason: cancelReason || undefined },
      {
        onSuccess: () => {
          setCancelDialogOpen(false)
          setCancelReason('')
          onStatusChanged?.()
        },
      }
    )
  }

  const handleConfirmTransfer = async () => {
    if (!transferAction) return
    setTransferPending(true)
    try {
      const result = await createPayRequest(rentId, transferAction.type, hostId, transferNotes, transferMethod)
      if (!result.success) {
        toast.error(result.error || 'Erreur lors de la création de la demande de transfert')
        return
      }
      toast.success('Demande de transfert créée avec succès')
      setTransferAction(null)
      setTransferNotes('')
      setTransferMethod('SEPA_VIREMENT')
      onStatusChanged?.()
    } catch (err) {
      toast.error('Erreur lors de la création de la demande de transfert')
    } finally {
      setTransferPending(false)
    }
  }

  return (
    <div className='space-y-3'>
      {actions.map(action => {
        const Icon = action.icon
        return (
          <Card
            key={action.newStatus}
            className='border border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow'
            onClick={() => setConfirmAction(action)}
          >
            <CardContent className='p-4 flex items-center gap-4'>
              <div className={`rounded-xl p-3 ${action.color} text-white flex-shrink-0`}>
                <Icon className='h-5 w-5' />
              </div>
              <div className='flex-1 min-w-0'>
                <p className='font-semibold text-gray-900'>{action.label}</p>
                <p className='text-sm text-gray-500'>{action.description}</p>
              </div>
              <ArrowRight className='h-5 w-5 text-gray-300 flex-shrink-0' />
            </CardContent>
          </Card>
        )
      })}

      <Card
        className='border border-red-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow'
        onClick={() => {
          setCancelReason('')
          setCancelDialogOpen(true)
        }}
      >
        <CardContent className='p-4 flex items-center gap-4'>
          <div className='rounded-xl p-3 bg-red-100 text-red-600 flex-shrink-0'>
            <XCircle className='h-5 w-5' />
          </div>
          <div className='flex-1 min-w-0'>
            <p className='font-semibold text-red-700'>Annuler la réservation</p>
            <p className='text-sm text-red-500'>
              {status === 'WAITING'
                ? "L'autorisation Stripe sera relâchée (pas de débit)."
                : 'Le client sera remboursé automatiquement via Stripe.'}
            </p>
          </div>
          <ArrowRight className='h-5 w-5 text-red-300 flex-shrink-0' />
        </CardContent>
      </Card>

      {/* Transfer actions */}
      {transfers.length > 0 && (
        <>
          <div className='pt-2 pb-1'>
            <p className='text-xs font-semibold text-gray-400 uppercase tracking-wider'>
              Transferts vers l&apos;hôte
            </p>
          </div>
          {transfers.map(transfer => (
            <Card
              key={transfer.type}
              className='border border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow'
              onClick={() => setTransferAction(transfer)}
            >
              <CardContent className='p-4 flex items-center gap-4'>
                <div className={`rounded-xl p-3 ${transfer.color} text-white flex-shrink-0`}>
                  <Banknote className='h-5 w-5' />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='font-semibold text-gray-900'>{transfer.label}</p>
                  <p className='text-sm text-gray-500'>{transfer.description}</p>
                  {hostAmount !== null && (
                    <p className='text-sm font-bold text-gray-700 mt-0.5'>
                      {formatTransferAmount(transfer.amount(hostAmount))}
                    </p>
                  )}
                </div>
                <ArrowRight className='h-5 w-5 text-gray-300 flex-shrink-0' />
              </CardContent>
            </Card>
          ))}
        </>
      )}

      {/* Pending transfer notice */}
      {isPendingTransfer && (
        <div className='flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-3'>
          <AlertTriangle className='h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5' />
          <div className='text-sm'>
            <p className='font-medium text-amber-800'>Demande de transfert en cours</p>
            <p className='text-amber-700'>
              Un transfert a été demandé et est en attente de traitement.
            </p>
          </div>
        </div>
      )}

      {/* Confirmation dialog for status actions */}
      <Dialog open={!!confirmAction} onOpenChange={open => !open && setConfirmAction(null)}>
        <DialogContent className='sm:max-w-md rounded-2xl'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-xl'>
              {confirmAction && <confirmAction.icon className='h-5 w-5 text-blue-600' />}
              Confirmer l&apos;action
            </DialogTitle>
            <DialogDescription className='text-left'>
              {confirmAction?.description}
            </DialogDescription>
          </DialogHeader>
          <div className='py-4'>
            <div className='flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-3'>
              <AlertTriangle className='h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5' />
              <div className='text-sm'>
                <p className='font-medium text-amber-800'>Conséquence</p>
                <p className='text-amber-700'>{confirmAction?.consequence}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setConfirmAction(null)}
              disabled={mutation.isPending}
              className='rounded-xl'
            >
              Retour
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={mutation.isPending}
              className={`${confirmAction?.color} ${confirmAction?.hoverColor} text-white rounded-xl`}
            >
              {mutation.isPending ? (
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
              ) : (
                <CheckCircle className='h-4 w-4 mr-2' />
              )}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer dialog */}
      <Dialog open={!!transferAction} onOpenChange={open => !open && setTransferAction(null)}>
        <DialogContent className='sm:max-w-md rounded-2xl'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-xl'>
              <Banknote className='h-5 w-5 text-blue-600' />
              {transferAction?.label}
            </DialogTitle>
            <DialogDescription className='text-left'>
              {transferAction?.description}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-3'>
              <AlertTriangle className='h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5' />
              <div className='text-sm'>
                <p className='font-medium text-amber-800'>Conséquence</p>
                <p className='text-amber-700'>{transferAction?.consequence}</p>
              </div>
            </div>

            {hostAmount !== null && transferAction && (
              <div className='rounded-xl bg-blue-50 border border-blue-100 p-4 text-center'>
                <p className='text-xs text-blue-500 mb-1'>Montant à transférer</p>
                <p className='text-2xl font-bold text-blue-700'>
                  {formatTransferAmount(transferAction.amount(hostAmount))}
                </p>
              </div>
            )}

            <div className='space-y-2'>
              <Label htmlFor='transferMethod'>Méthode de paiement</Label>
              <Select
                value={transferMethod}
                onValueChange={v => setTransferMethod(v as PaymentMethod)}
              >
                <SelectTrigger className='rounded-xl'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='transferNotes'>Notes (optionnel)</Label>
              <Textarea
                id='transferNotes'
                placeholder='Ex : Virement effectué par l&apos;admin pour aider l&apos;hôte...'
                value={transferNotes}
                onChange={e => setTransferNotes(e.target.value)}
                className='rounded-xl'
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setTransferAction(null)}
              disabled={transferPending}
              className='rounded-xl'
            >
              Retour
            </Button>
            <Button
              onClick={handleConfirmTransfer}
              disabled={transferPending}
              className={`${transferAction?.color} ${transferAction?.hoverColor} text-white rounded-xl`}
            >
              {transferPending ? (
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
              ) : (
                <Banknote className='h-4 w-4 mr-2' />
              )}
              Confirmer le transfert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel dialog with reason */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className='sm:max-w-md rounded-2xl'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-xl'>
              <XCircle className='h-5 w-5 text-red-600' />
              Annuler la réservation
            </DialogTitle>
            <DialogDescription className='text-left'>
              Cette action est irréversible. La réservation sera annulée définitivement.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-3'>
              <AlertTriangle className='h-5 w-5 text-red-600 flex-shrink-0 mt-0.5' />
              <div className='text-sm'>
                <p className='font-medium text-red-800'>Conséquence</p>
                <p className='text-red-700'>
                  {status === 'WAITING'
                    ? "L'autorisation de paiement sera relâchée. Aucun montant ne sera débité."
                    : 'Le paiement capturé sera remboursé intégralement au client.'}
                </p>
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='cancelReason'>Raison de l&apos;annulation (optionnel)</Label>
              <Textarea
                id='cancelReason'
                placeholder="Ex : Le voyageur a demandé l'annulation, l'hébergement n'est plus disponible..."
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
              disabled={mutation.isPending}
              className='rounded-xl'
            >
              Retour
            </Button>
            <Button
              onClick={handleConfirmCancel}
              disabled={mutation.isPending}
              className='bg-red-600 hover:bg-red-700 text-white rounded-xl'
            >
              {mutation.isPending ? (
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
  )
}
