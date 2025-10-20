'use client'

import { motion, Variants } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Users } from 'lucide-react'
import { TypeRentInterface } from '@/lib/interface/typeRentInterface'

interface FormData {
  typeRentId: string
  numberOfRooms: string
  numberOfBathrooms: string
  surface: string
  numberOfFloors: string
  accessibilityPMR: boolean
  // Hotel specific fields
  numberOfRoomsHotel?: string
  numberOfFloorsHotel?: string
  hasElevator?: boolean
  hasParking?: boolean
  hasConferenceRoom?: boolean
  hasSpaWellness?: boolean
  hasRestaurant?: boolean
  hasPool?: boolean
}

interface AdminProductCharacteristicsFormProps {
  formData: FormData
  typeRent: TypeRentInterface[]
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
  onCheckboxChange: (name: string, checked: boolean) => void
  itemVariants: Variants
}

export default function AdminProductCharacteristicsForm({
  formData,
  typeRent,
  onInputChange,
  onCheckboxChange,
  itemVariants,
}: AdminProductCharacteristicsFormProps) {
  const isHotel = typeRent.find(t => t.id === formData.typeRentId)?.name === 'Hôtel'

  return (
    <motion.div variants={itemVariants}>
      <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm relative z-50'>
        <CardHeader className='space-y-2'>
          <div className='flex items-center gap-2'>
            <div className='p-2 bg-purple-50 rounded-lg'>
              <Users className='h-5 w-5 text-purple-600' />
            </div>
            <div>
              <CardTitle className='text-xl'>Caractéristiques</CardTitle>
              <p className='text-slate-600 text-sm mt-1'>
                Vérifiez les détails techniques de l&apos;hébergement
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-2'>
              <label htmlFor='numberOfRooms' className='text-sm font-medium text-slate-700'>
                Nombre de chambres *
              </label>
              <Input
                id='numberOfRooms'
                name='numberOfRooms'
                type='number'
                min='1'
                placeholder='Ex: 3'
                value={formData.numberOfRooms}
                onChange={onInputChange}
                required
                className='border-slate-200 focus:border-purple-300 focus:ring-purple-200'
              />
            </div>

            <div className='space-y-2'>
              <label htmlFor='numberOfBathrooms' className='text-sm font-medium text-slate-700'>
                Nombre de salles de bain *
              </label>
              <Input
                id='numberOfBathrooms'
                name='numberOfBathrooms'
                type='number'
                min='1'
                placeholder='Ex: 2'
                value={formData.numberOfBathrooms}
                onChange={onInputChange}
                required
                className='border-slate-200 focus:border-purple-300 focus:ring-purple-200'
              />
            </div>

            <div className='space-y-2'>
              <label htmlFor='surface' className='text-sm font-medium text-slate-700'>
                Surface (m²) *
              </label>
              <Input
                id='surface'
                name='surface'
                type='number'
                min='1'
                placeholder='Ex: 85'
                value={formData.surface}
                onChange={onInputChange}
                required
                className='border-slate-200 focus:border-purple-300 focus:ring-purple-200'
              />
            </div>

            <div className='space-y-2'>
              <label htmlFor='numberOfFloors' className='text-sm font-medium text-slate-700'>
                Nombre d&apos;étages
              </label>
              <Input
                id='numberOfFloors'
                name='numberOfFloors'
                type='number'
                min='1'
                placeholder='Ex: 2'
                value={formData.numberOfFloors}
                onChange={onInputChange}
                className='border-slate-200 focus:border-purple-300 focus:ring-purple-200'
              />
            </div>
          </div>

          <div className='space-y-4'>
            <h3 className='font-medium text-slate-800 text-lg'>Accessibilité</h3>
            <div className='flex items-center space-x-3'>
              <input
                type='checkbox'
                id='accessibilityPMR'
                checked={formData.accessibilityPMR}
                onChange={e => onCheckboxChange('accessibilityPMR', e.target.checked)}
                className='w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-200'
              />
              <label htmlFor='accessibilityPMR' className='text-sm text-slate-700'>
                Accessible aux personnes à mobilité réduite (PMR)
              </label>
            </div>
          </div>

          {/* Hotel specific configuration */}
          {isHotel && (
            <div className='space-y-6 border-t border-slate-200 pt-6'>
              <h3 className='font-medium text-slate-800 text-lg'>Configuration Hôtel</h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-2'>
                  <label
                    htmlFor='numberOfRoomsHotel'
                    className='text-sm font-medium text-slate-700'
                  >
                    Nombre total de chambres dans l&apos;hôtel
                  </label>
                  <Input
                    id='numberOfRoomsHotel'
                    name='numberOfRoomsHotel'
                    type='number'
                    min='1'
                    placeholder='Ex: 25'
                    value={formData.numberOfRoomsHotel || ''}
                    onChange={onInputChange}
                    className='border-slate-200 focus:border-purple-300 focus:ring-purple-200'
                  />
                </div>

                <div className='space-y-2'>
                  <label
                    htmlFor='numberOfFloorsHotel'
                    className='text-sm font-medium text-slate-700'
                  >
                    Nombre d&apos;étages de l&apos;hôtel
                  </label>
                  <Input
                    id='numberOfFloorsHotel'
                    name='numberOfFloorsHotel'
                    type='number'
                    min='1'
                    placeholder='Ex: 4'
                    value={formData.numberOfFloorsHotel || ''}
                    onChange={onInputChange}
                    className='border-slate-200 focus:border-purple-300 focus:ring-purple-200'
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='flex items-center space-x-3'>
                  <input
                    type='checkbox'
                    id='hasElevator'
                    checked={formData.hasElevator || false}
                    onChange={e => onCheckboxChange('hasElevator', e.target.checked)}
                    className='w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-200'
                  />
                  <label htmlFor='hasElevator' className='text-sm text-slate-700'>
                    Ascenseur
                  </label>
                </div>

                <div className='flex items-center space-x-3'>
                  <input
                    type='checkbox'
                    id='hasParking'
                    checked={formData.hasParking || false}
                    onChange={e => onCheckboxChange('hasParking', e.target.checked)}
                    className='w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-200'
                  />
                  <label htmlFor='hasParking' className='text-sm text-slate-700'>
                    Parking
                  </label>
                </div>

                <div className='flex items-center space-x-3'>
                  <input
                    type='checkbox'
                    id='hasConferenceRoom'
                    checked={formData.hasConferenceRoom || false}
                    onChange={e => onCheckboxChange('hasConferenceRoom', e.target.checked)}
                    className='w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-200'
                  />
                  <label htmlFor='hasConferenceRoom' className='text-sm text-slate-700'>
                    Salle de conférence
                  </label>
                </div>

                <div className='flex items-center space-x-3'>
                  <input
                    type='checkbox'
                    id='hasSpaWellness'
                    checked={formData.hasSpaWellness || false}
                    onChange={e => onCheckboxChange('hasSpaWellness', e.target.checked)}
                    className='w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-200'
                  />
                  <label htmlFor='hasSpaWellness' className='text-sm text-slate-700'>
                    Spa / Bien-être
                  </label>
                </div>

                <div className='flex items-center space-x-3'>
                  <input
                    type='checkbox'
                    id='hasRestaurant'
                    checked={formData.hasRestaurant || false}
                    onChange={e => onCheckboxChange('hasRestaurant', e.target.checked)}
                    className='w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-200'
                  />
                  <label htmlFor='hasRestaurant' className='text-sm text-slate-700'>
                    Restaurant
                  </label>
                </div>

                <div className='flex items-center space-x-3'>
                  <input
                    type='checkbox'
                    id='hasPool'
                    checked={formData.hasPool || false}
                    onChange={e => onCheckboxChange('hasPool', e.target.checked)}
                    className='w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-200'
                  />
                  <label htmlFor='hasPool' className='text-sm text-slate-700'>
                    Piscine
                  </label>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
