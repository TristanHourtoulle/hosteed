'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { useAdminReservationStatusChange } from '@/hooks/useAdminReservationMutations'
import {
  XCircle,
  Banknote,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'
import { createPayRequest } from '@/lib/services/payment.service'
import { PaymentStatus, PaymentMethod } from '@prisma/client'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import {
  ActionConfig,
  TransferConfig,
  ACTIONS_BY_STATUS,
  getAvailableTransfers,
} from '@/lib/constants/reservation'
import { formatCurrencySafe } from '@/lib/utils/formatNumber'
import { ConfirmActionDialog } from './ConfirmActionDialog'
import { TransferDialog } from './TransferDialog'
import { CancelDialog } from './CancelDialog'

interface AdminActionButtonsProps {
  rentId: string
  status: string
  payment: string
  hostId: string
  hostAmount: number | null
  hasContract: boolean
  onStatusChanged?: () => void
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
    } catch (error) {
      logger.error({ error, rentId }, 'Error creating transfer request')
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
                      {formatCurrencySafe(transfer.amount(hostAmount))}
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

      <ConfirmActionDialog
        action={confirmAction}
        isPending={mutation.isPending}
        onConfirm={handleConfirmAction}
        onClose={() => setConfirmAction(null)}
      />

      <TransferDialog
        transfer={transferAction}
        hostAmount={hostAmount}
        method={transferMethod}
        notes={transferNotes}
        isPending={transferPending}
        onMethodChange={setTransferMethod}
        onNotesChange={setTransferNotes}
        onConfirm={handleConfirmTransfer}
        onClose={() => setTransferAction(null)}
      />

      <CancelDialog
        open={cancelDialogOpen}
        status={status}
        reason={cancelReason}
        isPending={mutation.isPending}
        onReasonChange={setCancelReason}
        onConfirm={handleConfirmCancel}
        onClose={() => setCancelDialogOpen(false)}
      />
    </div>
  )
}
