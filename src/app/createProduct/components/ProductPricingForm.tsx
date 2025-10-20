'use client'

import { useState } from 'react'
import { motion, Variants } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Euro, Calendar, Plus } from 'lucide-react'
import CreateSpecialPriceModal from '@/components/ui/CreateSpecialPriceModal'
import CommissionDisplay from '@/components/ui/CommissionDisplay'

interface SpecialPrice {
  id: string
  pricesMga: string
  pricesEuro: string
  day: string[]
  startDate: Date | null
  endDate: Date | null
}

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
  onSpecialPriceCreated: () => void
  onRemoveSpecialPrice: (id: string) => void
  isSubmitting: boolean
  onSubmit: (e: React.FormEvent) => void
  itemVariants: Variants
}

export default function ProductPricingForm({
  formData,
  onInputChange,
  onSpecialPriceCreated,
  onRemoveSpecialPrice,
  isSubmitting,
  onSubmit,
  itemVariants,
}: ProductPricingFormProps) {
  const [specialPriceModalOpen, setSpecialPriceModalOpen] = useState(false)

  // Format day names for display
  const formatDayNames = (days: string[]) => {
    const dayNames: { [key: string]: string } = {
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
                <Input
                  id='basePrice'
                  name='basePrice'
                  type='number'
                  min='1'
                  step='0.01'
                  placeholder='Ex: 85.00'
                  value={formData.basePrice}
                  onChange={onInputChange}
                  required
                  className='border-slate-200 focus:border-yellow-300 focus:ring-yellow-200'
                />
              </div>

              <div className='space-y-2'>
                <label htmlFor='basePriceMGA' className='text-sm font-medium text-slate-700'>
                  Prix de base par nuit (MGA)
                </label>
                <Input
                  id='basePriceMGA'
                  name='basePriceMGA'
                  type='number'
                  min='0'
                  step='1'
                  placeholder='Ex: 385000'
                  value={formData.basePriceMGA}
                  onChange={onInputChange}
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

      {/* Submit Section */}
      <motion.div variants={itemVariants}>
        <Card className='border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50'>
          <CardHeader>
            <CardTitle className='flex items-center gap-3 text-orange-800'>
              🏡 Finalisation de votre annonce
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='bg-white/60 rounded-lg p-6 border border-orange-200'>
              <h3 className='font-semibold text-orange-900 mb-3'>Avant de publier</h3>
              <ul className='text-sm text-orange-800 space-y-2'>
                <li className='flex items-center gap-2'>
                  <span className='w-2 h-2 bg-orange-500 rounded-full'></span>
                  Vérifiez que toutes les informations sont exactes
                </li>
                <li className='flex items-center gap-2'>
                  <span className='w-2 h-2 bg-orange-500 rounded-full'></span>
                  Assurez-vous d&apos;avoir ajouté des photos de qualité
                </li>
                <li className='flex items-center gap-2'>
                  <span className='w-2 h-2 bg-orange-500 rounded-full'></span>
                  Votre annonce sera soumise à validation avant publication
                </li>
              </ul>
            </div>

            <Button
              type='submit'
              size='lg'
              disabled={isSubmitting}
              onClick={onSubmit}
              className='w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-3 text-base shadow-lg'
            >
              {isSubmitting ? (
                <div className='flex items-center gap-2'>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                  Création en cours...
                </div>
              ) : (
                'Créer mon hébergement'
              )}
            </Button>
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
