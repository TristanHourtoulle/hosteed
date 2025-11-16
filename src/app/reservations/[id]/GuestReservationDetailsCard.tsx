import { Reservation } from './types'
import { Calendar, Users, Moon } from 'lucide-react'

interface GuestReservationDetailsCardProps {
  reservation: Reservation
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function GuestReservationDetailsCard({
  reservation,
}: GuestReservationDetailsCardProps) {
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
          <h2 className='text-xl font-bold text-gray-900'>Détails de votre séjour</h2>
        </div>
      </div>

      <div className='p-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* Dates section */}
          <div className='space-y-6'>
            <div className='bg-green-50 rounded-xl p-4'>
              <div className='flex items-center gap-3 mb-3'>
                <Calendar className='w-5 h-5 text-green-600' />
                <p className='text-sm font-medium text-green-700'>Date d&apos;arrivée</p>
              </div>
              <p className='text-lg font-semibold text-gray-900'>
                {formatDate(reservation.arrivingDate)}
              </p>
            </div>

            <div className='bg-red-50 rounded-xl p-4'>
              <div className='flex items-center gap-3 mb-3'>
                <Calendar className='w-5 h-5 text-red-600' />
                <p className='text-sm font-medium text-red-700'>Date de départ</p>
              </div>
              <p className='text-lg font-semibold text-gray-900'>
                {formatDate(reservation.leavingDate)}
              </p>
            </div>
          </div>

          {/* Details section */}
          <div className='space-y-6'>
            {reservation.numberOfNights && (
              <div className='bg-blue-50 rounded-xl p-4'>
                <div className='flex items-center gap-3 mb-3'>
                  <Moon className='w-5 h-5 text-blue-600' />
                  <p className='text-sm font-medium text-blue-700'>Durée du séjour</p>
                </div>
                <p className='text-lg font-semibold text-gray-900'>
                  {reservation.numberOfNights} {reservation.numberOfNights > 1 ? 'nuits' : 'nuit'}
                </p>
              </div>
            )}

            <div className='bg-purple-50 rounded-xl p-4'>
              <div className='flex items-center gap-3 mb-3'>
                <Users className='w-5 h-5 text-purple-600' />
                <p className='text-sm font-medium text-purple-700'>Nombre de voyageurs</p>
              </div>
              <p className='text-lg font-semibold text-gray-900'>
                {reservation.numberPeople
                  ? `${Number(reservation.numberPeople)} ${Number(reservation.numberPeople) > 1 ? 'personnes' : 'personne'}`
                  : 'Non spécifié'}
              </p>
            </div>
          </div>
        </div>

        {/* Property name */}
        <div className='mt-6 bg-gray-50 rounded-xl p-4'>
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
            {reservation.product?.name || 'Non spécifié'}
          </p>
        </div>
      </div>
    </div>
  )
}
