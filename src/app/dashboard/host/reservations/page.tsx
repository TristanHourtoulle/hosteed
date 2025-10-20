'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { findRentByHostUserId, approveRent } from '@/lib/services/rents.service'
import { PaymentStatus, RentStatus } from '@prisma/client'
import HostNavbar from '../components/HostNavbar'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/shadcnui/select'

interface Rent {
  id: string
  arrivingDate: Date
  leavingDate: Date
  status: RentStatus
  payment: PaymentStatus
  product: {
    id: string
    name: string
  }
  user: {
    id: string
    name: string | null
    email: string
  }
  stripeId: string | null
}

export default function RentsPage() {
  const {
    session,
    isLoading: isAuthLoading,
    isAuthenticated,
  } = useAuth({ required: true, redirectTo: '/auth' })
  const [rents, setRents] = useState<Rent[]>([])
  const [filteredRents, setFilteredRents] = useState<Rent[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('ALL')

  useEffect(() => {
    const fetchRents = async () => {
      try {
        if (session?.user?.id) {
          const data = await findRentByHostUserId(session.user.id)
          if (data) {
            setRents(data)
            setFilteredRents(data)
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des locations:', error)
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchRents()
    }
  }, [session, isAuthenticated])

  useEffect(() => {
    if (filterStatus === 'ALL') {
      setFilteredRents(rents)
    } else if (filterStatus === 'UPCOMING') {
      const upcoming = rents.filter(
        rent => rent.status === RentStatus.RESERVED && new Date(rent.arrivingDate) > new Date()
      )
      setFilteredRents(upcoming)
    } else if (filterStatus === 'REQUESTS') {
      const requests = rents.filter(rent => rent.status === RentStatus.WAITING)
      setFilteredRents(requests)
    } else if (filterStatus === 'REFUSED') {
      const refused = rents.filter(rent => rent.status === RentStatus.CANCEL)
      setFilteredRents(refused)
    }
  }, [filterStatus, rents])

  const getStatusBadge = (status: RentStatus) => {
    const statusConfig: Record<RentStatus, { label: string; color: string }> = {
      WAITING: { label: 'En attente', color: 'bg-orange-100 text-orange-800' },
      RESERVED: { label: 'Réservée', color: 'bg-yellow-100 text-yellow-800' },
      CHECKIN: { label: 'En cours', color: 'bg-green-100 text-green-800' },
      CHECKOUT: { label: 'Terminée', color: 'bg-gray-100 text-gray-800' },
      CANCEL: { label: 'Annulée', color: 'bg-red-100 text-red-800' },
    }

    const config = statusConfig[status] || { label: 'Inconnu', color: 'bg-gray-100 text-gray-800' }
    return <span className={`px-2 py-1 rounded-full text-sm ${config.color}`}>{config.label}</span>
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const handleApproveReservation = async (rentId: string, stripeId: string | null) => {
    try {
      if (!stripeId) {
        throw new Error('Aucun paiement associé à cette réservation')
      }
      const result = await approveRent(rentId)
      if (!result?.success) {
        throw new Error('Erreur lors de la capture du paiement')
      }
    } catch (error) {
      console.error("Erreur lors de l'approbation de la réservation:", error)
    }
  }

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

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-100'>
      <HostNavbar />
      <div className='container mx-auto py-6'>
        <div className='bg-white rounded-lg shadow-md'>
          <div className='p-6 border-b border-gray-200'>
            <div className='flex justify-between items-center'>
              <h1 className='text-2xl font-bold text-gray-900'>Mes Locations</h1>
              <Select value={filterStatus} onValueChange={value => setFilterStatus(value)}>
                <SelectTrigger className='w-[200px]'>
                  <SelectValue placeholder='Filtrer par statut' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='ALL'>Toutes les réservations</SelectItem>
                  <SelectItem value='UPCOMING'>Réservations à venir</SelectItem>
                  <SelectItem value='REQUESTS'>Demandes de réservation</SelectItem>
                  <SelectItem value='REFUSED'>Réservations refusées</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className='p-6'>
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Produit
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Client
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Date de début
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Date de fin
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Statut
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {filteredRents.map(rent => (
                    <tr key={rent.id} className='hover:bg-gray-50'>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {rent.product.name}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {rent.user.name}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {formatDate(rent.arrivingDate)}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {formatDate(rent.leavingDate)}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>{getStatusBadge(rent.status)}</td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        <div className='flex gap-2'>
                          <a
                            href={`/dashboard/host/reservations/${rent.id}`}
                            className='px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
                          >
                            Détails
                          </a>
                          <a
                            href={`/chat/${rent.id}`}
                            className='px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors'
                          >
                            Discuter
                          </a>
                          {rent.status === RentStatus.WAITING &&
                            rent.payment == PaymentStatus.NOT_PAID && (
                              <button
                                onClick={() => handleApproveReservation(rent.id, rent.stripeId)}
                                className='px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors'
                              >
                                Approuver
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRents.length === 0 && (
                    <tr>
                      <td colSpan={6} className='px-6 py-4 text-center text-sm text-gray-500'>
                        Aucune location trouvée
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
