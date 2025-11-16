'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wifi, Zap, UtensilsCrossed, Shield, Star } from 'lucide-react'
import CheckboxItem from './CheckboxItem'
import type { Equipment, Meal, Security, Service, FormData } from '../types'

interface EquipmentServicesSectionProps {
  formData: FormData
  equipments: Equipment[]
  meals: Meal[]
  securities: Security[]
  services: Service[]
  handleCheckboxChange: (field: keyof FormData, id: string) => void
  itemVariants: {
    hidden: { opacity: number; y: number }
    visible: { opacity: number; y: number; transition: { duration: number } }
  }
}

export default function EquipmentServicesSection({
  formData,
  equipments,
  meals,
  securities,
  services,
  handleCheckboxChange,
  itemVariants,
}: EquipmentServicesSectionProps) {
  return (
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
                Sélectionnez les équipements disponibles dans votre hébergement
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 grid-rows-2 gap-6 auto-rows-fr'>
            {/* Équipements */}
            <div className='border-2 border-slate-200 rounded-xl p-4 bg-white/50 backdrop-blur-sm flex flex-col h-full'>
              <h4 className='font-medium text-slate-700 flex items-center gap-2 mb-4'>
                <Zap className='h-4 w-4' />
                Équipements disponibles
              </h4>
              <div className='flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 content-start'>
                {equipments.map(equipment => (
                  <CheckboxItem
                    key={equipment.id}
                    id={equipment.id}
                    name={equipment.name}
                    checked={formData.equipmentIds.includes(equipment.id)}
                    onChange={() => handleCheckboxChange('equipmentIds', equipment.id)}
                    colorScheme='emerald'
                  />
                ))}
              </div>
            </div>

            {/* Repas */}
            <div className='border-2 border-slate-200 rounded-xl p-4 bg-white/50 backdrop-blur-sm flex flex-col h-full'>
              <h4 className='font-medium text-slate-700 flex items-center gap-2 mb-4'>
                <UtensilsCrossed className='h-4 w-4' />
                Services de restauration
              </h4>
              <div className='flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 content-start'>
                {meals.map(meal => (
                  <CheckboxItem
                    key={meal.id}
                    id={meal.id}
                    name={meal.name}
                    checked={formData.mealIds.includes(meal.id)}
                    onChange={() => handleCheckboxChange('mealIds', meal.id)}
                    colorScheme='orange'
                  />
                ))}
              </div>
            </div>

            {/* Sécurité */}
            <div className='border-2 border-slate-200 rounded-xl p-4 bg-white/50 backdrop-blur-sm flex flex-col h-full'>
              <h4 className='font-medium text-slate-700 flex items-center gap-2 mb-4'>
                <Shield className='h-4 w-4' />
                Équipements de sécurité
              </h4>
              <div className='flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 content-start'>
                {securities.map(security => (
                  <CheckboxItem
                    key={security.id}
                    id={security.id}
                    name={security.name}
                    checked={formData.securityIds.includes(security.id)}
                    onChange={() => handleCheckboxChange('securityIds', security.id)}
                    colorScheme='red'
                  />
                ))}
              </div>
            </div>

            {/* Services */}
            <div className='border-2 border-slate-200 rounded-xl p-4 bg-white/50 backdrop-blur-sm flex flex-col h-full'>
              <h4 className='font-medium text-slate-700 flex items-center gap-2 mb-4'>
                <Star className='h-4 w-4' />
                Services additionnels
              </h4>
              <div className='flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 content-start'>
                {services.map(service => (
                  <CheckboxItem
                    key={service.id}
                    id={service.id}
                    name={service.name}
                    checked={formData.serviceIds.includes(service.id)}
                    onChange={() => handleCheckboxChange('serviceIds', service.id)}
                    colorScheme='blue'
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
