import { RentWithDates } from '@/lib/services/rents.service'
import { formatDate } from './utils'

interface ReservationDetailsCardProps {
  rent: RentWithDates
  showSensitiveInfo?: boolean
}

export default function ReservationDetailsCard({
  rent,
  showSensitiveInfo = false,
}: ReservationDetailsCardProps) {
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
                d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          </div>
          <h2 className='text-xl font-bold text-gray-900'>Informations de la réservation</h2>
        </div>
      </div>

      <div className='p-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-6'>
            <div className='bg-gray-50 rounded-xl p-4'>
              <div className='flex items-center gap-3 mb-3'>
                <svg
                  className='w-5 h-5 text-gray-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                  />
                </svg>
                <p className='text-sm font-medium text-gray-600'>Propriété</p>
              </div>
              <p className='text-lg font-semibold text-gray-900'>
                {rent.product?.name || 'Non spécifié'}
              </p>
            </div>

            <div className='bg-gray-50 rounded-xl p-4'>
              <div className='flex items-center gap-3 mb-3'>
                <svg
                  className='w-5 h-5 text-gray-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                  />
                </svg>
                <p className='text-sm font-medium text-gray-600'>Locataire</p>
              </div>
              <p className='text-lg font-semibold text-gray-900'>
                {rent.user?.name || 'Non spécifié'}
              </p>
              <p className='text-sm text-gray-500 mt-1'>{rent.user?.email || 'Non spécifié'}</p>
            </div>

            <div className='bg-purple-50 rounded-xl p-4'>
              <div className='flex items-center gap-3 mb-3'>
                <svg
                  className='w-5 h-5 text-purple-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                  />
                </svg>
                <p className='text-sm font-medium text-purple-700'>Nombre de voyageurs</p>
              </div>
              <p className='text-lg font-semibold text-gray-900'>
                {rent.numberPeople
                  ? `${Number(rent.numberPeople)} ${Number(rent.numberPeople) > 1 ? 'personnes' : 'personne'}`
                  : 'Non spécifié'}
              </p>
            </div>
          </div>

          <div className='space-y-6'>
            <div className='bg-green-50 rounded-xl p-4'>
              <div className='flex items-center gap-3 mb-3'>
                <svg
                  className='w-5 h-5 text-green-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                  />
                </svg>
                <p className='text-sm font-medium text-green-700'>Date d&apos;arrivée</p>
              </div>
              <p className='text-lg font-semibold text-gray-900'>
                {rent.arrivingDate ? formatDate(rent.arrivingDate) : 'Non spécifiée'}
              </p>
            </div>

            <div className='bg-red-50 rounded-xl p-4'>
              <div className='flex items-center gap-3 mb-3'>
                <svg
                  className='w-5 h-5 text-red-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                  />
                </svg>
                <p className='text-sm font-medium text-red-700'>Date de départ</p>
              </div>
              <p className='text-lg font-semibold text-gray-900'>
                {rent.leavingDate ? formatDate(rent.leavingDate) : 'Non spécifiée'}
              </p>
            </div>

            {rent.numberOfNights && (
              <div className='bg-blue-50 rounded-xl p-4'>
                <div className='flex items-center gap-3 mb-3'>
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
                      d='M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z'
                    />
                  </svg>
                  <p className='text-sm font-medium text-blue-700'>Durée du séjour</p>
                </div>
                <p className='text-lg font-semibold text-gray-900'>
                  {rent.numberOfNights} {rent.numberOfNights > 1 ? 'nuits' : 'nuit'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stripe Payment ID - Only visible to admins and host managers */}
        {showSensitiveInfo && rent.stripeId && (
          <div className='mt-6 bg-yellow-50 rounded-xl p-4 border border-yellow-200'>
            <div className='flex items-center gap-3'>
              <svg
                className='w-5 h-5 text-yellow-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                />
              </svg>
              <div className='flex-1'>
                <p className='text-xs font-semibold text-yellow-700 flex items-center gap-1'>
                  🔒 ID de paiement Stripe (sensible)
                </p>
                <p className='text-sm font-mono text-gray-900 mt-1'>{rent.stripeId}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
