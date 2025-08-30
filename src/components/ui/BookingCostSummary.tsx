'use client'

import { ExtraPriceType } from '@prisma/client'
import { calculateTotalBookingCost, getExtraCostPreview } from '@/lib/utils/costCalculation'

interface ExtraWithPricing {
  id: string
  name: string
  description?: string | null
  priceEUR: number
  priceMGA: number
  type: ExtraPriceType
}

interface BookingCostSummaryProps {
  basePrice: number
  numberOfDays: number
  guestCount: number
  selectedExtras: ExtraWithPricing[]
  currency?: 'EUR' | 'MGA'
  startDate: Date
  endDate: Date
  className?: string
}

export default function BookingCostSummary({
  basePrice,
  numberOfDays,
  guestCount,
  selectedExtras,
  currency = 'EUR',
  startDate,
  endDate,
  className = ''
}: BookingCostSummaryProps) {
  const currencySymbol = currency === 'EUR' ? '€' : 'Ar'
  
  const bookingDetails = {
    startDate,
    endDate,
    guestCount
  }

  const { baseTotal, extrasTotal, grandTotal } = calculateTotalBookingCost(
    basePrice,
    numberOfDays,
    selectedExtras,
    bookingDetails,
    currency
  )

  return (
    <div className={`bg-gray-50 rounded-lg p-4 space-y-3 ${className}`}>
      <h3 className="font-semibold text-lg">Récapitulatif des coûts</h3>
      
      {/* Prix de base */}
      <div className="flex justify-between items-center">
        <span>Hébergement ({numberOfDays} jour{numberOfDays > 1 ? 's' : ''})</span>
        <span className="font-medium">{baseTotal.toFixed(2)}{currencySymbol}</span>
      </div>

      {/* Extras */}
      {selectedExtras.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Options supplémentaires :</div>
          {selectedExtras.map((extra) => {
            const { cost, description } = getExtraCostPreview(
              extra,
              numberOfDays,
              guestCount,
              currency
            )
            return (
              <div key={extra.id} className="flex justify-between items-start text-sm">
                <div className="flex-1 pr-2">
                  <div className="font-medium">{extra.name}</div>
                  <div className="text-gray-600 text-xs">{description}</div>
                </div>
                <span className="font-medium">{cost.toFixed(2)}{currencySymbol}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Séparateur */}
      <hr className="border-gray-300" />
      
      {/* Total */}
      <div className="flex justify-between items-center text-lg font-bold">
        <span>Total</span>
        <span>{grandTotal.toFixed(2)}{currencySymbol}</span>
      </div>

      {/* Détail des extras si applicable */}
      {extrasTotal > 0 && (
        <div className="text-xs text-gray-600">
          Dont {extrasTotal.toFixed(2)}{currencySymbol} d&apos;options supplémentaires
        </div>
      )}
    </div>
  )
}