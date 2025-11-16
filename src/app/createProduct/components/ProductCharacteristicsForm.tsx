'use client'

import { motion, Variants } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import NumberInput from '@/components/ui/NumberInput'
import TimeInput from '@/components/ui/TimeInput'
import { Users, Home } from 'lucide-react'
import { useMemo } from 'react'

interface FormData {
  room: string
  bathroom: string
  surface: string
  maxPeople: string
  minPeople: string
  accessibility: boolean
  petFriendly: boolean
  arriving: string
  leaving: string
  autoAccept: boolean
  typeRentId: string
}

interface ProductCharacteristicsFormProps {
  formData: FormData
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
  itemVariants: Variants
}

export default function ProductCharacteristicsForm({
  formData,
  onInputChange,
  itemVariants,
}: ProductCharacteristicsFormProps) {
  // Check if this is a hotel type (where configuration is relevant)
  const isHotelType = useMemo(() => {
    // Add logic to determine if this is a hotel type based on typeRentId
    // For now, assume it's hotel if specific conditions are met
    return formData.typeRentId === 'hotel-type-id' // Replace with actual hotel type ID
  }, [formData.typeRentId])

  return (
    <>
      {/* Caractéristiques */}
      <motion.div variants={itemVariants}>
        <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm'>
          <CardHeader className='space-y-2'>
            <div className='flex items-center gap-2'>
              <div className='p-2 bg-purple-50 rounded-lg'>
                <Users className='h-5 w-5 text-purple-600' />
              </div>
              <div>
                <CardTitle className='text-xl'>Caractéristiques</CardTitle>
                <p className='text-slate-600 text-sm mt-1'>
                  Détails sur la capacité et les espaces de votre hébergement
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <label htmlFor='room' className='text-sm font-medium text-slate-700'>
                  Nombre de chambres *
                </label>
                <NumberInput
                  id='room'
                  name='room'
                  min='1'
                  placeholder='Ex: 3'
                  value={formData.room}
                  onChange={onInputChange}
                  required
                  className='border-slate-200 focus:border-purple-300 focus:ring-purple-200'
                />
              </div>

              <div className='space-y-2'>
                <label htmlFor='bathroom' className='text-sm font-medium text-slate-700'>
                  Nombre de salles de bain *
                </label>
                <NumberInput
                  id='bathroom'
                  name='bathroom'
                  min='1'
                  placeholder='Ex: 2'
                  value={formData.bathroom}
                  onChange={onInputChange}
                  required
                  className='border-slate-200 focus:border-purple-300 focus:ring-purple-200'
                />
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <label htmlFor='surface' className='text-sm font-medium text-slate-700'>
                  Surface (m²)
                </label>
                <NumberInput
                  id='surface'
                  name='surface'
                  min='1'
                  placeholder='Ex: 85'
                  value={formData.surface}
                  onChange={onInputChange}
                  className='border-slate-200 focus:border-purple-300 focus:ring-purple-200'
                />
              </div>

              <div className='space-y-2'>
                <label htmlFor='maxPeople' className='text-sm font-medium text-slate-700'>
                  Nombre max de personnes *
                </label>
                <NumberInput
                  id='maxPeople'
                  name='maxPeople'
                  min='1'
                  placeholder='Ex: 6'
                  value={formData.maxPeople}
                  onChange={onInputChange}
                  required
                  className='border-slate-200 focus:border-purple-300 focus:ring-purple-200'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <label htmlFor='minPeople' className='text-sm font-medium text-slate-700'>
                Nombre min de personnes
              </label>
              <NumberInput
                id='minPeople'
                name='minPeople'
                min='1'
                placeholder='Ex: 2'
                value={formData.minPeople}
                onChange={onInputChange}
                className='border-slate-200 focus:border-purple-300 focus:ring-purple-200'
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='flex items-center space-x-2'>
                <input
                  id='accessibility'
                  name='accessibility'
                  type='checkbox'
                  checked={formData.accessibility}
                  onChange={onInputChange}
                  className='w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500'
                />
                <label htmlFor='accessibility' className='text-sm font-medium text-slate-700'>
                  Accessible aux personnes à mobilité réduite
                </label>
              </div>

              <div className='flex items-center space-x-2'>
                <input
                  id='petFriendly'
                  name='petFriendly'
                  type='checkbox'
                  checked={formData.petFriendly}
                  onChange={onInputChange}
                  className='w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500'
                />
                <label htmlFor='petFriendly' className='text-sm font-medium text-slate-700'>
                  Animaux acceptés
                </label>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <label htmlFor='arriving' className='text-sm font-medium text-slate-700'>
                  Heure d&apos;arrivée
                </label>
                <TimeInput
                  id='arriving'
                  name='arriving'
                  value={formData.arriving}
                  onChange={onInputChange}
                  className='border-slate-200 focus:border-purple-300 focus:ring-purple-200'
                />
              </div>

              <div className='space-y-2'>
                <label htmlFor='leaving' className='text-sm font-medium text-slate-700'>
                  Heure de départ
                </label>
                <TimeInput
                  id='leaving'
                  name='leaving'
                  value={formData.leaving}
                  onChange={onInputChange}
                  className='border-slate-200 focus:border-purple-300 focus:ring-purple-200'
                />
              </div>
            </div>

            <div className='flex items-center space-x-2'>
              <input
                id='autoAccept'
                name='autoAccept'
                type='checkbox'
                checked={formData.autoAccept}
                onChange={onInputChange}
                className='w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500'
              />
              <label htmlFor='autoAccept' className='text-sm font-medium text-slate-700'>
                Acceptation automatique des réservations
              </label>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Configuration Hôtel - Only show for hotel types */}
      {isHotelType && (
        <motion.div variants={itemVariants}>
          <Card className='border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50'>
            <CardHeader className='space-y-2'>
              <div className='flex items-center gap-2'>
                <div className='p-2 bg-amber-100 rounded-lg'>
                  <Home className='h-5 w-5 text-amber-700' />
                </div>
                <div>
                  <CardTitle className='text-xl text-amber-900'>Configuration Hôtel</CardTitle>
                  <p className='text-amber-700 text-sm mt-1'>
                    Configuration spécifique pour les établissements hôteliers
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='bg-white/60 rounded-lg p-4 border border-orange-200'>
                <p className='text-amber-800 text-sm'>
                  Les paramètres spécifiques aux hôtels seront configurés ici. Cette section sera
                  développée selon les besoins spécifiques de votre établissement.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </>
  )
}
