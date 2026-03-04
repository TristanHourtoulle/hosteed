'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcnui/dialog'
import { Button } from '@/components/ui/shadcnui/button'
import { Loader2, Trash2, AlertTriangle } from 'lucide-react'

interface ConfirmBulkDeleteDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  count: number
  isLoading: boolean
}

/**
 * Confirmation dialog for bulk deleting multiple products.
 * Displays the count of products to delete and a warning before proceeding.
 */
export function ConfirmBulkDeleteDialog({
  open,
  onClose,
  onConfirm,
  count,
  isLoading,
}: ConfirmBulkDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[450px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5 text-red-600' />
            Supprimer {count} hébergement{count > 1 ? 's' : ''}
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer définitivement {count} hébergement
            {count > 1 ? 's' : ''} ? Cette action est irréversible. Les produits avec des
            réservations actives seront ignorés.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className='gap-2'>
          <Button variant='outline' onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button variant='destructive' onClick={onConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className='h-4 w-4 animate-spin' />
                Suppression...
              </>
            ) : (
              <>
                <Trash2 className='h-4 w-4' />
                Supprimer ({count})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
