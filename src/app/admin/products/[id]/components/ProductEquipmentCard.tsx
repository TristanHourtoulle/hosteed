'use client'

import { motion, Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { Badge } from '@/components/ui/shadcnui/badge'
import { Wrench } from 'lucide-react'
import type { AdminProductWithRelations } from '../types'

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

interface ProductEquipmentCardProps {
  product: AdminProductWithRelations
}

/** Equipment, services, meals, securities, included services display. */
export function ProductEquipmentCard({ product }: ProductEquipmentCardProps) {
  const sections = [
    { label: 'Équipements', items: product.equipments },
    { label: 'Services', items: product.servicesList },
    { label: 'Repas', items: product.mealsList },
    { label: 'Sécurité', items: product.securities },
    {
      label: 'Services inclus',
      items: product.includedServices.map(s => ({ id: s.id, name: s.name })),
    },
  ]

  const hasAny = sections.some(s => s.items.length > 0)

  return (
    <motion.div initial='hidden' animate='visible' variants={fadeIn}>
      <Card className='border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl py-0 gap-0'>
        <div className='px-6 py-4 border-b border-gray-100'>
          <h2 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
            <Wrench className='h-5 w-5 text-blue-600' />
            Équipements et services
          </h2>
        </div>
        <CardContent className='p-6 space-y-4'>
          {!hasAny && (
            <p className='text-gray-500 text-sm'>Aucun équipement ou service configuré.</p>
          )}
          {sections.map(
            section =>
              section.items.length > 0 && (
                <div key={section.label}>
                  <p className='text-xs text-gray-500 uppercase tracking-wide mb-2'>
                    {section.label} ({section.items.length})
                  </p>
                  <div className='flex flex-wrap gap-2'>
                    {section.items.map(item => (
                      <Badge key={item.id} variant='secondary'>
                        {item.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
