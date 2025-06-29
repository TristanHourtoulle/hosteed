'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { Button } from '@/components/ui/shadcnui/button'
import { Calendar, MapPin } from 'lucide-react'

interface Rent {
  id: string
  product: {
    name: string
    address: string
    img: Array<{ img: string }> | null
  }
  arrivingDate: Date
  leavingDate: Date
  status: string
}

interface ReservationsListProps {
  reservations: Rent[]
}

export function ReservationsList({ reservations }: ReservationsListProps) {
  if (reservations.length === 0) {
    return (
      <Card className='bg-white/50 backdrop-blur-sm border-dashed'>
        <CardContent className='py-12 text-center text-gray-500'>
          <div className='flex flex-col items-center gap-3'>
            <Calendar className='w-12 h-12 text-gray-400' />
            <p className='text-lg'>Vous n'avez pas encore de réservations</p>
            <Link href='/'>
              <Button variant='outline' className='mt-2'>
                Explorer les hébergements
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='grid gap-4'>
      {reservations.map(rent => (
        <Card key={rent.id} className='overflow-hidden hover:shadow-lg transition-shadow p-0'>
          <CardContent className='p-0'>
            <div className='flex flex-col sm:flex-row items-center justify-center'>
              <div className='relative w-full sm:w-48 h-48'>
                <Image
                  src={rent.product.img?.[0]?.img || '/placeholder.png'}
                  alt={rent.product.name}
                  fill
                  className='object-cover rounded-br-lg'
                />
              </div>
              <div className='flex-1 p-6 py-0'>
                <div className='flex flex-col lg:flex-row h-full justify-between'>
                  <div className='mt-auto'>
                    <h3 className='text-xl font-semibold mb-2'>{rent.product.name}</h3>
                    <div className='flex items-center gap-2 text-gray-600 mb-4'>
                      <MapPin className='w-4 h-4' />
                      <span>{rent.product.address}</span>
                    </div>
                    <div className='flex flex-wrap gap-4 text-sm text-gray-600'>
                      <div>
                        <p className='font-medium'>Arrivée</p>
                        <p>{new Date(rent.arrivingDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className='font-medium'>Départ</p>
                        <p>{new Date(rent.leavingDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className='font-medium'>Statut</p>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${
                            rent.status === 'RESERVED'
                              ? 'bg-green-100 text-green-800'
                              : rent.status === 'WAITING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : rent.status === 'CANCEL'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {rent.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className='mt-4 flex justify-end lg:mt-auto'>
                    <Link href={`/reservations/${rent.id}`}>
                      <Button variant='outline'>Voir les détails</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
