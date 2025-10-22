'use client'

import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { formatNumber } from '@/lib/utils/formatNumber'

interface StatCardProps {
  title: string
  value: number
  description?: string
  icon: LucideIcon
  color: string
  bgColor: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color,
  bgColor,
  trend,
}: StatCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <Card className='border-0 shadow-md hover:shadow-lg transition-all duration-300'>
        <CardContent className='p-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <div className={`p-3 rounded-xl ${bgColor} ring-2 ring-white shadow-sm`}>
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
              <div>
                <p className='text-3xl font-bold text-slate-800'>{formatNumber(value)}</p>
                <p className='text-sm font-medium text-slate-600'>{title}</p>
                {description && <p className='text-xs text-slate-500 mt-1'>{description}</p>}
              </div>
            </div>

            {trend && (
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  trend.isPositive ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
                }`}
              >
                <span>{trend.isPositive ? '↗' : '↘'}</span>
                <span>{Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface StatsOverviewProps {
  stats: Array<{
    title: string
    value: number
    description?: string
    icon: LucideIcon
    color: string
    bgColor: string
    trend?: {
      value: number
      isPositive: boolean
    }
  }>
  loading?: boolean
}

export function StatsOverview({ stats, loading = false }: StatsOverviewProps) {
  if (loading) {
    return (
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className='border-0 shadow-md'>
            <CardContent className='p-6'>
              <div className='animate-pulse flex items-center gap-4'>
                <div className='w-12 h-12 bg-slate-200 rounded-xl'></div>
                <div className='space-y-2'>
                  <div className='w-20 h-8 bg-slate-200 rounded'></div>
                  <div className='w-24 h-4 bg-slate-200 rounded'></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <StatCard {...stat} />
        </motion.div>
      ))}
    </div>
  )
}
