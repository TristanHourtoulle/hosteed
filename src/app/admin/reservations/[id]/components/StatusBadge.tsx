'use client'

import { Clock, CheckCircle, LogIn, LogOut, Ban } from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  WAITING: { label: 'En attente', color: 'text-yellow-800', bg: 'bg-yellow-100', icon: Clock },
  RESERVED: { label: 'Confirmée', color: 'text-blue-800', bg: 'bg-blue-100', icon: CheckCircle },
  CHECKIN: { label: 'Check-in', color: 'text-green-800', bg: 'bg-green-100', icon: LogIn },
  CHECKOUT: { label: 'Check-out', color: 'text-gray-800', bg: 'bg-gray-100', icon: LogOut },
  CANCEL: { label: 'Annulée', color: 'text-red-800', bg: 'bg-red-100', icon: Ban },
}

interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md' | 'lg'
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || { label: status, color: 'text-gray-800', bg: 'bg-gray-100', icon: Clock }
  const Icon = config.icon

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.bg} ${config.color} ${sizeClasses[size]}`}>
      <Icon className={size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />
      {config.label}
    </span>
  )
}
