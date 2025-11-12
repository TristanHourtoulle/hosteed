'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { ProductValidation } from '@prisma/client'
import { isAdmin } from '@/hooks/useAdminAuth'
import { motion, Variants } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { XCircle, ArrowLeft } from 'lucide-react'
import { getProductsForValidation, getValidationStats } from './actions'
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

interface Product {
  id: string
  name: string
  description: string
  address: string
  basePrice: string
  validate: ProductValidation
  isDraft?: boolean
  originalProductId?: string | null
  img?: { img: string }[]
  owner: {
    id: string
    name?: string | null
    lastname?: string | null
    email: string
    image?: string | null
  }
  isRecentlyModified?: boolean
  wasRecheckRequested?: boolean
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
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
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

  const fetchData = async () => {
    try {
      setLoading(true)

      const [productsResult, statsResult] = await Promise.all([
        getProductsForValidation(),
        getValidationStats(),
      ])

      if (productsResult.success && productsResult.data) {
        setProducts(productsResult.data)
      } else {
        setError(productsResult.error || 'Erreur lors du chargement des produits')
      }

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data)
      }
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err)
      setError('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

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

  if (error) {
    return (
      <div className='container mx-auto p-6 max-w-4xl'>
        <Alert className='border-red-200 bg-red-50'>
          <XCircle className='h-4 w-4 text-red-600' />
          <AlertDescription className='text-red-800'>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <motion.div
      className='container mx-auto p-6 max-w-7xl'
      variants={containerVariants}
      initial='hidden'
      animate='visible'
    >
      {/* Header */}
      <motion.div className='flex items-center gap-4 mb-8' variants={itemVariants}>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => router.push('/admin')}
          className='flex items-center gap-2'
        >
          <ArrowLeft className='h-4 w-4' />
          Retour au dashboard
        </Button>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Validation des annonces</h1>
          <p className='text-gray-600 mt-1'>Gérer et valider les annonces soumises par les hôtes</p>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <motion.div variants={itemVariants}>
        <ValidationStatsCards stats={stats} />
      </motion.div>

      {/* Validation Tabs */}
      <motion.div variants={itemVariants}>
        <ValidationTabs
          products={products}
          stats={stats}
          currentUserId={session?.user?.id || ''}
          onUpdate={fetchData}
        />
      </motion.div>
    </motion.div>
  )
}
