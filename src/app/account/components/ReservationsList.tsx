'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { Button } from '@/components/ui/shadcnui/button'
import { Calendar, ChevronDown, MapPin, X, Clock, CheckCircle, XCircle, Filter } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/shadcnui'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/shadcnui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { format, differenceInDays, isAfter, isBefore } from 'date-fns'
import { fr } from 'date-fns/locale'

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
      setStatusFilter('')
    } else if (status === 'OUTGOING') {
      setDateFilter('OUTGOING')
      setStatusFilter('')
    } else {
      setStatusFilter(status)
      setDateFilter('')
    }
  }

  const clearDateFilter = () => {
    setDateFilter('')
  }

  const clearStatusFilter = () => {
    setStatusFilter('')
  }

  const clearAllFilters = () => {
    setDateFilter('')
    setStatusFilter('')
  }

  const returnFilteredOptionsInChoosingLanguage = (text: string, language: string) => {
    if (language.toUpperCase() === 'FR') {
      if (text === 'INCOMING') {
        return 'Réservations à venir'
      } else if (text === 'OUTGOING') {
        return 'Réservations passées'
      } else if (text === 'RESERVED') {
        return 'Confirmé'
      } else if (text === 'WAITING') {
        return 'En attente'
      } else if (text === 'CANCEL') {
        return 'Annulé'
      }
    }
    return text
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RESERVED':
        return <CheckCircle className='w-4 h-4' />
      case 'WAITING':
        return <Clock className='w-4 h-4' />
      case 'CANCEL':
        return <XCircle className='w-4 h-4' />
      default:
        return <Clock className='w-4 h-4' />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RESERVED':
        return 'from-green-500 to-emerald-500'
      case 'WAITING':
        return 'from-yellow-500 to-orange-500'
      case 'CANCEL':
        return 'from-red-500 to-rose-500'
      default:
        return 'from-blue-500 to-indigo-500'
    }
  }

  const getTripStatus = (rent: Rent) => {
    const now = new Date()
    const arrivalDate = new Date(rent.arrivingDate)
    const departureDate = new Date(rent.leavingDate)

    if (isBefore(departureDate, now)) {
      return { label: 'Terminé', color: 'text-gray-500' }
    } else if (isAfter(arrivalDate, now)) {
      const daysUntil = differenceInDays(arrivalDate, now)
      return {
        label:
          daysUntil === 0 ? "Aujourd'hui" : `Dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}`,
        color: 'text-blue-600',
      }
    } else {
      return { label: 'En cours', color: 'text-green-600' }
    }
  }

  useEffect(() => {
    let filtered = [...reservations]

    // Appliquer le filtre de date
    if (dateFilter === 'INCOMING') {
      filtered = filtered.filter(rent => new Date(rent.arrivingDate) >= new Date())
    } else if (dateFilter === 'OUTGOING') {
      filtered = filtered.filter(rent => new Date(rent.leavingDate) < new Date())
    }

    // Appliquer le filtre de statut
    if (statusFilter) {
      filtered = filtered.filter(rent => rent.status === statusFilter)
    }

    setFilteredReservations(filtered)
  }, [dateFilter, statusFilter, reservations])

  if (reservations.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='text-center py-16'
      >
        <div className='max-w-md mx-auto'>
          <div className='w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center'>
            <Calendar className='w-12 h-12 text-blue-500' />
          </div>
          <h3 className='text-2xl font-bold text-gray-900 mb-3'>Aucune réservation</h3>
          <p className='text-gray-600 mb-8 leading-relaxed'>
            Vous n&apos;avez pas encore de réservations. Explorez nos hébergements et réservez votre
            prochain voyage dès maintenant !
          </p>
          <Link href='/host'>
            <Button className='bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300'>
              Découvrir les hébergements
            </Button>
          </Link>
        </div>
      </motion.div>
    )
  }

  const activeFiltersCount = (dateFilter ? 1 : 0) + (statusFilter ? 1 : 0)

  return (
    <div className='space-y-6'>
      {/* Header and Filters */}
      <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
        <div>
          <h3 className='text-lg font-semibold text-gray-900'>
            {filteredReservations.length} réservation{filteredReservations.length > 1 ? 's' : ''}
            {activeFiltersCount > 0 && (
              <span className='text-gray-500'> (filtré{activeFiltersCount > 1 ? 's' : ''})</span>
            )}
          </h3>
          <p className='text-gray-600 text-sm'>Gérez vos réservations et vos prochains voyages</p>
        </div>

        {/* Filters */}
        <div className='flex flex-wrap gap-2'>
          {/* Active filters */}
          <AnimatePresence>
            {dateFilter && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Badge
                  variant='outline'
                  className='group transition-all duration-300 cursor-pointer flex items-center gap-2 hover:bg-red-50 text-xs py-1 px-3 rounded-full hover:text-red-600 hover:border-red-200'
                  onClick={clearDateFilter}
                >
                  {returnFilteredOptionsInChoosingLanguage(dateFilter, language)}
                  <X className='h-3 w-3 group-hover:text-red-600 transition-colors' />
                </Badge>
              </motion.div>
            )}
            {statusFilter && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Badge
                  variant='outline'
                  className='group transition-all duration-300 cursor-pointer flex items-center gap-2 hover:bg-red-50 text-xs py-1 px-3 rounded-full hover:text-red-600 hover:border-red-200'
                  onClick={clearStatusFilter}
                >
                  {returnFilteredOptionsInChoosingLanguage(statusFilter, language)}
                  <X className='h-3 w-3 group-hover:text-red-600 transition-colors' />
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Clear all filters */}
          {activeFiltersCount > 0 && (
            <Button
              variant='ghost'
              size='sm'
              onClick={clearAllFilters}
              className='text-xs h-7 px-3 hover:bg-gray-100'
            >
              Effacer tout
            </Button>
          )}

          {/* Filter dropdowns */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='sm' className='gap-2'>
                <Filter className='w-4 h-4' />
                Date
                <ChevronDown className='w-4 h-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={() => handleFilter('INCOMING')}>
                Réservations à venir
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilter('OUTGOING')}>
                Réservations passées
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='sm' className='gap-2'>
                <Filter className='w-4 h-4' />
                Statut
                <ChevronDown className='w-4 h-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={() => handleFilter('RESERVED')}>Confirmé</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilter('WAITING')}>
                En attente
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilter('CANCEL')}>Annulé</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Reservations List */}
      <div className='space-y-4'>
        <AnimatePresence>
          {filteredReservations.map((rent, index) => {
            const tripStatus = getTripStatus(rent)
            const duration = differenceInDays(
              new Date(rent.leavingDate),
              new Date(rent.arrivingDate)
            )

            return (
              <motion.div
                key={rent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                layout
              >
                <Card className='overflow-hidden hover:shadow-lg transition-all duration-300 border-0 shadow-sm bg-white group'>
                  <CardContent className='p-0'>
                    <div className='flex flex-col lg:flex-row'>
                      {/* Image */}
                      <div className='relative w-full lg:w-80 h-48 lg:h-auto overflow-hidden'>
                        <Image
                          src={rent.product.img?.[0]?.img || '/placeholder.png'}
                          alt={rent.product.name}
                          fill
                          className='object-cover group-hover:scale-105 transition-transform duration-500'
                        />

                        {/* Status badge on image */}
                        <div className='absolute top-4 left-4'>
                          <div
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-white text-sm font-medium bg-gradient-to-r ${getStatusColor(rent.status)} shadow-lg`}
                          >
                            {getStatusIcon(rent.status)}
                            {returnFilteredOptionsInChoosingLanguage(rent.status, language)}
                          </div>
                        </div>

                        {/* Trip status */}
                        <div className='absolute bottom-4 left-4'>
                          <div className='bg-white/90 backdrop-blur-sm rounded-full px-3 py-1'>
                            <span className={`text-sm font-medium ${tripStatus.color}`}>
                              {tripStatus.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className='flex-1 p-6'>
                        <div className='flex flex-col lg:flex-row lg:justify-between h-full'>
                          <div className='space-y-4'>
                            <div>
                              <h3 className='text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors'>
                                {rent.product.name}
                              </h3>
                              <div className='flex items-center gap-2 text-gray-600'>
                                <MapPin className='w-4 h-4 flex-shrink-0' />
                                <span className='text-sm'>{rent.product.address}</span>
                              </div>
                            </div>

                            <div className='grid grid-cols-2 lg:grid-cols-3 gap-4'>
                              <div className='space-y-1'>
                                <p className='text-xs font-medium text-gray-500 uppercase tracking-wide'>
                                  Arrivée
                                </p>
                                <p className='text-sm font-semibold text-gray-900'>
                                  {format(new Date(rent.arrivingDate), 'dd MMM yyyy', {
                                    locale: fr,
                                  })}
                                </p>
                              </div>
                              <div className='space-y-1'>
                                <p className='text-xs font-medium text-gray-500 uppercase tracking-wide'>
                                  Départ
                                </p>
                                <p className='text-sm font-semibold text-gray-900'>
                                  {format(new Date(rent.leavingDate), 'dd MMM yyyy', {
                                    locale: fr,
                                  })}
                                </p>
                              </div>
                              <div className='space-y-1 col-span-2 lg:col-span-1'>
                                <p className='text-xs font-medium text-gray-500 uppercase tracking-wide'>
                                  Durée
                                </p>
                                <p className='text-sm font-semibold text-gray-900'>
                                  {duration} nuit{duration > 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className='flex flex-col justify-end mt-6 lg:mt-0 lg:ml-6'>
                            <Link href={`/reservations/${rent.id}`}>
                              <Button className='w-full lg:w-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 px-6'>
                                Voir les détails
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
