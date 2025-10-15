'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { isFullAdmin } from '@/hooks/useAdminAuth'
import Link from 'next/link'
import { getAdminStatsYearly } from '@/lib/services/stats.service'
import { motion } from 'framer-motion'
import {
  Users,
  Home,
  Clock,
  CheckCircle,
  TrendingUp,
  Calendar,
  Building,
  UserCheck,
  BarChart2,
} from 'lucide-react'
import { StatsOverview } from '../components/StatsOverview'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcnui/card'
import { Separator } from '@/components/ui/shadcnui/separator'

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
  const { session, isLoading: isAuthLoading, isAuthenticated } = useAuth({ required: true, redirectTo: '/auth' })
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated && (!session?.user?.roles || !isFullAdmin(session.user.roles))) {
      router.push('/')
    }
  }, [isAuthenticated, session, router])

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

  if (isAuthLoading || loading) {
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

  if (!stats) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8'>
        <div className='max-w-7xl mx-auto'>
          <Card className='border-red-200 bg-red-50'>
            <CardContent className='p-6'>
              <div className='text-red-700 text-center'>
                <h3 className='font-semibold'>Erreur lors du chargement</h3>
                <p className='text-sm mt-1'>Impossible de charger les statistiques</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Calculate some derived stats for better insights
  const totalProducts = stats.product + stats.productWaiting
  const validationRate = totalProducts > 0 ? Math.round((stats.product / totalProducts) * 100) : 0
  const averageRentsPerUser =
    stats.users > 0 ? Math.round((stats.rent / stats.users) * 100) / 100 : 0

  const mainStats = [
    {
      title: 'Utilisateurs Inscrits',
      value: stats.users,
      description: 'Comptes utilisateurs actifs',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: { value: 12, isPositive: true },
    },
    {
      title: 'Hébergements Validés',
      value: stats.product,
      description: `${validationRate}% de taux de validation`,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: { value: 8, isPositive: true },
    },
    {
      title: 'En Attente de Validation',
      value: stats.productWaiting,
      description: 'Annonces à traiter',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Locations Cette Année',
      value: stats.rent,
      description: `${averageRentsPerUser} locations/utilisateur`,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: { value: 25, isPositive: true },
    },
  ]

  const additionalMetrics = [
    {
      title: 'Total Hébergements',
      value: totalProducts,
      subtitle: 'Toutes annonces confondues',
      icon: Building,
      color: 'text-indigo-600',
    },
    {
      title: 'Taux de Validation',
      value: validationRate,
      subtitle: "% d'annonces acceptées",
      icon: UserCheck,
      color: 'text-emerald-600',
      format: 'percentage',
    },
    {
      title: 'Activité Moyenne',
      value: averageRentsPerUser,
      subtitle: 'Locations par utilisateur',
      icon: TrendingUp,
      color: 'text-rose-600',
      format: 'decimal',
    },
  ]

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
      <motion.div
        className='max-w-7xl mx-auto p-6 space-y-8'
        variants={containerVariants}
        initial='hidden'
        animate='visible'
      >
        {/* Header */}
        <motion.div
          className='text-center space-y-4'
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className='inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium'>
            <TrendingUp className='h-4 w-4' />
            Analytics Dashboard
          </div>
          <h1 className='text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700'>
            Statistiques de la Plateforme
          </h1>
          <p className='text-slate-600 max-w-2xl mx-auto text-lg'>
            Suivez les performances et l&apos;évolution de votre plateforme d&apos;hébergement
          </p>
        </motion.div>

        {/* Main Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className='text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2'>
            <BarChart2 className='h-5 w-5 text-blue-600' />
            Métriques Principales
          </h2>
          <StatsOverview stats={mainStats} />
        </motion.div>

        <Separator className='my-8 bg-slate-200' />

        {/* Additional Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className='space-y-6'
        >
          <h2 className='text-xl font-semibold text-slate-800 flex items-center gap-2'>
            <TrendingUp className='h-5 w-5 text-indigo-600' />
            Métriques Complémentaires
          </h2>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {additionalMetrics.map((metric, index) => (
              <motion.div
                key={metric.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <Card className='border-0 shadow-sm hover:shadow-md transition-all duration-300'>
                  <CardHeader className='pb-3'>
                    <div className='flex items-center gap-3'>
                      <div className='p-2 bg-slate-50 rounded-lg'>
                        <metric.icon className={`h-5 w-5 ${metric.color}`} />
                      </div>
                      <div>
                        <CardTitle className='text-base font-medium text-slate-700'>
                          {metric.title}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className='pt-0'>
                    <div className='space-y-1'>
                      <p className='text-3xl font-bold text-slate-800'>
                        {metric.format === 'percentage'
                          ? `${metric.value}%`
                          : metric.format === 'decimal'
                            ? metric.value.toFixed(1)
                            : metric.value.toLocaleString()}
                      </p>
                      <p className='text-sm text-slate-500'>{metric.subtitle}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className='bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20'
        >
          <h3 className='text-lg font-semibold text-slate-800 mb-4'>Actions Rapides</h3>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {stats.productWaiting > 0 && (
              <Link href='/admin/validation' className='group'>
                <div className='p-4 bg-orange-50 rounded-lg border border-orange-200 group-hover:bg-orange-100 transition-colors'>
                  <div className='flex items-center gap-3'>
                    <Clock className='h-5 w-5 text-orange-600' />
                    <div>
                      <p className='font-medium text-orange-800'>Valider les annonces</p>
                      <p className='text-sm text-orange-600'>{stats.productWaiting} en attente</p>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            <Link href='/admin/users' className='group'>
              <div className='p-4 bg-blue-50 rounded-lg border border-blue-200 group-hover:bg-blue-100 transition-colors'>
                <div className='flex items-center gap-3'>
                  <Users className='h-5 w-5 text-blue-600' />
                  <div>
                    <p className='font-medium text-blue-800'>Gérer les utilisateurs</p>
                    <p className='text-sm text-blue-600'>{stats.users} inscrits</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href='/admin/products' className='group'>
              <div className='p-4 bg-green-50 rounded-lg border border-green-200 group-hover:bg-green-100 transition-colors'>
                <div className='flex items-center gap-3'>
                  <Home className='h-5 w-5 text-green-600' />
                  <div>
                    <p className='font-medium text-green-800'>Voir les hébergements</p>
                    <p className='text-sm text-green-600'>{stats.product} validés</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href='/admin/reservations' className='group'>
              <div className='p-4 bg-purple-50 rounded-lg border border-purple-200 group-hover:bg-purple-100 transition-colors'>
                <div className='flex items-center gap-3'>
                  <Calendar className='h-5 w-5 text-purple-600' />
                  <div>
                    <p className='font-medium text-purple-800'>Voir les réservations</p>
                    <p className='text-sm text-purple-600'>{stats.rent} cette année</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
