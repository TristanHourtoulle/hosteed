'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { findAllRentByUserId, cancelRent } from '@/lib/services/rents.service'
import { findProductById } from '@/lib/services/product.service'
import Image from 'next/image'
import Link from 'next/link'
import { PaymentStatus, RentStatus } from '@prisma/client'
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Star,
  Eye,
  X,
  AlertTriangle,
  CheckCircle,
  Loader,
  HourglassIcon,
  MessageCircle,
  Receipt,
} from 'lucide-react'
import { Button } from '@/components/ui/shadcnui/button'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { getActualProduct } from '@/lib/services/promotedProduct.service'

interface Rent {
  id: string
  productId: string
  arrivingDate: Date
  leavingDate: Date
  numberPeople: bigint
  accepted: boolean
  confirmed: boolean
  options?: {
    id: string
    name: string
    price: number
  }[]
  product?: {
    name: string
    address?: string
    img?: { img: string }[]
  }
  status: RentStatus
  payment: PaymentStatus
  Review?: { id: string }[] // Ajouter les reviews pour vérifier l'existence
}

const getStatusConfig = (
  status: RentStatus,
  payment: PaymentStatus,
  accepted: boolean,
  confirmed: boolean
) => {
  if (payment === 'DISPUTE') {
    return {
      label: 'Litige',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: AlertTriangle,
      bgGradient: 'from-red-50 to-pink-50',
    }
  }

  // If not accepted by host yet, show pending confirmation
  if (!accepted || !confirmed) {
    return {
      label: 'En attente de confirmation',
      color: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: HourglassIcon,
      bgGradient: 'from-amber-50 to-yellow-50',
    }
  }

  switch (status) {
    case 'RESERVED':
      return {
        label: 'Confirmé',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
        bgGradient: 'from-green-50 to-emerald-50',
      }
    case 'CHECKIN':
      return {
        label: 'Séjour en cours',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Clock,
        bgGradient: 'from-blue-50 to-indigo-50',
      }
    case 'CHECKOUT':
      return {
        label: 'Terminé',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: CheckCircle,
        bgGradient: 'from-gray-50 to-slate-50',
      }
    case 'CANCEL':
      return {
        label: 'Annulé',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: X,
        bgGradient: 'from-red-50 to-pink-50',
      }
    default:
      return {
        label: status,
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: Clock,
        bgGradient: 'from-gray-50 to-slate-50',
      }
  }
}

