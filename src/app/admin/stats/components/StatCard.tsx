'use client'

import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: number
  description: string
  icon: LucideIcon
  color: string
}

export function StatCard({ title, value, description, icon: Icon, color }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -5 }}
      className='w-full'
    >
      <Card className='bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300'>
        <CardContent className='pt-6'>
          <div className='flex items-start justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600 mb-1'>{title}</p>
              <h3 className={`text-3xl font-bold ${color} mb-1`}>{value}</h3>
              <p className='text-sm text-gray-500'>{description}</p>
            </div>
            <div className={`${color} opacity-20 rounded-full p-3`}>
              <Icon className={`h-6 w-6 ${color}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
