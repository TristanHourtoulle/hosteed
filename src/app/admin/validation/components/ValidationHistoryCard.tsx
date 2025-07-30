'use client'

import { ProductValidation } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Calendar, FileText, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface ValidationHistoryEntry {
  id: string
  previousStatus: ProductValidation
  newStatus: ProductValidation
  reason?: string | null
  createdAt: Date
  admin?: {
    id: string
    name?: string | null
    lastname?: string | null
    email: string
  } | null
  host?: {
    id: string
    name?: string | null
    lastname?: string | null
    email: string
  } | null
}

interface ValidationHistoryCardProps {
  history: ValidationHistoryEntry[]
}

export function ValidationHistoryCard({ history }: ValidationHistoryCardProps) {
  const getStatusBadge = (status: ProductValidation) => {
    switch (status) {
      case ProductValidation.NotVerified:
        return (
          <Badge variant='secondary' className='bg-yellow-100 text-yellow-800'>
            <Clock className='h-3 w-3 mr-1' />
            En attente
          </Badge>
        )
      case ProductValidation.RecheckRequest:
        return (
          <Badge variant='secondary' className='bg-orange-100 text-orange-800'>
            <AlertTriangle className='h-3 w-3 mr-1' />
            Révision demandée
          </Badge>
        )
      case ProductValidation.Approve:
        return (
          <Badge variant='default' className='bg-green-100 text-green-800'>
            <CheckCircle className='h-3 w-3 mr-1' />
            Validé
          </Badge>
        )
      case ProductValidation.Refused:
        return (
          <Badge variant='destructive' className='bg-red-100 text-red-800'>
            <XCircle className='h-3 w-3 mr-1' />
            Refusé
          </Badge>
        )
      default:
        return <Badge variant='outline'>Inconnu</Badge>
    }
  }

  const getStatusColor = (status: ProductValidation) => {
    switch (status) {
      case ProductValidation.NotVerified:
        return 'border-l-yellow-500'
      case ProductValidation.RecheckRequest:
        return 'border-l-orange-500'
      case ProductValidation.Approve:
        return 'border-l-green-500'
      case ProductValidation.Refused:
        return 'border-l-red-500'
      default:
        return 'border-l-gray-500'
    }
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <FileText className='h-5 w-5' />
            Historique des validations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-gray-500 text-center py-8'>Aucun historique disponible</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <FileText className='h-5 w-5' />
          Historique des validations ({history.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {history.map(entry => (
            <div
              key={entry.id}
              className={`border-l-4 pl-4 pb-4 ${getStatusColor(entry.newStatus)}`}
            >
              <div className='flex items-center justify-between mb-2'>
                <div className='flex items-center gap-2'>
                  {getStatusBadge(entry.previousStatus)}
                  <span className='text-gray-400'>→</span>
                  {getStatusBadge(entry.newStatus)}
                </div>
                <div className='flex items-center gap-1 text-sm text-gray-500'>
                  <Calendar className='h-4 w-4' />
                  {format(new Date(entry.createdAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                </div>
              </div>

              {entry.reason && (
                <div className='bg-gray-50 rounded-md p-3 mb-2'>
                  <p className='text-sm text-gray-700'>{entry.reason}</p>
                </div>
              )}

              <div className='flex items-center gap-1 text-sm text-gray-600'>
                <User className='h-4 w-4' />
                <span>
                  Par{' '}
                  {entry.admin
                    ? `${entry.admin.name || ''} ${entry.admin.lastname || ''}`.trim() ||
                      entry.admin.email
                    : entry.host
                      ? `${entry.host.name || ''} ${entry.host.lastname || ''}`.trim() ||
                        entry.host.email
                      : 'Utilisateur inconnu'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
