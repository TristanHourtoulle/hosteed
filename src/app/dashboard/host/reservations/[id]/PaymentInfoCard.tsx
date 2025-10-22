import { RentWithDates } from '@/lib/services/rents.service'
import { PayablePrices } from './types'
import { PaymentStatus } from '@prisma/client'
import { formatCurrency, calculatePaymentAmounts } from './utils'
import { formatPercentage } from '@/lib/utils/formatNumber'
import DebugSection from './DebugSection'

interface PaymentInfoCardProps {
  rent: RentWithDates
  prices: PayablePrices | null
  updating: boolean
  onPaymentRequest: (type: PaymentStatus) => void
}

export default function PaymentInfoCard({
  rent,
  prices,
  updating,
  onPaymentRequest,
}: PaymentInfoCardProps) {
  const paymentAmounts = calculatePaymentAmounts(rent)

  return (
    <div className='bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden'>
      <div className='bg-gradient-to-r from-emerald-50 to-green-50 p-6 border-b border-gray-100'>
        <div className='flex items-center gap-3'>
          <div className='bg-emerald-100 p-2 rounded-lg'>
            <svg
              className='w-6 h-6 text-emerald-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
              />
            </svg>
          </div>
          <h2 className='text-xl font-bold text-gray-900'>Informations financières</h2>
        </div>
      </div>

      <div className='p-6 space-y-4'>
        <div className='bg-blue-50 rounded-xl p-4 border border-blue-100'>
          <p className='text-sm font-medium text-blue-700 mb-2'>Prix total (sans commission)</p>
          <p className='text-2xl font-bold text-blue-900'>
            {prices ? formatCurrency(prices.totalPricesPayable) : '0 €'}
          </p>
        </div>

        <div className='bg-blue-50 rounded-xl p-4 border border-blue-100'>
          <p className='text-sm font-medium text-blue-700 mb-2'>Prix disponible</p>
          <p className='text-xl font-bold text-blue-900'>
            {prices ? formatCurrency(prices.availablePrice) : '0 €'}
          </p>
        </div>

        <div className='bg-orange-50 rounded-xl p-4 border border-orange-100'>
          <p className='text-sm font-medium text-orange-700 mb-2'>Prix en attente</p>
          <p className='text-xl font-bold text-orange-900'>
            {prices ? formatCurrency(prices.pendingPrice) : '0 €'}
          </p>
        </div>

        <div className='bg-green-50 rounded-xl p-4 border border-green-100'>
          <p className='text-sm font-medium text-green-700 mb-2'>Prix viré à l&apos;hébergeur</p>
          <p className='text-xl font-bold text-green-900'>
            {prices ? formatCurrency(prices.transferredPrice) : '0 €'}
          </p>
        </div>

        <div className='bg-gray-50 rounded-xl p-4 border border-gray-100'>
          <p className='text-sm font-medium text-gray-700 mb-2'>Commission</p>
          <p className='text-xl font-bold text-gray-900'>
            {formatPercentage((prices?.commission || 0) / 100)}
          </p>
        </div>
      </div>

      {/* Boutons de demande de paiement */}
      <div className='mt-8 space-y-4'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
          <svg
            className='w-5 h-5 text-blue-600'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
            />
          </svg>
          Demandes de paiement
        </h3>

        <DebugSection rent={rent} prices={prices} calculatePaymentAmounts={() => paymentAmounts} />

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {/* Demande de 50% */}
          {rent?.payment !== PaymentStatus.MID_TRANSFER_REQ &&
            rent?.payment !== PaymentStatus.MID_TRANSFER_DONE &&
            rent?.payment !== PaymentStatus.FULL_TRANSFER_REQ &&
            rent?.payment !== PaymentStatus.FULL_TRANSFER_DONE && (
              <button
                onClick={() => onPaymentRequest(PaymentStatus.MID_TRANSFER_REQ)}
                disabled={updating}
                className='bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl p-4 text-left transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed'
              >
                <div className='flex items-center gap-3 mb-2'>
                  <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
                    />
                  </svg>
                  <span className='font-semibold'>Demander 50%</span>
                </div>
                <p className='text-blue-100 text-sm'>
                  Demander le paiement de la moitié du montant dû
                </p>
                <p className='text-white font-bold mt-2'>
                  {formatCurrency(paymentAmounts.halfAmount)}
                </p>
              </button>
            )}

          {/* Demande du reste */}
          {rent.payment === PaymentStatus.MID_TRANSFER_DONE && (
            <button
              onClick={() => onPaymentRequest(PaymentStatus.REST_TRANSFER_REQ)}
              disabled={updating}
              className='bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl p-4 text-left transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <div className='flex items-center gap-3 mb-2'>
                <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
                  />
                </svg>
                <span className='font-semibold'>Demander le reste</span>
              </div>
              <p className='text-orange-100 text-sm'>Demander le solde restant du paiement</p>
              <p className='text-white font-bold mt-2'>
                {formatCurrency(paymentAmounts.halfAmount)}
              </p>
            </button>
          )}

          {/* Demande intégrale */}
          {rent?.payment !== PaymentStatus.FULL_TRANSFER_REQ &&
            rent?.payment !== PaymentStatus.FULL_TRANSFER_DONE &&
            rent?.payment !== PaymentStatus.MID_TRANSFER_REQ &&
            rent?.payment !== PaymentStatus.MID_TRANSFER_DONE && (
              <button
                onClick={() => onPaymentRequest(PaymentStatus.FULL_TRANSFER_REQ)}
                disabled={updating}
                className='bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl p-4 text-left transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed'
              >
                <div className='flex items-center gap-3 mb-2'>
                  <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
                    />
                  </svg>
                  <span className='font-semibold'>Demander le total</span>
                </div>
                <p className='text-green-100 text-sm'>
                  Demander le paiement intégral du montant dû
                </p>
                <p className='text-white font-bold mt-2'>
                  {formatCurrency(paymentAmounts.fullAmount)}
                </p>
              </button>
            )}
        </div>

        {/* Messages d'état */}
        {(rent.payment === PaymentStatus.MID_TRANSFER_REQ ||
          rent.payment === PaymentStatus.REST_TRANSFER_REQ ||
          rent.payment === PaymentStatus.FULL_TRANSFER_REQ) && (
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
                  d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
              <div>
                <p className='text-yellow-800 font-medium'>Demande en cours</p>
                <p className='text-yellow-700 text-sm'>
                  Votre demande de paiement a été envoyée aux administrateurs et est en cours de
                  traitement.
                </p>
              </div>
            </div>
          </div>
        )}

        {(rent.payment === PaymentStatus.MID_TRANSFER_DONE ||
          rent.payment === PaymentStatus.REST_TRANSFER_DONE ||
          rent.payment === PaymentStatus.FULL_TRANSFER_DONE) && (
          <div className='bg-green-50 border border-green-200 rounded-xl p-4'>
            <div className='flex items-center gap-3'>
              <svg
                className='w-5 h-5 text-green-600 flex-shrink-0'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
              <div>
                <p className='text-green-800 font-medium'>Paiement approuvé</p>
                <p className='text-green-700 text-sm'>
                  Votre demande de paiement a été approuvée et le virement va être effectué.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
