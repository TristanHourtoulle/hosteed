'use client'

import { useState } from 'react'
import { motion, Variants } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wifi, Plus, UtensilsCrossed, Star, Package, Highlighter } from 'lucide-react'
import CreateServiceModal from '@/components/ui/CreateServiceModal'
import CreateExtraModal from '@/components/ui/CreateExtraModal'
import CreateHighlightModal from '@/components/ui/CreateHighlightModal'

interface Equipment {
  id: string
  name: string
}

interface Meal {
  id: string
  name: string
}

interface Security {
  id: string
  name: string
}

interface Service {
  id: string
  name: string
}

interface IncludedService {
  id: string
  name: string
  description: string | null
  icon: string | null
  userId: string | null
}

interface ProductExtra {
  id: string
  name: string
  description: string | null
  priceEUR: number
  priceMGA: number
  type: string
  userId: string | null
}

interface PropertyHighlight {
  id: string
  name: string
  description: string | null
  icon: string | null
  userId: string | null
}

interface FormData {
  equipments: string[]
  meals: string[]
  securities: string[]
  services: string[]
  includedServices: string[]
  extras: string[]
  highlights: string[]
}

interface ProductServicesFormProps {
  formData: FormData
  equipments: Equipment[]
  meals: Meal[]
  securities: Security[]
  services: Service[]
  includedServices: IncludedService[]
  extras: ProductExtra[]
  highlights: PropertyHighlight[]
  onCheckboxChange: (category: string, id: string, checked: boolean) => void
  onServiceCreated: () => void
  onExtraCreated: () => void
  onHighlightCreated: () => void
  itemVariants: Variants
}

