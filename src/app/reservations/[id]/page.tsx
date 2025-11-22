// TODO: Implement chat with the host for a reservation

import Image from 'next/image'
import Link from 'next/link'
import { getReservationDetails } from './actions'
import { Button } from '@/components/ui/shadcnui/button'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { getProfileImageUrl } from '@/lib/utils'
import GuestReservationDetailsCard from './GuestReservationDetailsCard'
import GuestPricingDetailsCard from './GuestPricingDetailsCard'
import {
  MapPin,
  Calendar,
  User,
  Mail,
  Home,
  Info,
  Shield,
  Utensils,
  Car,
  Map,
  Star,
} from 'lucide-react'
import {
  Equipment,
  Service,
  Security,
  Meal,
  Transport,
  NearbyPlace,
  ReservationDetails,
} from './types'
import {
  translatePaymentStatus,
  translateRentStatus,
  getPaymentStatusColor,
  getRentStatusColor,
} from './utils'

function HostAvatar({ host }: { host: { name: string; email: string; image: string } }) {
  const profileImage = getProfileImageUrl(host.image)

  return (
    <div className='relative h-20 w-20 rounded-full overflow-hidden bg-gray-200'>
      {profileImage && (
        <Image
          src={profileImage}
          alt={host.name ?? 'host'}
          width={80}
          height={80}
          className='h-full w-full object-cover rounded-full'
          referrerPolicy='no-referrer'
        />
      )}
      {!profileImage && (
        <div className='absolute inset-0 flex items-center justify-center text-lg font-medium text-gray-600 bg-gray-100'>
          {host.name?.charAt(0) ?? 'H'}
        </div>
      )}
    </div>
  )
}

