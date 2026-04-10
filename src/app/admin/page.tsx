'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { motion, Variants } from 'framer-motion'
import { isAdmin, isFullAdmin } from '@/hooks/useAdminAuth'
import {
  ShieldCheck,
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
  Cctv,
  Soup,
  BrushCleaning,
  Calculator,
  Wallet,
  Image as ImageIcon,
  Banknote,
  UserPlus,
  CalendarCheck,
  ClipboardList,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/shadcnui/button'
import { Separator } from '@/components/ui/shadcnui/separator'
import { ActionCardGroup } from './components/ActionCardGroup'
import {
  getAdminDashboardStats,
  type AdminDashboardStats,
} from '@/lib/services/stats.service'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { KpiCard, KpiMetric } from '@/components/admin/ui/KpiCard'
import { PriorityList } from '@/components/admin/ui/PriorityList'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'tween',
      duration: 0.4,
      ease: 'easeOut',
    },
  },
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function AdminDashboard() {
  const {
    session,
    isLoading: isAuthLoading,
    isAuthenticated,
  } = useAuth({ required: true, redirectTo: '/auth' })
  const router = useRouter()
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (isAuthenticated && (!session?.user?.roles || !isAdmin(session.user.roles))) {
      router.push('/')
    }
  }, [isAuthenticated, session, router])

  const fetchStats = async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false
    try {
      if (silent) setRefreshing(true)
      else setLoading(true)
      const data = await getAdminDashboardStats()
      setStats(data)
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
    } finally {
      if (silent) setRefreshing(false)
      else setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const isAdminFull = isFullAdmin(session?.user?.roles)

  // Hero KPI row — tailored to the user's role
  const heroKpis = [
    {
      label: 'À valider',
      value: stats?.productsWaiting ?? 0,
      hint:
        (stats?.productsWaiting ?? 0) > 0
          ? 'annonces en attente d’action'
          : 'aucune annonce en attente',
      icon: ClipboardList,
      tone: 'amber' as const,
      href: '/admin/validation',
      show: true,
    },
    {
      label: 'Réservations (mois)',
      value: stats?.rentsThisMonth ?? 0,
      hint: 'ce mois-ci',
      icon: CalendarCheck,
      tone: 'blue' as const,
      href: '/admin/reservations',
      show: isAdminFull,
    },
    {
      label: 'Revenus (mois)',
      value: formatCurrency(stats?.revenueThisMonth ?? 0),
      hint: 'volume total encaissé',
      icon: Banknote,
      tone: 'emerald' as const,
      href: '/admin/stats',
      show: isAdminFull,
    },
    {
      label: 'Nouveaux utilisateurs',
      value: stats?.newUsersThisWeek ?? 0,
      hint: 'sur les 7 derniers jours',
      icon: UserPlus,
      tone: 'purple' as const,
      href: '/admin/users',
      show: isAdminFull,
    },
  ].filter(k => k.show)

  // Secondary metrics — context
  const secondaryMetrics = [
    {
      label: 'annonces actives',
      value: stats?.productsActive ?? 0,
      icon: Home,
      tone: 'slate' as const,
      href: '/admin/products',
      show: true,
    },
    {
      label: 'utilisateurs au total',
      value: stats?.usersTotal ?? 0,
      icon: Users,
      tone: 'slate' as const,
      href: '/admin/users',
      show: isAdminFull,
    },
    {
      label: 'réservations sur l’année',
      value: stats?.rentsYearly ?? 0,
      icon: Calendar,
      tone: 'slate' as const,
      href: '/admin/reservations',
      show: isAdminFull,
    },
  ].filter(m => m.show)

  // Priority list — only items that actually need action appear
  const priorities = [
    {
      icon: ClipboardCheck,
      title: 'Annonces à valider',
      description: 'Nouvelles soumissions et révisions demandées',
      count: stats?.productsWaitingValidation ?? 0,
      href: '/admin/validation',
      tone: 'amber' as const,
    },
    {
      icon: Wallet,
      title: 'Retraits en attente',
      description: 'Demandes de retrait des hôtes à traiter',
      count: stats?.withdrawalsPending ?? 0,
      href: '/admin/withdrawals',
      tone: 'purple' as const,
    },
    {
      icon: MessageSquare,
      title: 'Avis à modérer',
      description: 'Avis utilisateurs en attente d’approbation',
      count: stats?.reviewsPendingModeration ?? 0,
      href: '/admin/reviews',
      tone: 'blue' as const,
    },
  ]

  // Grouped navigation cards at the bottom — role-filtered
  const allCardGroups = [
    {
      title: 'Gestion des Contenus',
      description: 'Gérez les annonces, validations et modérations',
      icon: Shield,
      tone: 'blue' as const,
      cards: [
        {
          title: 'Validation des annonces',
          description: 'Valider les nouvelles annonces',
          icon: ClipboardCheck,
          href: '/admin/validation',
          tone: 'amber' as const,
          badge:
            stats?.productsWaitingValidation && stats.productsWaitingValidation > 0
              ? `${stats.productsWaitingValidation} en attente`
              : null,
          badgeVariant: 'destructive' as const,
        },
        {
          title: 'Gestion des hébergements',
          description: 'Voir et gérer tous les hébergements',
          icon: Home,
          href: '/admin/products',
          tone: 'blue' as const,
          badge: `${stats?.productsActive ?? 0} actifs`,
          badgeVariant: 'secondary' as const,
        },
        {
          title: 'Avis en attente',
          description: 'Modérer les avis utilisateurs',
          icon: MessageSquare,
          href: '/admin/reviews',
          tone: 'purple' as const,
          badge:
            stats?.reviewsPendingModeration && stats.reviewsPendingModeration > 0
              ? `${stats.reviewsPendingModeration} à modérer`
              : null,
          badgeVariant: 'destructive' as const,
        },
        {
          title: 'Refus de location',
          description: 'Gérer les litiges et refus',
          icon: XCircle,
          href: '/admin/rejections',
          tone: 'red' as const,
        },
      ],
    },
    {
      title: 'Gestion des Utilisateurs',
      description: 'Administration des comptes et rôles',
      icon: Users,
      tone: 'indigo' as const,
      adminOnly: true,
      cards: [
        {
          title: 'Utilisateurs',
          description: 'Gérer les comptes utilisateurs',
          icon: Users,
          href: '/admin/users',
          tone: 'indigo' as const,
          badge: `${stats?.usersTotal ?? 0} inscrits`,
          badgeVariant: 'secondary' as const,
        },
        {
          title: 'Réservations',
          description: 'Voir toutes les réservations',
          icon: Calendar,
          href: '/admin/reservations',
          tone: 'blue' as const,
          badge: `${stats?.rentsYearly ?? 0} cette année`,
          badgeVariant: 'secondary' as const,
        },
      ],
    },
    {
      title: 'Business & Analytics',
      description: 'Statistiques, paiements et promotions',
      icon: TrendingUp,
      tone: 'emerald' as const,
      adminOnly: true,
      cards: [
        {
          title: 'Statistiques',
          description: 'Analytics et performances',
          icon: BarChart2,
          href: '/admin/stats',
          tone: 'emerald' as const,
        },
        {
          title: 'Paiements',
          description: 'Gestion des transactions',
          icon: CreditCard,
          href: '/admin/payment',
          tone: 'emerald' as const,
        },
        {
          title: 'Annonces sponsorisées',
          description: 'Gérer les mises en avant',
          icon: Star,
          href: '/admin/promoted',
          tone: 'amber' as const,
        },
        {
          title: 'Configuration des commissions',
          description: 'Gérer les taux de commission par type de logement',
          icon: Calculator,
          href: '/admin/commissions',
          tone: 'slate' as const,
        },
        {
          title: 'Gestion des retraits',
          description: 'Gérer les demandes de retrait des hôtes',
          icon: Wallet,
          href: '/admin/withdrawals',
          tone: 'purple' as const,
          badge:
            stats?.withdrawalsPending && stats.withdrawalsPending > 0
              ? `${stats.withdrawalsPending} en attente`
              : null,
          badgeVariant: 'destructive' as const,
        },
      ],
    },
    {
      title: 'Configuration & Options',
      description: 'Taxonomies, équipements, sécurité et homepage',
      icon: Shield,
      tone: 'slate' as const,
      cards: [
        {
          title: 'Gestion des options de sécurité',
          description: 'Voir et gérer toutes les options de sécurité',
          icon: Cctv,
          href: '/admin/security',
          tone: 'red' as const,
        },
        {
          title: 'Gestion des options de repas',
          description: 'Voir et gérer toutes les options de repas',
          icon: Soup,
          href: '/admin/meals',
          tone: 'orange' as const,
        },
        {
          title: "Gestion des options d'équipements",
          description: "Voir et gérer toutes les options d'équipements",
          icon: BrushCleaning,
          href: '/admin/equipments',
          tone: 'slate' as const,
        },
        {
          title: 'Gestion des types de logements',
          description: 'Voir et gérer tous les types de logements',
          icon: Home,
          href: '/admin/typeRent',
          tone: 'blue' as const,
        },
        {
          title: "Images de la page d'accueil",
          description: 'Configurer les images de la homepage et de l’auth',
          icon: ImageIcon,
          href: '/admin/homepage',
          tone: 'indigo' as const,
        },
      ],
    },
  ]

  const cardGroups = allCardGroups.filter(group => {
    if (group.adminOnly) return isAdminFull
    return true
  })

  if (isAuthLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/40'>
        <div className='mx-auto max-w-7xl space-y-8 p-6'>
          <div className='space-y-3'>
            <div className='h-4 w-40 animate-pulse rounded bg-slate-200' />
            <div className='h-10 w-80 animate-pulse rounded bg-slate-200' />
            <div className='h-4 w-96 animate-pulse rounded bg-slate-200' />
          </div>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className='h-32 animate-pulse rounded-2xl border border-slate-200/80 bg-white'
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/40'>
      <motion.div
        className='mx-auto max-w-7xl space-y-10 p-6'
        variants={containerVariants}
        initial='hidden'
        animate='visible'
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <PageHeader
            eyebrow='Espace administrateur'
            eyebrowIcon={ShieldCheck}
            title='Tableau de bord'
            subtitle='Une vue d’ensemble de votre plateforme. Les actions urgentes sont mises en avant ci-dessous.'
            actions={
              <Button
                onClick={() => fetchStats({ silent: true })}
                disabled={refreshing || loading}
                variant='outline'
                className='gap-2 border-slate-200 bg-white/80 text-slate-700 shadow-sm hover:bg-slate-50'
              >
                {refreshing ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <RefreshCw className='h-4 w-4' />
                )}
                {refreshing ? 'Actualisation…' : 'Actualiser'}
              </Button>
            }
          />
        </motion.div>

        {/* Hero KPI row */}
        <motion.div variants={itemVariants}>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            {heroKpis.map(kpi => (
              <KpiCard
                key={kpi.label}
                label={kpi.label}
                value={kpi.value}
                hint={kpi.hint}
                icon={kpi.icon}
                tone={kpi.tone}
                href={kpi.href}
                loading={loading}
              />
            ))}
          </div>
        </motion.div>

        {/* Two-column: priorities + secondary metrics */}
        <motion.div variants={itemVariants}>
          <div className='grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'>
            <PriorityList items={priorities} loading={loading} />
            <div className='space-y-3'>
              <h2 className='px-1 text-sm font-semibold uppercase tracking-wide text-slate-500'>
                Vue d’ensemble
              </h2>
              <div className='space-y-3'>
                {secondaryMetrics.map(m => (
                  <KpiMetric
                    key={m.label}
                    label={m.label}
                    value={m.value}
                    icon={m.icon}
                    tone={m.tone}
                    href={m.href}
                    loading={loading}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* All admin sections */}
        <motion.div variants={itemVariants}>
          <div className='mb-6 flex items-center justify-between'>
            <h2 className='text-xl font-semibold text-slate-900'>Toutes les sections</h2>
            <span className='text-sm text-slate-500'>
              {cardGroups.length} catégorie{cardGroups.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className='space-y-8'>
            {cardGroups.map((group, groupIndex) => (
              <div key={group.title}>
                <ActionCardGroup
                  title={group.title}
                  description={group.description}
                  icon={group.icon}
                  tone={group.tone}
                  cards={group.cards ?? []}
                />
                {groupIndex < cardGroups.length - 1 && (
                  <Separator className='my-8 bg-slate-200' />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
