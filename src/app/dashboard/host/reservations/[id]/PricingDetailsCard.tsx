import { RentWithDates } from '@/lib/services/rents.service'
import { formatCurrency } from './utils'

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

export default function PricingDetailsCard({ rent }: PricingDetailsCardProps) {
  // Check if we have new pricing fields
  const hasNewPricing =
    rent.numberOfNights !== null &&
    rent.numberOfNights !== undefined &&
    rent.subtotal !== null &&
    rent.subtotal !== undefined

  if (!hasNewPricing) {
    // Fallback for legacy data
    return (
      <div className='bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden'>
        <div className='bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-gray-100'>
          <div className='flex items-center gap-3'>
            <div className='bg-purple-100 p-2 rounded-lg'>
              <svg
                className='w-6 h-6 text-purple-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z'
                />
              </svg>
            </div>
            <h2 className='text-xl font-bold text-gray-900'>Détails de tarification</h2>
          </div>
        </div>

        <div className='p-6'>
          <div className='bg-yellow-50 border border-yellow-200 rounded-xl p-4'>
            <div className='flex items-center gap-3'>
              <svg
                className='w-5 h-5 text-yellow-600 flex-shrink-0'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
              <div>
                <p className='text-yellow-800 font-medium'>Anciennes données</p>
                <p className='text-yellow-700 text-sm'>
                  Cette réservation a été créée avant la mise à jour du système de tarification.
                  Les détails complets ne sont pas disponibles.
                </p>
                <p className='text-yellow-900 font-semibold mt-2'>
                  Prix total: {formatCurrency(Number(rent.prices || 0))}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Parse pricingSnapshot if available
  let pricingSnapshot: PricingSnapshot | null = null
  if (rent.pricingSnapshot && typeof rent.pricingSnapshot === 'object') {
    pricingSnapshot = rent.pricingSnapshot as unknown as PricingSnapshot
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className='bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden'>
      {/* Header */}
      <div className='bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-gray-100'>
        <div className='flex items-center gap-3'>
          <div className='bg-purple-100 p-2 rounded-lg'>
            <svg
              className='w-6 h-6 text-purple-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z'
              />
            </svg>
          </div>
          <div>
            <h2 className='text-xl font-bold text-gray-900'>Détails de tarification</h2>
            <p className='text-sm text-gray-600'>Décomposition complète du prix</p>
          </div>
        </div>
      </div>

      <div className='p-6 space-y-6'>
        {/* Summary Section */}
        <div className='space-y-3'>
          <h3 className='font-semibold text-gray-900 flex items-center gap-2'>
            <svg className='w-5 h-5 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' />
            </svg>
            Résumé
          </h3>

          <div className='bg-gray-50 rounded-xl p-4 space-y-2'>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-gray-600'>Nombre de nuits</span>
              <span className='font-semibold text-gray-900'>{rent.numberOfNights}</span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-gray-600'>Prix moyen par nuit</span>
              <span className='font-semibold text-gray-900'>
                {formatCurrency(Number(rent.basePricePerNight || 0))}
              </span>
            </div>
            <div className='border-t border-gray-200 my-2'></div>
            <div className='flex justify-between items-center'>
              <span className='text-sm font-medium text-gray-700'>Sous-total hébergement</span>
              <span className='font-bold text-gray-900'>
                {formatCurrency(Number(rent.subtotal || 0))}
              </span>
            </div>
          </div>

          {/* Badges for promotions/special prices */}
          {(rent.promotionApplied || rent.specialPriceApplied) && (
            <div className='flex flex-wrap gap-2'>
              {rent.promotionApplied && (
                <div className='bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1'>
                  <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                  </svg>
                  Promotion appliquée
                </div>
              )}
              {rent.specialPriceApplied && (
                <div className='bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1'>
                  <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                  </svg>
                  Prix spécial appliqué
                </div>
              )}
            </div>
          )}

          {/* Savings */}
          {rent.totalSavings && rent.totalSavings > 0 && (
            <div className='bg-green-50 border border-green-200 rounded-xl p-3'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium text-green-700'>Économies réalisées</span>
                <span className='text-lg font-bold text-green-700'>
                  -{formatCurrency(Number(rent.totalSavings))}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Day-by-Day Breakdown */}
        {pricingSnapshot?.dailyBreakdown && pricingSnapshot.dailyBreakdown.length > 0 && (
          <div className='space-y-3'>
            <h3 className='font-semibold text-gray-900 flex items-center gap-2'>
              <svg className='w-5 h-5 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
              </svg>
              Détail par nuit
            </h3>

            <div className='space-y-2 max-h-64 overflow-y-auto'>
              {pricingSnapshot.dailyBreakdown.map((day, index) => (
                <div key={index} className='bg-gray-50 rounded-lg p-3 text-sm'>
                  <div className='flex justify-between items-start mb-1'>
                    <span className='font-medium text-gray-900'>{formatDate(day.date)}</span>
                    <div className='text-right'>
                      {day.savings > 0 ? (
                        <>
                          <span className='text-gray-400 line-through text-xs'>
                            {formatCurrency(day.basePrice)}
                          </span>
                          <span className='font-bold text-gray-900 ml-2'>
                            {formatCurrency(day.finalPrice)}
                          </span>
                        </>
                      ) : (
                        <span className='font-bold text-gray-900'>
                          {formatCurrency(day.finalPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                  {day.savings > 0 && (
                    <div className='flex items-center gap-1 text-xs text-green-600'>
                      {day.promotionApplied && (
                        <span className='bg-green-100 px-2 py-0.5 rounded'>
                          Promo -{day.promotionDiscount}%
                        </span>
                      )}
                      {day.specialPriceApplied && (
                        <span className='bg-blue-100 text-blue-600 px-2 py-0.5 rounded'>
                          Prix spécial
                        </span>
                      )}
                      <span className='ml-auto font-medium'>
                        -{formatCurrency(day.savings)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Extras Section */}
        {pricingSnapshot?.extrasDetails && pricingSnapshot.extrasDetails.length > 0 && (
          <div className='space-y-3'>
            <h3 className='font-semibold text-gray-900 flex items-center gap-2'>
              <svg className='w-5 h-5 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6v6m0 0v6m0-6h6m-6 0H6' />
              </svg>
              Extras sélectionnés
            </h3>

            <div className='space-y-2'>
              {pricingSnapshot.extrasDetails.map((extra, index) => (
                <div key={index} className='bg-gray-50 rounded-lg p-3 text-sm'>
                  <div className='flex justify-between items-start'>
                    <div>
                      <span className='font-medium text-gray-900'>{extra.name}</span>
                      <p className='text-xs text-gray-500'>
                        {formatCurrency(extra.pricePerUnit)} × {extra.quantity}
                      </p>
                    </div>
                    <span className='font-bold text-gray-900'>
                      {formatCurrency(extra.total)}
                    </span>
                  </div>
                </div>
              ))}
              <div className='bg-purple-50 border border-purple-200 rounded-lg p-3'>
                <div className='flex justify-between items-center'>
                  <span className='text-sm font-medium text-purple-700'>Total extras</span>
                  <span className='font-bold text-purple-900'>
                    {formatCurrency(Number(rent.extrasTotal || 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Commission Breakdown */}
        <div className='space-y-3'>
          <h3 className='font-semibold text-gray-900 flex items-center gap-2'>
            <svg className='w-5 h-5 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' />
            </svg>
            Répartition financière
          </h3>

          <div className='space-y-2'>
            <div className='bg-gray-50 rounded-lg p-3'>
              <div className='space-y-2 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Sous-total hébergement</span>
                  <span className='text-gray-900'>{formatCurrency(Number(rent.subtotal || 0))}</span>
                </div>
                {rent.extrasTotal && rent.extrasTotal > 0 && (
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Extras</span>
                    <span className='text-gray-900'>{formatCurrency(Number(rent.extrasTotal))}</span>
                  </div>
                )}
                <div className='border-t border-gray-200 pt-2'>
                  <div className='flex justify-between font-medium'>
                    <span className='text-gray-700'>Sous-total avant commission</span>
                    <span className='text-gray-900'>
                      {formatCurrency(Number(rent.subtotal || 0) + Number(rent.extrasTotal || 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
              <div className='space-y-2 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-blue-700'>Commission client</span>
                  <span className='text-blue-900 font-medium'>
                    +{formatCurrency(Number(rent.clientCommission || 0))}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-blue-700'>Commission hôte</span>
                  <span className='text-blue-900 font-medium'>
                    -{formatCurrency(Number(rent.hostCommission || 0))}
                  </span>
                </div>
                <div className='border-t border-blue-300 pt-2'>
                  <div className='flex justify-between font-semibold'>
                    <span className='text-blue-800'>Commission plateforme</span>
                    <span className='text-blue-900'>
                      {formatCurrency(Number(rent.platformAmount || 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className='bg-green-50 border border-green-200 rounded-lg p-3'>
              <div className='flex justify-between items-center'>
                <span className='font-semibold text-green-700'>Vous recevez</span>
                <span className='text-xl font-bold text-green-900'>
                  {formatCurrency(Number(rent.hostAmount || 0))}
                </span>
              </div>
            </div>

            <div className='bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4'>
              <div className='flex justify-between items-center'>
                <span className='text-lg font-bold text-gray-900'>Prix total client</span>
                <span className='text-2xl font-bold text-purple-900'>
                  {formatCurrency(Number(rent.totalAmount || 0))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Calculation timestamp */}
        {pricingSnapshot?.calculatedAt && (
          <div className='text-xs text-gray-500 text-center pt-4 border-t border-gray-200'>
            Prix calculé le {new Date(pricingSnapshot.calculatedAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}
      </div>
    </div>
  )
}
