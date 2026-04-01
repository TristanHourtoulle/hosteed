'use client'

import { motion, Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { ClipboardList, Check, X } from 'lucide-react'
import type { ProductRules } from '../types'

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

interface ProductRulesCardProps {
  rules: ProductRules[]
}

/** Product rules display (smoking, pets, events, check-in/out). */
export function ProductRulesCard({ rules }: ProductRulesCardProps) {
  if (rules.length === 0) return null

  const rule = rules[0]

  const boolItem = (label: string, value: boolean) => (
    <div className='flex items-center gap-2'>
      {value ? (
        <Check className='h-4 w-4 text-green-600' />
      ) : (
        <X className='h-4 w-4 text-red-400' />
      )}
      <span className='text-sm text-gray-700'>{label}</span>
    </div>
  )

  return (
    <motion.div initial='hidden' animate='visible' variants={fadeIn}>
      <Card className='border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl py-0 gap-0'>
        <div className='px-6 py-4 border-b border-gray-100'>
          <h2 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
            <ClipboardList className='h-5 w-5 text-blue-600' />
            Règles
          </h2>
        </div>
        <CardContent className='p-6'>
          <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
            {boolItem('Fumeurs autorisés', rule.smokingAllowed)}
            {boolItem('Animaux autorisés', rule.petsAllowed)}
            {boolItem('Événements autorisés', rule.eventsAllowed)}
            {boolItem('Self check-in', rule.selfCheckIn)}
          </div>

          <div className='grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100'>
            <div>
              <p className='text-xs text-gray-500 uppercase tracking-wide'>Check-in</p>
              <p className='font-medium text-gray-800'>{rule.checkInTime}</p>
            </div>
            <div>
              <p className='text-xs text-gray-500 uppercase tracking-wide'>Check-out</p>
              <p className='font-medium text-gray-800'>{rule.checkOutTime}</p>
            </div>
          </div>

          {rule.selfCheckIn && rule.selfCheckInType && (
            <div className='mt-3'>
              <p className='text-xs text-gray-500'>Type de self check-in</p>
              <p className='text-sm text-gray-800'>{rule.selfCheckInType}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
