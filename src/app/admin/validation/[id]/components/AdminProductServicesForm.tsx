'use client'

import { useState } from 'react'
import { motion, Variants } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Wifi, UtensilsCrossed, Shield, Star, Package, Plus } from 'lucide-react'
import CreateServiceModal from '@/components/ui/CreateServiceModal'
import CreateExtraModal from '@/components/ui/CreateExtraModal'
import CreateHighlightModal from '@/components/ui/CreateHighlightModal'

interface Equipment {
  id: string
  name: string
  icon: string
  isSelected?: boolean
}

interface Service {
  id: string
  name: string
  description?: string | null
  isSelected?: boolean
}

interface Meal {
  id: string
  name: string
  isSelected?: boolean
}

interface Security {
  id: string
  name: string
  isSelected?: boolean
}

interface ProductExtra {
  id: string
  name: string
  description?: string | null
  priceEUR: number
  priceMGA: number
  type: string
  isSelected?: boolean
}

interface Highlight {
  id: string
  name: string
  isSelected?: boolean
}

interface FormData {
  equipments: Equipment[]
  services: Service[]
  meals: Meal[]
  securities: Security[]
  extras: ProductExtra[]
  highlights: Highlight[]
}

interface AdminProductServicesFormProps {
  formData: FormData
  equipments: Equipment[]
  services: Service[]
  meals: Meal[]
  securities: Security[]
  extras: ProductExtra[]
  highlights: Highlight[]
  onCheckboxChange: (category: string, id: string, checked: boolean) => void
  onServiceCreated: () => void
  onExtraCreated: () => void
  onHighlightCreated: () => void
  itemVariants: Variants
}

