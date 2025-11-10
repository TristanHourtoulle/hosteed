'use client'

import { useEffect, useState, Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { findAllReservationsByHostId, FormattedRent } from '@/lib/services/rent.service'
import { FormattedUnavailability } from '@/lib/services/unavailableRent.service'
import HostNavbar from '../components/HostNavbar'
import UnavailabilityModal, { UnavailabilityData } from './UnavailabilityModal'
import ExportCalendarModal from '@/components/calendar/ExportCalendarModal'
import { toast } from 'sonner'
import Link from 'next/link'
import { Calendar as CalendarIcon } from 'lucide-react'

function CalendarContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    session,
    isLoading: isAuthLoading,
    isAuthenticated,
  } = useAuth({ required: true, redirectTo: '/auth' })
  const propertyId = searchParams.get('property')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [reservations, setReservations] = useState<FormattedRent[]>([])
  const [unavailabilities, setUnavailabilities] = useState<FormattedUnavailability[]>([])
  const [loading, setLoading] = useState(true)
  const [propertyName, setPropertyName] = useState<string>('')
  const [userProducts, setUserProducts] = useState<Array<{ id: string; name: string }>>([])
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
      const startDate = new Date(reservation.start)
      const endDate = new Date(reservation.end)
      // Logique "nuit d'hôtel" : afficher du startDate (inclus) au endDate (exclu)
      // Exemple : réservation du 12 au 13 = affiche sur le 12, pas sur le 13
      return date >= startDate && date < endDate
    })
  }

  const getUnavailabilitiesForDay = (date: Date) => {
    return unavailabilities.filter(unavail => {
      const startDate = new Date(unavail.start)
      const endDate = new Date(unavail.end)
      // Logique "nuit d'hôtel" : afficher du startDate (inclus) au endDate (exclu)
      // Exemple : blocage du 12 au 13 = affiche sur le 12, pas sur le 13
      return date >= startDate && date < endDate
    })
  }

  const fetchReservations = useCallback(async () => {
    try {
      if (!session?.user?.id) return

      const data = await findAllReservationsByHostId(session.user.id)

      // Filtrer par propriété si spécifié
      const filteredReservations = propertyId
        ? data.filter(reservation => reservation.propertyId === propertyId)
        : data

      setReservations(filteredReservations)
    } catch (error) {
      console.error('Erreur lors du chargement des réservations:', error)
      toast.error('Erreur lors du chargement des réservations')
    }
  }, [session?.user?.id, propertyId])

  const fetchUnavailabilities = useCallback(async () => {
    try {
      const params = propertyId ? `?productId=${propertyId}` : ''
      const response = await fetch(`/api/host/unavailability${params}`)
      if (response.ok) {
        const data = await response.json()
        setUnavailabilities(data)
      } else {
        toast.error('Erreur lors du chargement des indisponibilités')
      }
    } catch (error) {
      console.error('Erreur chargement indisponibilités:', error)
      toast.error('Erreur lors du chargement des indisponibilités')
    }
  }, [propertyId])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchReservations(), fetchUnavailabilities()])
      setLoading(false)
    }
    loadData()
  }, [fetchReservations, fetchUnavailabilities])

  // Fetch user products for dropdown
  useEffect(() => {
    const fetchUserProducts = async () => {
      if (!session?.user?.id) return

      try {
        const response = await fetch('/api/host/products')
        if (response.ok) {
          const data = await response.json()
          setUserProducts(data.products || [])
        }
      } catch (error) {
        console.error('Error fetching products:', error)
      }
    }

    fetchUserProducts()
  }, [session?.user?.id])

  // Fetch property name when propertyId changes
  useEffect(() => {
    const fetchPropertyName = async () => {
      if (!propertyId) {
        setPropertyName('')
        return
      }

      try {
        const response = await fetch(`/api/products/${propertyId}`)
        if (response.ok) {
          const product = await response.json()
          setPropertyName(product.name || '')
        }
      } catch (error) {
        console.error('Error fetching property name:', error)
      }
    }

    fetchPropertyName()
  }, [propertyId])

  const handleCreateUnavailability = async (data: UnavailabilityData) => {
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

    toast.success('Blocage créé avec succès')
    await fetchUnavailabilities()
  }

  const handleUpdateUnavailability = async (data: UnavailabilityData) => {
    if (!selectedUnavailability?.id) return

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

    toast.success('Blocage modifié avec succès')
    await fetchUnavailabilities()
  }

  const handleDeleteUnavailability = async (id: string) => {
    const response = await fetch(`/api/host/unavailability/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur lors de la suppression')
    }

    toast.success('Blocage supprimé avec succès')
    await fetchUnavailabilities()
    setModalOpen(false)
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
