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

interface ConfirmDeleteDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  product: { id: string; name: string } | null
  isLoading: boolean
}

/**
 * Confirmation dialog for deleting a single product.
 * Displays product name and a warning before proceeding.
 */
export function ConfirmDeleteDialog({
  open,
  onClose,
  onConfirm,
  product,
  isLoading,
}: ConfirmDeleteDialogProps) {
  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[450px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5 text-red-600' />
            Supprimer l&apos;hébergement
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer définitivement &quot;{product.name}&quot; ? Cette
            action est irréversible.
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
                Supprimer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
