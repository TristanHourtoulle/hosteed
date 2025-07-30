import { Crown, PenTool, Home, CheckCircle, User } from 'lucide-react'

interface RoleBadgeProps {
  role: string
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

export function RoleBadge({ role, size = 'md', showIcon = true }: RoleBadgeProps) {
  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return {
          label: 'Administrateur',
          icon: Crown,
          bgColor: 'bg-gradient-to-r from-red-500 to-red-600',
          textColor: 'text-white',
          borderColor: 'border-red-200',
          glowColor: 'shadow-red-500/25',
          emoji: '👑',
        }
      case 'BLOGWRITTER':
        return {
          label: 'Rédacteur Blog',
          icon: PenTool,
          bgColor: 'bg-gradient-to-r from-purple-500 to-purple-600',
          textColor: 'text-white',
          borderColor: 'border-purple-200',
          glowColor: 'shadow-purple-500/25',
          emoji: '✍️',
        }
      case 'HOST_VERIFIED':
        return {
          label: 'Hôte Vérifié',
          icon: CheckCircle,
          bgColor: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
          textColor: 'text-white',
          borderColor: 'border-emerald-200',
          glowColor: 'shadow-emerald-500/25',
          emoji: '✅',
        }
      case 'HOST':
        return {
          label: 'Hôte',
          icon: Home,
          bgColor: 'bg-gradient-to-r from-blue-500 to-blue-600',
          textColor: 'text-white',
          borderColor: 'border-blue-200',
          glowColor: 'shadow-blue-500/25',
          emoji: '🏠',
        }
      case 'USER':
      default:
        return {
          label: 'Utilisateur',
          icon: User,
          bgColor: 'bg-gradient-to-r from-gray-500 to-gray-600',
          textColor: 'text-white',
          borderColor: 'border-gray-200',
          glowColor: 'shadow-gray-500/25',
          emoji: '👤',
        }
    }
  }

  const config = getRoleConfig(role)
  const Icon = config.icon

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  return (
    <div
      className={`
      inline-flex items-center gap-2 rounded-full font-medium
      ${config.bgColor} ${config.textColor} ${sizeClasses[size]}
      shadow-lg ${config.glowColor} border ${config.borderColor}
      transition-all duration-200 hover:scale-105 hover:shadow-xl
    `}
    >
      {showIcon && (
        <div className='flex items-center gap-1'>
          <span className='text-sm'>{config.emoji}</span>
          <Icon className={iconSizes[size]} />
        </div>
      )}
      <span className='font-semibold'>{config.label}</span>
    </div>
  )
}

export function RoleIcon({ role, size = 'md' }: { role: string; size?: 'sm' | 'md' | 'lg' }) {
  const config = getRoleConfig(role)

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-lg',
  }

  return (
    <div
      className={`
      ${sizeClasses[size]} rounded-full ${config.bgColor} 
      flex items-center justify-center shadow-lg ${config.glowColor}
      border-2 ${config.borderColor}
    `}
    >
      <span>{config.emoji}</span>
    </div>
  )
}

function getRoleConfig(role: string) {
  switch (role) {
    case 'ADMIN':
      return {
        bgColor: 'bg-gradient-to-r from-red-500 to-red-600',
        borderColor: 'border-red-200',
        glowColor: 'shadow-red-500/25',
        emoji: '👑',
      }
    case 'BLOGWRITTER':
      return {
        bgColor: 'bg-gradient-to-r from-purple-500 to-purple-600',
        borderColor: 'border-purple-200',
        glowColor: 'shadow-purple-500/25',
        emoji: '✍️',
      }
    case 'HOST_VERIFIED':
      return {
        bgColor: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
        borderColor: 'border-emerald-200',
        glowColor: 'shadow-emerald-500/25',
        emoji: '✅',
      }
    case 'HOST':
      return {
        bgColor: 'bg-gradient-to-r from-blue-500 to-blue-600',
        borderColor: 'border-blue-200',
        glowColor: 'shadow-blue-500/25',
        emoji: '🏠',
      }
    case 'USER':
    default:
      return {
        bgColor: 'bg-gradient-to-r from-gray-500 to-gray-600',
        borderColor: 'border-gray-200',
        glowColor: 'shadow-gray-500/25',
        emoji: '👤',
      }
  }
}
