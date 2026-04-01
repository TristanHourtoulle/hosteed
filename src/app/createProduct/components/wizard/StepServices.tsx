'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Zap,
  UtensilsCrossed,
  Shield,
  Star,
  Package,
  Plus,
  Highlighter,
} from 'lucide-react'
import { ServiceSelectionSection } from '../index'
import CreateServiceModal from '@/components/ui/CreateServiceModal'
import CreateExtraModal from '@/components/ui/CreateExtraModal'
import CreateHighlightModal from '@/components/ui/CreateHighlightModal'
import type { FormData, IncludedService, ProductExtra, PropertyHighlight } from '../../types'

const stepVariants = {
  enter: { opacity: 0, x: 30 },
  center: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -30, transition: { duration: 0.2 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

interface Service {
  id: string
  name: string
}

interface StepServicesProps {
  formData: FormData
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
  equipments: Service[]
  meals: Service[]
  securities: Service[]
  services: Service[]
  includedServices: IncludedService[]
  extras: ProductExtra[]
  highlights: PropertyHighlight[]
  refreshIncludedServices: () => Promise<void>
  refreshExtras: () => Promise<void>
  refreshHighlights: () => Promise<void>
}

export function StepServices({
  formData,
  setFormData,
  equipments,
  meals,
  securities,
  services,
  includedServices,
  extras,
  highlights,
  refreshIncludedServices,
  refreshExtras,
  refreshHighlights,
}: StepServicesProps) {
  const [serviceModalOpen, setServiceModalOpen] = useState(false)
  const [extraModalOpen, setExtraModalOpen] = useState(false)
  const [highlightModalOpen, setHighlightModalOpen] = useState(false)

  const handleCheckboxChange = (field: keyof FormData, id: string) => {
    setFormData(prev => {
      const currentArray = prev[field] as string[]
      const isChecked = currentArray.includes(id)
      return {
        ...prev,
        [field]: isChecked ? currentArray.filter(item => item !== id) : [...currentArray, id],
      }
    })
  }

  return (
    <motion.div
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="space-y-6"
    >
      {/* Equipments */}
      <ServiceSelectionSection
        title="Équipements disponibles"
        description="Sélectionnez les équipements disponibles dans votre hébergement"
        icon={Zap}
        iconColor="text-emerald-600"
        bgColor="bg-emerald-50"
        borderColor="border-emerald-500"
        services={equipments}
        selectedServiceIds={formData.equipmentIds}
        onServiceToggle={id => handleCheckboxChange('equipmentIds', id)}
        itemVariants={itemVariants}
      />

      {/* Meals */}
      <ServiceSelectionSection
        title="Services de restauration"
        description="Sélectionnez les services de repas proposés"
        icon={UtensilsCrossed}
        iconColor="text-orange-600"
        bgColor="bg-orange-50"
        borderColor="border-orange-500"
        services={meals}
        selectedServiceIds={formData.mealIds}
        onServiceToggle={id => handleCheckboxChange('mealIds', id)}
        itemVariants={itemVariants}
      />

      {/* Security */}
      <ServiceSelectionSection
        title="Équipements de sécurité"
        description="Sélectionnez les équipements de sécurité disponibles"
        icon={Shield}
        iconColor="text-red-600"
        bgColor="bg-red-50"
        borderColor="border-red-500"
        services={securities}
        selectedServiceIds={formData.securityIds}
        onServiceToggle={id => handleCheckboxChange('securityIds', id)}
        itemVariants={itemVariants}
      />

      {/* Additional Services */}
      <ServiceSelectionSection
        title="Services additionnels"
        description="Sélectionnez les services additionnels proposés"
        icon={Star}
        iconColor="text-blue-600"
        bgColor="bg-blue-50"
        borderColor="border-blue-500"
        services={services}
        selectedServiceIds={formData.serviceIds}
        onServiceToggle={id => handleCheckboxChange('serviceIds', id)}
        itemVariants={itemVariants}
      />

      {/* Included Services, Extras, Highlights */}
      <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl">
        <CardHeader className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Star className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Services et Options</CardTitle>
              <p className="text-slate-500 text-sm mt-0.5">
                Services inclus, extras payants et points forts
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Included Services */}
          <div className="border-2 border-slate-200 rounded-xl p-4 bg-white/50">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-slate-700 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Services inclus
              </h4>
              <Button type="button" size="sm" variant="outline" onClick={() => setServiceModalOpen(true)} className="text-xs">
                <Plus className="h-3 w-3 mr-1" />
                Ajouter
              </Button>
            </div>
            <div className="space-y-2">
              {includedServices.map(service => (
                <label
                  key={service.id}
                  className={`flex items-center p-2 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                    formData.includedServiceIds.includes(service.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.includedServiceIds.includes(service.id)}
                    onChange={() => handleCheckboxChange('includedServiceIds', service.id)}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-2 w-full">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      formData.includedServiceIds.includes(service.id)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-slate-300'
                    }`}>
                      {formData.includedServiceIds.includes(service.id) && (
                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-slate-700 block truncate">{service.name}</span>
                      {service.description && (
                        <span className="text-xs text-slate-500 block truncate">{service.description}</span>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Extras */}
          <div className="border-2 border-slate-200 rounded-xl p-4 bg-white/50">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-slate-700 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Options payantes
              </h4>
              <Button type="button" size="sm" variant="outline" onClick={() => setExtraModalOpen(true)} className="text-xs">
                <Plus className="h-3 w-3 mr-1" />
                Ajouter
              </Button>
            </div>
            <div className="space-y-2">
              {extras.map(extra => (
                <label
                  key={extra.id}
                  className={`flex items-center p-2 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                    formData.extraIds.includes(extra.id)
                      ? 'border-green-500 bg-green-50'
                      : 'border-slate-200 bg-white hover:border-green-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.extraIds.includes(extra.id)}
                    onChange={() => handleCheckboxChange('extraIds', extra.id)}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-2 w-full">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      formData.extraIds.includes(extra.id)
                        ? 'border-green-500 bg-green-500'
                        : 'border-slate-300'
                    }`}>
                      {formData.extraIds.includes(extra.id) && (
                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-slate-700 block truncate">{extra.name}</span>
                      <span className="text-xs text-green-600 block">{extra.priceEUR}€ / {extra.priceMGA.toLocaleString()}Ar</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Highlights */}
          <div className="border-2 border-slate-200 rounded-xl p-4 bg-white/50">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-slate-700 flex items-center gap-2">
                <Highlighter className="h-4 w-4" />
                Points forts
              </h4>
              <Button type="button" size="sm" variant="outline" onClick={() => setHighlightModalOpen(true)} className="text-xs">
                <Plus className="h-3 w-3 mr-1" />
                Ajouter
              </Button>
            </div>
            <div className="space-y-2">
              {highlights.map(highlight => (
                <label
                  key={highlight.id}
                  className={`flex items-center p-2 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                    formData.highlightIds.includes(highlight.id)
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-slate-200 bg-white hover:border-yellow-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.highlightIds.includes(highlight.id)}
                    onChange={() => handleCheckboxChange('highlightIds', highlight.id)}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-2 w-full">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      formData.highlightIds.includes(highlight.id)
                        ? 'border-yellow-500 bg-yellow-500'
                        : 'border-slate-300'
                    }`}>
                      {formData.highlightIds.includes(highlight.id) && (
                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-slate-700 block truncate">{highlight.name}</span>
                      {highlight.description && (
                        <span className="text-xs text-slate-500 block truncate">{highlight.description}</span>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateServiceModal
        isOpen={serviceModalOpen}
        onClose={() => setServiceModalOpen(false)}
        onServiceCreated={refreshIncludedServices}
        title="Ajouter un service inclus personnalisé"
        description="Créez un service inclus spécifique à votre hébergement"
      />
      <CreateExtraModal
        isOpen={extraModalOpen}
        onClose={() => setExtraModalOpen(false)}
        onExtraCreated={refreshExtras}
      />
      <CreateHighlightModal
        isOpen={highlightModalOpen}
        onClose={() => setHighlightModalOpen(false)}
        onHighlightCreated={refreshHighlights}
      />
    </motion.div>
  )
}
