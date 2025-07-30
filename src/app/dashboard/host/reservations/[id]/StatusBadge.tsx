import { RentStatus } from '@prisma/client'

interface StatusConfig {
  label: string
  color: string
  icon: string
}

const statusConfigs: Record<RentStatus, StatusConfig> = {
  WAITING: {
    label: 'En attente',
    color:
      'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300',
    icon: '⏳',
  },
  RESERVED: {
    label: 'Réservée',
    color: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300',
    icon: '📅',
  },
  CHECKIN: {
    label: 'En cours',
    color: 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300',
    icon: '🏠',
  },
  CHECKOUT: {
    label: 'Terminée',
    color: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300',
    icon: '✅',
  },
  CANCEL: {
    label: 'Annulée',
    color: 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300',
    icon: '❌',
  },
}

interface StatusBadgeProps {
  status: RentStatus
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfigs[status] || {
    label: 'Inconnu',
    color: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300',
    icon: '❓',
  }

  return (
    <span
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${config.color} shadow-sm`}
    >
      <span>{config.icon}</span>
      {config.label}
    </span>
  )
}
