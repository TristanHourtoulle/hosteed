'use client'

import { RentStatus } from '@prisma/client'
import { RentWithDates } from '@/lib/services/rents.service'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { Button } from '@/components/ui/shadcnui/button'
import {
  CheckCircle,
  XCircle,
  LogIn,
  LogOut,
  ArrowRight,
  Loader2,
} from 'lucide-react'

interface ActionButtonsProps {
  rent: RentWithDates
  updating: boolean
  onStatusChange: (status: RentStatus) => void
  onApproveReservation: () => void
  onShowRejectModal: () => void
}

interface ActionConfig {
  key: string
  label: string
  description: string
  consequence: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  onClick: () => void
}

export function ActionButtons({
  rent,
  updating,
  onStatusChange,
  onApproveReservation,
  onShowRejectModal,
}: ActionButtonsProps) {
  const isTerminal = rent.status === RentStatus.CHECKOUT || rent.status === RentStatus.CANCEL

  if (isTerminal) {
    return (
      <div className='rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-500 text-center'>
        {rent.status === RentStatus.CHECKOUT
          ? 'Séjour terminé — aucune action disponible.'
          : 'Réservation annulée — aucune action disponible.'}
      </div>
    )
  }

  const actions: ActionConfig[] = []

  switch (rent.status) {
    case RentStatus.WAITING:
      actions.push({
        key: 'approve',
        label: 'Accepter la réservation',
        description: 'Confirme la réservation auprès du voyageur.',
        consequence: 'Le paiement sera capturé et le voyageur sera notifié.',
        icon: CheckCircle,
        color: 'bg-green-600',
        onClick: onApproveReservation,
      })
      actions.push({
        key: 'reject',
        label: 'Refuser la réservation',
        description: 'Refuse la demande de réservation.',
        consequence: "L'autorisation de paiement sera relâchée. Les administrateurs seront notifiés.",
        icon: XCircle,
        color: 'bg-red-100 text-red-600',
        onClick: onShowRejectModal,
      })
      break

    case RentStatus.RESERVED:
      actions.push({
        key: 'checkin',
        label: 'Enregistrer le check-in',
        description: "Le voyageur est arrivé sur le lieu d'hébergement.",
        consequence: 'Le séjour est officiellement en cours.',
        icon: LogIn,
        color: 'bg-blue-600',
        onClick: () => onStatusChange(RentStatus.CHECKIN),
      })
      break

    case RentStatus.CHECKIN:
      actions.push({
        key: 'checkout',
        label: 'Enregistrer le check-out',
        description: "Le voyageur a quitté le lieu d'hébergement.",
        consequence: "Le séjour est terminé. Les fonds seront libérés vers l'hôte.",
        icon: LogOut,
        color: 'bg-gray-600',
        onClick: () => onStatusChange(RentStatus.CHECKOUT),
      })
      break
  }

  return (
    <div className='space-y-3'>
      {actions.map(action => {
        const Icon = action.icon
        const isReject = action.key === 'reject'

        return (
          <Card
            key={action.key}
            className={`border ${isReject ? 'border-red-200' : 'border-gray-200'} rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow`}
            onClick={updating ? undefined : action.onClick}
          >
            <CardContent className='p-4 flex items-center gap-4'>
              <div
                className={`rounded-xl p-3 flex-shrink-0 ${
                  isReject ? 'bg-red-100 text-red-600' : `${action.color} text-white`
                }`}
              >
                {updating ? (
                  <Loader2 className='h-5 w-5 animate-spin' />
                ) : (
                  <Icon className='h-5 w-5' />
                )}
              </div>
              <div className='flex-1 min-w-0'>
                <p className={`font-semibold ${isReject ? 'text-red-700' : 'text-gray-900'}`}>
                  {action.label}
                </p>
                <p className={`text-sm ${isReject ? 'text-red-500' : 'text-gray-500'}`}>
                  {action.description}
                </p>
              </div>
              <ArrowRight
                className={`h-5 w-5 flex-shrink-0 ${isReject ? 'text-red-300' : 'text-gray-300'}`}
              />
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
