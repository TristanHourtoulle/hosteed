'use client'

import { useState, useEffect } from 'react'
import { ExtraPriceType } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcnui/card'
import { getExtraCostPreview } from '@/lib/utils/costCalculation'
import { Check, Plus } from 'lucide-react'

interface ProductExtra {
  id: string
  name: string
  description: string | null
  priceEUR: number
  priceMGA: number
  type: ExtraPriceType
  userId: string | null
}

interface ExtraSelectionStepProps {
  productId: string
  numberOfDays: number
  guestCount: number
  currency?: 'EUR' | 'MGA'
  selectedExtraIds: string[]
  onSelectionChange: (selectedIds: string[]) => void
  onCostChange: (totalExtrasCost: number) => void
}

const PRICE_TYPE_LABELS: Record<ExtraPriceType, string> = {
  PER_DAY: 'par jour',
  PER_PERSON: 'par personne',
  PER_DAY_PERSON: 'par jour et par personne',
  PER_BOOKING: 'par réservation'
}

export default function ExtraSelectionStep({
  productId,
  numberOfDays,
  guestCount,
  currency = 'EUR',
  selectedExtraIds,
  onSelectionChange,
  onCostChange
}: ExtraSelectionStepProps) {
  const [extras, setExtras] = useState<ProductExtra[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchExtras = async () => {
      try {
        const response = await fetch(`/api/products/${productId}/extras`)
        if (response.ok) {
          const extrasData = await response.json()
          setExtras(extrasData)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des extras:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchExtras()
  }, [productId])

  useEffect(() => {
    // Calculer le coût total des extras sélectionnés
    const selectedExtras = extras.filter(extra => selectedExtraIds.includes(extra.id))
    const totalCost = selectedExtras.reduce((total, extra) => {
      const { cost } = getExtraCostPreview(extra, numberOfDays, guestCount, currency)
      return total + cost
    }, 0)
    
    onCostChange(totalCost)
  }, [selectedExtraIds, extras, numberOfDays, guestCount, currency, onCostChange])

  const handleExtraToggle = (extraId: string) => {
    const newSelection = selectedExtraIds.includes(extraId)
      ? selectedExtraIds.filter(id => id !== extraId)
      : [...selectedExtraIds, extraId]
    
    onSelectionChange(newSelection)
  }

  const currencySymbol = currency === 'EUR' ? '€' : 'Ar'

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">
            Chargement des options supplémentaires...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (extras.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Options supplémentaires
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Aucune option supplémentaire disponible pour ce logement.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Options supplémentaires
        </CardTitle>
        <p className="text-sm text-gray-600">
          Sélectionnez les services supplémentaires que vous souhaitez ajouter à votre réservation
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {extras.map(extra => {
            const isSelected = selectedExtraIds.includes(extra.id)
            const { cost, description } = getExtraCostPreview(extra, numberOfDays, guestCount, currency)
            
            return (
              <div
                key={extra.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => handleExtraToggle(extra.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {isSelected && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{extra.name}</h3>
                        {extra.description && (
                          <p className="text-sm text-gray-600 mt-1">{extra.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {description} • {PRICE_TYPE_LABELS[extra.type]}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg text-gray-900">
                      {cost.toFixed(2)}{currencySymbol}
                    </p>
                    {extra.type !== 'PER_BOOKING' && (
                      <p className="text-xs text-gray-500">
                        ({currency === 'EUR' ? extra.priceEUR : extra.priceMGA}{currencySymbol} {PRICE_TYPE_LABELS[extra.type]})
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        
        {selectedExtraIds.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Récapitulatif des options sélectionnées</h4>
            <div className="space-y-2">
              {extras
                .filter(extra => selectedExtraIds.includes(extra.id))
                .map(extra => {
                  const { cost } = getExtraCostPreview(extra, numberOfDays, guestCount, currency)
                  return (
                    <div key={extra.id} className="flex justify-between items-center text-sm">
                      <span>{extra.name}</span>
                      <span className="font-medium">{cost.toFixed(2)}{currencySymbol}</span>
                    </div>
                  )
                })
              }
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}