export default function AdminProductServicesForm({
  formData,
  equipments,
  services,
  meals,
  securities,
  extras,
  highlights,
  onCheckboxChange,
  onServiceCreated,
  onExtraCreated,
  onHighlightCreated,
  itemVariants
}: AdminProductServicesFormProps) {
  const [serviceModalOpen, setServiceModalOpen] = useState(false)
  const [extraModalOpen, setExtraModalOpen] = useState(false)
  const [highlightModalOpen, setHighlightModalOpen] = useState(false)

  return (
    <>
      <motion.div variants={itemVariants}>
        <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm'>
          <CardHeader className='space-y-2'>
            <div className='flex items-center gap-2'>
              <div className='p-2 bg-indigo-50 rounded-lg'>
                <Wifi className='h-5 w-5 text-indigo-600' />
              </div>
              <div>
                <CardTitle className='text-xl'>Services et Équipements</CardTitle>
                <p className='text-slate-600 text-sm mt-1'>
                  Vérifiez les services et équipements disponibles
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-8'>
            {/* Équipements */}
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='font-medium text-slate-800 text-lg flex items-center gap-2'>
                  <Wifi className='h-5 w-5 text-indigo-600' />
                  Équipements
                </h3>
              </div>
              <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
                {equipments.map(equipment => (
                  <label
                    key={equipment.id}
                    className='flex items-center space-x-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors'
                  >
                    <input
                      type='checkbox'
                      checked={formData.equipments.some(e => e.id === equipment.id)}
                      onChange={e => onCheckboxChange('equipments', equipment.id, e.target.checked)}
                      className='w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-200'
                    />
                    <span className='text-sm font-medium text-slate-700'>{equipment.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Services */}
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='font-medium text-slate-800 text-lg flex items-center gap-2'>
                  <Package className='h-5 w-5 text-indigo-600' />
                  Services inclus
                </h3>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => setServiceModalOpen(true)}
                  className='flex items-center gap-2'
                >
                  <Plus className='h-4 w-4' />
                  Nouveau service
                </Button>
              </div>
              <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
                {services.map(service => (
                  <label
                    key={service.id}
                    className='flex items-center space-x-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors'
                  >
                    <input
                      type='checkbox'
                      checked={formData.services.some(s => s.id === service.id)}
                      onChange={e => onCheckboxChange('services', service.id, e.target.checked)}
                      className='w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-200'
                    />
                    <span className='text-sm font-medium text-slate-700'>{service.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Repas */}
            <div className='space-y-4'>
              <h3 className='font-medium text-slate-800 text-lg flex items-center gap-2'>
                <UtensilsCrossed className='h-5 w-5 text-indigo-600' />
                Repas
              </h3>
              <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
                {meals.map(meal => (
                  <label
                    key={meal.id}
                    className='flex items-center space-x-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors'
                  >
                    <input
                      type='checkbox'
                      checked={formData.meals.some(m => m.id === meal.id)}
                      onChange={e => onCheckboxChange('meals', meal.id, e.target.checked)}
                      className='w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-200'
                    />
                    <span className='text-sm font-medium text-slate-700'>{meal.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sécurité */}
            <div className='space-y-4'>
              <h3 className='font-medium text-slate-800 text-lg flex items-center gap-2'>
                <Shield className='h-5 w-5 text-indigo-600' />
                Sécurité
              </h3>
              <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
                {securities.map(security => (
                  <label
                    key={security.id}
                    className='flex items-center space-x-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors'
                  >
                    <input
                      type='checkbox'
                      checked={formData.securities.some(s => s.id === security.id)}
                      onChange={e => onCheckboxChange('securities', security.id, e.target.checked)}
                      className='w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-200'
                    />
                    <span className='text-sm font-medium text-slate-700'>{security.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Options payantes */}
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='font-medium text-slate-800 text-lg flex items-center gap-2'>
                  <Package className='h-5 w-5 text-indigo-600' />
                  Options payantes
                </h3>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => setExtraModalOpen(true)}
                  className='flex items-center gap-2'
                >
                  <Plus className='h-4 w-4' />
                  Nouvelle option
                </Button>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                {extras.map(extra => (
                  <label
                    key={extra.id}
                    className='flex items-start space-x-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors'
                  >
                    <input
                      type='checkbox'
                      checked={formData.extras.some(e => e.id === extra.id)}
                      onChange={e => onCheckboxChange('extras', extra.id, e.target.checked)}
                      className='w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-200 mt-0.5'
                    />
                    <div className='flex-1'>
                      <div className='font-medium text-slate-700'>{extra.name}</div>
                      {extra.description && (
                        <div className='text-sm text-slate-500 mt-1'>{extra.description}</div>
                      )}
                      <div className='text-sm font-medium text-indigo-600 mt-1'>
                        {extra.priceEUR}€ | {extra.priceMGA.toLocaleString()} Ar
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Points forts */}
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='font-medium text-slate-800 text-lg flex items-center gap-2'>
                  <Star className='h-5 w-5 text-indigo-600' />
                  Points forts
                </h3>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => setHighlightModalOpen(true)}
                  className='flex items-center gap-2'
                >
                  <Plus className='h-4 w-4' />
                  Nouveau point fort
                </Button>
              </div>
              <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
                {highlights.map(highlight => (
                  <label
                    key={highlight.id}
                    className='flex items-center space-x-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors'
                  >
                    <input
                      type='checkbox'
                      checked={formData.highlights.some(h => h.id === highlight.id)}
                      onChange={e => onCheckboxChange('highlights', highlight.id, e.target.checked)}
                      className='w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-200'
                    />
                    <span className='text-sm font-medium text-slate-700'>{highlight.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Modals */}
      <CreateServiceModal
        isOpen={serviceModalOpen}
        onClose={() => setServiceModalOpen(false)}
        onServiceCreated={onServiceCreated}
        title="Créer un nouveau service"
        description="Ajoutez un nouveau service disponible"
      />

      <CreateExtraModal
        isOpen={extraModalOpen}
        onClose={() => setExtraModalOpen(false)}
        onExtraCreated={onExtraCreated}
      />

      <CreateHighlightModal
        isOpen={highlightModalOpen}
        onClose={() => setHighlightModalOpen(false)}
        onHighlightCreated={onHighlightCreated}
      />
    </>
  )
}