export default async function ReservationDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const { reservation, host } = (await getReservationDetails(
    resolvedParams.id
  )) as unknown as ReservationDetails

  return (
    <div className='min-h-screen bg-gradient-to-b from-blue-50 to-white py-10'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='max-w-4xl mx-auto space-y-8'>
          {/* Header */}
          <div className='flex items-center justify-between'>
            <h1 className='text-3xl font-bold text-gray-900'>Détails de la réservation</h1>
            <Link href='/account'>
              <Button variant='outline'>Retour</Button>
            </Link>
          </div>

          {/* Property Overview */}
          <Card>
            <CardContent className='p-6'>
              <div className='flex flex-col md:flex-row gap-6'>
                <div className='relative w-full md:w-1/3 aspect-[4/3]'>
                  <Image
                    src={reservation.product.img?.[0]?.img || '/placeholder.png'}
                    alt={reservation.product.name}
                    fill
                    className='object-cover rounded-lg'
                  />
                </div>
                <div className='flex-1'>
                  <h2 className='text-2xl font-semibold mb-4'>{reservation.product.name}</h2>
                  <div className='flex items-center gap-2 text-gray-600 mb-4'>
                    <MapPin className='w-4 h-4' />
                    <span>{reservation.product.address}</span>
                  </div>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm'>
                    <div>
                      <p className='font-medium'>Arrivée</p>
                      <div className='flex items-center gap-2 text-gray-600'>
                        <Calendar className='w-4 h-4' />
                        <span>{new Date(reservation.arrivingDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div>
                      <p className='font-medium'>Départ</p>
                      <div className='flex items-center gap-2 text-gray-600'>
                        <Calendar className='w-4 h-4' />
                        <span>{new Date(reservation.leavingDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div>
                      <p className='font-medium'>Voyageurs</p>
                      <div className='flex items-center gap-2 text-gray-600'>
                        <User className='w-4 h-4' />
                        <span>{reservation.numberPeople.toString()} personnes</span>
                      </div>
                    </div>
                    <div>
                      <p className='font-medium'>Prix total</p>
                      <div className='flex items-center gap-2 text-gray-600'>
                        <span>{reservation.prices.toString()}€</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Host Information */}
          <Card>
            <CardContent className='p-6'>
              <h3 className='text-xl font-semibold mb-4'>Informations sur l&apos;hôte</h3>
              <div className='flex flex-col sm:flex-row items-start gap-6'>
                <div className='flex items-center gap-4'>
                  <HostAvatar
                    host={host as unknown as { name: string; email: string; image: string }}
                  />
                  <div>
                    <p className='font-medium text-lg'>{host.name}</p>
                    <div className='flex flex-col gap-2 text-sm text-gray-600 mt-2'>
                      <div className='flex items-center gap-2'>
                        <Mail className='w-4 h-4' />
                        <span>{host.email}</span>
                      </div>
                      {host.roles === 'HOST_VERIFIED' ||
                        (host.roles === 'ADMIN' && (
                          <div className='flex items-center gap-2'>
                            <Star className='w-4 h-4 text-yellow-400' />
                            <span>Hôte vérifié</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
                <div className='flex-1 bg-gray-50 rounded-lg p-4 mt-4 sm:mt-0'>
                  <p className='text-sm text-gray-600'>
                    Pour toute question concernant votre séjour, n&apos;hésitez pas à contacter
                    votre hôte directement par email.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property Details */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Amenities */}
            <Card>
              <CardContent className='p-6'>
                <h3 className='text-xl font-semibold mb-4'>Équipements</h3>
                <div className='space-y-3'>
                  {reservation.product.equipments.map((equipment: Equipment) => (
                    <div key={equipment.id} className='flex items-center gap-2 text-gray-600'>
                      <Home className='w-4 h-4' />
                      <span>{equipment.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Services */}
            <Card>
              <CardContent className='p-6'>
                <h3 className='text-xl font-semibold mb-4'>Services</h3>
                <div className='space-y-3'>
                  {reservation.product.servicesList.map((service: Service) => (
                    <div key={service.id} className='flex items-center gap-2 text-gray-600'>
                      <Info className='w-4 h-4' />
                      <span>{service.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card>
              <CardContent className='p-6'>
                <h3 className='text-xl font-semibold mb-4'>Sécurité</h3>
                <div className='space-y-3'>
                  {reservation.product.securities.map((security: Security) => (
                    <div key={security.id} className='flex items-center gap-2 text-gray-600'>
                      <Shield className='w-4 h-4' />
                      <span>{security.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Meals */}
            <Card>
              <CardContent className='p-6'>
                <h3 className='text-xl font-semibold mb-4'>Repas</h3>
                <div className='space-y-3'>
                  {reservation.product.mealsList.map((meal: Meal) => (
                    <div key={meal.id} className='flex items-center gap-2 text-gray-600'>
                      <Utensils className='w-4 h-4' />
                      <span>{meal.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Transport */}
            <Card>
              <CardContent className='p-6'>
                <h3 className='text-xl font-semibold mb-4'>Transport</h3>
                <div className='space-y-3'>
                  {reservation.product.transportOptions.map((transport: Transport) => (
                    <div key={transport.id} className='flex items-center gap-2 text-gray-600'>
                      <Car className='w-4 h-4' />
                      <span>{transport.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Nearby Places */}
            <Card>
              <CardContent className='p-6'>
                <h3 className='text-xl font-semibold mb-4'>À proximité</h3>
                <div className='space-y-3'>
                  {reservation.product.nearbyPlaces.map((place: NearbyPlace) => (
                    <div key={place.id} className='flex items-center gap-2 text-gray-600'>
                      <Map className='w-4 h-4' />
                      <span>{place.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Proximity Landmarks (visible only with reservation) */}
            {reservation.product.proximityLandmarks &&
              reservation.product.proximityLandmarks.length > 0 && (
                <Card className='border-blue-200 bg-blue-50/50'>
                  <CardContent className='p-6'>
                    <div className='flex items-start gap-3 mb-4'>
                      <Info className='w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0' />
                      <div>
                        <h3 className='text-xl font-semibold text-blue-900 mb-1'>
                          Points de repère pour vous aider à localiser
                        </h3>
                        <p className='text-sm text-blue-700'>
                          Ces informations sont visibles uniquement pour faciliter votre arrivée
                        </p>
                      </div>
                    </div>
                    <div className='space-y-2'>
                      {reservation.product.proximityLandmarks.map(
                        (landmark: string, index: number) => (
                          <div key={index} className='flex items-center gap-2 text-blue-800'>
                            <MapPin className='w-4 h-4 flex-shrink-0' />
                            <span>{landmark}</span>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
          </div>

          {/* Status and Payment */}
          <Card>
            <CardContent className='p-6'>
              <h3 className='text-xl font-semibold mb-4'>Statut de la réservation</h3>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
                <div>
                  <p className='font-medium mb-2'>Statut</p>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      getRentStatusColor(reservation.status).bg
                    } ${getRentStatusColor(reservation.status).text}`}
                  >
                    {translateRentStatus(reservation.status)}
                  </span>
                </div>
                {/* Add data for the host confirmation for this reservation (reservation.confirmed) */}
                {reservation.confirmed ? (
                  <div>
                    <p className='font-medium mb-2'>Confirmation de l&apos;hôte</p>
                    <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800'>
                      Confirmé
                    </span>
                  </div>
                ) : (
                  <div>
                    <p className='font-medium mb-2'>Confirmation de l&apos;hôte</p>
                    <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800'>
                      En attente
                    </span>
                  </div>
                )}
                <div>
                  <p className='font-medium mb-2'>Paiement</p>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      getPaymentStatusColor(reservation.payment).bg
                    } ${getPaymentStatusColor(reservation.payment).text}`}
                  >
                    {translatePaymentStatus(reservation.payment)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reservation Details Cards */}
          <div className='grid grid-cols-1 xl:grid-cols-3 gap-8'>
            {/* Guest Reservation Details */}
            <div className='xl:col-span-2'>
              <GuestReservationDetailsCard reservation={reservation} />
            </div>

            {/* Pricing Details */}
            <div>
              <GuestPricingDetailsCard rent={reservation} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
