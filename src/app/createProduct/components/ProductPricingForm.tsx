'use client'

import { motion, Variants } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import NumberInput from '@/components/ui/NumberInput'
import { Euro } from 'lucide-react'

interface FormData {
  basePrice: string
  basePriceMGA: string
}

interface ProductPricingFormProps {
  formData: FormData
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
  itemVariants: Variants
}

export default function ProductPricingForm({
  formData,
  onInputChange,
  itemVariants,
}: ProductPricingFormProps) {
  return (
    <motion.div variants={itemVariants}>
      <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm'>
        <CardHeader className='space-y-2'>
          <div className='flex items-center gap-2'>
            <div className='p-2 bg-yellow-50 rounded-lg'>
              <Euro className='h-5 w-5 text-yellow-600' />
            </div>
            <div>
              <CardTitle className='text-xl'>Tarification</CardTitle>
              <p className='text-slate-600 text-sm mt-1'>Définissez vos prix de base par nuit</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                Prix de base par nuit (MGA) *
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
        </CardContent>
      </Card>
    </motion.div>
  )
}