export default function ReservationsPage() {
  const {
    session,
    isLoading: isAuthLoading,
    isAuthenticated,
  } = useAuth({ required: true, redirectTo: '/auth' })
  const [rents, setRents] = useState<Rent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  useEffect(() => {
    const fetchRents = async () => {
      if (!isAuthenticated || !session?.user?.id) return
      console.log(await getActualProduct())
      try {
        setLoading(true)
        const userRents = await findAllRentByUserId(session.user.id)

        if (userRents) {
          const rentsWithProducts = await Promise.all(
            userRents.map(async rent => {
              const product = await findProductById(rent.productId)
              return {
                ...rent,
                arrivingDate: new Date(Number(rent.arrivingDate)),
                leavingDate: new Date(Number(rent.leavingDate)),
                options: [],
                product: product || undefined,
              }
            })
          )
          setRents(rentsWithProducts)
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des réservations:', error)
        setError('Une erreur est survenue lors de la récupération de vos réservations')
      } finally {
        setLoading(false)
      }
    }

    fetchRents()
  }, [isAuthenticated, session])

  const handleCancel = async (rentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) return

    setCancellingId(rentId)
    try {
      await cancelRent(rentId)
      setRents(rents.filter(rent => rent.id !== rentId))
    } catch (error) {
      console.error("Erreur lors de l'annulation:", error)
      alert("Erreur lors de l'annulation de la réservation")
    } finally {
      setCancellingId(null)
    }
  }

  if (isAuthLoading || loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='flex flex-col items-center gap-4'>
          <div className='w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin'></div>
          <p className='text-slate-600 text-lg'>Chargement...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4'>
        <Card className='w-full max-w-md'>
          <CardContent className='p-8 text-center'>
            <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <AlertTriangle className='w-8 h-8 text-red-600' />
            </div>
            <h2 className='text-2xl font-bold text-gray-900 mb-2'>Erreur</h2>
            <p className='text-gray-600 mb-6'>{error}</p>
            <Button variant='outline' onClick={() => window.location.reload()}>
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50'>
      {/* Header */}
      <div className='bg-white shadow-sm border-b'>
        <div className='container mx-auto px-4 py-8'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-4xl font-bold text-gray-900 mb-2'>Mes réservations</h1>
              <p className='text-gray-600'>Gérez et consultez vos réservations</p>
            </div>
            <div className='hidden md:flex items-center space-x-2 text-sm text-gray-500'>
              <Calendar className='w-4 h-4' />
              <span>
                {rents.length} réservation{rents.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className='container mx-auto px-4 py-8'>
        {rents.length === 0 ? (
          <div className='text-center py-16'>
            <Card className='w-full max-w-md mx-auto'>
              <CardContent className='p-8'>
                <div className='w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6'>
                  <Calendar className='w-10 h-10 text-gray-400' />
                </div>
                <h3 className='text-2xl font-bold text-gray-900 mb-3'>Aucune réservation</h3>
                <p className='text-gray-600 mb-6'>
                  Vous n&apos;avez pas encore de réservations. Découvrez nos hébergements
                  exceptionnels !
                </p>
                <Button asChild className='w-full'>
                  <Link href='/host'>
                    <Eye className='w-4 h-4 mr-2' />
                    Explorer les hébergements
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
            {rents.map((rent, index) => {
              const statusConfig = getStatusConfig(
                rent.status,
                rent.payment,
                rent.accepted,
                rent.confirmed
              )
              const StatusIcon = statusConfig.icon
              const isOngoing = rent.status === 'CHECKIN'
              const isPending = !rent.accepted || !rent.confirmed
              const canCancel = rent.status === 'RESERVED' && !isPending
              const hasReview = rent.Review && rent.Review.length > 0
              const canReview =
                (rent.status === 'CHECKIN' || rent.status === 'CHECKOUT') && !hasReview

              return (
                <Card
                  key={`${rent.id}-${index}`}
                  className={`overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white border-0 pt-0`}
                >
                  {/* Image */}
                  <div className='relative h-56 w-full overflow-hidden'>
                    {rent.product?.img && rent.product.img.length > 0 ? (
                      <Image
                        src={rent.product.img[0].img}
                        alt={rent.product.name || 'Hébergement'}
                        fill
                        className='object-cover transition-transform duration-300 hover:scale-105'
                      />
                    ) : (
                      <div className='bg-gradient-to-br from-gray-200 to-gray-300 h-full w-full flex items-center justify-center'>
                        <div className='text-center'>
                          <MapPin className='w-12 h-12 text-gray-400 mx-auto mb-2' />
                          <span className='text-gray-500 text-sm'>Aucune image</span>
                        </div>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className='absolute top-4 right-4'>
                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm border ${statusConfig.color}`}
                      >
                        <StatusIcon className='w-3 h-3' />
                        {statusConfig.label}
                      </div>
                    </div>

                    {/* Ongoing indicator */}
                    {isOngoing && (
                      <div className='absolute top-4 left-4'>
                        <div className='flex items-center gap-1.5 px-2 py-1 bg-green-500 text-white rounded-full text-xs font-medium'>
                          <div className='w-2 h-2 bg-white rounded-full animate-pulse'></div>
                          En cours
                        </div>
                      </div>
                    )}
                  </div>

                  <CardContent className='p-6 bg-white/80 backdrop-blur-sm'>
                    {/* Property name */}
                    <div className='mb-4'>
                      <h3 className='text-xl font-bold text-gray-900 mb-1 line-clamp-1'>
                        {rent.product?.name || 'Hébergement non trouvé'}
                      </h3>
                      {rent.product?.address && (
                        <div className='flex items-center text-gray-600 text-sm'>
                          <MapPin className='w-4 h-4 mr-1' />
                          <span className='line-clamp-1'>{rent.product.address}</span>
                        </div>
                      )}
                    </div>

                    {/* Pending confirmation notice */}
                    {isPending && (
                      <div className='mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg'>
                        <div className='flex items-start space-x-2'>
                          <HourglassIcon className='w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0' />
                          <div>
                            <p className='text-sm font-medium text-amber-800'>
                              En attente de confirmation
                            </p>
                            <p className='text-xs text-amber-700 mt-1'>
                              L&apos;hôte doit confirmer votre réservation. Vous recevrez un email
                              dès validation.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Reservation details */}
                    <div className='space-y-3 mb-6'>
                      <div className='flex items-center justify-between text-sm'>
                        <div className='flex items-center text-gray-600'>
                          <Calendar className='w-4 h-4 mr-2' />
                          <span>Arrivée</span>
                        </div>
                        <span className='font-semibold text-gray-900'>
                          {rent.arrivingDate.toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <div className='flex items-center justify-between text-sm'>
                        <div className='flex items-center text-gray-600'>
                          <Calendar className='w-4 h-4 mr-2' />
                          <span>Départ</span>
                        </div>
                        <span className='font-semibold text-gray-900'>
                          {rent.leavingDate.toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <div className='flex items-center justify-between text-sm'>
                        <div className='flex items-center text-gray-600'>
                          <Users className='w-4 h-4 mr-2' />
                          <span>Voyageurs</span>
                        </div>
                        <span className='font-semibold text-gray-900'>
                          {rent.numberPeople ? rent.numberPeople.toString() : '1'} personne
                          {Number(rent.numberPeople) > 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Reservation ID */}
                      <div className='pt-2 border-t border-gray-200'>
                        <div className='flex items-center justify-between text-xs'>
                          <span className='text-gray-500'>Numéro de réservation</span>
                          <span className='font-mono font-semibold text-gray-700'>
                            #{rent.id.slice(-8).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className='space-y-2'>
                      <Button asChild className='w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'>
                        <Link href={`/reservations/${rent.id}`}>
                          <Receipt className='w-4 h-4 mr-2' />
                          Voir les détails et le prix
                        </Link>
                      </Button>
                      <Button variant='outline' asChild className='w-full'>
                        <Link href={`/host/${rent.productId}`}>
                          <Eye className='w-4 h-4 mr-2' />
                          Voir l&apos;hébergement
                        </Link>
                      </Button>
                      <Button variant='outline' asChild className='w-full'>
                        <Link href={`/chat/${rent.id}`}>
                          <MessageCircle className='w-4 h-4 mr-2' />
                          Contacter l&apos;hébergeur
                        </Link>
                      </Button>
                      <div className='flex gap-2'>
                        {canCancel && (
                          <Button
                            variant='outline'
                            size='sm'
                            className='flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300'
                            onClick={() => handleCancel(rent.id)}
                            disabled={cancellingId === rent.id}
                          >
                            {cancellingId === rent.id ? (
                              <Loader className='w-4 h-4 animate-spin' />
                            ) : (
                              <X className='w-4 h-4 mr-1' />
                            )}
                            Annuler
                          </Button>
                        )}

                        {canReview && (
                          <Button asChild size='sm' className='flex-1'>
                            <Link href={`/reviews/create?rentId=${rent.id}`}>
                              <Star className='w-4 h-4 mr-1' />
                              {rent.status === 'CHECKIN' ? 'Donner mon avis' : 'Laisser un avis'}
                            </Link>
                          </Button>
                        )}

                        {hasReview && (rent.status === 'CHECKIN' || rent.status === 'CHECKOUT') && (
                          <Button size='sm' variant='outline' className='flex-1' disabled>
                            <Star className='w-4 h-4 mr-1 fill-yellow-400 text-yellow-400' />
                            Avis déjà laissé
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
