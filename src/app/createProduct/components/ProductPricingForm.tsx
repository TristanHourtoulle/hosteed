'use client'

import { useState } from 'react'
import { motion, Variants } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import NumberInput from '@/components/ui/NumberInput'
import { Euro, Calendar, Plus } from 'lucide-react'
import CreateSpecialPriceModal from '@/components/ui/CreateSpecialPriceModal'
import CommissionDisplay from '@/components/ui/CommissionDisplay'
import type { SpecialPrice } from '@/types/product-form'

interface FormData {
  basePrice: string
  basePriceMGA: string
  specialPrices: SpecialPrice[]
}

interface ProductPricingFormProps {
  formData: FormData
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
  onSpecialPriceCreated: (specialPrice: Omit<SpecialPrice, 'id'>) => void
  onRemoveSpecialPrice: (id: string) => void
  itemVariants: Variants
}

export default function ProductPricingForm({
  formData,
  onInputChange,
  onSpecialPriceCreated,
  onRemoveSpecialPrice,
  itemVariants,
}: ProductPricingFormProps) {
  const [specialPriceModalOpen, setSpecialPriceModalOpen] = useState(false)

  // Format day names for display
  const formatDayNames = (days: string[]) => {
    const dayNames: { [key: string]: string } = {
      Monday: 'Lun',
      Tuesday: 'Mar',
      Wednesday: 'Mer',
      Thursday: 'Jeu',
      Friday: 'Ven',
      Saturday: 'Sam',
      Sunday: 'Dim',
      // Legacy format support
      MONDAY: 'Lun',
      TUESDAY: 'Mar',
      WEDNESDAY: 'Mer',
      THURSDAY: 'Jeu',
      FRIDAY: 'Ven',
      SATURDAY: 'Sam',
      SUNDAY: 'Dim',
    }
    return days.map(day => dayNames[day] || day).join(', ')
  }

  return (
    <>
      {/* Tarification */}
      <motion.div variants={itemVariants}>
        <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm'>
          <CardHeader className='space-y-2'>
            <div className='flex items-center gap-2'>
              <div className='p-2 bg-yellow-50 rounded-lg'>
                <Euro className='h-5 w-5 text-yellow-600' />
              </div>
              <div>
                <CardTitle className='text-xl'>Tarification</CardTitle>
                <p className='text-slate-600 text-sm mt-1'>
                  Définissez vos prix de base et créez des tarifs spéciaux
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <label htmlFor='basePrice' className='text-sm font-medium text-slate-700'>
                  Prix de base par nuit (EUR) *
                </label>
                <NumberInput
                  id='basePrice'
                  name='basePrice'
                  placeholder='Ex: 85.00'
                  value={formData.basePrice}
                  onChange={onInputChange}
                  required
                  allowDecimals={true}
                  className='border-slate-200 focus:border-yellow-300 focus:ring-yellow-200'
                />
              </div>

              <div className='space-y-2'>
                <label htmlFor='basePriceMGA' className='text-sm font-medium text-slate-700'>
                  Prix de base par nuit (MGA)
                </label>
                <NumberInput
                  id='basePriceMGA'
                  name='basePriceMGA'
                  placeholder='Ex: 385 000'
                  value={formData.basePriceMGA}
                  onChange={onInputChange}
                  allowDecimals={false}
                  className='border-slate-200 focus:border-yellow-300 focus:ring-yellow-200'
                />
              </div>
            </div>

            {/* Tarifs spéciaux */}
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='font-medium text-slate-800 text-lg flex items-center gap-2'>
                  <Calendar className='h-5 w-5 text-yellow-600' />
                  Tarifs spéciaux
                </h3>
                <button
                  type='button'
                  onClick={() => setSpecialPriceModalOpen(true)}
                  className='flex items-center gap-2 px-3 py-2 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors'
                >
                  <Plus className='h-4 w-4' />
                  Créer un tarif spécial
                </button>
              </div>

              {formData.specialPrices.length > 0 && (
                <div className='space-y-3'>
                  {formData.specialPrices.map(price => (
                    <div
                      key={price.id}
                      className='p-4 border border-yellow-200 rounded-lg bg-yellow-50/50'
                    >
                      <div className='flex items-center justify-between'>
                        <div>
                          <div className='flex items-center gap-4 mb-2'>
                            <span className='font-medium text-yellow-800'>
                              {price.pricesEuro}€ / nuit
                            </span>
                            {price.pricesMga && (
                              <span className='text-sm text-yellow-600'>
                                ({price.pricesMga} MGA)
                              </span>
                            )}
                          </div>
                          <div className='text-sm text-yellow-700'>
                            <span className='font-medium'>Jours:</span> {formatDayNames(price.day)}
                          </div>
                          {price.startDate && price.endDate && (
                            <div className='text-sm text-yellow-700'>
                              <span className='font-medium'>Période:</span>{' '}
                              {price.startDate.toLocaleDateString()} -{' '}
                              {price.endDate.toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <button
                          type='button'
                          onClick={() => onRemoveSpecialPrice(price.id)}
                          className='text-red-500 hover:text-red-700 px-2 py-1 rounded'
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Commission display */}
            <div className='mt-6'>
              <CommissionDisplay basePrice={parseFloat(formData.basePrice) || 0} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Special Price Modal */}
      <CreateSpecialPriceModal
        isOpen={specialPriceModalOpen}
        onClose={() => setSpecialPriceModalOpen(false)}
        onSpecialPriceCreated={onSpecialPriceCreated}
      />
    </>
  )
}
