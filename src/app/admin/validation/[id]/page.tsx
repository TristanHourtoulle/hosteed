'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, useCallback } from 'react'
import { ProductValidation, ExtraPriceType, DayEnum } from '@prisma/client'
import { motion } from 'framer-motion'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, XCircle, Tag, Power, PowerOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  findSpecialsPricesByProduct,
  createSpecialPrices,
  updateSpecialPrices,
  toggleSpecialPriceStatus,
  deleteSpecialsPricesByProduct,
} from '@/lib/services/specialPrices.service'
import CreateSpecialPriceModal from '@/components/ui/CreateSpecialPriceModal'
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

interface SpecialPrice {
  id: string
  pricesMga: string
  pricesEuro: string
  day: DayEnum[]
  startDate: Date | null
  endDate: Date | null
  activate: boolean
  productId: string
}

interface SpecialPriceData {
  pricesMga: string
  pricesEuro: string
  day: DayEnum[]
  startDate: Date | null
  endDate: Date | null
  activate: boolean
}

interface Product {
  id: string
  name: string
  description: string
  address: string
  latitude?: number
  longitude?: number
  basePrice: string
  priceMGA?: string
  availableRooms?: number
  room?: number // ✅ Correct field name (not 'bedroom')
  bathroom?: number
  arriving: number
  leaving: number
  validate: ProductValidation
  isDraft?: boolean
  originalProductId?: string
  originalProduct?: Product
  phone?: string
  phoneCountry?: string
  surface?: number // Surface en m²
  minPeople?: number
  maxPeople?: number
  img?: { img: string }[]
  owner: {
    id: string
    name?: string | null
    lastname?: string | null
    email: string
    image?: string | null
    profilePicture?: string | null
    profilePictureBase64?: string | null
  }
  type?: { id: string; name: string; description: string }
  equipments?: { id: string; name: string; icon: string }[]
  mealsList?: { id: string; name: string }[]
  servicesList?: { id: string; name: string }[]
  securities?: { id: string; name: string }[]
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
    hasStairs?: boolean
    hasElevator?: boolean
    hasHandicapAccess?: boolean
    hasPetsOnProperty?: boolean
    additionalNotes?: string
  } | null
  hotel?: { id: string; name: string }[] // ✅ Array because it's one-to-many
  includedServices?: { id: string; name: string; description: string | null; icon: string | null }[]
  extras?: {
    id: string
    name: string
    description: string | null
    priceEUR: number
    priceMGA: number
    type: ExtraPriceType
  }[]
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
  const [specialPrices, setSpecialPrices] = useState<SpecialPrice[]>([])
  const [specialPriceModalOpen, setSpecialPriceModalOpen] = useState(false)
  const [editingSpecialPrice, setEditingSpecialPrice] = useState<SpecialPrice | null>(null)

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

      const [result, specialPricesResult] = await Promise.all([
        getProductForValidation(productId),
        findSpecialsPricesByProduct(productId),
      ])

      if (result.success && result.data) {
        setProduct(result.data as unknown as Product)
      } else {
        setError(result.error || 'Erreur lors du chargement du produit')
      }

      if (Array.isArray(specialPricesResult)) {
        setSpecialPrices(specialPricesResult as unknown as SpecialPrice[])
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
    setActiveTab('edit')
  }

  const handleSaveProduct = (updatedProduct: Product) => {
    setProduct(updatedProduct)
    setActiveTab('details')
    // Rafraîchir les données
    fetchProduct()
  }

  const handleCancelEdit = () => {
    setActiveTab('details')
  }

  // Fonctions pour gérer les prix spéciaux
  const handleSpecialPriceCreated = async (specialPriceData: SpecialPriceData) => {
    try {
      let result

      if (editingSpecialPrice) {
        // Mode modification
        result = await updateSpecialPrices(
          editingSpecialPrice.id,
          specialPriceData.pricesMga,
          specialPriceData.pricesEuro,
          specialPriceData.day,
          specialPriceData.startDate,
          specialPriceData.endDate,
          specialPriceData.activate
        )
      } else {
        // Mode création
        result = await createSpecialPrices(
          specialPriceData.pricesMga,
          specialPriceData.pricesEuro,
          specialPriceData.day,
          specialPriceData.startDate,
          specialPriceData.endDate,
          specialPriceData.activate,
          productId!
        )
      }

      if (result) {
        // Si l'opération a réussi, recharger la liste des prix spéciaux
        const updatedSpecialPrices = await findSpecialsPricesByProduct(productId!)
        if (Array.isArray(updatedSpecialPrices)) {
          setSpecialPrices(updatedSpecialPrices as unknown as SpecialPrice[])
        }
        setSpecialPriceModalOpen(false)
        setEditingSpecialPrice(null)
      } else {
        console.error("Erreur lors de l'opération sur le prix spécial")
      }
    } catch (error) {
      console.error("Erreur lors de l'opération sur le prix spécial:", error)
    }
  }

  const handleEditSpecialPrice = (price: SpecialPrice) => {
    setEditingSpecialPrice(price)
    setSpecialPriceModalOpen(true)
  }

  const handleToggleSpecialPriceStatus = async (priceId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus
      const result = await toggleSpecialPriceStatus(priceId, newStatus)

      if (result) {
        // Si la mise à jour a réussi, recharger la liste des prix spéciaux
        const updatedSpecialPrices = await findSpecialsPricesByProduct(productId!)
        if (Array.isArray(updatedSpecialPrices)) {
          setSpecialPrices(updatedSpecialPrices as unknown as SpecialPrice[])
        }
      } else {
        console.error('Erreur lors de la mise à jour du statut du prix spécial')
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut du prix spécial:', error)
    }
  }

  const handleDeleteSpecialPrice = async (priceId: string) => {
    try {
      // Demander confirmation avant suppression
      if (!confirm('Êtes-vous sûr de vouloir supprimer ce prix spécial ?')) {
        return
      }

      // Appeler le service pour supprimer le prix spécial
      const result = await deleteSpecialsPricesByProduct(priceId)

      if (result) {
        // Si la suppression a réussi, recharger la liste des prix spéciaux
        const updatedSpecialPrices = await findSpecialsPricesByProduct(productId!)
        if (Array.isArray(updatedSpecialPrices)) {
          setSpecialPrices(updatedSpecialPrices as unknown as SpecialPrice[])
        }
      } else {
        console.error('Erreur lors de la suppression du prix spécial')
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du prix spécial:', error)
    }
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
                <Badge variant='secondary' className='ml-2'>
                  Modifications
                </Badge>
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
          <>
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

            {/* Section Prix spéciaux */}
            <motion.div
              className='mt-8'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className='bg-white rounded-lg border border-gray-200 p-6'>
                <div className='flex items-center justify-between mb-6'>
                  <div className='flex items-center gap-3'>
                    <div className='p-2 bg-orange-100 rounded-lg'>
                      <Tag className='h-5 w-5 text-orange-600' />
                    </div>
                    <div>
                      <h3 className='text-lg font-semibold text-gray-900'>Prix spéciaux</h3>
                      <p className='text-sm text-gray-500'>
                        {specialPrices.length} prix spécial{specialPrices.length > 1 ? 'aux' : ''}{' '}
                        configuré{specialPrices.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {specialPrices.length === 0 ? (
                  <div className='text-center py-8'>
                    <Tag className='h-12 w-12 text-gray-300 mx-auto mb-4' />
                    <p className='text-gray-500'>Aucun prix spécial configuré pour ce produit</p>
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {specialPrices.map(price => (
                      <div key={price.id} className='border rounded-lg p-4'>
                        <div className='flex items-center justify-between mb-3'>
                          <div className='flex items-center gap-3'>
                            <div className='w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center'>
                              <Tag className='h-5 w-5 text-orange-600' />
                            </div>
                            <div>
                              <p className='font-medium text-gray-900'>
                                {price.pricesEuro}€ / nuit
                              </p>
                              <p className='text-sm text-gray-500'>Prix MGA: {price.pricesMga}</p>
                            </div>
                          </div>
                          <Badge
                            className={
                              price.activate
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {price.activate ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
                          <div>
                            <p className='text-gray-600 mb-1'>Jours applicables</p>
                            <div className='flex flex-wrap gap-1'>
                              {price.day.map(day => (
                                <Badge key={day} variant='outline' className='text-xs'>
                                  {day}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className='text-gray-600 mb-1'>Période</p>
                            <p className='text-gray-900'>
                              {price.startDate && price.endDate ? (
                                <>
                                  {new Date(price.startDate).toLocaleDateString('fr-FR')} -{' '}
                                  {new Date(price.endDate).toLocaleDateString('fr-FR')}
                                </>
                              ) : price.startDate ? (
                                `À partir du ${new Date(price.startDate).toLocaleDateString('fr-FR')}`
                              ) : price.endDate ? (
                                `Jusqu'au ${new Date(price.endDate).toLocaleDateString('fr-FR')}`
                              ) : (
                                "Toute l'année"
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}

        {activeTab === 'comparison' && product.isDraft && product.originalProduct && (
          <ComparisonView draft={product} original={product.originalProduct} />
        )}

        {activeTab === 'edit' && (
          <>
            <ProductEditForm
              product={product}
              onSave={handleSaveProduct}
              onCancel={handleCancelEdit}
            />

            {/* Section Prix spéciaux - Édition */}
            <motion.div
              className='mt-8'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className='bg-white rounded-lg border border-gray-200 p-6'>
                <div className='flex items-center justify-between mb-6'>
                  <div className='flex items-center gap-3'>
                    <div className='p-2 bg-orange-100 rounded-lg'>
                      <Tag className='h-5 w-5 text-orange-600' />
                    </div>
                    <div>
                      <h3 className='text-lg font-semibold text-gray-900'>
                        Gestion des prix spéciaux
                      </h3>
                      <p className='text-sm text-gray-500'>
                        {specialPrices.length} prix spécial{specialPrices.length > 1 ? 'aux' : ''}{' '}
                        configuré{specialPrices.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSpecialPriceModalOpen(true)}
                    className='px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2'
                  >
                    <Tag className='h-4 w-4' />
                    Créer un prix spécial
                  </button>
                </div>

                {specialPrices.length === 0 ? (
                  <div className='text-center py-8'>
                    <Tag className='h-12 w-12 text-gray-300 mx-auto mb-4' />
                    <p className='text-gray-500 mb-4'>Aucun prix spécial configuré</p>
                    <button
                      onClick={() => setSpecialPriceModalOpen(true)}
                      className='px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 mx-auto'
                    >
                      <Tag className='h-4 w-4' />
                      Créer un prix spécial
                    </button>
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {specialPrices.map(price => (
                      <div key={price.id} className='border rounded-lg p-4'>
                        <div className='flex items-center justify-between mb-3'>
                          <div className='flex items-center gap-3'>
                            <div className='w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center'>
                              <Tag className='h-5 w-5 text-orange-600' />
                            </div>
                            <div>
                              <p className='font-medium text-gray-900'>
                                {price.pricesEuro}€ / nuit
                              </p>
                              <p className='text-sm text-gray-500'>Prix MGA: {price.pricesMga}</p>
                            </div>
                          </div>
                          <Badge
                            className={
                              price.activate
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {price.activate ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4'>
                          <div>
                            <p className='text-gray-600 mb-1'>Jours applicables</p>
                            <div className='flex flex-wrap gap-1'>
                              {price.day.map(day => (
                                <Badge key={day} variant='outline' className='text-xs'>
                                  {day}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className='text-gray-600 mb-1'>Période</p>
                            <p className='text-gray-900'>
                              {price.startDate && price.endDate ? (
                                <>
                                  {new Date(price.startDate).toLocaleDateString('fr-FR')} -{' '}
                                  {new Date(price.endDate).toLocaleDateString('fr-FR')}
                                </>
                              ) : price.startDate ? (
                                `À partir du ${new Date(price.startDate).toLocaleDateString('fr-FR')}`
                              ) : price.endDate ? (
                                `Jusqu'au ${new Date(price.endDate).toLocaleDateString('fr-FR')}`
                              ) : (
                                "Toute l'année"
                              )}
                            </p>
                          </div>

                          <div className='flex items-end justify-end gap-2'>
                            <button
                              onClick={() => handleEditSpecialPrice(price)}
                              className='px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors'
                            >
                              Modifier
                            </button>
                            <button
                              onClick={() =>
                                handleToggleSpecialPriceStatus(price.id, price.activate)
                              }
                              className={`px-3 py-1 text-sm border rounded transition-colors flex items-center gap-1 ${
                                price.activate
                                  ? 'border-orange-300 text-orange-600 hover:bg-orange-50'
                                  : 'border-green-300 text-green-600 hover:bg-green-50'
                              }`}
                            >
                              {price.activate ? (
                                <>
                                  <PowerOff className='h-3 w-3' />
                                  Désactiver
                                </>
                              ) : (
                                <>
                                  <Power className='h-3 w-3' />
                                  Activer
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteSpecialPrice(price.id)}
                              className='px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors'
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}

        {/* Historique des validations */}
        {activeTab === 'details' && (
          <motion.div
            className='mt-8'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <ValidationHistoryCard
              history={
                validationHistory as unknown as Parameters<
                  typeof ValidationHistoryCard
                >[0]['history']
              }
            />
          </motion.div>
        )}
      </motion.div>

      {/* Modal de création/modification de prix spécial */}
      <CreateSpecialPriceModal
        isOpen={specialPriceModalOpen}
        onClose={() => {
          setSpecialPriceModalOpen(false)
          setEditingSpecialPrice(null)
        }}
        onSpecialPriceCreated={handleSpecialPriceCreated}
        editingSpecialPrice={editingSpecialPrice}
      />
    </div>
  )
}
