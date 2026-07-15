'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { CACHE_TAGS } from '@/lib/cache/query-client'
import { useMutationWithCache } from '@/hooks/useMutationWithCache'
import { useAuth } from '@/hooks/useAuth'
import { findAllReservationsByHostId, FormattedRent } from '@/lib/services/rent.service'
import { findProductBySlugOrId } from '@/lib/services/product.service'
import { FormattedUnavailability } from '@/lib/services/unavailableRent.service'
import HostNavbar from '../components/HostNavbar'
import UnavailabilityModal, { UnavailabilityData } from './UnavailabilityModal'
import ExportCalendarModal from '@/components/calendar/ExportCalendarModal'
import Link from 'next/link'
import { Calendar as CalendarIcon } from 'lucide-react'

function CalendarContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    session,
    isLoading: isAuthLoading,
  } = useAuth({ required: true, redirectTo: '/auth' })
  const propertyId = searchParams.get('property')
  const hostId = session?.user?.id
  const [currentDate, setCurrentDate] = useState(new Date())
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedUnavailability, setSelectedUnavailability] = useState<{
    id: string
    title: string
    description: string | null
    startDate: Date
    endDate: Date
    productId: string
  } | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days = []

    // Ajouter les jours du mois précédent pour compléter la première semaine
    const firstDayOfWeek = firstDay.getDay() || 7 // Convertir dimanche (0) en 7
    for (let i = firstDayOfWeek - 1; i > 0; i--) {
      const prevDate = new Date(year, month, 1 - i)
      days.push(prevDate)
    }

    // Ajouter les jours du mois courant
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }

    // Ajouter les jours du mois suivant pour compléter la dernière semaine
    const lastDayOfWeek = lastDay.getDay() || 7
    for (let i = 1; i <= 7 - lastDayOfWeek; i++) {
      const nextDate = new Date(year, month + 1, i)
      days.push(nextDate)
    }

    return days
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { day: 'numeric' })
  }

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth()
  }

  const getReservationsForDay = (date: Date) => {
    return reservations.filter(reservation => {
      // Parser les dates en forçant l'heure locale à minuit pour éviter les problèmes de timezone
      const startDate = new Date(reservation.start)
      const endDate = new Date(reservation.end)

      // Normaliser à minuit en heure locale
      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(0, 0, 0, 0)

      // Logique "nuit d'hôtel" : afficher du startDate (inclus) au endDate (exclu)
      // Exemple : réservation du 12 au 13 = affiche sur le 12, pas sur le 13
      return date >= startDate && date < endDate
    })
  }

  const getUnavailabilitiesForDay = (date: Date) => {
    return unavailabilities.filter(unavail => {
      // Parser les dates en forçant l'heure locale à minuit pour éviter les problèmes de timezone
      const [startYear, startMonth, startDay] = unavail.start.split('-').map(Number)
      const startDate = new Date(startYear, startMonth - 1, startDay)

      const [endYear, endMonth, endDay] = unavail.end.split('-').map(Number)
      const endDate = new Date(endYear, endMonth - 1, endDay)

      // Debug log
      if (unavail.id === 'cmhtdss3b0000s6vjhwc04k30') {
        console.log('🗓️ [CALENDAR] Checking unavailability:', {
          unavail,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          checkingDate: date.toISOString(),
          condition: `${date.toISOString()} >= ${startDate.toISOString()} && ${date.toISOString()} < ${endDate.toISOString()}`,
          result: date >= startDate && date < endDate,
        })
      }

      // Logique "nuit d'hôtel" : afficher du startDate (inclus) au endDate (exclu)
      // Exemple : blocage du 12 au 13 = affiche sur le 12, pas sur le 13
      return date >= startDate && date < endDate
    })
  }

  // --- Server reads (React Query) ---
  const reservationsQuery = useQuery({
    queryKey: CACHE_TAGS.hostReservations(hostId ?? ''),
    queryFn: () => findAllReservationsByHostId(hostId!),
    enabled: !!hostId,
  })

  const unavailabilitiesQuery = useQuery({
    queryKey: CACHE_TAGS.hostUnavailability(propertyId ?? undefined),
    queryFn: async (): Promise<FormattedUnavailability[]> => {
      const params = propertyId ? `?productId=${propertyId}` : ''
      const response = await fetch(`/api/host/unavailability${params}`)
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des indisponibilités')
      }
      return response.json()
    },
  })

  const userProductsQuery = useQuery({
    queryKey: CACHE_TAGS.hostProductsList(),
    queryFn: async (): Promise<Array<{ id: string; name: string }>> => {
      const response = await fetch('/api/host/products')
      if (!response.ok) return []
      const data = await response.json()
      return data.products || []
    },
    enabled: !!hostId,
  })

  const propertyNameQuery = useQuery({
    queryKey: CACHE_TAGS.product(propertyId ?? ''),
    queryFn: () => findProductBySlugOrId(propertyId!),
    enabled: !!propertyId,
    select: product => product?.name || '',
  })

  // Filtrer les réservations par propriété si spécifié
  const reservations = propertyId
    ? (reservationsQuery.data ?? []).filter(reservation => reservation.propertyId === propertyId)
    : reservationsQuery.data ?? []
  const unavailabilities = unavailabilitiesQuery.data ?? []
  const userProducts = userProductsQuery.data ?? []
  const propertyName = propertyNameQuery.data ?? ''
  const loading = reservationsQuery.isLoading || unavailabilitiesQuery.isLoading

  // Invalidate the unavailability list plus the guest-facing availability caches
  // so a blocked date immediately hides the property from booking results.
  const unavailabilityInvalidationKeys = (productId: string) => [
    CACHE_TAGS.hostUnavailability(productId),
    CACHE_TAGS.hostUnavailability(),
    ['availability', productId] as const,
    ['room-type-availability', productId] as const,
  ]

  // --- Mutations (React Query) ---
  const createUnavailability = useMutationWithCache<void, UnavailabilityData>({
    mutationFn: async data => {
      const response = await fetch('/api/host/unavailability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: data.productId,
          startDate: data.startDate.toISOString(),
          endDate: data.endDate.toISOString(),
          title: data.title,
          description: data.description || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la création')
      }
    },
    invalidateKeys: (_data, data) => unavailabilityInvalidationKeys(data.productId),
    successMessage: 'Blocage créé avec succès',
  })

  const updateUnavailability = useMutationWithCache<void, UnavailabilityData>({
    mutationFn: async data => {
      if (!selectedUnavailability?.id) {
        throw new Error('Aucun blocage sélectionné')
      }

      const response = await fetch(`/api/host/unavailability/${selectedUnavailability.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: data.startDate.toISOString(),
          endDate: data.endDate.toISOString(),
          title: data.title,
          description: data.description || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la modification')
      }
    },
    invalidateKeys: (_data, data) => unavailabilityInvalidationKeys(data.productId),
    successMessage: 'Blocage modifié avec succès',
  })

  const deleteUnavailability = useMutationWithCache<void, string>({
    mutationFn: async id => {
      const response = await fetch(`/api/host/unavailability/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la suppression')
      }
    },
    invalidateKeys: () => {
      const productId = selectedUnavailability?.productId
      return productId ? unavailabilityInvalidationKeys(productId) : [CACHE_TAGS.hostUnavailability()]
    },
    successMessage: 'Blocage supprimé avec succès',
    onSuccess: () => setModalOpen(false),
  })

  const handleCreateUnavailability = async (data: UnavailabilityData) => {
    await createUnavailability.mutateAsync(data)
  }

  const handleUpdateUnavailability = async (data: UnavailabilityData) => {
    if (!selectedUnavailability?.id) return
    await updateUnavailability.mutateAsync(data)
  }

  const handleDeleteUnavailability = async (id: string) => {
    await deleteUnavailability.mutateAsync(id)
  }

  const handleDayClick = (
    date: Date,
    reservationsForDay: FormattedRent[],
    unavailabilitiesForDay: FormattedUnavailability[]
  ) => {
    // Si clic sur date vide (pas de réservation ni d'indisponibilité), créer
    if (reservationsForDay.length === 0 && unavailabilitiesForDay.length === 0) {
      setSelectedDate(date)
      setSelectedUnavailability(null)
      setModalMode('create')
      setModalOpen(true)
    }
  }

  const handleUnavailabilityClick = (e: React.MouseEvent, unavail: FormattedUnavailability) => {
    e.stopPropagation()
    setSelectedUnavailability({
      id: unavail.id,
      title: unavail.title,
      description: unavail.description,
      startDate: new Date(unavail.start),
      endDate: new Date(unavail.end),
      productId: unavail.productId,
    })
    setModalMode('edit')
    setModalOpen(true)
  }

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  if (isAuthLoading) {
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

  return (
    <div className='min-h-screen bg-gray-100'>
      <HostNavbar />
      <div className='container mx-auto py-6'>
        <div className='bg-white rounded-lg shadow-md'>
          <div className='p-6 border-b border-gray-200'>
            <div className='flex flex-col gap-4'>
              <div className='flex justify-between items-center'>
                <h1 className='text-2xl font-bold text-gray-900'>{formatMonthYear(currentDate)}</h1>
                <div className='flex items-center gap-2'>
                  <button
                    onClick={prevMonth}
                    className='p-2 rounded-md hover:bg-gray-100 text-gray-700'
                  >
                    <svg className='h-5 w-5' viewBox='0 0 24 24' fill='none' stroke='currentColor'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        d='M15 19l-7-7 7-7'
                      />
                    </svg>
                  </button>
                  <button
                    onClick={nextMonth}
                    className='p-2 rounded-md hover:bg-gray-100 text-gray-700'
                  >
                    <svg className='h-5 w-5' viewBox='0 0 24 24' fill='none' stroke='currentColor'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        d='M9 5l7 7-7 7'
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Product selector dropdown */}
              <div className='flex items-center gap-3'>
                <label htmlFor='product-select' className='text-sm font-medium text-gray-700'>
                  Logement:
                </label>
                <select
                  id='product-select'
                  value={propertyId || ''}
                  onChange={e => {
                    const newPropertyId = e.target.value
                    if (newPropertyId) {
                      router.push(`/dashboard/host/calendar?property=${newPropertyId}`)
                    } else {
                      router.push('/dashboard/host/calendar')
                    }
                  }}
                  className='flex-1 max-w-md border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value=''>Tous les logements</option>
                  {userProducts.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Calendar Sync Buttons */}
              <div className='flex gap-2'>
                {propertyId && (
                  <ExportCalendarModal productId={propertyId} productName={propertyName} />
                )}
                <Link href='/dashboard/host/calendars'>
                  <button className='inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2'>
                    <CalendarIcon className='h-4 w-4' />
                    Importer des calendriers
                  </button>
                </Link>
              </div>
            </div>
            {!propertyId && (
              <div className='mt-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm'>
                💡 Cliquez sur une date vide pour bloquer une propriété
              </div>
            )}
          </div>

          <div className='p-6'>
            {isAuthLoading || loading ? (
              <div className='flex items-center justify-center h-[600px]'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
              </div>
            ) : (
              <div className='grid grid-cols-7 gap-1'>
                {weekDays.map(day => (
                  <div key={day} className='text-center font-semibold py-2 text-gray-900'>
                    {day}
                  </div>
                ))}
                {getDaysInMonth(currentDate).map((date, index) => {
                  const reservationsForDay = getReservationsForDay(date)
                  const unavailabilitiesForDay = getUnavailabilitiesForDay(date)
                  return (
                    <div
                      key={index}
                      onClick={() =>
                        handleDayClick(date, reservationsForDay, unavailabilitiesForDay)
                      }
                      className={`min-h-[100px] p-2 border border-gray-200 rounded-lg ${
                        !isCurrentMonth(date)
                          ? 'bg-gray-100 text-gray-400'
                          : 'bg-white text-gray-900'
                      } ${isToday(date) ? 'bg-blue-100 border-blue-300' : ''} ${
                        reservationsForDay.length === 0 && unavailabilitiesForDay.length === 0
                          ? 'cursor-pointer hover:bg-gray-50'
                          : ''
                      }`}
                    >
                      <div className='text-sm font-medium mb-1'>{formatDate(date)}</div>
                      <div className='space-y-1'>
                        {/* Réservations (bleu) */}
                        {reservationsForDay.map(reservation => (
                          <div
                            key={reservation.id}
                            onClick={() =>
                              router.push(`/dashboard/host/reservations/${reservation.id}`)
                            }
                            className='text-xs p-1 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700 transition-colors'
                          >
                            <div className='font-medium truncate'>{reservation.title}</div>
                            <div className='text-blue-100 truncate'>{reservation.propertyName}</div>
                          </div>
                        ))}

                        {/* Indisponibilités (rouge) */}
                        {unavailabilitiesForDay.map(unavail => (
                          <div
                            key={unavail.id}
                            onClick={e => handleUnavailabilityClick(e, unavail)}
                            className='text-xs p-1 bg-red-500 text-white rounded cursor-pointer hover:bg-red-600 transition-colors'
                          >
                            <div className='font-medium truncate'>🚫 {unavail.title}</div>
                            {unavail.propertyName && (
                              <div className='text-red-100 truncate'>{unavail.propertyName}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <UnavailabilityModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={modalMode === 'create' ? handleCreateUnavailability : handleUpdateUnavailability}
        onDelete={modalMode === 'edit' ? handleDeleteUnavailability : undefined}
        selectedDate={selectedDate || undefined}
        existingUnavailability={selectedUnavailability}
        mode={modalMode}
        preselectedPropertyId={propertyId}
      />
    </div>
  )
}

export default function CalendarPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen bg-gray-100 flex items-center justify-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
        </div>
      }
    >
      <CalendarContent />
    </Suspense>
  )
}
