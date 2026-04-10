'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { isAdmin } from '@/hooks/useAdminAuth'
import { motion, Variants } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { XCircle, ArrowLeft, RefreshCw, ShieldCheck, Loader2 } from 'lucide-react'
import { getValidationStats } from './actions'
import { ValidationStatsCards } from './components/ValidationStatsCards'
import ValidationTabs from './components/ValidationTabs'

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
      type: 'tween',
      duration: 0.5,
      ease: 'easeOut',
    },
  },
}

interface ValidationStats {
  pending: number
  approved: number
  rejected: number
  recheckRequest: number
  modificationPending: number
  drafts: number
  total: number
}

export default function ValidationPage() {
  const {
    session,
    isLoading: isAuthLoading,
    isAuthenticated,
  } = useAuth({ required: true, redirectTo: '/auth' })
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<ValidationStats>({
    pending: 0,
    approved: 0,
    rejected: 0,
    recheckRequest: 0,
    modificationPending: 0,
    drafts: 0,
    total: 0,
  })

  useEffect(() => {
    if (isAuthenticated) {
      if (!session?.user) {
        router.push('/auth')
        return
      }

      if (!isAdmin(session.user.roles)) {
        router.push('/')
        return
      }

      fetchData()
    }
  }, [isAuthenticated, session, router])

  const fetchData = async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false
    try {
      if (silent) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      const statsResult = await getValidationStats()
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data)
      } else {
        setError(statsResult.error || 'Erreur lors du chargement des statistiques')
      }
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err)
      setError('Erreur lors du chargement des données')
    } finally {
      if (silent) {
        setRefreshing(false)
      } else {
        setLoading(false)
      }
    }
  }

  const handleRefresh = () => {
    setError(null)
    fetchData({ silent: true })
  }

  if (isAuthLoading || loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/40'>
        <div className='container mx-auto max-w-7xl space-y-8 p-6'>
          <div className='space-y-3'>
            <div className='h-4 w-40 animate-pulse rounded bg-slate-200' />
            <div className='h-10 w-80 animate-pulse rounded bg-slate-200' />
            <div className='h-4 w-96 animate-pulse rounded bg-slate-200' />
          </div>
          <div className='grid gap-4 md:grid-cols-3'>
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className='h-32 animate-pulse rounded-2xl border border-slate-200/80 bg-white'
              />
            ))}
          </div>
          <div className='h-14 animate-pulse rounded-xl border border-slate-200/80 bg-white' />
          <div className='grid gap-6 lg:grid-cols-2 xl:grid-cols-3'>
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className='h-[30rem] animate-pulse rounded-2xl border border-slate-200/80 bg-white'
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/40'>
      <motion.div
        className='container mx-auto max-w-7xl space-y-8 p-6'
        variants={containerVariants}
        initial='hidden'
        animate='visible'
      >
        {/* Breadcrumb / back link */}
        <motion.div variants={itemVariants}>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => router.push('/admin')}
            className='text-slate-600 hover:text-slate-900'
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Retour au panel admin
          </Button>
        </motion.div>

        {/* Header */}
        <motion.div
          variants={itemVariants}
          className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'
        >
          <div className='space-y-3'>
            <span className='inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700'>
              <ShieldCheck className='h-3.5 w-3.5' />
              Espace administrateur
            </span>
            <h1 className='bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-800 bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-5xl'>
              Validation des annonces
            </h1>
            <p className='max-w-2xl text-base text-slate-600'>
              Passez en revue, validez ou refusez les annonces soumises par les hôtes.
              Les annonces en attente d’action sont mises en avant en haut de la liste.
            </p>
          </div>

          <div className='shrink-0'>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
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
          </div>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div variants={itemVariants}>
            <Alert className='border-red-200 bg-red-50'>
              <XCircle className='h-4 w-4 text-red-600' />
              <AlertDescription className='text-red-800'>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Statistics */}
        <motion.div variants={itemVariants}>
          <ValidationStatsCards stats={stats} />
        </motion.div>

        {/* Validation Tabs */}
        <motion.div variants={itemVariants}>
          <ValidationTabs
            stats={stats}
            currentUserId={session?.user?.id || ''}
            onUpdate={() => fetchData({ silent: true })}
          />
        </motion.div>
      </motion.div>
    </div>
  )
}
