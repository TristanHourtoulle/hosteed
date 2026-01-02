import { MapPin, Clock, Car } from 'lucide-react'
import { getLocationDisplay, formatProductLocation } from '@/lib/utils'

interface NearbyPlace {
  name: string
  distance: number
  duration: number
  transport: string
}

interface TransportOption {
  name: string
  description?: string
}

interface PropertyLocationProps {
  address?: string
  // Nouveaux champs de localisation structurés
  neighborhood?: string | null
  city?: string | null
  region?: string | null
  country?: string | null
  nearbyPlaces?: NearbyPlace[]
  transportOptions?: TransportOption[]
}

export default function PropertyLocation({
  address,
  neighborhood,
  city,
  region,
  country,
  nearbyPlaces,
  transportOptions,
}: PropertyLocationProps) {
  if (!address && !city) return null

  // Construire l'objet de localisation
  const locationData = { address, neighborhood, city, region, country }
  const displayLocation = getLocationDisplay(locationData)
  const displayCountry = country || 'Madagascar'

  return (
    <div className='border-b border-gray-200 pb-8'>
      <h3 className='text-lg font-semibold text-gray-900 mb-4'>Emplacement</h3>
      <div className='space-y-6'>
        <div className='flex items-start gap-3'>
          <MapPin className='h-5 w-5 text-gray-400 mt-0.5' />
          <div>
            <p className='text-gray-900 font-medium'>{displayLocation}</p>
            {!displayLocation.includes(displayCountry) && (
              <p className='text-sm text-gray-600'>{displayCountry}</p>
            )}
          </div>
        </div>

        {/* Interactive Map */}
        <div className='w-full h-64 rounded-xl overflow-hidden border relative bg-gray-100'>
          {/* Dynamic Google Maps Embed based on address */}
          <iframe
            src={`https://www.google.com/maps?q=${encodeURIComponent(
              displayLocation + ', ' + displayCountry
            )}&output=embed&z=10`}
            width='100%'
            height='100%'
            style={{ border: 0 }}
            allowFullScreen
            loading='lazy'
            referrerPolicy='no-referrer-when-downgrade'
            title={`Carte de ${displayLocation}, ${displayCountry}`}
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
                de {displayLocation}.
              </p>
            </div>
          </div>
        </div>

        {nearbyPlaces && nearbyPlaces.length > 0 && (
          <div>
            <h4 className='text-base font-medium text-gray-900 mb-3'>À proximité</h4>
            <div className='space-y-3'>
              {nearbyPlaces.map((place, index) => (
                <div key={index} className='flex items-start gap-3'>
                  <Clock className='h-5 w-5 text-gray-400 mt-0.5' />
                  <div>
                    <p className='text-gray-900'>{place.name}</p>
                    <p className='text-sm text-gray-600'>
                      {place.distance < 1000
                        ? `${place.distance}m`
                        : `${(place.distance / 1000).toFixed(1)}km`}{' '}
                      • {place.duration} min {place.transport}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {transportOptions && transportOptions.length > 0 && (
          <div>
            <h4 className='text-base font-medium text-gray-900 mb-3'>Transports</h4>
            <div className='space-y-3'>
              {transportOptions.map((option, index) => (
                <div key={index} className='flex items-start gap-3'>
                  <Car className='h-5 w-5 text-gray-400 mt-0.5' />
                  <div>
                    <p className='text-gray-900'>{option.name}</p>
                    {option.description && (
                      <p className='text-sm text-gray-600'>{option.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
