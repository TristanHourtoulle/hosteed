'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollText, Cigarette, PawPrint, PartyPopper, KeyRound } from 'lucide-react'
import type { ProductFormData } from '@/types/product-form'

interface ProductRulesFormProps {
  formData: ProductFormData
  onChange: (field: keyof ProductFormData, value: unknown) => void
  itemVariants: {
    hidden: { opacity: number; y: number }
    visible: { opacity: number; y: number; transition: { duration: number } }
  }
}

const RULES_TOGGLES = [
  {
    key: 'smokingAllowed' as const,
    label: 'Fumeur autorisé',
    icon: Cigarette,
    description: "Les invités peuvent fumer dans l'hébergement",
  },
  {
    key: 'petsAllowed' as const,
    label: 'Animaux acceptés',
    icon: PawPrint,
    description: 'Les invités peuvent venir avec leurs animaux',
  },
  {
    key: 'eventsAllowed' as const,
    label: 'Événements autorisés',
    icon: PartyPopper,
    description: "Les fêtes et événements sont autorisés dans l'hébergement",
  },
  {
    key: 'selfCheckIn' as const,
    label: 'Self check-in',
    icon: KeyRound,
    description: "Les invités peuvent s'enregistrer eux-mêmes",
  },
]

/** Form section for property rules (smoking, pets, events, self check-in). */
export function ProductRulesForm({ formData, onChange, itemVariants }: ProductRulesFormProps) {
  return (
    <motion.div variants={itemVariants}>
      <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm'>
        <CardHeader className='space-y-2'>
          <div className='flex items-center gap-2'>
            <div className='p-2 bg-amber-50 rounded-lg'>
              <ScrollText className='h-5 w-5 text-amber-600' />
            </div>
            <div>
              <CardTitle className='text-xl'>Règles de la propriété</CardTitle>
              <p className='text-slate-600 text-sm mt-1'>
                Définissez ce qui est autorisé ou non dans votre hébergement
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-3'>
          {RULES_TOGGLES.map(({ key, label, icon: Icon, description }) => (
            <label
              key={key}
              className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm ${
                formData[key]
                  ? 'border-amber-300 bg-amber-50/50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className='flex items-center gap-3'>
                <Icon className={`h-4 w-4 ${formData[key] ? 'text-amber-600' : 'text-slate-400'}`} />
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
                  formData[key] ? 'bg-amber-500 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className='w-4 h-4 bg-white rounded-full mx-1 shadow-sm' />
              </div>
            </label>
          ))}

          {formData.selfCheckIn && (
            <div className='pl-10 mt-2'>
              <label className='text-sm font-medium text-slate-700'>
                Type de self check-in
              </label>
              <input
                type='text'
                value={formData.selfCheckInType || ''}
                onChange={(e) => onChange('selfCheckInType', e.target.value)}
                placeholder='Ex: Boîte à clés, Digicode, Serrure connectée...'
                className='mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent'
              />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
