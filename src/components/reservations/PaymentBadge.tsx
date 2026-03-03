'use client'

import { CreditCard } from 'lucide-react'
import { PAYMENT_CONFIG } from '@/lib/constants/reservation'

interface PaymentBadgeProps {
  payment: string
  status: string
}

export function PaymentBadge({ payment, status }: PaymentBadgeProps) {
  const effectivePayment = payment === 'NOT_PAID' && status === 'WAITING' ? 'AUTHORIZED' : payment
  const config = PAYMENT_CONFIG[effectivePayment] || { label: payment, color: 'text-gray-700', bg: 'bg-gray-100' }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
      <CreditCard className='h-3 w-3' />
      {config.label}
    </span>
  )
}
