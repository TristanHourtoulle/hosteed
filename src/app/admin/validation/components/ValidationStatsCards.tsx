'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle, Clock, Home, Edit, FileText } from 'lucide-react'

interface ValidationStats {
  pending: number
  approved: number
  rejected: number
  recheckRequest: number
  modificationPending: number
  drafts: number
  total: number
}

interface ValidationStatsCardsProps {
  stats: ValidationStats
}

export function ValidationStatsCards({ stats }: ValidationStatsCardsProps) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8'>
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
          <div className='text-2xl font-bold text-yellow-600'>{stats.pending}</div>
          <p className='text-xs text-muted-foreground'>nouvelles</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Révisions</CardTitle>
          <Edit className='h-4 w-4 text-blue-600' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-blue-600'>{stats.recheckRequest}</div>
          <p className='text-xs text-muted-foreground'>à corriger</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Modifications</CardTitle>
          <FileText className='h-4 w-4 text-purple-600' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-purple-600'>
            {stats.modificationPending + stats.drafts}
          </div>
          <p className='text-xs text-muted-foreground'>en attente</p>
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
