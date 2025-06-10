// TODO: refactor this file because it's larger than 200 lines
'use client'

import { useEffect, useState } from 'react'
import { getRentById, cancelRent } from '@/lib/services/rents.service'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface User {
  name: string | null
  lastname: string | null
  email: string
  roles: string
}

interface Product {
  name: string
  basePrice: string
  validate: string
}

interface Rent {
  id: string
  status: string
  arrivingDate: string | Date
  leavingDate: string | Date
  prices: bigint
  createdAt?: string | Date
  product?: Product
  user?: User
  payment?: string
}

export default function ReservationDetailsPage() {
  const [rent, setRent] = useState<Rent | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const params = useParams()

  useEffect(() => {
    const fetchRent = async () => {
      try {
        if (params.id) {
          const data = await getRentById(params.id as string)
          if (data) {
            setRent(data)
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la réservation:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRent()
  }, [params.id])

  const handleCancelRent = async () => {
    try {
      setCancelling(true)
      await cancelRent(params.id as string)
      // Rafraîchir les données après l'annulation
      const data = await getRentById(params.id as string)
      if (data) {
        setRent(data)
      }
    } catch (error) {
      console.error("Erreur lors de l'annulation de la réservation:", error)
    } finally {
      setCancelling(false)
    }
  }

  const formatDate = (dateString: string | Date | undefined | null) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch (error) {
      console.error('Erreur de formatage de date:', error)
      return '-'
    }
  }

  if (loading) {
    return (
      <div className='flex justify-center items-center h-[200px] text-lg text-gray-600'>
        Chargement...
      </div>
    )
  }

  if (!rent) {
    return (
      <div className='flex justify-center items-center h-[200px] text-lg text-red-600'>
        Réservation non trouvée
      </div>
    )
  }

  return (
    <div className='max-w-7xl mx-auto p-8'>
      <div className='mb-6 flex justify-between items-center'>
        <Link href='/admin/users' className='text-blue-600 hover:text-blue-800 flex items-center'>
          <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M10 19l-7-7m0 0l7-7m-7 7h18'
            />
          </svg>
          Retour à la liste des utilisateurs
        </Link>
        {rent.status === 'RESERVED' && (
          <button
            onClick={handleCancelRent}
            disabled={cancelling}
            className='px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {cancelling ? 'Annulation en cours...' : 'Annuler la réservation'}
          </button>
        )}
      </div>

      {/* Informations de la réservation */}
      <div className='bg-white rounded-lg shadow-md mb-8'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <h1 className='text-2xl font-semibold text-gray-800'>Détails de la réservation</h1>
        </div>
        <div className='p-6'>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <p className='text-sm text-gray-500'>ID de la réservation</p>
              <p className='text-lg'>{rent.id}</p>
            </div>
            <div>
              <p className='text-sm text-gray-500'>Statut</p>
              <p className='text-lg'>{rent.status}</p>
            </div>
            <div>
              <p className='text-sm text-gray-500'>Date d&apos;arrivée</p>
              <p className='text-lg'>{formatDate(rent.arrivingDate)}</p>
            </div>
            <div>
              <p className='text-sm text-gray-500'>Date de départ</p>
              <p className='text-lg'>{formatDate(rent.leavingDate)}</p>
            </div>
            <div>
              <p className='text-sm text-gray-500'>Prix total</p>
              <p className='text-lg'>{rent.prices}€</p>
            </div>
            <div>
              <p className='text-sm text-gray-500'>Date de création</p>
              <p className='text-lg'>{formatDate(rent.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Informations du produit */}
      {rent.product && (
        <div className='bg-white rounded-lg shadow-md mb-8'>
          <div className='px-6 py-4 border-b border-gray-200'>
            <h2 className='text-xl font-semibold text-gray-800'>Informations du produit</h2>
          </div>
          <div className='p-6'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-sm text-gray-500'>Nom du produit</p>
                <p className='text-lg'>{rent.product.name}</p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Prix par nuit</p>
                <p className='text-lg'>{rent.product.basePrice}€</p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Statut du produit</p>
                <p className='text-lg'>{rent.product.validate ? 'Validé' : 'En attente'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Informations du client */}
      {rent.user && (
        <div className='bg-white rounded-lg shadow-md'>
          <div className='px-6 py-4 border-b border-gray-200'>
            <h2 className='text-xl font-semibold text-gray-800'>Informations du client</h2>
          </div>
          <div className='p-6'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-sm text-gray-500'>Nom</p>
                <p className='text-lg'>{rent.user.name || '-'}</p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Prénom</p>
                <p className='text-lg'>{rent.user.lastname || '-'}</p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Email</p>
                <p className='text-lg'>{rent.user.email}</p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Rôle</p>
                <p className='text-lg'>{rent.user.roles}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
