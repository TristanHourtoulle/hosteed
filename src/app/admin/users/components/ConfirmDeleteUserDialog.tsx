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
import {
  Loader2,
  Trash2,
  AlertTriangle,
  Package,
  CalendarDays,
  ShieldAlert,
  CalendarClock,
} from 'lucide-react'

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
    RESERVED: 'Réservée',
    CHECKIN: 'Check-in',
    CHECKOUT: 'Check-out',
    CANCEL: 'Annulée',
  }
  return labels[status] || status
}

function ActiveRentRow({ rent, showGuest }: { rent: ActiveRent; showGuest?: boolean }) {
  return (
    <li className='flex items-start gap-3 rounded-xl border border-red-100 bg-red-50/60 p-3'>
      <div className='mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-red-600 shadow-sm'>
        <CalendarClock className='h-3.5 w-3.5' />
      </div>
      <div className='min-w-0 flex-1'>
        <p className='truncate text-sm font-semibold text-slate-900'>{rent.product.name}</p>
        <p className='text-xs text-slate-600'>
          {formatStatus(rent.status)} · {new Date(rent.arrivingDate).toLocaleDateString('fr-FR')}{' '}
          → {new Date(rent.leavingDate).toLocaleDateString('fr-FR')}
          {showGuest && rent.user && ` · ${rent.user.name || rent.user.email}`}
        </p>
      </div>
    </li>
  )
}

export function ConfirmDeleteUserDialog({
  open,
  onClose,
  onConfirm,
  deletionInfo,
  isLoading,
}: ConfirmDeleteUserDialogProps) {
  if (!deletionInfo) return null

  const {
    user,
    ownedProductCount,
    rentCount,
    activeRentsAsGuest,
    activeRentsAsHost,
    hasActiveReservations,
  } = deletionInfo
  const displayName = [user.name, user.lastname].filter(Boolean).join(' ') || user.email

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[560px]'>
        <DialogHeader>
          <div className='flex items-start gap-3'>
            <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100'>
              <AlertTriangle className='h-5 w-5' />
            </div>
            <div className='min-w-0 flex-1 space-y-1'>
              <DialogTitle className='text-lg'>
                {hasActiveReservations
                  ? 'Suppression impossible'
                  : "Supprimer l'utilisateur"}
              </DialogTitle>
              <DialogDescription className='text-sm text-slate-600'>
                {hasActiveReservations ? (
                  <>
                    <span className='font-semibold text-slate-900'>{displayName}</span> a des
                    réservations actives et ne peut pas être supprimé pour le moment.
                  </>
                ) : (
                  <>
                    Cette action supprimera définitivement{' '}
                    <span className='font-semibold text-slate-900'>{displayName}</span> et toutes
                    ses données associées. Elle est <strong>irréversible</strong>.
                  </>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Impact summary */}
        <div className='space-y-4 py-2'>
          <div className='grid grid-cols-2 gap-3'>
            <div className='flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5'>
              <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600'>
                <Package className='h-4 w-4' />
              </div>
              <div className='min-w-0'>
                <p className='text-xs text-slate-500'>Hébergements</p>
                <p className='text-sm font-semibold text-slate-900'>
                  {ownedProductCount} possédé{ownedProductCount > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className='flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5'>
              <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600'>
                <CalendarDays className='h-4 w-4' />
              </div>
              <div className='min-w-0'>
                <p className='text-xs text-slate-500'>Réservations</p>
                <p className='text-sm font-semibold text-slate-900'>
                  {rentCount} au total
                </p>
              </div>
            </div>
          </div>

          {hasActiveReservations && (
            <div className='space-y-3 rounded-xl border border-red-200 bg-red-50/40 p-4'>
              <div className='flex items-center gap-2 text-sm font-semibold text-red-700'>
                <ShieldAlert className='h-4 w-4' />
                Réservations actives bloquantes
              </div>
              {activeRentsAsGuest.length > 0 && (
                <div className='space-y-2'>
                  <p className='text-xs font-medium uppercase tracking-wide text-slate-500'>
                    En tant que voyageur ({activeRentsAsGuest.length})
                  </p>
                  <ul className='space-y-2'>
                    {activeRentsAsGuest.map(rent => (
                      <ActiveRentRow key={rent.id} rent={rent} />
                    ))}
                  </ul>
                </div>
              )}
              {activeRentsAsHost.length > 0 && (
                <div className='space-y-2'>
                  <p className='text-xs font-medium uppercase tracking-wide text-slate-500'>
                    En tant qu’hôte ({activeRentsAsHost.length})
                  </p>
                  <ul className='space-y-2'>
                    {activeRentsAsHost.map(rent => (
                      <ActiveRentRow key={rent.id} rent={rent} showGuest />
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {!hasActiveReservations && ownedProductCount > 0 && (
            <div className='flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-sm'>
              <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0 text-amber-600' />
              <p className='text-amber-800'>
                Les <strong>{ownedProductCount}</strong> hébergement
                {ownedProductCount > 1 ? 's' : ''} de cet utilisateur seront également supprimé
                {ownedProductCount > 1 ? 's' : ''}.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className='gap-2'>
          <Button variant='outline' onClick={onClose} disabled={isLoading}>
            {hasActiveReservations ? 'Fermer' : 'Annuler'}
          </Button>
          {!hasActiveReservations && (
            <Button
              variant='destructive'
              onClick={onConfirm}
              disabled={isLoading}
              className='gap-2'
            >
              {isLoading ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Suppression…
                </>
              ) : (
                <>
                  <Trash2 className='h-4 w-4' />
                  Supprimer définitivement
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
