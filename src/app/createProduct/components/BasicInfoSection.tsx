'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Home } from 'lucide-react'
import MDEditor from '@uiw/react-md-editor'
import RichEditorGuide from '@/components/ui/RichEditorGuide'
import type { FormData } from '../types'

interface Type {
  id: string
  name: string
}

interface BasicInfoSectionProps {
  formData: FormData
  types: Type[]
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
  itemVariants: {
    hidden: { opacity: number; y: number }
    visible: { opacity: number; y: number; transition: { duration: number } }
  }
}

export default function BasicInfoSection({
  formData,
  types,
  handleInputChange,
  setFormData,
  itemVariants,
}: BasicInfoSectionProps) {
  return (
    <motion.div variants={itemVariants}>
      <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm'>
        <CardHeader className='space-y-2'>
          <div className='flex items-center gap-2'>
            <div className='p-2 bg-blue-50 rounded-lg'>
              <Home className='h-5 w-5 text-blue-600' />
            </div>
            <div>
              <CardTitle className='text-xl'>Informations principales</CardTitle>
              <p className='text-slate-600 text-sm mt-1'>
                Les informations essentielles de votre hébergement
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-2'>
              <label htmlFor='name' className='text-sm font-medium text-slate-700'>
                Nom de l&apos;hébergement
              </label>
              <Input
                id='name'
                name='name'
                type='text'
                value={formData.name}
                onChange={handleInputChange}
                placeholder='Ex: Villa avec vue sur mer'
                className='border-slate-200 focus:border-blue-300 focus:ring-blue-200'
              />
            </div>

            <div className='space-y-2'>
              <label htmlFor='typeId' className='text-sm font-medium text-slate-700'>
                Type d&apos;hébergement
              </label>
              <select
                id='typeId'
                name='typeId'
                value={formData.typeId}
                onChange={handleInputChange}
                required
                className='w-full px-3 py-2 border border-slate-200 rounded-md focus:border-blue-300 focus:ring-blue-200 focus:ring-2 focus:ring-opacity-50'
              >
                <option value=''>Sélectionnez un type</option>
                {types.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className='space-y-2'>
            <label htmlFor='description' className='text-sm font-medium text-slate-700'>
              Description détaillée
            </label>
            <div
              data-color-mode='light'
              className='rounded-md border border-slate-200 overflow-hidden'
            >
              <MDEditor
                value={formData.description}
                onChange={value => setFormData({ ...formData, description: value || '' })}
                height={400}
                preview='edit'
                className='!border-none'
                data-color-mode='light'
                visibleDragbar={false}
                textareaProps={{
                  placeholder:
                    "Décrivez votre hébergement en détail...\n\n**Points forts:**\n- Avantage 1\n- Avantage 2\n\n**Environnement:**\nDécrivez l'environnement de votre hébergement...",
                  required: true,
                }}
              />
            </div>
            <RichEditorGuide />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
