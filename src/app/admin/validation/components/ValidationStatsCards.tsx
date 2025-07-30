'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle, Clock, Home } from 'lucide-react'

interface ValidationStats {
  pending: number
  approved: number
  rejected: number
  recheckRequest: number
  total: number
}

interface ValidationStatsCardsProps {
  stats: ValidationStats
}

export function ValidationStatsCards({ stats }: ValidationStatsCardsProps) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Total</CardTitle>
          <Home className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{stats.total}</div>
          <p className='text-xs text-muted-foreground'>annonces au total</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>En attente</CardTitle>
          <Clock className='h-4 w-4 text-yellow-600' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-yellow-600'>
            {stats.pending + stats.recheckRequest}
          </div>
          <p className='text-xs text-muted-foreground'>à valider</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Validées</CardTitle>
          <CheckCircle className='h-4 w-4 text-green-600' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-green-600'>{stats.approved}</div>
          <p className='text-xs text-muted-foreground'>approuvées</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Refusées</CardTitle>
          <XCircle className='h-4 w-4 text-red-600' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-red-600'>{stats.rejected}</div>
          <p className='text-xs text-muted-foreground'>rejetées</p>
        </CardContent>
      </Card>
    </div>
  )
}
