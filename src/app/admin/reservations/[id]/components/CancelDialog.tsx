'use client'

import { Button } from '@/components/ui/shadcnui/button'
import { Textarea } from '@/components/ui/shadcnui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
} from '@/shadcnui'
import { XCircle, Loader2, AlertTriangle } from 'lucide-react'

interface CancelDialogProps {
  open: boolean
  status: string
  reason: string
  isPending: boolean
  onReasonChange: (reason: string) => void
  onConfirm: () => void
  onClose: () => void
}

export function CancelDialog({
  open,
  status,
  reason,
  isPending,
  onReasonChange,
  onConfirm,
  onClose,
}: CancelDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
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
              value={reason}
              onChange={e => onReasonChange(e.target.value)}
              className='rounded-xl'
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant='outline'
            onClick={onClose}
            disabled={isPending}
            className='rounded-xl'
          >
            Retour
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending}
            className='bg-red-600 hover:bg-red-700 text-white rounded-xl'
          >
            {isPending ? (
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
  )
}
