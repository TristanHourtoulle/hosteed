'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getAdminStatsYearly } from '@/lib/services/stats.service'

interface Stats {
  users: number
  product: number
  productWaiting: number
  rent: number
}

export default function AdminStats() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.roles || session.user.roles !== 'ADMIN') {
      router.push('/')
    }
  }, [session, router])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getAdminStatsYearly()
        setStats(data)
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className='flex justify-center items-center h-[200px] text-lg text-gray-600'>
        Chargement...
      </div>
    )
  }

  if (!stats) {
    return (
      <div className='flex justify-center items-center h-[200px] text-lg text-red-600'>
        Erreur lors du chargement des statistiques
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-100 p-6'>
      <div className='max-w-7xl mx-auto'>
        <h1 className='text-3xl font-bold text-gray-900 mb-8'>Statistiques Administratives</h1>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {/* Carte des utilisateurs */}
          <div className='bg-white rounded-lg shadow-md p-6'>
            <h2 className='text-xl font-semibold text-gray-800 mb-2'>Utilisateurs</h2>
            <p className='text-3xl font-bold text-primary'>{stats.users}</p>
            <p className='text-gray-600 mt-2'>Nombre total d&apos;utilisateurs</p>
          </div>

          {/* Carte des produits validés */}
          <div className='bg-white rounded-lg shadow-md p-6'>
            <h2 className='text-xl font-semibold text-gray-800 mb-2'>Produits Validés</h2>
            <p className='text-3xl font-bold text-green-600'>{stats.product}</p>
            <p className='text-gray-600 mt-2'>Nombre de produits validés</p>
          </div>

          {/* Carte des produits en attente */}
          <div className='bg-white rounded-lg shadow-md p-6'>
            <h2 className='text-xl font-semibold text-gray-800 mb-2'>Produits en Attente</h2>
            <p className='text-3xl font-bold text-yellow-600'>{stats.productWaiting}</p>
            <p className='text-gray-600 mt-2'>Produits en attente de validation</p>
          </div>

          {/* Carte des locations */}
          <div className='bg-white rounded-lg shadow-md p-6'>
            <h2 className='text-xl font-semibold text-gray-800 mb-2'>Locations</h2>
            <p className='text-3xl font-bold text-blue-600'>{stats.rent}</p>
            <p className='text-gray-600 mt-2'>Locations de l&apos;année en cours</p>
          </div>
        </div>
      </div>
    </div>
  )
}
