'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/shadcnui/button'
import PromotionForm from '@/components/promotions/PromotionForm'
import PromotionCard from '@/components/promotions/PromotionCard'
import OverlapConfirmationModal from '@/components/promotions/OverlapConfirmationModal'
import { ProductPromotion } from '@prisma/client'

interface Product {
  id: string
  name: string
  basePrice: string
}

interface PromotionWithProduct extends ProductPromotion {
  product: Product
}

export default function HostPromotionsPage() {
  const [promotions, setPromotions] = useState<PromotionWithProduct[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [pendingPromotion, setPendingPromotion] = useState<{
    productId: string
    discountPercentage: number
    startDate: string
    endDate: string
  } | null>(null)
  const [overlappingPromotions, setOverlappingPromotions] = useState<ProductPromotion[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch promotions
      const promosRes = await fetch('/api/promotions')
      if (promosRes.ok) {
        const data = await promosRes.json()
        setPromotions(data)
      }

      // Fetch products
      const productsRes = await fetch('/api/host/products')
      if (productsRes.ok) {
        const data = await productsRes.json()
        setProducts(data.map((p: Product) => ({
          id: p.id,
          name: p.name,
          basePrice: p.basePrice
        })))
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: {
    productId: string
    discountPercentage: number
    startDate: string
    endDate: string
  }) => {
    try {
      setSubmitting(true)

      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const responseData = await res.json()

      if (res.status === 409) {
        // Conflit détecté - afficher la modal
        setPendingPromotion(data)
        setOverlappingPromotions(responseData.overlappingPromotions)
        setShowModal(true)
      } else if (res.ok) {
        toast.success('Promotion créée avec succès !')
        setShowForm(false)
        fetchData()
      } else {
        toast.error(responseData.error || 'Erreur lors de la création')
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
      toast.error('Erreur lors de la création de la promotion')
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmOverlap = async () => {
    try {
      setSubmitting(true)

      const res = await fetch('/api/promotions/confirm-overlap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promotionData: pendingPromotion,
          overlappingIds: overlappingPromotions.map((p) => p.id)
        })
      })

      if (res.ok) {
        toast.success('Promotion créée ! Les promotions précédentes ont été désactivées.')
        setShowModal(false)
        setShowForm(false)
        setPendingPromotion(null)
        setOverlappingPromotions([])
        fetchData()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erreur lors de la création')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la confirmation')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelPromotion = async (promotionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette promotion ?')) {
      return
    }

    try {
      const res = await fetch(`/api/promotions/${promotionId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Promotion annulée')
        fetchData()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erreur lors de l\'annulation')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de l\'annulation')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const activePromotions = promotions.filter((p) => p.isActive)
  const inactivePromotions = promotions.filter((p) => !p.isActive)

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Mes Promotions
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Gérez les promotions de vos logements
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          {showForm ? 'Annuler' : 'Nouvelle promotion'}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-white rounded-lg border-2 border-blue-200 shadow-sm">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">
            Créer une nouvelle promotion
          </h2>
          <PromotionForm
            products={products}
            onSubmit={handleSubmit}
            loading={submitting}
          />
        </div>
      )}

      {/* Active Promotions */}
      {activePromotions.length > 0 && (
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900">
            Promotions actives ({activePromotions.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activePromotions.map((promo) => (
              <PromotionCard
                key={promo.id}
                promotion={promo}
                onCancel={() => handleCancelPromotion(promo.id)}
                showActions
              />
            ))}
          </div>
        </div>
      )}

      {/* Inactive Promotions */}
      {inactivePromotions.length > 0 && (
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-600">
            Promotions désactivées ou expirées ({inactivePromotions.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {inactivePromotions.map((promo) => (
              <PromotionCard
                key={promo.id}
                promotion={promo}
                showActions={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {promotions.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-base sm:text-lg">
            Aucune promotion pour le moment
          </p>
          <Button
            onClick={() => setShowForm(true)}
            className="mt-4"
          >
            <Plus className="w-4 h-4 mr-2" />
            Créer ma première promotion
          </Button>
        </div>
      )}

      {/* Overlap Confirmation Modal */}
      <OverlapConfirmationModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setPendingPromotion(null)
          setOverlappingPromotions([])
        }}
        onConfirm={handleConfirmOverlap}
        overlappingPromotions={overlappingPromotions}
        newPromotion={pendingPromotion || { discountPercentage: 0, startDate: '', endDate: '' }}
        loading={submitting}
      />
    </div>
  )
}
