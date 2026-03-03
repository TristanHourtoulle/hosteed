import { RentWithDates } from '@/lib/services/rents.service'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import {
  CalendarDays,
  Home,
  MapPin,
  Moon,
  Users,
  Lock,
} from 'lucide-react'

interface ReservationDetailsCardProps {
  rent: RentWithDates
  showSensitiveInfo?: boolean
}

function formatDate(date: Date | string | null | undefined) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function ReservationDetailsCard({
  rent,
  showSensitiveInfo = false,
}: ReservationDetailsCardProps) {
  return (
    <Card className='border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl py-0 gap-0'>
      <div className='px-6 py-4 border-b border-gray-100'>
        <h2 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
          <CalendarDays className='h-5 w-5 text-blue-600' />
          Détails du séjour
        </h2>
      </div>
      <CardContent className='p-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* Property */}
          <div className='space-y-3'>
            <div className='flex items-start gap-3'>
              <Home className='h-5 w-5 text-gray-400 mt-0.5' />
              <div>
                <p className='text-xs text-gray-500 uppercase tracking-wide'>Hébergement</p>
                <p className='font-medium text-gray-900'>
                  {rent.product?.name || 'Non spécifié'}
                </p>
              </div>
            </div>
            {rent.product?.address && (
              <div className='flex items-start gap-3'>
                <MapPin className='h-5 w-5 text-gray-400 mt-0.5' />
                <div>
                  <p className='text-xs text-gray-500 uppercase tracking-wide'>Adresse</p>
                  <p className='text-gray-800'>{rent.product.address}</p>
                </div>
              </div>
            )}
          </div>

          {/* Stay Info */}
          <div className='space-y-3'>
            <div className='flex items-center gap-6'>
              <div className='flex items-center gap-2'>
                <CalendarDays className='h-4 w-4 text-gray-400' />
                <div>
                  <p className='text-xs text-gray-500'>Arrivée</p>
                  <p className='font-medium text-gray-800'>{formatDate(rent.arrivingDate)}</p>
                </div>
              </div>
              <span className='text-gray-300'>&rarr;</span>
              <div>
                <p className='text-xs text-gray-500'>Départ</p>
                <p className='font-medium text-gray-800'>{formatDate(rent.leavingDate)}</p>
              </div>
            </div>
            <div className='flex items-center gap-6'>
              {rent.numberOfNights && (
                <div className='flex items-center gap-2'>
                  <Moon className='h-4 w-4 text-gray-400' />
                  <span className='text-gray-800'>
                    {rent.numberOfNights} nuit{rent.numberOfNights > 1 ? 's' : ''}
                  </span>
                </div>
              )}
              <div className='flex items-center gap-2'>
                <Users className='h-4 w-4 text-gray-400' />
                <span className='text-gray-800'>
                  {Number(rent.numberPeople)} personne{Number(rent.numberPeople) > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stripe Payment ID - Only visible to admins/host managers or dev mode */}
        {(showSensitiveInfo || process.env.NODE_ENV === 'development') && rent.stripeId && (
          <div className='mt-6 flex items-start gap-3 rounded-xl bg-yellow-50 border border-yellow-200 p-4'>
            <Lock className='h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5' />
            <div className='flex-1'>
              <p className='text-xs font-semibold text-yellow-700'>
                ID de paiement Stripe (sensible)
              </p>
              <p className='text-sm font-mono text-gray-900 mt-1'>{rent.stripeId}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
