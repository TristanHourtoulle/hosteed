'use client'

interface PaymentDetails {
  totalPricesPayable: number
  availablePrice: number
  pendingPrice: number
  transferredPrice: number
  commission: number
}

interface PaymentDetailsCardProps {
  paymentDetails: PaymentDetails
}

export default function PaymentDetailsCard({ paymentDetails }: PaymentDetailsCardProps) {
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    })
  }

  return (
    <div className='bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden'>
      <div className='bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-100'>
        <div className='flex items-center gap-3'>
          <div className='bg-blue-100 p-2 rounded-lg'>
            <svg
              className='w-6 h-6 text-blue-600'
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
          <h3 className='text-xl font-bold text-gray-900'>Détails du paiement</h3>
        </div>
      </div>

      <div className='p-6 space-y-4'>
        <div className='bg-blue-50 rounded-xl p-4 border border-blue-100'>
          <p className='text-sm font-medium text-blue-700 mb-2'>Prix total (sans commission)</p>
          <p className='text-2xl font-bold text-blue-900'>
            {formatCurrency(paymentDetails.totalPricesPayable)}
          </p>
        </div>

        <div className='bg-orange-50 rounded-xl p-4 border border-orange-100'>
          <p className='text-sm font-medium text-orange-700 mb-2'>
            Prix disponible pour l&apos;hôte
          </p>
          <p className='text-xl font-bold text-orange-900'>
            {formatCurrency(paymentDetails.availablePrice)}
          </p>
        </div>

        <div className='bg-yellow-50 rounded-xl p-4 border border-yellow-100'>
          <p className='text-sm font-medium text-yellow-700 mb-2'>Prix en attente de traitement</p>
          <p className='text-xl font-bold text-yellow-900'>
            {formatCurrency(paymentDetails.pendingPrice)}
          </p>
        </div>

        <div className='bg-green-50 rounded-xl p-4 border border-green-100'>
          <p className='text-sm font-medium text-green-700 mb-2'>
            Prix déjà viré à l&apos;hébergeur
          </p>
          <p className='text-xl font-bold text-green-900'>
            {formatCurrency(paymentDetails.transferredPrice)}
          </p>
        </div>

        <div className='bg-gray-50 rounded-xl p-4 border border-gray-100'>
          <p className='text-sm font-medium text-gray-700 mb-2'>Commission plateforme</p>
          <p className='text-xl font-bold text-gray-900'>{paymentDetails.commission}%</p>
        </div>

        <div className='mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200'>
          <p className='text-sm text-blue-800'>
            <strong>Note :</strong> Ces informations vous permettent de suivre l&apos;état du
            paiement à votre hôte. Le prix viré correspond au montant déjà transféré à
            l&apos;hébergeur après déduction de la commission plateforme.
          </p>
        </div>
      </div>
    </div>
  )
}
