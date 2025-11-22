'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Star, Package, Plus, Highlighter } from 'lucide-react'
import ServiceOptionsCard from './ServiceOptionsCard'
import type { IncludedService, ProductExtra, PropertyHighlight, FormData } from '../types'

interface ServicesOptionsSectionProps {
  formData: FormData
  includedServices: IncludedService[]
  extras: ProductExtra[]
  highlights: PropertyHighlight[]
  handleCheckboxChange: (field: keyof FormData, id: string) => void
  setServiceModalOpen: (open: boolean) => void
  setExtraModalOpen: (open: boolean) => void
  setHighlightModalOpen: (open: boolean) => void
  itemVariants: {
    hidden: { opacity: number; y: number }
    visible: { opacity: number; y: number; transition: { duration: number } }
  }
}

export default function ServicesOptionsSection({
  formData,
  includedServices,
  extras,
  highlights,
  handleCheckboxChange,
  setServiceModalOpen,
  setExtraModalOpen,
  setHighlightModalOpen,
  itemVariants,
}: ServicesOptionsSectionProps) {
  return (
    <motion.div variants={itemVariants}>
      <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm'>
        <CardHeader className='space-y-2'>
          <div className='flex items-center gap-2'>
            <div className='p-2 bg-indigo-50 rounded-lg'>
              <Star className='h-5 w-5 text-indigo-600' />
            </div>
            <div>
              <CardTitle className='text-xl'>Services et Options</CardTitle>
              <p className='text-slate-600 text-sm mt-1'>
                Sélectionnez les services inclus, extras payants et points forts de votre hébergement
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* Services inclus */}
            <ServiceOptionsCard
              title='Services inclus'
              icon={<Package className='h-4 w-4' />}
              items={includedServices}
              selectedIds={formData.includedServiceIds}
              onToggle={id => handleCheckboxChange('includedServiceIds', id)}
              onAddNew={() => setServiceModalOpen(true)}
              colorScheme='blue'
            />

            {/* Extras payants */}
            <ServiceOptionsCard
              title='Options payantes'
              icon={<Plus className='h-4 w-4' />}
              items={extras}
              selectedIds={formData.extraIds}
              onToggle={id => handleCheckboxChange('extraIds', id)}
              onAddNew={() => setExtraModalOpen(true)}
              colorScheme='emerald'
              showPrices={true}
            />

            {/* Points forts */}
            <ServiceOptionsCard
              title='Points forts'
              icon={<Highlighter className='h-4 w-4' />}
              items={highlights}
              selectedIds={formData.highlightIds}
              onToggle={id => handleCheckboxChange('highlightIds', id)}
              onAddNew={() => setHighlightModalOpen(true)}
              colorScheme='purple'
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
