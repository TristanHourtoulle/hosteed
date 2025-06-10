'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { findAllReservationsByHostId, FormattedRent } from '@/lib/services/rent.service'
import HostNavbar from '../components/HostNavbar'

function CalendarContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const propertyId = searchParams.get('property')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [reservations, setReservations] = useState<FormattedRent[]>([])
  const [loading, setLoading] = useState(true)

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
      return date >= startDate && date <= endDate
    })
  }

  useEffect(() => {
    const fetchReservations = async () => {
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
      } finally {
        setLoading(false)
      }
    }

    fetchReservations()
  }, [session?.user?.id, propertyId])

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  return (
    <div className='min-h-screen bg-gray-100'>
      <HostNavbar />
      <div className='container mx-auto py-6'>
        <div className='bg-white rounded-lg shadow-md'>
          <div className='p-6 border-b border-gray-200'>
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
          </div>

          <div className='p-6'>
            {loading ? (
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
                  return (
                    <div
                      key={index}
                      className={`min-h-[100px] p-2 border border-gray-200 rounded-lg ${
                        !isCurrentMonth(date)
                          ? 'bg-gray-100 text-gray-400'
                          : 'bg-white text-gray-900'
                      } ${isToday(date) ? 'bg-blue-100 border-blue-300' : ''}`}
                    >
                      <div className='text-sm font-medium mb-1'>{formatDate(date)}</div>
                      <div className='space-y-1'>
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
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
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
