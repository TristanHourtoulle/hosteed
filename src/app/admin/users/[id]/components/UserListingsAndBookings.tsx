'use client'

import { MapPin, Calendar, Euro, Home } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcnui/card'
import { Badge } from '@/components/ui/shadcnui/badge'
import { Button } from '@/components/ui/shadcnui/button'
import Link from 'next/link'
import Image from 'next/image'

interface UserListingsAndBookingsProps {
  userId: string
  user: {
    id: string
    name: string | null
    email: string
    role: string
  }
  posts: Array<{
    id: string
    title: string
    description: string
    price: number
    location: string
    images: string[]
    status: string
    createdAt: Date
    isPromoted?: boolean
  }>
  bookings: Array<{
    id: string
    product: {
      id: string
      title: string
      price: number
      location: string
      images: string[]
    }
    totalPrice: number
    startDate: Date
    endDate: Date
    status: string
    createdAt: Date
  }>
}

export function UserListingsAndBookings({ posts, bookings }: UserListingsAndBookingsProps) {
  // Calculer les statistiques
  const totalEarnings = bookings
    .filter(booking => booking.status === 'CONFIRMED')
    .reduce((sum, booking) => sum + booking.totalPrice, 0)

  const activePosts = posts.filter(post => post.status === 'APPROVED').length
  const totalBookings = bookings.length

  return (
    <div className='space-y-8'>
      {/* Statistiques */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <Card className='border-0 shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-blue-100 text-sm font-medium'>Revenus totaux</p>
                <p className='text-2xl font-bold mt-1'>{totalEarnings}€</p>
              </div>
              <div className='bg-white/20 p-3 rounded-full'>
                <Euro className='h-6 w-6 text-white' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='border-0 shadow-lg bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-green-100 text-sm font-medium'>Annonces actives</p>
                <p className='text-2xl font-bold mt-1'>{activePosts}</p>
              </div>
              <div className='bg-white/20 p-3 rounded-full'>
                <Home className='h-6 w-6 text-white' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='border-0 shadow-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-purple-100 text-sm font-medium'>Réservations</p>
                <p className='text-2xl font-bold mt-1'>{totalBookings}</p>
              </div>
              <div className='bg-white/20 p-3 rounded-full'>
                <Calendar className='h-6 w-6 text-white' />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Annonces de l'utilisateur */}
      <Card className='border-0 shadow-lg rounded-2xl'>
        <CardHeader className='pb-4'>
          <CardTitle className='text-xl font-bold text-gray-900 flex items-center gap-2'>
            <Home className='h-5 w-5 text-blue-600' />
            Annonces ({posts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className='text-center py-12'>
              <Home className='h-12 w-12 text-gray-300 mx-auto mb-4' />
              <p className='text-gray-500'>Aucune annonce trouvée</p>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {posts.map(post => (
                <div
                  key={post.id}
                  className='border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow'
                >
                  {post.images && post.images.length > 0 && (
                    <div className='aspect-video bg-gray-100 relative'>
                      <Image
                        src={post.images[0]}
                        alt={post.title}
                        fill
                        className='object-cover'
                        unoptimized
                      />
                      {post.isPromoted && (
                        <Badge className='absolute top-2 right-2 bg-yellow-500 text-white border-0'>
                          Sponsorisé
                        </Badge>
                      )}
                    </div>
                  )}
                  <div className='p-4'>
                    <h3 className='font-medium text-gray-900 mb-2 line-clamp-2'>{post.title}</h3>
                    <div className='flex items-center gap-1 text-gray-500 text-sm mb-2'>
                      <MapPin className='h-4 w-4' />
                      <span>{post.location}</span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='font-bold text-blue-600'>{post.price}€/nuit</span>
                      <Badge
                        variant={
                          post.status === 'APPROVED'
                            ? 'default'
                            : post.status === 'PENDING'
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {post.status === 'APPROVED'
                          ? 'Approuvé'
                          : post.status === 'PENDING'
                            ? 'En attente'
                            : 'Rejeté'}
                      </Badge>
                    </div>
                    <div className='mt-3'>
                      <Button variant='outline' size='sm' asChild className='w-full'>
                        <Link href={`/posts/${post.id}`}>Voir l&apos;annonce</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Réservations de l'utilisateur */}
      <Card className='border-0 shadow-lg rounded-2xl'>
        <CardHeader className='pb-4'>
          <CardTitle className='text-xl font-bold text-gray-900 flex items-center gap-2'>
            <Calendar className='h-5 w-5 text-purple-600' />
            Réservations ({bookings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className='text-center py-12'>
              <Calendar className='h-12 w-12 text-gray-300 mx-auto mb-4' />
              <p className='text-gray-500'>Aucune réservation trouvée</p>
            </div>
          ) : (
            <div className='space-y-4'>
              {bookings.map(booking => (
                <div
                  key={booking.id}
                  className='border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow'
                >
                  <div className='flex items-start gap-4'>
                    {booking.product.images && booking.product.images.length > 0 && (
                      <div className='w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative'>
                        <Image
                          src={booking.product.images[0]}
                          alt={booking.product.title}
                          fill
                          className='object-cover'
                          unoptimized
                        />
                      </div>
                    )}
                    <div className='flex-1 min-w-0'>
                      <h3 className='font-medium text-gray-900 mb-1'>{booking.product.title}</h3>
                      <div className='flex items-center gap-1 text-gray-500 text-sm mb-2'>
                        <MapPin className='h-4 w-4' />
                        <span>{booking.product.location}</span>
                      </div>
                      <div className='text-sm text-gray-600 mb-2'>
                        {new Date(booking.startDate).toLocaleDateString('fr-FR')} -{' '}
                        {new Date(booking.endDate).toLocaleDateString('fr-FR')}
                      </div>
                      <div className='flex items-center justify-between'>
                        <span className='font-bold text-green-600'>{booking.totalPrice}€</span>
                        <Badge
                          variant={
                            booking.status === 'CONFIRMED'
                              ? 'default'
                              : booking.status === 'PENDING'
                                ? 'secondary'
                                : 'destructive'
                          }
                        >
                          {booking.status === 'CONFIRMED'
                            ? 'Confirmé'
                            : booking.status === 'PENDING'
                              ? 'En attente'
                              : 'Annulé'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
