'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcnui/card'
import { Badge } from '@/components/ui/shadcnui/badge'
import { Home, Clock, CheckCircle, XCircle, MapPin, Euro, Calendar } from 'lucide-react'
import type { ExtendedUser } from '../types'

interface UserListingsAndBookingsProps {
  user: ExtendedUser
}

export function UserListingsAndBookings({ user }: UserListingsAndBookingsProps) {
  return (
    <>
      <Card className='lg:col-span-2 hover:shadow-lg transition-shadow duration-200'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-xl'>
            <Home className='h-5 w-5 text-blue-600' />
            Hébergements ({user.Product.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {user.Product.length > 0 ? (
              user.Product.map(product => (
                <Card
                  key={product.id}
                  className='overflow-hidden hover:shadow-md transition-shadow duration-200'
                >
                  <CardContent className='p-4'>
                    <div className='flex justify-between items-start'>
                      <div className='space-y-2'>
                        <h3 className='font-medium text-lg'>{product.name}</h3>
                        <div className='flex items-center gap-4 text-gray-600'>
                          <div className='flex items-center gap-1'>
                            <MapPin className='h-4 w-4' />
                            <span className='text-sm'>{product.address}</span>
                          </div>
                          <div className='flex items-center gap-1'>
                            <Euro className='h-4 w-4' />
                            <span className='text-sm'>{product.basePrice}€ / nuit</span>
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={product.validate === 'Approve' ? 'default' : 'secondary'}
                        className='ml-4'
                      >
                        {product.validate}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className='text-gray-600 text-sm italic'>Aucun hébergement</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className='lg:col-span-3 hover:shadow-lg transition-shadow duration-200'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-xl'>
            <Clock className='h-5 w-5 text-blue-600' />
            Réservations ({user.Rent.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {user.Rent.length > 0 ? (
              user.Rent.map(rent => (
                <Card
                  key={rent.id}
                  className='overflow-hidden hover:shadow-md transition-shadow duration-200'
                >
                  <CardContent className='p-4'>
                    <div className='flex justify-between items-start'>
                      <div className='space-y-2'>
                        <h3 className='font-medium text-lg'>Réservation #{rent.id.slice(-8)}</h3>
                        <div className='flex items-center gap-2 text-gray-600'>
                          <Calendar className='h-4 w-4' />
                          <span className='text-sm'>
                            {new Date(rent.arrivingDate).toLocaleDateString('fr-FR')} -{' '}
                            {new Date(rent.leavingDate).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant={
                          rent.status === 'CHECKIN'
                            ? 'default'
                            : rent.status === 'CANCEL'
                              ? 'destructive'
                              : 'secondary'
                        }
                        className='flex items-center gap-1 ml-4'
                      >
                        {rent.status === 'CHECKIN' ? (
                          <CheckCircle className='h-3 w-3' />
                        ) : rent.status === 'CANCEL' ? (
                          <XCircle className='h-3 w-3' />
                        ) : null}
                        {rent.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className='text-gray-600 text-sm italic'>Aucune réservation</p>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
