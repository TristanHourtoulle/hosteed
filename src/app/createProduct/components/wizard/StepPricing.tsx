'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Euro, Plus } from 'lucide-react'
import { ProductPricingForm } from '../index'
import { BookingCostSummary } from '@/components/ui/BookingCostSummary'
import CreateSpecialPriceModal from '@/components/ui/CreateSpecialPriceModal'
import type { FormData, SpecialPrice, ProductExtra } from '../../types'
import { DayEnum } from '@prisma/client'

const stepVariants = {
  enter: { opacity: 0, x: 30 },
  center: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -30, transition: { duration: 0.2 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

interface StepPricingProps {
  formData: FormData
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
  specialPrices: SpecialPrice[]
  setSpecialPrices: React.Dispatch<React.SetStateAction<SpecialPrice[]>>
  extras: ProductExtra[]
  hasFieldError?: (field: string) => boolean
  getFieldError?: (field: string) => string | undefined
}

export function StepPricing({
  formData,
  handleInputChange,
  specialPrices,
  setSpecialPrices,
  extras,
  hasFieldError,
  getFieldError,
}: StepPricingProps) {
  const [specialPriceModalOpen, setSpecialPriceModalOpen] = useState(false)

  const selectedExtras = useMemo(() => {
    return extras.filter(extra => formData.extraIds.includes(extra.id))
  }, [extras, formData.extraIds])

  const testBooking = useMemo(() => ({
    startDate: new Date(),
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    guestCount: 2,
  }), [])

  const numberOfDays = useMemo(() => {
    return Math.ceil(
      (testBooking.endDate.getTime() - testBooking.startDate.getTime()) / (1000 * 60 * 60 * 24)
    )
  }, [testBooking])

  const handleSpecialPriceCreated = (newSpecialPrice: Omit<SpecialPrice, 'id'>) => {
    const specialPriceWithId: SpecialPrice = {
      ...newSpecialPrice,
      id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    }
    setSpecialPrices(prev => [...prev, specialPriceWithId])
  }

  // priceMGA in wizard maps to basePriceMGA in ProductPricingForm
  const pricingHasFieldError = (field: string) => {
    const mappedField = field === 'basePriceMGA' ? 'priceMGA' : field
    return hasFieldError?.(mappedField) ?? false
  }
  const pricingGetFieldError = (field: string) => {
    const mappedField = field === 'basePriceMGA' ? 'priceMGA' : field
    return getFieldError?.(mappedField)
  }

  return (
    <motion.div
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="space-y-6"
    >
      <ProductPricingForm
        formData={{
          basePrice: formData.basePrice,
          basePriceMGA: formData.priceMGA,
        }}
        onInputChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
          if (e.target.name === 'basePriceMGA') {
            handleInputChange({
              ...e,
              target: { ...e.target, name: 'priceMGA' },
            } as React.ChangeEvent<HTMLInputElement>)
          } else {
            handleInputChange(e)
          }
        }}
        itemVariants={itemVariants}
        hasFieldError={pricingHasFieldError}
        getFieldError={pricingGetFieldError}
      />

      {/* Special Prices */}
      <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl">
        <CardHeader className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Euro className="h-5 w-5 text-orange-600" />
              </div>
              <CardTitle className="text-lg">Prix spéciaux</CardTitle>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setSpecialPriceModalOpen(true)}
              className="text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-2">
            {specialPrices.map(sp => (
              <div
                key={sp.id}
                className="flex items-center p-3 border rounded-lg bg-orange-50 border-orange-200"
              >
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-700">
                    {sp.pricesEuro}€ / {sp.pricesMga}Ar
                  </span>
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                    sp.activate ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {sp.activate ? 'Actif' : 'Inactif'}
                  </span>
                  <div className="text-xs text-slate-500 mt-1">
                    {sp.day.length > 0 && (
                      <span>
                        {sp.day.map(day => {
                          const dayNames: Record<DayEnum, string> = {
                            Monday: 'Lun', Tuesday: 'Mar', Wednesday: 'Mer',
                            Thursday: 'Jeu', Friday: 'Ven', Saturday: 'Sam', Sunday: 'Dim',
                          }
                          return dayNames[day]
                        }).join(', ')}
                      </span>
                    )}
                    {sp.startDate && sp.endDate && (
                      <span className="ml-2">
                        {new Date(sp.startDate).toLocaleDateString('fr-FR')} -{' '}
                        {new Date(sp.endDate).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {specialPrices.length === 0 && (
              <p className="text-center py-4 text-slate-500 text-sm">
                Aucun prix spécial défini
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cost Summary Preview */}
      {selectedExtras.length > 0 && formData.basePrice && (
        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-slate-700">Aperçu des coûts</h3>
            <BookingCostSummary
              basePrice={parseFloat(formData.basePrice) || 0}
              numberOfDays={numberOfDays}
              guestCount={testBooking.guestCount}
              selectedExtras={selectedExtras}
              currency="EUR"
              startDate={testBooking.startDate}
              endDate={testBooking.endDate}
              className="max-w-md"
              showCommissions={false}
            />
          </CardContent>
        </Card>
      )}

      <CreateSpecialPriceModal
        isOpen={specialPriceModalOpen}
        onClose={() => setSpecialPriceModalOpen(false)}
        onSpecialPriceCreated={handleSpecialPriceCreated}
      />
    </motion.div>
  )
}
