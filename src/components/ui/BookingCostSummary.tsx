'use client'

import { useState, useEffect } from 'react'
import { ExtraPriceType } from '@prisma/client'
import { calculateTotalBookingCost, getExtraCostPreview } from '@/lib/utils/costCalculation'
import { calculateTotalRentPrice, type CommissionCalculation } from '@/lib/services/commission.service'

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
  showCommissions?: boolean
}

export default function BookingCostSummary({
  basePrice,
  numberOfDays,
  guestCount,
  selectedExtras,
  currency = 'EUR',
  startDate,
  endDate,
  className = '',
  showCommissions = false
}: BookingCostSummaryProps) {
  const currencySymbol = currency === 'EUR' ? '€' : 'Ar'
  const [commissionCalc, setCommissionCalc] = useState<CommissionCalculation | null>(null)
  
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

  useEffect(() => {
    if (showCommissions && currency === 'EUR' && grandTotal > 0) {
      calculateTotalRentPrice(grandTotal, 1, 0)
        .then(setCommissionCalc)
        .catch(() => setCommissionCalc(null))
    }
  }, [showCommissions, currency, grandTotal])

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
      
      {/* Sous-total si commissions affichées */}
      {showCommissions && commissionCalc ? (
        <div className="flex justify-between items-center">
          <span>Sous-total</span>
          <span className="font-medium">{grandTotal.toFixed(2)}{currencySymbol}</span>
        </div>
      ) : (
        <div className="flex justify-between items-center text-lg font-bold">
          <span>Total</span>
          <span>{grandTotal.toFixed(2)}{currencySymbol}</span>
        </div>
      )}

      {/* Section commissions */}
      {showCommissions && commissionCalc && currency === 'EUR' && (
        <>
          <div className="space-y-2 bg-blue-50 rounded p-3 text-sm">
            <div className="font-medium text-blue-800">Répartition des commissions :</div>
            
            <div className="flex justify-between items-center">
              <span className="text-green-700">• Vous recevrez</span>
              <span className="font-medium text-green-700">
                {commissionCalc.hostReceives.toFixed(2)}€
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-red-600">• Commission hébergeur</span>
              <span className="font-medium text-red-600">
                -{commissionCalc.hostCommission.toFixed(2)}€
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-blue-600">• Commission client</span>
              <span className="font-medium text-blue-600">
                +{commissionCalc.clientCommission.toFixed(2)}€
              </span>
            </div>
          </div>

          {/* Total final avec commissions */}
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Prix final pour le client</span>
            <span className="text-blue-700">{commissionCalc.clientPays.toFixed(2)}€</span>
          </div>
        </>
      )}

      {/* Détail des extras si applicable */}
      {extrasTotal > 0 && !showCommissions && (
        <div className="text-xs text-gray-600">
          Dont {extrasTotal.toFixed(2)}{currencySymbol} d&apos;options supplémentaires
        </div>
      )}
    </div>
  )
}