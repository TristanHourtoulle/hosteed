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
import { Loader2, Trash2, AlertTriangle, Package, CalendarDays } from 'lucide-react'

interface ActiveRent {
  id: string
  status: string
  arrivingDate: string
  leavingDate: string
  product: { id: string; name: string }
  user?: { id: string; name: string | null; email: string }
}

interface DeletionInfo {
  user: { id: string; name: string | null; lastname: string | null; email: string }
  ownedProductCount: number
  rentCount: number
  activeRentsAsGuest: ActiveRent[]
  activeRentsAsHost: ActiveRent[]
  hasActiveReservations: boolean
}

interface ConfirmDeleteUserDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  deletionInfo: DeletionInfo | null
  isLoading: boolean
}

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    WAITING: 'En attente',
    RESERVED: 'Reservee',
    CHECKIN: 'Check-in',
  }
  return labels[status] || status
}

export function ConfirmDeleteUserDialog({
  open,
  onClose,
  onConfirm,
  deletionInfo,
  isLoading,
}: ConfirmDeleteUserDialogProps) {
  if (!deletionInfo) return null

  const { user, ownedProductCount, rentCount, activeRentsAsGuest, activeRentsAsHost, hasActiveReservations } = deletionInfo
  const displayName = [user.name, user.lastname].filter(Boolean).join(' ') || user.email

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[520px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5 text-red-600' />
            Supprimer l&apos;utilisateur
          </DialogTitle>
          <DialogDescription>
            {hasActiveReservations
              ? `Impossible de supprimer "${displayName}" car il a des reservations actives.`
              : `Etes-vous sur de vouloir supprimer definitivement "${displayName}" ? Cette action est irreversible.`}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-2'>
          <div className='flex gap-4 text-sm text-gray-600'>
            <div className='flex items-center gap-1.5'>
              <Package className='h-4 w-4' />
              <span>{ownedProductCount} hebergement{ownedProductCount > 1 ? 's' : ''}</span>
            </div>
            <div className='flex items-center gap-1.5'>
              <CalendarDays className='h-4 w-4' />
              <span>{rentCount} reservation{rentCount > 1 ? 's' : ''} (total)</span>
            </div>
          </div>

          {hasActiveReservations && (
            <div className='space-y-3'>
              {activeRentsAsGuest.length > 0 && (
                <div>
                  <p className='text-sm font-medium text-gray-900 mb-2'>
                    Reservations actives (en tant que voyageur) :
                  </p>
                  <ul className='space-y-1.5'>
                    {activeRentsAsGuest.map(rent => (
                      <li
                        key={rent.id}
                        className='text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2'
                      >
                        <span className='font-medium'>{rent.product.name}</span>
                        <span className='text-gray-500'>
                          {' '}&mdash; {formatStatus(rent.status)} &mdash;{' '}
                          {new Date(rent.arrivingDate).toLocaleDateString('fr-FR')} au{' '}
                          {new Date(rent.leavingDate).toLocaleDateString('fr-FR')}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {activeRentsAsHost.length > 0 && (
                <div>
                  <p className='text-sm font-medium text-gray-900 mb-2'>
                    Reservations actives (en tant qu&apos;hote) :
                  </p>
                  <ul className='space-y-1.5'>
                    {activeRentsAsHost.map(rent => (
                      <li
                        key={rent.id}
                        className='text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2'
                      >
                        <span className='font-medium'>{rent.product.name}</span>
                        <span className='text-gray-500'>
                          {' '}&mdash; {formatStatus(rent.status)} &mdash;{' '}
                          {new Date(rent.arrivingDate).toLocaleDateString('fr-FR')} au{' '}
                          {new Date(rent.leavingDate).toLocaleDateString('fr-FR')}
                          {rent.user && ` (${rent.user.name || rent.user.email})`}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {!hasActiveReservations && ownedProductCount > 0 && (
            <p className='text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2'>
              Attention : les {ownedProductCount} hebergement{ownedProductCount > 1 ? 's' : ''} de
              cet utilisateur seront egalement supprimes.
            </p>
          )}
        </div>

        <DialogFooter className='gap-2'>
          <Button variant='outline' onClick={onClose} disabled={isLoading}>
            {hasActiveReservations ? 'Fermer' : 'Annuler'}
          </Button>
          {!hasActiveReservations && (
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
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