export default function ProductServicesForm({
  formData,
  equipments,
  meals,
  securities,
  services,
  includedServices,
  extras,
  highlights,
  onCheckboxChange,
  onServiceCreated,
  onExtraCreated,
  onHighlightCreated,
  itemVariants
}: ProductServicesFormProps) {
  const [serviceModalOpen, setServiceModalOpen] = useState(false)
  const [extraModalOpen, setExtraModalOpen] = useState(false)
  const [highlightModalOpen, setHighlightModalOpen] = useState(false)

  return (
    <>
      {/* Équipements et Services */}
      <motion.div variants={itemVariants}>
        <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm'>
          <CardHeader className='space-y-2'>
            <div className='flex items-center gap-2'>
              <div className='p-2 bg-emerald-50 rounded-lg'>
                <Wifi className='h-5 w-5 text-emerald-600' />
              </div>
              <div>
                <CardTitle className='text-xl'>Équipements et Services</CardTitle>
                <p className='text-slate-600 text-sm mt-1'>
                  Sélectionnez les équipements et services disponibles
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-8'>
            {/* Équipements */}
            <div className='space-y-4'>
              <h3 className='font-medium text-slate-800 text-lg'>Équipements</h3>
              <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
                {equipments.map(equipment => (
                  <label
                    key={equipment.id}
                    className='flex items-center space-x-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors'
                  >
                    <input
                      type='checkbox'
                      checked={formData.equipments.includes(equipment.id)}
                      onChange={e => onCheckboxChange('equipments', equipment.id, e.target.checked)}
                      className='w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500'
                    />
                    <span className='text-sm text-slate-700'>{equipment.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Services */}
            <div className='space-y-4'>
              <h3 className='font-medium text-slate-800 text-lg'>Services</h3>
              <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
                {services.map(service => (
                  <label
                    key={service.id}
                    className='flex items-center space-x-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors'
                  >
                    <input
                      type='checkbox'
                      checked={formData.services.includes(service.id)}
                      onChange={e => onCheckboxChange('services', service.id, e.target.checked)}
                      className='w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500'
                    />
                    <span className='text-sm text-slate-700'>{service.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Repas */}
            <div className='space-y-4'>
              <h3 className='font-medium text-slate-800 text-lg'>Options de repas</h3>
              <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
                {meals.map(meal => (
                  <label
                    key={meal.id}
                    className='flex items-center space-x-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors'
                  >
                    <input
                      type='checkbox'
                      checked={formData.meals.includes(meal.id)}
                      onChange={e => onCheckboxChange('meals', meal.id, e.target.checked)}
                      className='w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500'
                    />
                    <span className='text-sm text-slate-700'>{meal.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sécurité */}
            <div className='space-y-4'>
              <h3 className='font-medium text-slate-800 text-lg'>Sécurité</h3>
              <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
                {securities.map(security => (
                  <label
                    key={security.id}
                    className='flex items-center space-x-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors'
                  >
                    <input
                      type='checkbox'
                      checked={formData.securities.includes(security.id)}
                      onChange={e => onCheckboxChange('securities', security.id, e.target.checked)}
                      className='w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500'
                    />
                    <span className='text-sm text-slate-700'>{security.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Services et Options */}
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
                  Services inclus, options payantes et points forts de votre hébergement
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-8'>
            {/* Services inclus */}
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='font-medium text-slate-800 text-lg flex items-center gap-2'>
                  <UtensilsCrossed className='h-5 w-5 text-indigo-600' />
                  Services inclus
                </h3>
                <button
                  type='button'
                  onClick={() => setServiceModalOpen(true)}
                  className='flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors'
                >
                  <Plus className='h-4 w-4' />
                  Créer un service
                </button>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                {includedServices.map(service => (
                  <label
                    key={service.id}
                    className='flex items-center space-x-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors'
                  >
                    <input
                      type='checkbox'
                      checked={formData.includedServices.includes(service.id)}
                      onChange={e => onCheckboxChange('includedServices', service.id, e.target.checked)}
                      className='w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500'
                    />
                    <div className='flex-1'>
                      <span className='text-sm font-medium text-slate-700'>{service.name}</span>
                      {service.description && (
                        <p className='text-xs text-slate-500 mt-1'>{service.description}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Extras payants */}
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='font-medium text-slate-800 text-lg flex items-center gap-2'>
                  <Package className='h-5 w-5 text-indigo-600' />
                  Options payantes
                </h3>
                <button
                  type='button'
                  onClick={() => setExtraModalOpen(true)}
                  className='flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors'
                >
                  <Plus className='h-4 w-4' />
                  Créer une option
                </button>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                {extras.map(extra => (
                  <label
                    key={extra.id}
                    className='flex items-center space-x-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors'
                  >
                    <input
                      type='checkbox'
                      checked={formData.extras.includes(extra.id)}
                      onChange={e => onCheckboxChange('extras', extra.id, e.target.checked)}
                      className='w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500'
                    />
                    <div className='flex-1'>
                      <div className='flex items-center justify-between'>
                        <span className='text-sm font-medium text-slate-700'>{extra.name}</span>
                        <span className='text-sm font-semibold text-emerald-600'>{extra.priceEUR}€</span>
                      </div>
                      {extra.description && (
                        <p className='text-xs text-slate-500 mt-1'>{extra.description}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Points forts */}
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='font-medium text-slate-800 text-lg flex items-center gap-2'>
                  <Highlighter className='h-5 w-5 text-indigo-600' />
                  Points forts
                </h3>
                <button
                  type='button'
                  onClick={() => setHighlightModalOpen(true)}
                  className='flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors'
                >
                  <Plus className='h-4 w-4' />
                  Créer un point fort
                </button>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                {highlights.map(highlight => (
                  <label
                    key={highlight.id}
                    className='flex items-center space-x-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors'
                  >
                    <input
                      type='checkbox'
                      checked={formData.highlights.includes(highlight.id)}
                      onChange={e => onCheckboxChange('highlights', highlight.id, e.target.checked)}
                      className='w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500'
                    />
                    <div className='flex-1'>
                      <span className='text-sm font-medium text-slate-700'>{highlight.name}</span>
                      {highlight.description && (
                        <p className='text-xs text-slate-500 mt-1'>{highlight.description}</p>
                      )}
                    </div>
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
        description="Ajoutez un nouveau service à votre hébergement"
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