'use client'

import { motion, Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { Badge } from '@/components/ui/shadcnui/badge'
import { CalendarDays } from 'lucide-react'
import type { AdminRent } from '../types'

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const STATUS_COLORS: Record<string, string> = {
  WAITING: 'bg-yellow-100 text-yellow-800',
  RESERVED: 'bg-blue-100 text-blue-800',
  CHECKIN: 'bg-green-100 text-green-800',
  CHECKOUT: 'bg-gray-100 text-gray-800',
  CANCEL: 'bg-red-100 text-red-800',
}

interface ProductReservationsCardProps {
  rents: AdminRent[]
}

/** Recent reservations list. */
export function ProductReservationsCard({ rents }: ProductReservationsCardProps) {
  return (
    <motion.div initial='hidden' animate='visible' variants={fadeIn}>
      <Card className='border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl py-0 gap-0'>
        <div className='px-6 py-4 border-b border-gray-100'>
          <h2 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
            <CalendarDays className='h-5 w-5 text-blue-600' />
            Réservations ({rents.length})
          </h2>
        </div>
        <CardContent className='p-6'>
          {rents.length === 0 ? (
            <p className='text-gray-500 text-sm'>Aucune réservation pour ce produit.</p>
          ) : (
            <div className='space-y-3'>
              {rents.map(rent => (
                <div
                  key={rent.id}
                  className='p-3 rounded-lg bg-gray-50 flex flex-wrap items-center justify-between gap-3'
                >
                  <div className='space-y-0.5'>
                    <p className='text-sm font-medium text-gray-800'>
                      {rent.user.name || rent.user.email}
                    </p>
                    <p className='text-xs text-gray-500'>
                      {new Date(rent.arrivingDate).toLocaleDateString('fr-FR')} →{' '}
                      {new Date(rent.leavingDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Badge className={STATUS_COLORS[rent.status] || 'bg-gray-100 text-gray-800'}>
                      {rent.status}
                    </Badge>
                    <span className='text-sm font-medium text-gray-800'>
                      {Number(rent.prices)}€
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
