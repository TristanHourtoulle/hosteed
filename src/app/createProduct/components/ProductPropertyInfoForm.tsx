'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, TrendingUp, ArrowUpFromLine, Accessibility, PawPrint } from 'lucide-react'
import type { ProductFormData } from '@/types/product-form'

interface ProductPropertyInfoFormProps {
  formData: ProductFormData
  onChange: (field: keyof ProductFormData, value: unknown) => void
  itemVariants: {
    hidden: { opacity: number; y: number }
    visible: { opacity: number; y: number; transition: { duration: number } }
  }
}

const PROPERTY_TOGGLES = [
  {
    key: 'hasStairs' as const,
    label: 'Escaliers',
    icon: TrendingUp,
    description: "L'hébergement possède des escaliers",
  },
  {
    key: 'hasElevator' as const,
    label: 'Ascenseur',
    icon: ArrowUpFromLine,
    description: 'Un ascenseur est disponible',
  },
  {
    key: 'hasHandicapAccess' as const,
    label: 'Accès handicapé',
    icon: Accessibility,
    description: "L'hébergement est accessible aux personnes à mobilité réduite",
  },
  {
    key: 'hasPetsOnProperty' as const,
    label: 'Animaux sur place',
    icon: PawPrint,
    description: 'Des animaux sont présents sur la propriété',
  },
]

/** Form section for property information (stairs, elevator, handicap access, pets on property). */
export function ProductPropertyInfoForm({ formData, onChange, itemVariants }: ProductPropertyInfoFormProps) {
  return (
    <motion.div variants={itemVariants}>
      <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm'>
        <CardHeader className='space-y-2'>
          <div className='flex items-center gap-2'>
            <div className='p-2 bg-indigo-50 rounded-lg'>
              <Building2 className='h-5 w-5 text-indigo-600' />
            </div>
            <div>
              <CardTitle className='text-xl'>Informations sur la propriété</CardTitle>
              <p className='text-slate-600 text-sm mt-1'>
                Détails pratiques sur les accès et la configuration de votre hébergement
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-3'>
          {PROPERTY_TOGGLES.map(({ key, label, icon: Icon, description }) => (
            <label
              key={key}
              className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm ${
                formData[key]
                  ? 'border-indigo-300 bg-indigo-50/50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className='flex items-center gap-3'>
                <Icon className={`h-4 w-4 ${formData[key] ? 'text-indigo-600' : 'text-slate-400'}`} />
                <div>
                  <p className='text-sm font-medium text-slate-700'>{label}</p>
                  <p className='text-xs text-slate-500'>{description}</p>
                </div>
              </div>
              <input
                type='checkbox'
                checked={!!formData[key]}
                onChange={(e) => onChange(key, e.target.checked)}
                className='sr-only'
              />
              <div
                className={`w-10 h-6 rounded-full transition-colors duration-200 flex items-center ${
                  formData[key] ? 'bg-indigo-500 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className='w-4 h-4 bg-white rounded-full mx-1 shadow-sm' />
              </div>
            </label>
          ))}

          <div className='mt-4'>
            <label className='text-sm font-medium text-slate-700'>
              Notes complémentaires
            </label>
            <textarea
              value={formData.additionalNotes || ''}
              onChange={(e) => onChange('additionalNotes', e.target.value)}
              placeholder="Informations supplémentaires sur la propriété (accès, parking, etc.)..."
              rows={3}
              className='mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none'
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
