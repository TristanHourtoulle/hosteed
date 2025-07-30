import { PaymentRequestModalProps } from './types'
import { PaymentMethod, PaymentStatus } from '@prisma/client'
import { formatCurrency } from './utils'

export default function PaymentRequestModal({
  isOpen,
  paymentType,
  prices,
  notes,
  method,
  updating,
  onClose,
  onNotesChange,
  onMethodChange,
  onSubmit,
}: PaymentRequestModalProps) {
  if (!isOpen) return null

  const getPaymentTypeLabel = () => {
    switch (paymentType) {
      case PaymentStatus.FULL_TRANSFER_REQ:
        return 'Demande de paiement intégral'
      case PaymentStatus.MID_TRANSFER_REQ:
        return 'Demande de paiement de 50%'
      case PaymentStatus.REST_TRANSFER_REQ:
        return 'Demande du solde restant'
      default:
        return 'Demande de paiement'
    }
  }

  const getPaymentAmount = () => {
    if (!prices) return '0€'

    switch (paymentType) {
      case PaymentStatus.FULL_TRANSFER_REQ:
        return formatCurrency(prices.totalPricesPayable)
      case PaymentStatus.MID_TRANSFER_REQ:
        return formatCurrency(prices.totalPricesPayable / 2)
      case PaymentStatus.REST_TRANSFER_REQ:
        return formatCurrency(prices.totalPricesPayable / 2)
      default:
        return '0€'
    }
  }

  return (
    <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100'>
        {/* Header avec icône */}
        <div className='bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-2xl'>
          <div className='flex items-center gap-3'>
            <div className='bg-white/20 p-2 rounded-lg'>
              <svg
                className='w-6 h-6 text-white'
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
            <div>
              <h2 className='text-xl font-bold text-white'>{getPaymentTypeLabel()}</h2>
              <p className='text-blue-100 text-sm'>Montant: {getPaymentAmount()}</p>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className='p-6 space-y-6'>
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
            <div className='flex items-start gap-3'>
              <svg
                className='w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0'
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
                <p className='text-blue-800 font-medium text-sm'>Information</p>
                <p className='text-blue-700 text-sm mt-1'>
                  Cette demande sera envoyée aux administrateurs pour validation. Vous et le
                  locataire recevrez une confirmation par email.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className='block text-sm font-semibold text-gray-700 mb-2'>
              <span className='flex items-center gap-2'>
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
                  />
                </svg>
                Méthode de paiement préférée
              </span>
            </label>
            <select
              value={method}
              onChange={e => onMethodChange(e.target.value as PaymentMethod)}
              className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'
            >
              <option value={PaymentMethod.SEPA_VIREMENT}>🏦 Virement SEPA</option>
              <option value={PaymentMethod.TAPTAP}>📱 Taptap</option>
              <option value={PaymentMethod.PAYPAL}>💳 PayPal</option>
              <option value={PaymentMethod.INTERNATIONAL}>🌍 Virement International</option>
              <option value={PaymentMethod.OTHER}>⚙️ Autre</option>
            </select>
          </div>

          <div>
            <label className='block text-sm font-semibold text-gray-700 mb-2'>
              <span className='flex items-center gap-2'>
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z'
                  />
                </svg>
                Notes complémentaires
                <span className='text-gray-400 text-xs'>(optionnel)</span>
              </span>
            </label>
            <textarea
              value={notes}
              onChange={e => onNotesChange(e.target.value)}
              className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none'
              rows={3}
              placeholder='Ajoutez des informations complémentaires (coordonnées bancaires, délais souhaités, etc.)'
            />
          </div>
        </div>

        {/* Footer avec boutons */}
        <div className='bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end gap-3'>
          <button
            onClick={onClose}
            className='px-6 py-2.5 text-gray-600 hover:text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition-colors'
            disabled={updating}
          >
            Annuler
          </button>
          <button
            onClick={onSubmit}
            disabled={updating}
            className='px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
          >
            {updating ? (
              <>
                <svg
                  className='w-4 h-4 animate-spin'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                  />
                </svg>
                Envoi en cours...
              </>
            ) : (
              <>
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 19l9 2-9-18-9 18 9-2zm0 0v-8'
                  />
                </svg>
                Envoyer la demande
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
