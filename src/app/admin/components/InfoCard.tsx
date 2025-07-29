'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcnui/card'
import { Badge } from '@/components/ui/shadcnui/badge'
import { Button } from '@/components/ui/shadcnui/button'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface InfoCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  variant?: 'default' | 'success' | 'warning' | 'danger'
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'destructive' | 'outline' | 'secondary'
  }
  badge?: {
    text: string
    variant?: 'default' | 'destructive' | 'outline' | 'secondary'
  }
}

const variantStyles = {
  default: {
    bg: 'bg-slate-50',
    icon: 'text-slate-600',
    border: 'border-slate-200',
  },
  success: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    border: 'border-green-200',
  },
  warning: {
    bg: 'bg-orange-50',
    icon: 'text-orange-600',
    border: 'border-orange-200',
  },
  danger: {
    bg: 'bg-red-50',
    icon: 'text-red-600',
    border: 'border-red-200',
  },
}

export function InfoCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  action,
  badge,
}: InfoCardProps) {
  const styles = variantStyles[variant]

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <Card
        className={`border-0 shadow-sm hover:shadow-md transition-all duration-300 ${styles.border}`}
      >
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className={`p-2 rounded-lg ${styles.bg}`}>
                <Icon className={`h-5 w-5 ${styles.icon}`} />
              </div>
              <div>
                <CardTitle className='text-base font-medium text-slate-700'>{title}</CardTitle>
                {subtitle && <p className='text-sm text-slate-500 mt-1'>{subtitle}</p>}
              </div>
            </div>
            {badge && (
              <Badge variant={badge.variant} className='text-xs'>
                {badge.text}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className='pt-0'>
          <div className='flex items-center justify-between'>
            <p className='text-2xl font-bold text-slate-800'>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {action && (
              <Button
                size='sm'
                variant={action.variant || 'outline'}
                onClick={action.onClick}
                className='text-xs'
              >
                {action.label}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface InfoCardGridProps {
  cards: InfoCardProps[]
  columns?: 1 | 2 | 3 | 4
  title?: string
  description?: string
}

export function InfoCardGrid({ cards, columns = 3, title, description }: InfoCardGridProps) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div className='space-y-6'>
      {(title || description) && (
        <div className='space-y-2'>
          {title && <h3 className='text-lg font-semibold text-slate-800'>{title}</h3>}
          {description && <p className='text-slate-600'>{description}</p>}
        </div>
      )}

      <div className={`grid ${gridClasses[columns]} gap-4`}>
        {cards.map((card, index) => (
          <motion.div
            key={`${card.title}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <InfoCard {...card} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
