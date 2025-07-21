'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getAdminStatsYearly } from '@/lib/services/stats.service'
import { motion } from 'framer-motion'
import { Users, Home, Clock, CheckCircle } from 'lucide-react'
import { StatCard } from './components/StatCard'

interface Stats {
  users: number
  product: number
  productWaiting: number
  rent: number
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
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
      <div className='min-h-screen bg-gray-50 p-8'>
        <div className='max-w-7xl mx-auto'>
          <div className='animate-pulse space-y-8'>
            <div className='h-12 bg-gray-200 rounded w-1/3'></div>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className='bg-gray-200 rounded-lg h-32'></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className='min-h-screen bg-gray-50 p-8'>
        <div className='max-w-7xl mx-auto'>
          <div className='bg-red-50 border border-red-200 rounded-lg p-4 text-red-700'>
            Erreur lors du chargement des statistiques
          </div>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Utilisateurs',
      value: stats.users,
      description: "Nombre total d'utilisateurs",
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Produits Validés',
      value: stats.product,
      description: 'Nombre de produits validés',
      icon: CheckCircle,
      color: 'text-blue-600',
    },
    {
      title: 'Produits en Attente',
      value: stats.productWaiting,
      description: 'Produits en attente de validation',
      icon: Home,
      color: 'text-blue-600',
    },
    {
      title: 'Locations',
      value: stats.rent,
      description: "Locations de l'année en cours",
      icon: Clock,
      color: 'text-blue-600',
    },
  ]

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <motion.div
        className='max-w-7xl mx-auto space-y-8'
        variants={containerVariants}
        initial='hidden'
        animate='visible'
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className='text-4xl font-bold text-gray-900'>Statistiques Administratives</h1>
          <p className='text-gray-600 mt-2'>
            Vue d&apos;ensemble des performances de la plateforme
          </p>
        </motion.div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {statCards.map(card => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>
      </motion.div>
    </div>
  )
}
