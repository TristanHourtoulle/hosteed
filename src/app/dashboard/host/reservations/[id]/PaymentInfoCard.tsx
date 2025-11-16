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
  showSensitiveInfo?: boolean
}

export default function PaymentInfoCard({
  rent,
  prices,
  updating,
  onPaymentRequest,
  showSensitiveInfo = false,
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
        {/* Total dû à l'hôte */}
        <div className='bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200'>
          <p className='text-sm font-medium text-blue-700 mb-2 flex items-center gap-2'>
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
              <path d='M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z' />
              <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z' clipRule='evenodd' />
            </svg>
            Total dû à vous
          </p>
          <p className='text-3xl font-bold text-blue-900'>
            {prices ? formatCurrency(prices.totalPricesPayable) : '0 €'}
          </p>
          <p className='text-xs text-blue-600 mt-1'>Commission déduite</p>
        </div>

        {/* Statut des paiements */}
        <div className='grid grid-cols-3 gap-3'>
          <div className='bg-green-50 rounded-lg p-3 border border-green-200'>
            <p className='text-xs font-medium text-green-700 mb-1'>Reçu</p>
            <p className='text-lg font-bold text-green-900'>
              {prices ? formatCurrency(prices.transferredPrice) : '0 €'}
            </p>
          </div>

          <div className='bg-orange-50 rounded-lg p-3 border border-orange-200'>
            <p className='text-xs font-medium text-orange-700 mb-1'>En attente</p>
            <p className='text-lg font-bold text-orange-900'>
              {prices ? formatCurrency(prices.pendingPrice) : '0 €'}
            </p>
          </div>

          <div className='bg-blue-50 rounded-lg p-3 border border-blue-200'>
            <p className='text-xs font-medium text-blue-700 mb-1'>Disponible</p>
            <p className='text-lg font-bold text-blue-900'>
              {prices ? formatCurrency(prices.availablePrice) : '0 €'}
            </p>
          </div>
        </div>

        {/* Info message */}
        <div className='bg-gray-50 rounded-lg p-3 border border-gray-200'>
          <p className='text-xs text-gray-600 flex items-start gap-2'>
            <svg className='w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
              <path fillRule='evenodd' d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z' clipRule='evenodd' />
            </svg>
            <span>
              Le prix disponible représente ce que vous pouvez demander maintenant.
              {rent.product?.contract && ' Avec un contrat, vous pouvez demander le paiement dès la réservation confirmée.'}
            </span>
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

        {/* Debug Section - Only visible to admins and host managers */}
        {showSensitiveInfo && (
          <DebugSection rent={rent} prices={prices} calculatePaymentAmounts={() => paymentAmounts} />
        )}

        <div className='flex flex-col gap-4'>
          {/* Demande de 50% */}
          {rent?.payment === PaymentStatus.CLIENT_PAID &&
            (rent?.status === 'RESERVED' ||
              rent?.status === 'CHECKIN' ||
              rent?.product?.contract) && (
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
          {rent?.payment === PaymentStatus.CLIENT_PAID &&
            (rent?.status === 'RESERVED' ||
              rent?.status === 'CHECKOUT' ||
              rent?.product?.contract) && (
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
