import { MapPin } from 'lucide-react'
import { getCityFromAddress } from '@/lib/utils'

interface PropertyLocationProps {
  address?: string
}

export default function PropertyLocation({ address }: PropertyLocationProps) {
  return (
    <div className='border-b border-gray-200 pb-8'>
      <h3 className='text-lg font-semibold text-gray-900 mb-4'>Emplacement</h3>
      <div className='space-y-4'>
        <div className='flex items-start gap-3'>
          <MapPin className='h-5 w-5 text-gray-400 mt-0.5' />
          <div>
            <p className='text-gray-900 font-medium'>{getCityFromAddress(address)}</p>
            <p className='text-sm text-gray-600'>Madagascar</p>
          </div>
        </div>

        {/* Interactive Map */}
        <div className='w-full h-64 rounded-xl overflow-hidden border relative bg-gray-100'>
          {/* Dynamic Google Maps Embed based on address */}
          <iframe
            src={`https://www.google.com/maps?q=${encodeURIComponent(
              getCityFromAddress(address) + ', Madagascar'
            )}&output=embed&z=10`}
            width='100%'
            height='100%'
            style={{ border: 0 }}
            allowFullScreen
            loading='lazy'
            referrerPolicy='no-referrer-when-downgrade'
            title={`Carte de ${getCityFromAddress(address)}, Madagascar`}
          ></iframe>

          {/* Map attribution */}
          <div className='absolute bottom-2 right-2 bg-white/90 px-2 py-1 rounded text-xs text-gray-600'>
            © Google Maps
          </div>
        </div>

        {/* Privacy Notice - Outside map */}
        <div className='mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4'>
          <div className='flex items-start gap-3'>
            <MapPin className='h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0' />
            <div>
              <h4 className='font-medium text-blue-900 mb-1'>Protection de la vie privée</h4>
              <p className='text-sm text-blue-800'>
                Pour votre sécurité et celle de l&apos;hôte, l&apos;emplacement exact sera
                communiqué après confirmation de votre réservation. La carte montre la zone générale
                de {getCityFromAddress(address)}.
              </p>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
          <div>
            <h4 className='font-medium text-gray-900 mb-2'>À proximité</h4>
            <ul className='space-y-1 text-gray-600'>
              <li>• Plage - 2 min à pied</li>
              <li>• Restaurant - 5 min à pied</li>
              <li>• Supermarché - 10 min en voiture</li>
              <li>• Aéroport - 45 min en voiture</li>
            </ul>
          </div>
          <div>
            <h4 className='font-medium text-gray-900 mb-2'>Transports</h4>
            <ul className='space-y-1 text-gray-600'>
              <li>• Parking gratuit sur place</li>
              <li>• Taxi disponible</li>
              <li>• Location de voiture possible</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
