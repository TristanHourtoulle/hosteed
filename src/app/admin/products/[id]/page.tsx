'use client'

import { useEffect, useState, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, Variants } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { isAdmin } from '@/hooks/useAdminAuth'
import {
  findProductByIdForAdmin,
  validateProduct,
  rejectProduct,
  deleteProduct,
} from '@/lib/services/product.service'
import { findSpecialsPricesByProduct } from '@/lib/services/specialPrices.service'
import { calculateCommissions } from '@/lib/services/commission.service'
import { Alert, AlertDescription } from '@/components/ui/shadcnui/alert'
import type { AdminProductWithRelations, SpecialPrice } from './types'

import { ProductDetailHeader } from './components/ProductDetailHeader'
import { ProductInfoCard } from './components/ProductInfoCard'
import { ProductCharacteristicsCard } from './components/ProductCharacteristicsCard'
import { ProductEquipmentCard } from './components/ProductEquipmentCard'
import { ProductImagesCard } from './components/ProductImagesCard'
import { ProductLocationCard } from './components/ProductLocationCard'
import { ProductExtrasCard } from './components/ProductExtrasCard'
import { ProductRulesCard } from './components/ProductRulesCard'
import { ProductReservationsCard } from './components/ProductReservationsCard'
import { ProductReviewsCard } from './components/ProductReviewsCard'
import { ProductSpecialPricesCard } from './components/ProductSpecialPricesCard'
import { ProductAdminActions } from './components/ProductAdminActions'
import { ProductHostInfo } from './components/ProductHostInfo'
import { ProductPricingSummary } from './components/ProductPricingSummary'

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { session, isLoading: isAuthLoading, isAuthenticated } = useAuth({ required: true, redirectTo: '/auth' })
  const router = useRouter()
  const resolvedParams = use(params)

  const [product, setProduct] = useState<AdminProductWithRelations | null>(null)
  const [specialPrices, setSpecialPrices] = useState<SpecialPrice[]>([])
  const [specialPricesCount, setSpecialPricesCount] = useState(0)
  const [commissionRates, setCommissionRates] = useState<{
    hostRate: number
    clientRate: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated && (!session?.user?.roles || !isAdmin(session.user.roles))) {
      router.push('/')
    }
  }, [isAuthenticated, session, router])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [productData, specialPricesData] = await Promise.all([
        findProductByIdForAdmin(resolvedParams.id),
        findSpecialsPricesByProduct(resolvedParams.id),
      ])

      if (productData) {
        setProduct(productData as unknown as AdminProductWithRelations)
        const typeId = productData.type?.id
        const commissionData = await calculateCommissions(
          Number(productData.basePrice),
          typeId ?? undefined
        )
        setCommissionRates({
          hostRate: commissionData.breakdown.hostCommissionRate * 100,
          clientRate: commissionData.breakdown.clientCommissionRate * 100,
        })
      } else {
        setError('Hébergement introuvable')
      }

      if (Array.isArray(specialPricesData)) {
        const prices = specialPricesData as unknown as SpecialPrice[]
        setSpecialPrices(prices)
        setSpecialPricesCount(prices.length)
      }
    } catch {
      setError('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }, [resolvedParams.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleValidate = async () => {
    try {
      const updated = await validateProduct(resolvedParams.id)
      if (updated) {
        setProduct(prev => (prev ? { ...prev, validate: updated.validate } : prev))
        toast.success('Hébergement validé')
      }
    } catch {
      toast.error('Erreur lors de la validation')
    }
  }

  const handleReject = async () => {
    try {
      const updated = await rejectProduct(resolvedParams.id)
      if (updated) {
        setProduct(prev => (prev ? { ...prev, validate: updated.validate } : prev))
        toast.success('Hébergement refusé')
      }
    } catch {
      toast.error('Erreur lors du refus')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteProduct(resolvedParams.id)
      toast.success('Hébergement supprimé')
      router.push('/admin/products')
    } catch {
      toast.error('Impossible de supprimer (réservations actives ?)')
    }
  }

  if (isAuthLoading || loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='flex flex-col items-center gap-4'>
          <div className='w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin' />
          <p className='text-slate-600 text-lg'>Chargement...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  if (error || !product) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8'>
        <div className='max-w-4xl mx-auto'>
          <Alert variant='destructive' className='rounded-2xl'>
            <AlertDescription>{error || 'Hébergement introuvable'}</AlertDescription>
          </Alert>
          <Link
            href='/admin/products'
            className='inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-800'
          >
            <ArrowLeft className='h-4 w-4' />
            Retour aux hébergements
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'>
      <div className='container mx-auto p-6 max-w-6xl space-y-6'>
        {/* Back link */}
        <motion.div initial='hidden' animate='visible' variants={fadeIn}>
          <Link
            href='/admin/products'
            className='inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium'
          >
            <ArrowLeft className='h-4 w-4' />
            Retour aux hébergements
          </Link>
        </motion.div>

        {/* Header */}
        <ProductDetailHeader product={product} commissionRates={commissionRates} />

        {/* Main content: 2/3 + 1/3 */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Left column */}
          <div className='lg:col-span-2 space-y-6'>
            <ProductInfoCard product={product} />
            <ProductCharacteristicsCard product={product} />
            <ProductEquipmentCard product={product} />
            <ProductImagesCard images={product.img} productName={product.name} />
            <ProductLocationCard product={product} />
            <ProductExtrasCard extras={product.extras} highlights={product.highlights} />
            <ProductRulesCard rules={product.rules} />
            <ProductReservationsCard rents={product.rents} />
            <ProductReviewsCard reviews={product.reviews} />
            <ProductSpecialPricesCard
              productId={resolvedParams.id}
              initialSpecialPrices={specialPrices}
              onCountChange={setSpecialPricesCount}
            />
          </div>

          {/* Right sidebar */}
          <div className='space-y-6'>
            <ProductAdminActions
              productId={resolvedParams.id}
              productName={product.name}
              validationStatus={product.validate}
              onValidate={handleValidate}
              onReject={handleReject}
              onDelete={handleDelete}
            />
            <ProductHostInfo owner={product.owner} />
            <ProductPricingSummary
              product={product}
              specialPricesCount={specialPricesCount}
              commissionRates={commissionRates}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
