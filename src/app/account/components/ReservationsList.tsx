'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { Button } from '@/components/ui/shadcnui/button'
import { Calendar, ChevronDown, MapPin, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/shadcnui'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/shadcnui/badge'

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
  const [filteredReservations, setFilteredReservations] = useState<Rent[]>(reservations)
  const [dateFilter, setDateFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const language = 'fr'

  const handleFilter = (status: string) => {
    if (status === 'INCOMING') {
      setDateFilter('INCOMING')
    } else if (status === 'OUTGOING') {
      setDateFilter('OUTGOING')
    } else {
      setStatusFilter(status)
    }
  }

  const clearDateFilter = () => {
    setDateFilter('')
  }

  const clearStatusFilter = () => {
    setStatusFilter('')
  }

  const returnFilteredOptionsInChoosingLanguage = (text: string, language: string) => {
    if (language.toUpperCase() === 'FR') {
      if (text === 'INCOMING') {
        return 'Réservations à venir'
      } else if (text === 'OUTGOING') {
        return 'Réservations passées'
      } else if (text === 'RESERVED') {
        return 'Réservé'
      } else if (text === 'WAITING') {
        return 'En attente'
      } else if (text === 'CANCEL') {
        return 'Annulé'
      }
    } else if (language.toUpperCase() === 'EN') {
      if (text === 'INCOMING') {
        return 'Incoming reservations'
      } else if (text === 'OUTGOING') {
        return 'Past reservations'
      } else if (text === 'RESERVED') {
        return 'Reserved'
      } else if (text === 'WAITING') {
        return 'Waiting'
      } else if (text === 'CANCEL') {
        return 'Canceled'
      }
    }
  }

  useEffect(() => {
    let filtered = [...reservations]

    // Appliquer le filtre de date
    if (dateFilter === 'INCOMING') {
      filtered = filtered.filter(rent => rent.arrivingDate >= new Date())
    } else if (dateFilter === 'OUTGOING') {
      filtered = filtered.filter(rent => rent.leavingDate < new Date())
    }

    // Appliquer le filtre de statut
    if (statusFilter) {
      filtered = filtered.filter(rent => rent.status === statusFilter)
    }

    setFilteredReservations(filtered)
  }, [dateFilter, statusFilter, reservations])

  if (reservations.length === 0) {
    return (
      <Card className='bg-white/50 backdrop-blur-sm border-dashed'>
        <CardContent className='py-12 text-center text-gray-500'>
          <div className='flex flex-col items-center gap-3'>
            <Calendar className='w-12 h-12 text-gray-400' />
            <p className='text-lg'>Vous n&apos;avez pas encore de réservations</p>
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
      <div className='flex flex-col lg:flex-row w-full lg:w-auto justify-end gap-2 mb-4'>
        {/* Display the filter has been set ex: Réservations à venir sous forme de badge */}
        {dateFilter && (
          <Badge
            variant='outline'
            className='group transition-all duration-300 cursor-pointer flex items-center gap-1 hover:bg-destructive/5 text-xs py-0 px-4 rounded-full hover:text-destructive/75 hover:border-destructive/75'
            onClick={clearDateFilter}
          >
            {returnFilteredOptionsInChoosingLanguage(dateFilter, language)}
            <X className='h-3 w-3 group-hover:text-destructive/75 group-hover:scale-110 group-hover:rotate-90 transition-all duration-300' />
          </Badge>
        )}
        {statusFilter && (
          <Badge
            variant='outline'
            className='group transition-all duration-300 cursor-pointer flex items-center gap-1 hover:bg-destructive/5 text-xs py-0 px-4 rounded-full hover:text-destructive/75 hover:border-destructive/75'
            onClick={clearStatusFilter}
          >
            {returnFilteredOptionsInChoosingLanguage(statusFilter, language)}
            <X className='h-3 w-3 group-hover:text-destructive/75 group-hover:scale-110 group-hover:rotate-90 transition-all duration-300' />
          </Badge>
        )}
        {/* Filter by date */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline'>
              Filtrer par date
              <ChevronDown className='w-4 h-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleFilter('INCOMING')}>
              Réservations à venir
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFilter('OUTGOING')}>
              Réservations passées
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {/* Filter by status */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline'>
              Filtrer par statut
              <ChevronDown className='w-4 h-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleFilter('RESERVED')}>Réservé</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFilter('WAITING')}>En attente</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFilter('CANCEL')}>Annulé</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {filteredReservations.map(rent => (
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
