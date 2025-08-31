'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/shadcnui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcnui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/shadcnui/tabs'
import { Badge } from '@/components/ui/shadcnui/badge'
import { findProductById } from '@/lib/services/product.service'
import { findAllRentByProductId } from '@/lib/services/rents.service'
import { 
  ArrowLeft, 
  Home, 
  Star, 
  Calendar, 
  Users, 
  Euro, 
  TrendingUp,
  MessageCircle,
  Settings,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Product {
  id: string
  name: string
  address: string
  basePrice: string
  description: string
  status: string
  validation: string
  reviews: Array<{
    id: string
    title: string
    text: string
    grade: number
    publishDate: Date
  }>
}

interface Rent {
  id: string
  arrivingDate: Date
  leavingDate: Date
  peopleNumber: number
  prices: number
  status: string
  confirmed: boolean
  user: {
    name: string | null
    email: string
  }
}

export default function PropertyDashboard() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [reservations, setReservations] = useState<Rent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) return
      
      try {
        setLoading(true)
        const [productData, reservationsData] = await Promise.all([
          findProductById(productId),
          findAllRentByProductId(productId)
        ])

        if (productData) {
          setProduct(productData as unknown as Product)
        }

        if (Array.isArray(reservationsData)) {
          setReservations(reservationsData as unknown as Rent[])
        }
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err)
        setError('Erreur lors du chargement des données')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [productId, session])

  if (!session) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Card className='w-full max-w-md'>
          <CardContent className='p-8 text-center'>
            <h2 className='text-xl font-bold mb-4'>Connexion requise</h2>
            <p className='text-gray-600 mb-4'>
              Veuillez vous connecter pour accéder au tableau de bord
            </p>
            <Button asChild>
              <Link href='/auth/signin'>Se connecter</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 pt-20'>
        <div className='max-w-6xl mx-auto px-6 py-8'>
          <div className='flex items-center justify-center py-16'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className='min-h-screen bg-gray-50 pt-20'>
        <div className='max-w-6xl mx-auto px-6 py-8'>
          <Card className='text-center p-8'>
            <h2 className='text-xl font-bold text-red-600 mb-4'>Erreur</h2>
            <p className='text-gray-600 mb-4'>{error || 'Propriété non trouvée'}</p>
            <Button asChild>
              <Link href='/dashboard/host'>Retour au tableau de bord</Link>
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  // Calculs statistiques
  const totalReservations = reservations.length
  const confirmedReservations = reservations.filter(r => r.confirmed).length
  const pendingReservations = reservations.filter(r => r.status === 'WAITING').length
  const totalRevenue = reservations
    .filter(r => r.confirmed)
    .reduce((sum, r) => sum + Number(r.prices), 0)
  const averageRating = product.reviews?.length > 0 
    ? product.reviews.reduce((sum, r) => sum + r.grade, 0) / product.reviews.length 
    : 0
  const totalReviews = product.reviews?.length || 0

  // Réservations récentes
  const recentReservations = reservations
    .sort((a, b) => new Date(b.arrivingDate).getTime() - new Date(a.arrivingDate).getTime())
    .slice(0, 5)

  // Avis récents
  const recentReviews = product.reviews
    ?.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
    .slice(0, 3) || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WAITING': return 'bg-yellow-100 text-yellow-800'
      case 'RESERVED': return 'bg-blue-100 text-blue-800'
      case 'CHECKIN': return 'bg-green-100 text-green-800'
      case 'CHECKOUT': return 'bg-gray-100 text-gray-800'
      case 'CANCEL': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'WAITING': return <Clock className='h-4 w-4' />
      case 'RESERVED': return <CheckCircle className='h-4 w-4' />
      case 'CHECKIN': return <Users className='h-4 w-4' />
      case 'CHECKOUT': return <CheckCircle className='h-4 w-4' />
      case 'CANCEL': return <XCircle className='h-4 w-4' />
      default: return <AlertCircle className='h-4 w-4' />
    }
  }

  return (
    <div className='min-h-screen bg-gray-50 pt-20'>
      <div className='max-w-6xl mx-auto px-6 py-8'>
        {/* En-tête */}
        <div className='mb-8'>
          <div className='flex items-center gap-4 mb-6'>
            <Button variant='ghost' asChild>
              <Link href='/dashboard/host' className='flex items-center gap-2'>
                <ArrowLeft className='h-4 w-4' />
                Retour au tableau de bord
              </Link>
            </Button>
          </div>
          
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
            <div className='flex items-center gap-4'>
              <div className='w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center'>
                <Home className='h-6 w-6 text-white' />
              </div>
              <div>
                <h1 className='text-2xl font-bold text-gray-900'>{product.name}</h1>
                <p className='text-gray-600'>{product.address}</p>
              </div>
            </div>
            
            <div className='flex items-center gap-2'>
              <Button asChild size='sm'>
                <Link href={`/host/${product.id}`} className='flex items-center gap-2'>
                  <Eye className='h-4 w-4' />
                  Voir la page
                </Link>
              </Button>
              <Button variant='outline' asChild size='sm'>
                <Link href={`/dashboard/host/edit/${product.id}`} className='flex items-center gap-2'>
                  <Settings className='h-4 w-4' />
                  Modifier
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Statistiques principales */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600 mb-1'>Total réservations</p>
                  <p className='text-2xl font-bold text-gray-900'>{totalReservations}</p>
                </div>
                <Calendar className='h-8 w-8 text-blue-500' />
              </div>
              <p className='text-sm text-gray-500 mt-2'>{confirmedReservations} confirmées</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600 mb-1'>Revenus totaux</p>
                  <p className='text-2xl font-bold text-gray-900'>{totalRevenue}€</p>
                </div>
                <Euro className='h-8 w-8 text-green-500' />
              </div>
              <p className='text-sm text-gray-500 mt-2'>Réservations confirmées</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600 mb-1'>Note moyenne</p>
                  <div className='flex items-center gap-2'>
                    <p className='text-2xl font-bold text-gray-900'>{averageRating.toFixed(1)}</p>
                    <Star className='h-5 w-5 fill-yellow-400 text-yellow-400' />
                  </div>
                </div>
                <BarChart3 className='h-8 w-8 text-yellow-500' />
              </div>
              <p className='text-sm text-gray-500 mt-2'>{totalReviews} avis</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600 mb-1'>En attente</p>
                  <p className='text-2xl font-bold text-gray-900'>{pendingReservations}</p>
                </div>
                <AlertCircle className='h-8 w-8 text-orange-500' />
              </div>
              <p className='text-sm text-gray-500 mt-2'>Réservations à traiter</p>
            </CardContent>
          </Card>
        </div>

        {/* Contenu principal avec onglets */}
        <Tabs defaultValue='reservations' className='space-y-6'>
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='reservations' className='flex items-center gap-2'>
              <Calendar className='h-4 w-4' />
              Réservations
            </TabsTrigger>
            <TabsTrigger value='reviews' className='flex items-center gap-2'>
              <Star className='h-4 w-4' />
              Avis ({totalReviews})
            </TabsTrigger>
            <TabsTrigger value='analytics' className='flex items-center gap-2'>
              <TrendingUp className='h-4 w-4' />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value='reservations' className='space-y-6'>
            <Card>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <CardTitle>Réservations récentes</CardTitle>
                  <Button asChild size='sm'>
                    <Link href='/dashboard/host/reservations'>
                      Voir toutes les réservations
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {recentReservations.length === 0 ? (
                  <div className='text-center py-8'>
                    <Calendar className='h-12 w-12 text-gray-300 mx-auto mb-4' />
                    <p className='text-gray-500'>Aucune réservation pour le moment</p>
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {recentReservations.map(reservation => (
                      <div key={reservation.id} className='flex items-center justify-between p-4 border rounded-lg'>
                        <div className='flex items-center gap-4'>
                          <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                            <Users className='h-5 w-5 text-blue-600' />
                          </div>
                          <div>
                            <p className='font-medium text-gray-900'>
                              {reservation.user.name || reservation.user.email}
                            </p>
                            <p className='text-sm text-gray-500'>
                              {format(new Date(reservation.arrivingDate), 'dd MMM', { locale: fr })} - {' '}
                              {format(new Date(reservation.leavingDate), 'dd MMM yyyy', { locale: fr })}
                            </p>
                          </div>
                        </div>
                        <div className='flex items-center gap-4'>
                          <Badge className={getStatusColor(reservation.status)}>
                            <div className='flex items-center gap-1'>
                              {getStatusIcon(reservation.status)}
                              {reservation.status}
                            </div>
                          </Badge>
                          <p className='font-medium text-gray-900'>{reservation.prices}€</p>
                          <Button asChild size='sm' variant='outline'>
                            <Link href={`/dashboard/host/reservations/${reservation.id}`}>
                              Voir détails
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='reviews' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Avis récents</CardTitle>
              </CardHeader>
              <CardContent>
                {recentReviews.length === 0 ? (
                  <div className='text-center py-8'>
                    <Star className='h-12 w-12 text-gray-300 mx-auto mb-4' />
                    <p className='text-gray-500'>Aucun avis pour le moment</p>
                  </div>
                ) : (
                  <div className='space-y-6'>
                    {recentReviews.map(review => (
                      <div key={review.id} className='border-b border-gray-200 pb-6 last:border-b-0'>
                        <div className='flex items-start justify-between mb-3'>
                          <div>
                            <h4 className='font-semibold text-gray-900'>{review.title}</h4>
                            <div className='flex items-center gap-2 mt-1'>
                              <div className='flex items-center gap-1'>
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.grade 
                                        ? 'fill-yellow-400 text-yellow-400' 
                                        : 'fill-gray-200 text-gray-200'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className='text-sm text-gray-500'>
                                {format(new Date(review.publishDate), 'dd MMM yyyy', { locale: fr })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className='text-gray-700 leading-relaxed'>{review.text}</p>
                      </div>
                    ))}
                    
                    <div className='pt-4 border-t'>
                      <Button asChild variant='outline' className='w-full'>
                        <Link href={`/host/${product.id}#reviews`}>
                          Voir tous les avis
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='analytics' className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <Card>
                <CardHeader>
                  <CardTitle>Performance du mois</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-600'>Taux d'occupation</span>
                      <span className='font-semibold'>75%</span>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-600'>Revenus moyens/nuit</span>
                      <span className='font-semibold'>{product.basePrice}€</span>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-600'>Temps de réponse moyen</span>
                      <span className='font-semibold'>2h</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Actions recommandées</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    <div className='flex items-center gap-3 p-3 bg-yellow-50 rounded-lg'>
                      <AlertCircle className='h-5 w-5 text-yellow-600' />
                      <span className='text-sm'>
                        {pendingReservations} réservation{pendingReservations > 1 ? 's' : ''} en attente
                      </span>
                    </div>
                    <div className='flex items-center gap-3 p-3 bg-blue-50 rounded-lg'>
                      <MessageCircle className='h-5 w-5 text-blue-600' />
                      <span className='text-sm'>
                        Répondre aux messages clients
                      </span>
                    </div>
                    <div className='flex items-center gap-3 p-3 bg-green-50 rounded-lg'>
                      <TrendingUp className='h-5 w-5 text-green-600' />
                      <span className='text-sm'>
                        Optimiser les prix pour la haute saison
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}