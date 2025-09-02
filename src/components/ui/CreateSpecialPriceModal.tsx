'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Calendar, Euro, DollarSign, Clock, CheckCircle } from 'lucide-react'
import { DayEnum } from '@prisma/client'

interface SpecialPrice {
  id: string
  pricesMga: string
  pricesEuro: string
  day: DayEnum[]
  startDate: Date | null
  endDate: Date | null
  activate: boolean
}

interface CreateSpecialPriceModalProps {
  isOpen: boolean
  onClose: () => void
  onSpecialPriceCreated: (specialPrice: Omit<SpecialPrice, 'id'>) => void
  editingSpecialPrice?: SpecialPrice | null
}

const DAYS: { value: DayEnum; label: string }[] = [
  { value: 'Monday', label: 'Lundi' },
  { value: 'Tuesday', label: 'Mardi' },
  { value: 'Wednesday', label: 'Mercredi' },
  { value: 'Thursday', label: 'Jeudi' },
  { value: 'Friday', label: 'Vendredi' },
  { value: 'Saturday', label: 'Samedi' },
  { value: 'Sunday', label: 'Dimanche' },
]

export default function CreateSpecialPriceModal({
  isOpen,
  onClose,
  onSpecialPriceCreated,
  editingSpecialPrice,
}: CreateSpecialPriceModalProps) {
  const [formData, setFormData] = useState({
    pricesMga: '',
    pricesEuro: '',
    day: [] as DayEnum[],
    startDate: '',
    endDate: '',
    activate: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Pré-remplir le formulaire en mode édition
  useEffect(() => {
    if (editingSpecialPrice) {
      setFormData({
        pricesMga: editingSpecialPrice.pricesMga,
        pricesEuro: editingSpecialPrice.pricesEuro,
        day: editingSpecialPrice.day,
        startDate: editingSpecialPrice.startDate 
          ? new Date(editingSpecialPrice.startDate).toISOString().split('T')[0]
          : '',
        endDate: editingSpecialPrice.endDate 
          ? new Date(editingSpecialPrice.endDate).toISOString().split('T')[0]
          : '',
        activate: editingSpecialPrice.activate,
      })
    } else {
      // Réinitialiser le formulaire en mode création
      setFormData({
        pricesMga: '',
        pricesEuro: '',
        day: [],
        startDate: '',
        endDate: '',
        activate: true,
      })
    }
  }, [editingSpecialPrice])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleDayToggle = (day: DayEnum) => {
    setFormData(prev => ({
      ...prev,
      day: prev.day.includes(day)
        ? prev.day.filter(d => d !== day)
        : [...prev.day, day],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const specialPriceData = {
        pricesMga: formData.pricesMga,
        pricesEuro: formData.pricesEuro,
        day: formData.day,
        startDate: formData.startDate ? new Date(formData.startDate) : null,
        endDate: formData.endDate ? new Date(formData.endDate) : null,
        activate: formData.activate,
      }

      onSpecialPriceCreated(specialPriceData)

      // Reset form
      setFormData({
        pricesMga: '',
        pricesEuro: '',
        day: [],
        startDate: '',
        endDate: '',
        activate: true,
      })

      onClose()
    } catch (error) {
      console.error('Erreur lors de la création du prix spécial:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = formData.pricesMga && formData.pricesEuro && formData.day.length > 0

  return (
    <AnimatePresence>
      {isOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center'>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='absolute inset-0 bg-black/50 backdrop-blur-sm'
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className='relative w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto'
          >
            <Card className='border-0 shadow-2xl bg-white'>
              <CardHeader className='space-y-2 border-b border-slate-200'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='p-2 bg-orange-100 rounded-lg'>
                      <Euro className='h-5 w-5 text-orange-600' />
                    </div>
                    <div>
                      <CardTitle className='text-xl text-slate-800'>
                        {editingSpecialPrice ? 'Modifier le prix spécial' : 'Ajouter un prix spécial'}
                      </CardTitle>
                      <p className='text-slate-600 text-sm mt-1'>
                        Définissez des tarifs spécifiques pour certaines périodes
                      </p>
                    </div>
                  </div>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={onClose}
                    className='text-slate-400 hover:text-slate-600'
                  >
                    <X className='h-5 w-5' />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className='p-6'>
                <form onSubmit={handleSubmit} className='space-y-6'>
                  {/* Prix */}
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className='space-y-2'>
                      <label htmlFor='pricesEuro' className='text-sm font-medium text-slate-700'>
                        Prix en euros (€)
                      </label>
                      <div className='relative'>
                        <DollarSign className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400' />
                        <Input
                          id='pricesEuro'
                          name='pricesEuro'
                          type='number'
                          step='0.01'
                          min='0'
                          placeholder='100.00'
                          value={formData.pricesEuro}
                          onChange={handleInputChange}
                          required
                          className='pl-10 border-slate-200 focus:border-orange-300 focus:ring-orange-200'
                        />
                      </div>
                    </div>

                    <div className='space-y-2'>
                      <label htmlFor='pricesMga' className='text-sm font-medium text-slate-700'>
                        Prix en Ariary (MGA)
                      </label>
                      <div className='relative'>
                        <Euro className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400' />
                        <Input
                          id='pricesMga'
                          name='pricesMga'
                          type='number'
                          min='0'
                          placeholder='400000'
                          value={formData.pricesMga}
                          onChange={handleInputChange}
                          required
                          className='pl-10 border-slate-200 focus:border-orange-300 focus:ring-orange-200'
                        />
                      </div>
                    </div>
                  </div>

                  {/* Jours de la semaine */}
                  <div className='space-y-3'>
                    <label className='text-sm font-medium text-slate-700'>
                      Jours de la semaine
                    </label>
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
                      {DAYS.map(day => (
                        <label
                          key={day.value}
                          className={`relative flex items-center p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm ${
                            formData.day.includes(day.value)
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-slate-200 bg-white hover:border-orange-300'
                          }`}
                        >
                          <input
                            type='checkbox'
                            checked={formData.day.includes(day.value)}
                            onChange={() => handleDayToggle(day.value)}
                            className='sr-only'
                          />
                          <div className='flex items-center space-x-2 w-full'>
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                formData.day.includes(day.value)
                                  ? 'border-orange-500 bg-orange-500'
                                  : 'border-slate-300'
                              }`}
                            >
                              {formData.day.includes(day.value) && (
                                <CheckCircle className='w-3 h-3 text-white' />
                              )}
                            </div>
                            <span className='text-sm font-medium text-slate-700'>
                              {day.label}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Période */}
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className='space-y-2'>
                      <label htmlFor='startDate' className='text-sm font-medium text-slate-700'>
                        Date de début (optionnel)
                      </label>
                      <div className='relative'>
                        <Calendar className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400' />
                        <Input
                          id='startDate'
                          name='startDate'
                          type='date'
                          value={formData.startDate}
                          onChange={handleInputChange}
                          className='pl-10 border-slate-200 focus:border-orange-300 focus:ring-orange-200'
                        />
                      </div>
                    </div>

                    <div className='space-y-2'>
                      <label htmlFor='endDate' className='text-sm font-medium text-slate-700'>
                        Date de fin (optionnel)
                      </label>
                      <div className='relative'>
                        <Calendar className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400' />
                        <Input
                          id='endDate'
                          name='endDate'
                          type='date'
                          value={formData.endDate}
                          onChange={handleInputChange}
                          className='pl-10 border-slate-200 focus:border-orange-300 focus:ring-orange-200'
                        />
                      </div>
                    </div>
                  </div>

                  {/* Activation */}
                  <div className='flex items-center space-x-2'>
                    <input
                      id='activate'
                      name='activate'
                      type='checkbox'
                      checked={formData.activate}
                      onChange={handleInputChange}
                      className='w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500'
                    />
                    <label htmlFor='activate' className='text-sm font-medium text-slate-700'>
                      Activer ce prix spécial
                    </label>
                  </div>

                  {/* Boutons */}
                  <div className='flex justify-end gap-3 pt-4 border-t border-slate-200'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={onClose}
                      disabled={isSubmitting}
                    >
                      Annuler
                    </Button>
                    <Button
                      type='submit'
                      disabled={!isFormValid || isSubmitting}
                      className='bg-orange-600 hover:bg-orange-700 text-white'
                    >
                      {isSubmitting ? (
                        <div className='flex items-center gap-2'>
                          <div className='w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin' />
                          Création...
                        </div>
                      ) : (
                        <div className='flex items-center gap-2'>
                          <CheckCircle className='h-4 w-4' />
                          {editingSpecialPrice ? 'Modifier le prix spécial' : 'Créer le prix spécial'}
                        </div>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
