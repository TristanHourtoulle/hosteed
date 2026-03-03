import { RentWithDates } from '@/lib/services/rents.service'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { Separator } from '@/components/ui/shadcnui/separator'
import { Wallet, CalendarDays, Package, Tag } from 'lucide-react'
import { PricingRow } from '@/components/reservations/PricingRow'
import { formatCurrencySafe } from '@/lib/utils/formatNumber'

interface PricingDetailsCardProps {
  rent: RentWithDates
}

interface DailyBreakdown {
  date: string
  basePrice: number
  finalPrice: number
  promotionApplied: boolean
  promotionDiscount?: number
  specialPriceApplied: boolean
  specialPriceValue?: number
  savings: number
}

interface ExtraDetail {
  extraId: string
  name: string
  quantity: number
  pricePerUnit: number
  total: number
}

interface PricingSnapshot {
  dailyBreakdown: DailyBreakdown[]
  extrasDetails: ExtraDetail[]
  summary: {
    numberOfNights: number
    averageNightlyPrice: number
    subtotal: number
    totalSavings: number
    extrasTotal: number
    clientCommission: number
    totalAmount: number
    promotionApplied: boolean
    specialPriceApplied: boolean
  }
  calculatedAt: string
}

export function PricingDetailsCard({ rent }: PricingDetailsCardProps) {
  const hasNewPricing =
    rent.numberOfNights !== null &&
    rent.numberOfNights !== undefined &&
    rent.subtotal !== null &&
    rent.subtotal !== undefined

  if (!hasNewPricing) {
    return (
      <Card className='border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl py-0 gap-0'>
        <div className='px-6 py-4 border-b border-gray-100'>
          <h2 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
            <Wallet className='h-5 w-5 text-blue-600' />
            Détail des prix
          </h2>
        </div>
        <CardContent className='p-6'>
          <div className='flex items-start gap-3 rounded-xl bg-yellow-50 border border-yellow-200 p-4'>
            <Tag className='h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5' />
            <div>
              <p className='text-yellow-800 font-medium'>Anciennes données</p>
              <p className='text-yellow-700 text-sm'>
                Cette réservation a été créée avant la mise à jour du système de tarification. Les
                détails complets ne sont pas disponibles.
              </p>
              <p className='text-yellow-900 font-semibold mt-2'>
                Prix total: {formatCurrencySafe(Number(rent.prices || 0))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  let pricingSnapshot: PricingSnapshot | null = null
  if (rent.pricingSnapshot && typeof rent.pricingSnapshot === 'object') {
    pricingSnapshot = rent.pricingSnapshot as unknown as PricingSnapshot
  }

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    })
  }

  return (
    <Card className='border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl py-0 gap-0'>
      <div className='px-6 py-4 border-b border-gray-100'>
        <h2 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
          <Wallet className='h-5 w-5 text-blue-600' />
          Détail des prix
        </h2>
      </div>
      <CardContent className='p-6'>
        <div className='space-y-6'>
          {/* Summary */}
          <div className='space-y-1'>
            <PricingRow
              label={`${formatCurrencySafe(rent.basePricePerNight)} × ${rent.numberOfNights || '-'} nuit${(rent.numberOfNights || 0) > 1 ? 's' : ''}`}
              value={formatCurrencySafe(rent.subtotal)}
            />

            {rent.discountAmount !== null &&
              rent.discountAmount !== undefined &&
              rent.discountAmount > 0 && (
                <PricingRow
                  label={`Réduction${rent.promotionApplied ? ' (promotion)' : ''}${rent.specialPriceApplied ? ' (prix spécial)' : ''}`}
                  value={`-${formatCurrencySafe(rent.discountAmount)}`}
                  color='text-green-600'
                  indent
                />
              )}

            {rent.totalSavings !== null &&
              rent.totalSavings !== undefined &&
              rent.totalSavings > 0 &&
              rent.totalSavings !== rent.discountAmount && (
                <PricingRow
                  label='Économies totales'
                  value={formatCurrencySafe(rent.totalSavings)}
                  color='text-green-600'
                  indent
                />
              )}

            {rent.extrasTotal !== null &&
              rent.extrasTotal !== undefined &&
              rent.extrasTotal > 0 && (
                <PricingRow label='Extras' value={formatCurrencySafe(rent.extrasTotal)} indent />
              )}

            <Separator className='my-2' />

            <PricingRow
              label='Commission client'
              value={formatCurrencySafe(rent.clientCommission)}
              indent
            />
            <PricingRow
              label='Commission hôte'
              value={formatCurrencySafe(rent.hostCommission)}
              indent
            />

            <Separator className='my-2' />

            <PricingRow
              label='Montant total client'
              value={formatCurrencySafe(rent.totalAmount)}
              bold
            />
            <div className='flex items-center justify-between pt-1'>
              <span className='text-sm text-gray-600'>Dont part plateforme</span>
              <span className='text-sm font-medium text-indigo-600'>
                {formatCurrencySafe(rent.platformAmount)}
              </span>
            </div>

            {/* Host amount highlighted */}
            <div className='mt-3 rounded-xl bg-emerald-50 border border-emerald-200 p-3'>
              <div className='flex items-center justify-between'>
                <span className='font-semibold text-emerald-700'>Vous recevez</span>
                <span className='text-xl font-bold text-emerald-900'>
                  {formatCurrencySafe(rent.hostAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Day-by-Day Breakdown */}
          {pricingSnapshot?.dailyBreakdown && pricingSnapshot.dailyBreakdown.length > 0 && (
            <div className='space-y-3'>
              <h3 className='font-semibold text-gray-800 flex items-center gap-2 text-sm'>
                <CalendarDays className='h-4 w-4 text-blue-600' />
                Détail par nuit
              </h3>

              <div className='space-y-1.5 max-h-64 overflow-y-auto'>
                {pricingSnapshot.dailyBreakdown.map((day, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between py-2 px-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors'
                  >
                    <span className='text-sm font-medium text-gray-800'>
                      {formatShortDate(day.date)}
                    </span>
                    <div className='flex items-center gap-3'>
                      {day.savings > 0 && (
                        <div className='flex items-center gap-1.5'>
                          {day.promotionApplied && (
                            <span className='text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium'>
                              Promo {day.promotionDiscount ? `-${day.promotionDiscount}%` : ''}
                            </span>
                          )}
                          {day.specialPriceApplied && (
                            <span className='text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium'>
                              Prix spécial
                            </span>
                          )}
                          <span className='text-xs text-gray-400 line-through'>
                            {formatCurrencySafe(day.basePrice)}
                          </span>
                        </div>
                      )}
                      <span className='text-sm font-semibold text-gray-900'>
                        {formatCurrencySafe(day.finalPrice)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extras */}
          {pricingSnapshot?.extrasDetails && pricingSnapshot.extrasDetails.length > 0 && (
            <div className='space-y-3'>
              <h3 className='font-semibold text-gray-800 flex items-center gap-2 text-sm'>
                <Package className='h-4 w-4 text-blue-600' />
                Extras sélectionnés
              </h3>

              <div className='space-y-1.5'>
                {pricingSnapshot.extrasDetails.map((extra, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between py-2 px-3 rounded-lg border border-gray-100'
                  >
                    <div>
                      <span className='text-sm font-medium text-gray-800'>{extra.name}</span>
                      <p className='text-xs text-gray-500'>
                        {formatCurrencySafe(extra.pricePerUnit)} &times; {extra.quantity}
                      </p>
                    </div>
                    <span className='text-sm font-semibold text-gray-900'>
                      {formatCurrencySafe(extra.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Calculation timestamp */}
          {pricingSnapshot?.calculatedAt && (
            <p className='text-xs text-gray-400 text-center pt-2 border-t border-gray-100'>
              Prix calculé le{' '}
              {new Date(pricingSnapshot.calculatedAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
