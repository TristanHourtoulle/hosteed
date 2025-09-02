'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, useCallback } from 'react'
import { ProductValidation, ExtraPriceType } from '@prisma/client'
import { motion } from 'framer-motion'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  getProductForValidation,
  approveProduct,
  rejectProduct,
  requestRecheck,
  getValidationHistory,
} from '../actions'
import { ValidationHistoryCard } from '../components/ValidationHistoryCard'
import { ProductHeader } from './components/ProductHeader'
import { ProductDetails } from './components/ProductDetails'
import { ProductSidebar } from './components/ProductSidebar'
import { ComparisonView } from './components/ComparisonView'
import { ProductEditForm } from './components/ProductEditForm'

interface ValidationHistoryEntry {
  id: string
  previousStatus: ProductValidation
  newStatus: ProductValidation
  reason?: string | null
  createdAt: string | Date
  admin: {
    name?: string | null
    lastname?: string | null
    email: string
  } | null
}

interface Product {
  id: string
  name: string
  description: string
  address: string
  basePrice: string
  priceMGA?: string
  availableRooms?: number
  guest: number
  bedroom: number
  bed: number
  bathroom: number
  arriving: number
  leaving: number
  validate: ProductValidation
  isDraft?: boolean
  originalProductId?: string
  originalProduct?: Product
  img?: { img: string }[]
  user: {
    id: string
    name?: string | null
    lastname?: string | null
    email: string
    image?: string | null
    profilePicture?: string | null
    profilePictureBase64?: string | null
  }[]
  type?: { name: string; description: string }
  equipments?: { name: string; icon: string }[]
  mealsList?: { name: string }[]
  servicesList?: { name: string }[]
  securities?: { name: string }[]
  typeRoom?: { name: string; description: string }
  rules?: {
    smokingAllowed: boolean
    petsAllowed: boolean
    eventsAllowed: boolean
    checkInTime: string
    checkOutTime: string
    selfCheckIn: boolean
    selfCheckInType?: string
  }
  nearbyPlaces?: {
    name: string
    distance: string
    duration: string
    transport: string
  }[]
  transportOptions?: { name: string; description: string }[]
  propertyInfo?: {
    hasStairs: boolean
    hasElevator: boolean
    hasHandicapAccess: boolean
    hasPetsOnProperty: boolean
    additionalNotes?: string
  }
  hotel?: { id: string; userId: string }
  includedServices?: { id: string; name: string; description: string | null; icon: string | null }[]
  extras?: { id: string; name: string; description: string | null; priceEUR: number; priceMGA: number; type: ExtraPriceType }[]
  highlights?: { id: string; name: string; description: string | null; icon: string | null }[]
}

interface ValidationDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function ValidationDetailPage({ params }: ValidationDetailPageProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [productId, setProductId] = useState<string | null>(null)
  const [validationHistory, setValidationHistory] = useState<ValidationHistoryEntry[]>([])
  const [activeTab, setActiveTab] = useState<'details' | 'comparison' | 'edit'>('details')
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setProductId(resolvedParams.id)
    }
    getParams()
  }, [params])

  const fetchValidationHistory = useCallback(async () => {
    if (!productId) return

    try {
      const historyResult = await getValidationHistory(productId)
      if (historyResult.success && historyResult.data) {
        setValidationHistory(historyResult.data)
      }
    } catch (error) {
      console.error('Error fetching validation history:', error)
    }
  }, [productId])

  const fetchProduct = useCallback(async () => {
    if (!productId) return

    try {
      setLoading(true)
      setError(null)

      const result = await getProductForValidation(productId)

      if (result.success && result.data) {
        setProduct(result.data as unknown as Product)
      } else {
        setError(result.error || 'Erreur lors du chargement du produit')
      }
    } catch (err) {
      console.error('Error fetching product:', err)
      setError('Erreur lors du chargement du produit')
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    if (productId) {
      fetchProduct()
      fetchValidationHistory()
    }
  }, [productId, fetchProduct, fetchValidationHistory])

  const handleApprove = async () => {
    if (!product || !session?.user?.id) return

    try {
      setActionLoading(true)
      const result = await approveProduct(product.id, session.user.id, reason.trim() || undefined)

      if (result.success) {
        // Rediriger vers la liste des validations après approbation
        router.push('/admin/validation')
        return
      } else {
        setError(result.error || 'Erreur lors de la validation')
      }
    } catch (err) {
      console.error('Error approving product:', err)
      setError('Erreur lors de la validation')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!product || !session?.user?.id || !reason.trim()) return

    try {
      setActionLoading(true)
      const result = await rejectProduct(product.id, session.user.id, reason.trim())

      if (result.success) {
        // Rediriger vers la liste des validations après refus
        router.push('/admin/validation')
        return
      } else {
        setError(result.error || 'Erreur lors du refus')
      }
    } catch (err) {
      console.error('Error rejecting product:', err)
      setError('Erreur lors du refus')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRequestRecheck = async () => {
    if (!product || !session?.user?.id || !reason.trim()) return

    try {
      setActionLoading(true)
      const result = await requestRecheck(product.id, session.user.id, reason.trim())

      if (result.success) {
        // Rediriger vers la liste des validations après demande de révision
        router.push('/admin/validation')
        return
      } else {
        setError(result.error || 'Erreur lors de la demande de révision')
      }
    } catch (err) {
      console.error('Error requesting recheck:', err)
      setError('Erreur lors de la demande de révision')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEditProduct = () => {
    setIsEditing(true)
    setActiveTab('edit')
  }

  const handleSaveProduct = (updatedProduct: Product) => {
    setProduct(updatedProduct)
    setIsEditing(false)
    setActiveTab('details')
    // Rafraîchir les données
    fetchProduct()
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setActiveTab('details')
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    )
  }

  if (error) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <Alert className='max-w-md mx-auto'>
          <XCircle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!product) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <Alert className='max-w-md mx-auto'>
          <XCircle className='h-4 w-4' />
          <AlertDescription>Annonce non trouvée</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='space-y-8'
      >
        {/* Header */}
        <ProductHeader product={product} />

        {/* Tabs */}
        <div className='border-b border-gray-200'>
          <nav className='flex space-x-8'>
            <button
              onClick={() => setActiveTab('details')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Détails
            </button>
            {product.isDraft && product.originalProduct && (
              <button
                onClick={() => setActiveTab('comparison')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'comparison'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Comparaison
                <Badge variant="secondary" className="ml-2">Modifications</Badge>
              </button>
            )}
            <button
              onClick={handleEditProduct}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'edit'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Édition
            </button>
          </nav>
        </div>

        {activeTab === 'details' && (
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            <ProductDetails product={product} />
            <ProductSidebar
              product={product}
              reason={reason}
              setReason={setReason}
              actionLoading={actionLoading}
              handleApprove={handleApprove}
              handleReject={handleReject}
              handleRequestRecheck={handleRequestRecheck}
            />
          </div>
        )}

        {activeTab === 'comparison' && product.isDraft && product.originalProduct && (
          <ComparisonView draft={product} original={product.originalProduct} />
        )}

        {activeTab === 'edit' && (
          <ProductEditForm
            product={product}
            onSave={handleSaveProduct}
            onCancel={handleCancelEdit}
          />
        )}

        {/* Historique des validations */}
        {activeTab === 'details' && (
          <motion.div
            className='mt-8'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <ValidationHistoryCard history={validationHistory as unknown as Parameters<typeof ValidationHistoryCard>[0]['history']} />
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}