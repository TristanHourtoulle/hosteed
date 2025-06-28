'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { findRentByHostUserId, approveRent } from '@/lib/services/rents.service'
import { PaymentStatus, RentStatus } from '@prisma/client'
import HostNavbar from '../components/HostNavbar'

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
  const { data: session } = useSession()
  const [rents, setRents] = useState<Rent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRents = async () => {
      try {
        if (session?.user?.id) {
          const data = await findRentByHostUserId(session.user.id)
          if (data) {
            setRents(data)
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des locations:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchRents()
    }
  }, [session])

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
            <h1 className='text-2xl font-bold text-gray-900'>Mes Locations</h1>
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
                  {rents.map(rent => (
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
                        {rent.status === RentStatus.WAITING &&
                          rent.payment == PaymentStatus.NOT_PAID && (
                            <button
                              onClick={() => handleApproveReservation(rent.id, rent.stripeId)}
                              className='px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors'
                            >
                              Approuver
                            </button>
                          )}
                      </td>
                    </tr>
                  ))}
                  {rents.length === 0 && (
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
