import Image from 'next/image'
import { getReservationDetails } from './actions'
import { getProfileImageUrl } from '@/lib/utils'
import GuestReservationDetailsCard from './GuestReservationDetailsCard'
import GuestPricingDetailsCard from './GuestPricingDetailsCard'
import {
  MapPin,
  Calendar,
  Users as UsersIcon,
  Mail,
  Home,
  Info,
  Shield,
  Utensils,
  Car,
  Map,
  Star,
  ArrowRight,
  CreditCard,
  BadgeCheck,
  Phone,
} from 'lucide-react'
import type {
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
import { PageHeader } from '@/components/admin/ui/PageHeader'

interface FeatureBlockProps {
  title: string
  icon: React.ComponentType<{ className?: string }>
  tone: 'blue' | 'emerald' | 'purple' | 'amber' | 'red' | 'indigo' | 'slate'
  items: Array<{ id: string; name: string }>
  itemIcon?: React.ComponentType<{ className?: string }>
  emptyLabel?: string
}

const TONE: Record<
  FeatureBlockProps['tone'],
  { iconBg: string; iconText: string }
> = {
  blue: { iconBg: 'bg-blue-50', iconText: 'text-blue-600' },
  emerald: { iconBg: 'bg-emerald-50', iconText: 'text-emerald-600' },
  purple: { iconBg: 'bg-purple-50', iconText: 'text-purple-600' },
  amber: { iconBg: 'bg-amber-50', iconText: 'text-amber-600' },
  red: { iconBg: 'bg-red-50', iconText: 'text-red-600' },
  indigo: { iconBg: 'bg-indigo-50', iconText: 'text-indigo-600' },
  slate: { iconBg: 'bg-slate-100', iconText: 'text-slate-600' },
}

function FeatureBlock({
  title,
  icon: Icon,
  tone,
  items,
  itemIcon: ItemIcon = Info,
  emptyLabel = 'Aucun élément renseigné.',
}: FeatureBlockProps) {
  const toneClass = TONE[tone]
  return (
    <div className='rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm'>
      <div className='mb-4 flex items-center gap-3'>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneClass.iconBg} ${toneClass.iconText}`}
        >
          <Icon className='h-4 w-4' />
        </div>
        <h3 className='text-sm font-semibold uppercase tracking-wide text-slate-500'>
          {title}
        </h3>
      </div>
      {items.length === 0 ? (
        <p className='text-sm text-slate-400'>{emptyLabel}</p>
      ) : (
        <ul className='space-y-1.5'>
          {items.map(item => (
            <li
              key={item.id}
              className='flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-sm text-slate-700'
            >
              <ItemIcon className='h-3.5 w-3.5 shrink-0 text-slate-400' />
              <span className='truncate'>{item.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function HostAvatarLarge({
  host,
}: {
  host: { name: string; email: string; image: string }
}) {
  const profileImage = getProfileImageUrl(host.image)
  return (
    <div className='relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 ring-4 ring-white shadow-lg'>
      {profileImage ? (
        <Image
          src={profileImage}
          alt={host.name ?? 'Host'}
          width={80}
          height={80}
          className='h-full w-full object-cover'
          referrerPolicy='no-referrer'
        />
      ) : (
        <div className='flex h-full w-full items-center justify-center text-2xl font-bold text-white'>
          {host.name?.charAt(0)?.toUpperCase() ?? 'H'}
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

  const rentStatus = getRentStatusColor(reservation.status)
  const paymentStatus = getPaymentStatusColor(reservation.payment)

  const isVerifiedHost = host.roles === 'HOST_VERIFIED' || host.roles === 'ADMIN'

  const productImages = reservation.product.img as Array<{ img: string }> | undefined
  const firstImage = productImages && productImages.length > 0 ? productImages[0].img : null

  const numberOfNights = (() => {
    const arrival = new Date(reservation.arrivingDate)
    const departure = new Date(reservation.leavingDate)
    const diff = Math.round((departure.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
  })()

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/40'>
      <div className='mx-auto max-w-6xl space-y-8 p-6'>
        <PageHeader
          backHref='/account'
          backLabel='Retour à mon compte'
          eyebrow={`Réservation #${reservation.id.slice(-6).toUpperCase()}`}
          title='Détails de la réservation'
          subtitle='Consultez les informations de votre séjour, votre hôte et les équipements inclus.'
        />

        {/* Status card row */}
        <div className='grid gap-4 md:grid-cols-3'>
          <div className='rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm'>
            <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>
              Statut
            </p>
            <span
              className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset ${rentStatus.bg} ${rentStatus.text} ring-current/10`}
            >
              {translateRentStatus(reservation.status)}
            </span>
          </div>
          <div className='rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm'>
            <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>
              Confirmation hôte
            </p>
            <span
              className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ring-1 ${
                reservation.confirmed
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                  : 'bg-amber-50 text-amber-700 ring-amber-200'
              }`}
            >
              <BadgeCheck className='h-3.5 w-3.5' />
              {reservation.confirmed ? 'Confirmé' : 'En attente'}
            </span>
          </div>
          <div className='rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm'>
            <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>
              Paiement
            </p>
            <span
              className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset ${paymentStatus.bg} ${paymentStatus.text} ring-current/10`}
            >
              <CreditCard className='h-3.5 w-3.5' />
              {translatePaymentStatus(reservation.payment)}
            </span>
          </div>
        </div>

        {/* Property overview */}
        <div className='overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm'>
          <div className='grid gap-0 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]'>
            <div className='relative aspect-[4/3] w-full md:aspect-auto md:min-h-[280px]'>
              {firstImage ? (
                <Image
                  src={firstImage}
                  alt={reservation.product.name}
                  fill
                  className='object-cover'
                  sizes='(max-width: 768px) 100vw, 40vw'
                />
              ) : (
                <div className='flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200'>
                  <Home className='h-16 w-16 text-slate-400' />
                </div>
              )}
            </div>
            <div className='space-y-5 p-6'>
              <div>
                <h2 className='text-2xl font-bold text-slate-900'>
                  {reservation.product.name}
                </h2>
                <p className='mt-1 flex items-center gap-1.5 text-sm text-slate-500'>
                  <MapPin className='h-4 w-4' />
                  {reservation.product.address}
                </p>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='rounded-xl bg-slate-50 p-3'>
                  <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>
                    Arrivée
                  </p>
                  <p className='mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-900'>
                    <Calendar className='h-4 w-4 text-blue-600' />
                    {new Date(reservation.arrivingDate).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className='rounded-xl bg-slate-50 p-3'>
                  <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>
                    Départ
                  </p>
                  <p className='mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-900'>
                    <Calendar className='h-4 w-4 text-blue-600' />
                    {new Date(reservation.leavingDate).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className='rounded-xl bg-slate-50 p-3'>
                  <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>
                    Durée
                  </p>
                  <p className='mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-900'>
                    <ArrowRight className='h-4 w-4 text-emerald-600' />
                    {numberOfNights} nuit{numberOfNights > 1 ? 's' : ''}
                  </p>
                </div>
                <div className='rounded-xl bg-slate-50 p-3'>
                  <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>
                    Voyageurs
                  </p>
                  <p className='mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-900'>
                    <UsersIcon className='h-4 w-4 text-purple-600' />
                    {reservation.numberPeople.toString()} personne
                    {Number(reservation.numberPeople) > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Host card */}
        <div className='rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm'>
          <h3 className='mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500'>
            Votre hôte
          </h3>
          <div className='flex flex-col gap-6 sm:flex-row sm:items-start'>
            <HostAvatarLarge
              host={host as unknown as { name: string; email: string; image: string }}
            />
            <div className='flex-1'>
              <div className='flex flex-wrap items-center gap-2'>
                <p className='text-lg font-bold text-slate-900'>{host.name}</p>
                {isVerifiedHost && (
                  <span className='inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200'>
                    <Star className='h-3 w-3' />
                    Hôte vérifié
                  </span>
                )}
              </div>
              <div className='mt-3 space-y-2 text-sm text-slate-600'>
                <div className='flex items-center gap-2'>
                  <Mail className='h-4 w-4 text-slate-400' />
                  <a href={`mailto:${host.email}`} className='hover:text-blue-600'>
                    {host.email}
                  </a>
                </div>
                <div className='flex items-center gap-2'>
                  <Phone className='h-4 w-4 text-slate-400' />
                  <span className='text-slate-500'>
                    Contactez votre hôte par email pour toute question
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Property details grid */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
          <FeatureBlock
            title='Équipements'
            icon={Home}
            tone='blue'
            items={reservation.product.equipments as Equipment[]}
            itemIcon={Home}
          />
          <FeatureBlock
            title='Services'
            icon={Info}
            tone='indigo'
            items={reservation.product.servicesList as Service[]}
          />
          <FeatureBlock
            title='Sécurité'
            icon={Shield}
            tone='red'
            items={reservation.product.securities as Security[]}
            itemIcon={Shield}
          />
          <FeatureBlock
            title='Repas'
            icon={Utensils}
            tone='amber'
            items={reservation.product.mealsList as Meal[]}
            itemIcon={Utensils}
          />
          <FeatureBlock
            title='Transport'
            icon={Car}
            tone='emerald'
            items={reservation.product.transportOptions as Transport[]}
            itemIcon={Car}
          />
          <FeatureBlock
            title='À proximité'
            icon={Map}
            tone='purple'
            items={reservation.product.nearbyPlaces as NearbyPlace[]}
            itemIcon={MapPin}
          />
        </div>

        {/* Proximity landmarks (visible only to guest who booked) */}
        {reservation.product.proximityLandmarks &&
          reservation.product.proximityLandmarks.length > 0 && (
            <div className='rounded-2xl border border-blue-200 bg-blue-50/60 p-6'>
              <div className='mb-4 flex items-start gap-3'>
                <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600'>
                  <Info className='h-5 w-5' />
                </div>
                <div>
                  <h3 className='text-sm font-semibold uppercase tracking-wide text-blue-900'>
                    Points de repère
                  </h3>
                  <p className='mt-1 text-sm text-blue-700'>
                    Ces informations sont partagées uniquement avec les voyageurs ayant une
                    réservation, pour faciliter votre arrivée.
                  </p>
                </div>
              </div>
              <ul className='space-y-2'>
                {(reservation.product.proximityLandmarks as string[]).map((landmark, i) => (
                  <li
                    key={i}
                    className='flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-blue-200/60'
                  >
                    <MapPin className='h-4 w-4 shrink-0 text-blue-600' />
                    <span>{landmark}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        {/* Reservation + pricing details cards (existing components) */}
        <div className='grid grid-cols-1 gap-6 xl:grid-cols-3'>
          <div className='xl:col-span-2'>
            <GuestReservationDetailsCard reservation={reservation} />
          </div>
          <div>
            <GuestPricingDetailsCard rent={reservation} />
          </div>
        </div>
      </div>
    </div>
  )
}
