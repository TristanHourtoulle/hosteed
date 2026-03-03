'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { Button } from '@/components/ui/shadcnui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/shadcnui/dropdown-menu'
import {
  CalendarDays,
  Mail,
  Eye,
  MoreVertical,
  MapPin,
  Users,
  Moon,
  CheckCircle,
  XCircle,
  LogIn,
  LogOut,
} from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { PaymentBadge } from './PaymentBadge'
import { formatDateShort } from '@/lib/utils/format'
import { formatCurrencySafe } from '@/lib/utils/formatNumber'

interface ReservationCardProps {
  reservation: {
    id: string
    status: string
    payment: string
    totalAmount: number | null
    arrivingDate: string
    leavingDate: string
    numberOfNights: number | null
    product: {
      name: string
      address: string | null
      owner: { name: string | null; email: string }
    }
    user: {
      name: string | null
      lastname: string | null
      email: string
    }
  }
  index: number
  onStatusAction: (rentId: string, status: 'RESERVED' | 'CHECKIN' | 'CHECKOUT' | 'CANCEL') => void
}

export function ReservationCard({ reservation, index, onStatusAction }: ReservationCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Card className='group hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden'>
        <CardContent className='p-5 space-y-4'>
          {/* Header: Product + Actions */}
          <div className='flex items-start justify-between'>
            <div className='flex-1 min-w-0'>
              <Link
                href={`/admin/reservations/${reservation.id}`}
                className='font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors truncate block'
              >
                {reservation.product.name}
              </Link>
              {reservation.product.address && (
                <p className='text-gray-500 text-sm flex items-center gap-1 mt-0.5'>
                  <MapPin className='h-3 w-3 flex-shrink-0' />
                  <span className='truncate'>{reservation.product.address}</span>
                </p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity'
                >
                  <MoreVertical className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='rounded-xl'>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/admin/reservations/${reservation.id}`} className='flex items-center gap-2'>
                    <Eye className='h-4 w-4' />
                    Voir les détails
                  </Link>
                </DropdownMenuItem>
                {reservation.status === 'WAITING' && (
                  <DropdownMenuItem
                    onClick={() => onStatusAction(reservation.id, 'RESERVED')}
                    className='flex items-center gap-2 text-green-600'
                  >
                    <CheckCircle className='h-4 w-4' />
                    Approuver
                  </DropdownMenuItem>
                )}
                {reservation.status === 'RESERVED' && (
                  <DropdownMenuItem
                    onClick={() => onStatusAction(reservation.id, 'CHECKIN')}
                    className='flex items-center gap-2 text-blue-600'
                  >
                    <LogIn className='h-4 w-4' />
                    Check-in
                  </DropdownMenuItem>
                )}
                {reservation.status === 'CHECKIN' && (
                  <DropdownMenuItem
                    onClick={() => onStatusAction(reservation.id, 'CHECKOUT')}
                    className='flex items-center gap-2 text-gray-600'
                  >
                    <LogOut className='h-4 w-4' />
                    Check-out
                  </DropdownMenuItem>
                )}
                {!['CHECKOUT', 'CANCEL'].includes(reservation.status) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onStatusAction(reservation.id, 'CANCEL')}
                      className='flex items-center gap-2 text-red-600'
                    >
                      <XCircle className='h-4 w-4' />
                      Annuler
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Status + Payment */}
          <div className='flex flex-wrap items-center gap-2'>
            <StatusBadge status={reservation.status} />
            <PaymentBadge payment={reservation.payment} status={reservation.status} />
          </div>

          {/* Guest & Host */}
          <div className='space-y-2 text-sm'>
            <div className='flex items-center gap-2 text-gray-700'>
              <Users className='h-4 w-4 text-gray-400 flex-shrink-0' />
              <span className='font-medium'>Voyageur :</span>
              <span className='truncate'>
                {[reservation.user.name, reservation.user.lastname].filter(Boolean).join(' ') || reservation.user.email}
              </span>
            </div>
            <div className='flex items-center gap-2 text-gray-700'>
              <Mail className='h-4 w-4 text-gray-400 flex-shrink-0' />
              <span className='font-medium'>Hôte :</span>
              <span className='truncate'>
                {reservation.product.owner.name || reservation.product.owner.email}
              </span>
            </div>
          </div>

          {/* Dates */}
          <div className='flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2'>
            <CalendarDays className='h-4 w-4 text-gray-400' />
            <span>{formatDateShort(reservation.arrivingDate)}</span>
            <span className='text-gray-400'>&rarr;</span>
            <span>{formatDateShort(reservation.leavingDate)}</span>
            {reservation.numberOfNights && (
              <span className='ml-auto flex items-center gap-1 text-gray-500'>
                <Moon className='h-3 w-3' />
                {reservation.numberOfNights}n
              </span>
            )}
          </div>

          {/* Amount */}
          <div className='flex items-center justify-between pt-2 border-t border-gray-100'>
            <span className='text-sm text-gray-500'>Montant total</span>
            <span className='text-lg font-bold text-gray-900'>
              {formatCurrencySafe(reservation.totalAmount)}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
