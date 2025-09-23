'use client'

import { motion, Variants } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Home } from 'lucide-react'
import { TypeRentInterface } from '@/lib/interface/typeRentInterface'

interface FormData {
  name: string
  description: string
  typeRentId: string
}

interface EditProductBasicInfoFormProps {
  formData: FormData
  typeRent: TypeRentInterface[]
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  itemVariants: Variants
}

export default function EditProductBasicInfoForm({
  formData,
  typeRent,
  onInputChange,
  itemVariants
}: EditProductBasicInfoFormProps) {
  return (
    <motion.div variants={itemVariants}>
      <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm relative z-50'>
        <CardHeader className='space-y-2'>
          <div className='flex items-center gap-2'>
            <div className='p-2 bg-blue-50 rounded-lg'>
              <Home className='h-5 w-5 text-blue-600' />
            </div>
            <div>
              <CardTitle className='text-xl'>Informations de base</CardTitle>
              <p className='text-slate-600 text-sm mt-1'>
                Modifiez les informations principales de votre hébergement
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='space-y-2'>
            <label htmlFor='name' className='text-sm font-medium text-slate-700'>
              Nom de l&apos;hébergement *
            </label>
            <Input
              id='name'
              name='name'
              placeholder='Ex: Villa avec vue sur mer'
              value={formData.name}
              onChange={onInputChange}
              required
              className='border-slate-200 focus:border-blue-300 focus:ring-blue-200'
            />
          </div>

          <div className='space-y-2'>
            <label htmlFor='description' className='text-sm font-medium text-slate-700'>
              Description *
            </label>
            <textarea
              id='description'
              name='description'
              placeholder='Décrivez votre hébergement, ses atouts, son environnement...'
              value={formData.description}
              onChange={onInputChange}
              required
              rows={4}
              className='w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:border-blue-300 focus:ring-1 focus:ring-blue-200 resize-none'
            />
          </div>

          <div className='space-y-2'>
            <label htmlFor='typeRentId' className='text-sm font-medium text-slate-700'>
              Type d&apos;hébergement *
            </label>
            <select
              id='typeRentId'
              name='typeRentId'
              value={formData.typeRentId}
              onChange={onInputChange}
              required
              className='w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:border-blue-300 focus:ring-1 focus:ring-blue-200'
            >
              <option value=''>Choisissez un type</option>
              {typeRent.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}