'use client'

import { Button } from '@/components/ui/shadcnui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shadcnui'
import { CheckCircle, Loader2, AlertTriangle } from 'lucide-react'
import { ActionConfig } from '@/lib/constants/reservation'

interface ConfirmActionDialogProps {
  action: ActionConfig | null
  isPending: boolean
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmActionDialog({ action, isPending, onConfirm, onClose }: ConfirmActionDialogProps) {
  return (
    <Dialog open={!!action} onOpenChange={open => !open && onClose()}>
      <DialogContent className='sm:max-w-md rounded-2xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-xl'>
            {action && <action.icon className='h-5 w-5 text-blue-600' />}
            Confirmer l&apos;action
          </DialogTitle>
          <DialogDescription className='text-left'>
            {action?.description}
          </DialogDescription>
        </DialogHeader>
        <div className='py-4'>
          <div className='flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-3'>
            <AlertTriangle className='h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5' />
            <div className='text-sm'>
              <p className='font-medium text-amber-800'>Conséquence</p>
              <p className='text-amber-700'>{action?.consequence}</p>
            </div>
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
            className={`${action?.color} ${action?.hoverColor} text-white rounded-xl`}
          >
            {isPending ? (
              <Loader2 className='h-4 w-4 mr-2 animate-spin' />
            ) : (
              <CheckCircle className='h-4 w-4 mr-2' />
            )}
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
