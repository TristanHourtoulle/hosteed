'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { isAdmin } from '@/hooks/useAdminAuth'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  ArrowRight,
  Bell,
  Eye,
  Zap,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcnui/card'
import { Button } from '@/components/ui/shadcnui/button'
import { Badge } from '@/components/ui/shadcnui/badge'
import { getAdminStatsYearly } from '@/lib/services/stats.service'

interface QuickAction {
  title: string
  description: string
  href: string
  icon: React.ReactNode
  urgent?: boolean
  count?: number
}

interface RecentActivity {
  id: string
  type: 'validation' | 'rejection' | 'user' | 'payment'
  title: string
  description: string
  timestamp: Date
  urgent: boolean
}

interface Stats {
  users: number
  product: number
  productWaiting: number
  rent: number
}

export default function AdminOverview() {
  const {
    session,
    isLoading: isAuthLoading,
    isAuthenticated,
  } = useAuth({ required: true, redirectTo: '/auth' })
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated && (!session?.user?.roles || !isAdmin(session.user.roles))) {
      router.push('/')
    }
  }, [isAuthenticated, session, router])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsData = await getAdminStatsYearly()
        setStats(statsData)
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Mock recent activities - in real app, this would come from an API
  const recentActivities: RecentActivity[] = [
    {
      id: '1',
      type: 'validation',
      title: 'Nouvelle annonce à valider',
      description: 'Villa moderne à Nice',
      timestamp: new Date(),
      urgent: true,
    },
    {
      id: '2',
      type: 'rejection',
      title: 'Nouveau rejet de réservation',
      description: 'Problème de paiement signalé',
      timestamp: new Date(Date.now() - 3600000),
      urgent: true,
    },
    {
      id: '3',
      type: 'user',
      title: 'Nouvel utilisateur inscrit',
      description: 'Jean Dupont vient de créer un compte',
      timestamp: new Date(Date.now() - 7200000),
      urgent: false,
    },
  ]

  const getQuickActions = (): QuickAction[] => {
    if (!stats) return []

    return [
      {
        title: 'Valider les annonces',
        description: `${stats.productWaiting || 0} annonces en attente`,
        href: '/admin/validation',
        icon: <Clock className='h-5 w-5 text-orange-600' />,
        urgent: (stats.productWaiting || 0) > 0,
        count: stats.productWaiting || 0,
      },
      {
        title: 'Gérer les rejets',
        description: 'Résoudre les litiges en cours',
        href: '/admin/rejections',
        icon: <AlertTriangle className='h-5 w-5 text-red-600' />,
        urgent: true,
      },
      {
        title: 'Voir les statistiques',
        description: 'Analytics détaillées',
        href: '/admin/stats',
        icon: <TrendingUp className='h-5 w-5 text-blue-600' />,
      },
      {
        title: 'Gérer les utilisateurs',
        description: `${stats.users || 0} utilisateurs inscrits`,
        href: '/admin/users',
        icon: <Users className='h-5 w-5 text-green-600' />,
      },
    ]
  }

  const quickActions = getQuickActions()

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

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
      <motion.div
        className='max-w-7xl mx-auto p-6 space-y-8'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <motion.div
          className='space-y-4'
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-slate-800'>Tableau de Bord Administrateur</h1>
              <p className='text-slate-600 mt-1'>
                Vue d&apos;ensemble des activités et actions prioritaires
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <Badge variant='outline' className='bg-blue-50 text-blue-700'>
                <Bell className='h-3 w-3 mr-1' />
                {recentActivities.filter(a => a.urgent).length} urgents
              </Badge>
            </div>
          </div>
        </motion.div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Main Content */}
          <div className='lg:col-span-2 space-y-8'>
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className='space-y-4'
            >
              <h2 className='text-xl font-semibold text-slate-800 flex items-center gap-2'>
                <Zap className='h-5 w-5 text-yellow-600' />
                Actions Prioritaires
              </h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {quickActions.map((action, index) => (
                  <motion.div
                    key={action.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link href={action.href}>
                      <Card
                        className={`
                        border-0 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group
                        ${action.urgent ? 'ring-2 ring-orange-200 bg-orange-50/50' : 'bg-white/70'}
                      `}
                      >
                        <CardContent className='p-4'>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                              <div
                                className={`
                                p-2 rounded-lg
                                ${action.urgent ? 'bg-orange-100' : 'bg-slate-100'}
                              `}
                              >
                                {action.icon}
                              </div>
                              <div>
                                <h3 className='font-semibold text-slate-800 group-hover:text-blue-700 transition-colors'>
                                  {action.title}
                                </h3>
                                <p className='text-sm text-slate-600'>{action.description}</p>
                              </div>
                            </div>
                            <div className='flex items-center gap-2'>
                              {action.count !== undefined && action.count > 0 && (
                                <Badge variant={action.urgent ? 'destructive' : 'secondary'}>
                                  {action.count}
                                </Badge>
                              )}
                              <ArrowRight className='h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all' />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Key Metrics */}
            {stats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className='space-y-4'
              >
                <h2 className='text-xl font-semibold text-slate-800 flex items-center gap-2'>
                  <TrendingUp className='h-5 w-5 text-green-600' />
                  Métriques Clés
                </h2>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                  <Card className='border-0 shadow-sm bg-white/70'>
                    <CardContent className='p-4 text-center'>
                      <div className='space-y-2'>
                        <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto'>
                          <Users className='h-5 w-5 text-blue-600' />
                        </div>
                        <div>
                          <p className='text-2xl font-bold text-slate-800'>{stats.users}</p>
                          <p className='text-xs text-slate-600'>Utilisateurs</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className='border-0 shadow-sm bg-white/70'>
                    <CardContent className='p-4 text-center'>
                      <div className='space-y-2'>
                        <div className='w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto'>
                          <CheckCircle2 className='h-5 w-5 text-green-600' />
                        </div>
                        <div>
                          <p className='text-2xl font-bold text-slate-800'>{stats.product}</p>
                          <p className='text-xs text-slate-600'>Validés</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className='border-0 shadow-sm bg-white/70'>
                    <CardContent className='p-4 text-center'>
                      <div className='space-y-2'>
                        <div className='w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mx-auto'>
                          <Clock className='h-5 w-5 text-orange-600' />
                        </div>
                        <div>
                          <p className='text-2xl font-bold text-slate-800'>
                            {stats.productWaiting}
                          </p>
                          <p className='text-xs text-slate-600'>En attente</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className='border-0 shadow-sm bg-white/70'>
                    <CardContent className='p-4 text-center'>
                      <div className='space-y-2'>
                        <div className='w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto'>
                          <Calendar className='h-5 w-5 text-purple-600' />
                        </div>
                        <div>
                          <p className='text-2xl font-bold text-slate-800'>{stats.rent}</p>
                          <p className='text-xs text-slate-600'>Locations</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Recent Activities */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className='border-0 shadow-sm bg-white/70'>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-lg font-semibold text-slate-800 flex items-center gap-2'>
                    <Bell className='h-5 w-5 text-blue-600' />
                    Activités Récentes
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {recentActivities.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className={`
                        p-3 rounded-lg border-l-4 
                        ${
                          activity.urgent
                            ? 'border-red-400 bg-red-50'
                            : 'border-blue-400 bg-blue-50'
                        }
                      `}
                    >
                      <div className='space-y-1'>
                        <div className='flex items-center justify-between'>
                          <p className='font-medium text-slate-800 text-sm'>{activity.title}</p>
                          {activity.urgent && (
                            <Badge variant='destructive' className='text-xs px-2 py-0'>
                              Urgent
                            </Badge>
                          )}
                        </div>
                        <p className='text-slate-600 text-xs'>{activity.description}</p>
                        <p className='text-slate-500 text-xs'>
                          {activity.timestamp.toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </motion.div>
                  ))}

                  <Button variant='outline' size='sm' className='w-full' asChild>
                    <Link href='/admin/notifications'>
                      <Eye className='h-4 w-4 mr-2' />
                      Voir toutes les activités
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card className='border-0 shadow-sm bg-white/70'>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-lg font-semibold text-slate-800'>
                    Liens Rapides
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-2'>
                  {[
                    { label: 'Toutes les statistiques', href: '/admin/stats' },
                    { label: 'Gestion des paiements', href: '/admin/payment' },
                    { label: 'Annonces sponsorisées', href: '/admin/promoted' },
                    { label: 'Avis en attente', href: '/admin/reviews' },
                  ].map(link => (
                    <Button
                      key={link.href}
                      variant='ghost'
                      size='sm'
                      className='w-full justify-start text-slate-600 hover:text-blue-700 hover:bg-blue-50'
                      asChild
                    >
                      <Link href={link.href}>
                        <ArrowRight className='h-3 w-3 mr-2' />
                        {link.label}
                      </Link>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
