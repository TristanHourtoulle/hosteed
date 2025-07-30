'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion, Variants } from 'framer-motion'
import { Separator } from '@/components/ui/shadcnui/separator'
import {
  ClipboardCheck,
  Users,
  BarChart2,
  MessageSquare,
  Home,
  Star,
  CreditCard,
  XCircle,
  Calendar,
  TrendingUp,
  Shield,
  CheckCircle2,
  Clock,
  Cctv,
  Soup,
  BrushCleaning,
} from 'lucide-react'
import { StatsOverview } from './components/StatsOverview'
import { ActionCardGroup } from './components/ActionCardGroup'
import { getAdminStatsYearly } from '@/lib/services/stats.service'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
}

interface Stats {
  users: number
  product: number
  productWaiting: number
  rent: number
}

export default function AdminDashboard() {
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

  // Quick stats cards for dashboard overview
  const quickStats = [
    {
      title: 'Utilisateurs',
      value: stats?.users || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Produits actifs',
      value: stats?.product || 0,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'En attente',
      value: stats?.productWaiting || 0,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Locations',
      value: stats?.rent || 0,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ]

  // Grouped navigation cards
  const cardGroups = [
    {
      title: 'Gestion des Contenus',
      description: 'Gérez les annonces, validations et modérations',
      icon: Shield,
      cards: [
        {
          title: 'Validation des annonces',
          description: 'Valider les nouvelles annonces',
          icon: ClipboardCheck,
          href: '/admin/validation',
          badge:
            stats?.productWaiting && stats.productWaiting > 0
              ? `${stats.productWaiting} en attente`
              : null,
          badgeVariant: 'destructive' as const,
        },
        {
          title: 'Gestion des hébergements',
          description: 'Voir et gérer tous les hébergements',
          icon: Home,
          href: '/admin/products',
          badge: `${stats?.product || 0} actifs`,
          badgeVariant: 'secondary' as const,
        },
        {
          title: 'Avis en attente',
          description: 'Modérer les avis utilisateurs',
          icon: MessageSquare,
          href: '/admin/reviews',
        },
        {
          title: 'Refus de location',
          description: 'Gérer les litiges et refus',
          icon: XCircle,
          href: '/admin/rejections',
        },
      ],
    },
    {
      title: 'Gestion des Utilisateurs',
      description: 'Administration des comptes et rôles',
      icon: Users,
      cards: [
        {
          title: 'Utilisateurs',
          description: 'Gérer les comptes utilisateurs',
          icon: Users,
          href: '/admin/users',
          badge: `${stats?.users || 0} inscrits`,
          badgeVariant: 'secondary' as const,
        },
        {
          title: 'Réservations',
          description: 'Voir toutes les réservations',
          icon: Calendar,
          href: '/admin/reservations',
          badge: `${stats?.rent || 0} cette année`,
          badgeVariant: 'secondary' as const,
        },
      ],
    },
    {
      title: 'Business & Analytics',
      description: 'Statistiques, paiements et promotions',
      icon: TrendingUp,
      cards: [
        {
          title: 'Statistiques',
          description: 'Analytics et performances',
          icon: BarChart2,
          href: '/admin/stats',
        },
        {
          title: 'Paiements',
          description: 'Gestion des transactions',
          icon: CreditCard,
          href: '/admin/payment',
        },
        {
          title: 'Annonces sponsorisées',
          description: 'Gérer les mises en avant',
          icon: Star,
          href: '/admin/promoted',
        },
      ],
    },
    {
      title: 'Gestion des Options',
      description: 'Configuration des équipements, repas et sécurité',
      icon: Shield,
      cards: [
        {
          title: 'Gestion des options de sécurité',
          description: 'Voir et gérer toutes les options de sécurité',
          icon: Cctv,
          href: '/admin/security',
        },
        {
          title: 'Gestion des options de repas',
          description: 'Voir et gérer toutes les options de repas',
          icon: Soup,
          href: '/admin/meals',
        },
        {
          title: "Gestion des options d'équipements",
          description: "Voir et gérer toutes les options d'équipements",
          icon: BrushCleaning,
          href: '/admin/equipments',
        },
        {
          title: 'Gestion des types de logements',
          description: 'Voir et gérer tous les types de logements',
          icon: Home,
          href: '/admin/typeRent',
        },
      ],
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
        {/* Header Section */}
        <motion.div className='text-center space-y-4' variants={itemVariants}>
          <div className='inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium'>
            <Shield className='h-4 w-4' />
            Panel Administrateur
          </div>
          <h1 className='text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700'>
            Dashboard Administrateur
          </h1>
          <p className='text-slate-600 max-w-2xl mx-auto text-lg'>
            Gérez efficacement votre plateforme avec une interface claire et organisée
          </p>
        </motion.div>

        {/* Quick Stats Overview */}
        {!loading && stats && (
          <motion.div variants={itemVariants}>
            <StatsOverview stats={quickStats} />
          </motion.div>
        )}

        {/* Loading State for Stats */}
        {loading && (
          <motion.div variants={itemVariants}>
            <StatsOverview stats={[]} loading={true} />
          </motion.div>
        )}

        {/* Grouped Admin Sections */}
        <div className='space-y-8'>
          {cardGroups.map((group, groupIndex) => (
            <motion.div
              key={group.title}
              variants={itemVariants}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.2 }}
            >
              <ActionCardGroup
                title={group.title}
                description={group.description}
                icon={group.icon}
                cards={group.cards ?? []}
              />
              {groupIndex < cardGroups.length - 1 && <Separator className='my-8 bg-slate-200' />}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
