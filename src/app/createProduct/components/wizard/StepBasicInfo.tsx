'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Home, Users } from 'lucide-react'
import { TiptapEditor } from '@/components/ui/TiptapEditor'
import { FieldLabel } from './FieldLabel'
import type { FormData } from '../../types'
import { TypeRentInterface } from '@/lib/interface/typeRentInterface'

const stepVariants = {
  enter: { opacity: 0, x: 30 },
  center: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -30, transition: { duration: 0.2 } },
}

interface StepBasicInfoProps {
  formData: FormData
  types: TypeRentInterface[]
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
  hasFieldError?: (field: string) => boolean
  getFieldError?: (field: string) => string | undefined
}

export function StepBasicInfo({
  formData,
  types,
  handleInputChange,
  setFormData,
  hasFieldError,
  getFieldError,
}: StepBasicInfoProps) {
  return (
    <motion.div
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="space-y-6"
    >
      {/* Basic Info Card */}
      <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl">
        <CardHeader className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Home className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Informations principales</CardTitle>
              <p className="text-slate-500 text-sm mt-0.5">
                Les informations essentielles de votre hébergement
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <FieldLabel htmlFor="name" required error={getFieldError?.('name')}>
                Nom de l&apos;hébergement
              </FieldLabel>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ex: Villa avec vue sur mer"
                className={`border-slate-200 focus:border-blue-300 focus:ring-blue-200 ${hasFieldError?.('name') ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : ''}`}
              />
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="typeId" required error={getFieldError?.('typeId')}>
                Type d&apos;hébergement
              </FieldLabel>
              <select
                id="typeId"
                name="typeId"
                value={formData.typeId}
                onChange={handleInputChange}
                required
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-opacity-50 ${hasFieldError?.('typeId') ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-slate-200 focus:border-blue-300 focus:ring-blue-200'}`}
              >
                <option value="">Sélectionnez un type</option>
                {types.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="description" required error={getFieldError?.('description')}>
              Description détaillée
            </FieldLabel>
            <TiptapEditor
              content={formData.description}
              onChange={(html) => setFormData(prev => ({ ...prev, description: html }))}
              placeholder="Décrivez votre hébergement en détail..."
              className={hasFieldError?.('description') ? 'border-red-300' : ''}
            />
          </div>
        </CardContent>
      </Card>

      {/* Hotel Configuration - Conditional */}
      {formData.isHotel && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-2xl">
          <CardHeader className="px-6 py-4 border-b border-amber-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Users className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <CardTitle className="text-lg text-amber-900">Configuration Hôtel</CardTitle>
                <p className="text-amber-700 text-sm mt-0.5">
                  Configuration spécifique pour la gestion hôtelière
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <FieldLabel htmlFor="hotelName" required error={getFieldError?.('hotelName')} className="text-amber-800">
                  Nom de l&apos;hôtel
                </FieldLabel>
                <Input
                  id="hotelName"
                  name="hotelName"
                  type="text"
                  placeholder="Ex: Hôtel des Jardins"
                  value={formData.hotelName}
                  onChange={handleInputChange}
                  className={`bg-white/80 ${hasFieldError?.('hotelName') ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-amber-200 focus:border-amber-400 focus:ring-amber-200'}`}
                />
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="availableRooms" required error={getFieldError?.('availableRooms')} className="text-amber-800">
                  Nombre de chambres disponibles
                </FieldLabel>
                <Input
                  id="availableRooms"
                  name="availableRooms"
                  type="number"
                  min="1"
                  placeholder="Ex: 5"
                  value={formData.availableRooms}
                  onChange={handleInputChange}
                  className={`bg-white/80 ${hasFieldError?.('availableRooms') ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-amber-200 focus:border-amber-400 focus:ring-amber-200'}`}
                />
              </div>
            </div>

            <div className="bg-amber-100 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-amber-200 rounded-full">
                  <Home className="h-4 w-4 text-amber-700" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-amber-800 mb-1">
                    Fonctionnement Hôtelier
                  </h4>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Cette chambre représente un type de chambre dans votre hôtel. Si vous avez{' '}
                    <span className="font-semibold">{formData.availableRooms || 'X'}</span>{' '}
                    chambres de ce type, plusieurs clients pourront réserver en même temps.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}
