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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcnui/select'
import { Banknote, Loader2, AlertTriangle } from 'lucide-react'
import { PaymentMethod } from '@prisma/client'
import { TransferConfig, PAYMENT_METHODS } from '@/lib/constants/reservation'
import { formatCurrencySafe } from '@/lib/utils/formatNumber'

interface TransferDialogProps {
  transfer: TransferConfig | null
  hostAmount: number | null
  method: PaymentMethod
  notes: string
  isPending: boolean
  onMethodChange: (method: PaymentMethod) => void
  onNotesChange: (notes: string) => void
  onConfirm: () => void
  onClose: () => void
}

export function TransferDialog({
  transfer,
  hostAmount,
  method,
  notes,
  isPending,
  onMethodChange,
  onNotesChange,
  onConfirm,
  onClose,
}: TransferDialogProps) {
  return (
    <Dialog open={!!transfer} onOpenChange={open => !open && onClose()}>
      <DialogContent className='sm:max-w-md rounded-2xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-xl'>
            <Banknote className='h-5 w-5 text-blue-600' />
            {transfer?.label}
          </DialogTitle>
          <DialogDescription className='text-left'>
            {transfer?.description}
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-3'>
            <AlertTriangle className='h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5' />
            <div className='text-sm'>
              <p className='font-medium text-amber-800'>Conséquence</p>
              <p className='text-amber-700'>{transfer?.consequence}</p>
            </div>
          </div>

          {hostAmount !== null && transfer && (
            <div className='rounded-xl bg-blue-50 border border-blue-100 p-4 text-center'>
              <p className='text-xs text-blue-500 mb-1'>Montant à transférer</p>
              <p className='text-2xl font-bold text-blue-700'>
                {formatCurrencySafe(transfer.amount(hostAmount))}
              </p>
            </div>
          )}

          <div className='space-y-2'>
            <Label htmlFor='transferMethod'>Méthode de paiement</Label>
            <Select
              value={method}
              onValueChange={v => onMethodChange(v as PaymentMethod)}
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
              value={notes}
              onChange={e => onNotesChange(e.target.value)}
              className='rounded-xl'
              rows={2}
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
            className={`${transfer?.color} ${transfer?.hoverColor} text-white rounded-xl`}
          >
            {isPending ? (
              <Loader2 className='h-4 w-4 mr-2 animate-spin' />
            ) : (
              <Banknote className='h-4 w-4 mr-2' />
            )}
            Confirmer le transfert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
