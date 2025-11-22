'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, ShieldAlert, Filter } from 'lucide-react'
import { Button } from '@/components/ui/shadcnui/button'
import { Badge } from '@/components/ui/shadcnui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/shadcnui/alert-dialog'
import PromotionForm from '@/components/promotions/PromotionForm'
import PromotionCard from '@/components/promotions/PromotionCard'
import OverlapConfirmationModal from '@/components/promotions/OverlapConfirmationModal'
import { ProductPromotion } from '@prisma/client'
import HostNavbar from '../components/HostNavbar'
import { useAuth } from '@/hooks/useAuth'
import { UserCombobox } from '@/components/ui/UserCombobox'

interface Product {
  id: string
  name: string
  basePrice: string
  owner?: {
    id: string
    name: string
    email: string
  }
}

interface PromotionWithProduct extends ProductPromotion {
  product: Product
}

interface User {
  id: string
  email: string
  name: string | null
  lastname: string | null
}

export default function HostPromotionsPage() {
  const { session } = useAuth({ required: true, redirectTo: '/auth' })
  const [promotions, setPromotions] = useState<PromotionWithProduct[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('all')
  const [cancelingPromotionId, setCancelingPromotionId] = useState<string | null>(null)

  // Vérifier si l'utilisateur est admin ou host manager
  const isAdminOrManager =
    session?.user?.roles === 'ADMIN' || session?.user?.roles === 'HOST_MANAGER'

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

  const fetchData = async (showLoadingState = true) => {
    try {
      if (showLoadingState) {
        setLoading(true)
      }

      // Fetch promotions
      const promosRes = await fetch('/api/promotions')
      if (promosRes.ok) {
        const data = await promosRes.json()
        // Validation: s'assurer que data est un tableau
        if (Array.isArray(data)) {
          // Convertir les dates string en objets Date
          const promotionsWithDates = data.map(promo => ({
            ...promo,
            startDate: new Date(promo.startDate),
            endDate: new Date(promo.endDate),
            createdAt: new Date(promo.createdAt),
            updatedAt: new Date(promo.updatedAt),
          }))
          setPromotions(promotionsWithDates)
        } else {
          console.error('Invalid promotions data format:', data)
          setPromotions([])
          toast.error('Format de données invalide pour les promotions')
        }
      } else {
        setPromotions([])
      }

      // Fetch products (avec owner pour filtrage admin)
      const productsRes = await fetch('/api/host/products')
      if (productsRes.ok) {
        const data = await productsRes.json()
        // L'API retourne un objet paginé avec products, currentPage, etc.
        const productsArray = data.products || data

        // Validation: s'assurer que productsArray est un tableau
        if (Array.isArray(productsArray)) {
          setProducts(
            productsArray.map((p: Product & { owner?: { id: string; name: string; email: string } }) => ({
              id: p.id,
              name: p.name,
              basePrice: p.basePrice,
              owner: p.owner ? {
                id: p.owner.id,
                name: p.owner.name,
                email: p.owner.email,
              } : undefined,
            }))
          )
        } else {
          console.error('Invalid products data format:', data)
          setProducts([])
          toast.error('Format de données invalide pour les produits')
        }
      } else {
        setProducts([])
      }

      // Fetch users (admin/host manager uniquement)
      if (isAdminOrManager) {
        try {
          const usersRes = await fetch('/api/users')
          if (usersRes.ok) {
            const usersData = await usersRes.json()
            if (Array.isArray(usersData)) {
              setUsers(usersData.map((u: { id: string; email: string; name?: string; lastname?: string }) => ({
                id: u.id,
                email: u.email,
                name: u.name || null,
                lastname: u.lastname || null,
              })))
            }
          }
        } catch (error) {
          console.error('Erreur lors du chargement des utilisateurs:', error)
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      toast.error('Erreur lors du chargement des données')
      setPromotions([])
      setProducts([])
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
        body: JSON.stringify(data),
      })

      const responseData = await res.json()

      if (res.status === 409) {
        // Conflit détecté - afficher la modal
        setPendingPromotion(data)
        // Convertir les dates des promotions en conflit
        const overlappingWithDates = responseData.overlappingPromotions.map((promo: ProductPromotion) => ({
          ...promo,
          startDate: new Date(promo.startDate),
          endDate: new Date(promo.endDate),
          createdAt: new Date(promo.createdAt),
          updatedAt: new Date(promo.updatedAt),
        }))
        setOverlappingPromotions(overlappingWithDates)
        setShowModal(true)
      } else if (res.ok) {
        await fetchData(false) // Recharger sans afficher le skeleton
        toast.success('Promotion créée avec succès !')
        setShowForm(false)
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
          overlappingIds: overlappingPromotions.map(p => p.id),
        }),
      })

      if (res.ok) {
        await fetchData(false) // Recharger sans afficher le skeleton
        toast.success('Promotion créée ! Les promotions précédentes ont été désactivées.')
        setShowModal(false)
        setShowForm(false)
        setPendingPromotion(null)
        setOverlappingPromotions([])
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
    try {
      setCancelingPromotionId(promotionId)
      const res = await fetch(`/api/promotions/${promotionId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        // Mise à jour optimiste de l'état local
        setPromotions(prevPromotions =>
          prevPromotions.map(promo =>
            promo.id === promotionId ? { ...promo, isActive: false } : promo
          )
        )
        toast.success('Promotion annulée')
      } else {
        const data = await res.json()
        toast.error(data.error || "Erreur lors de l'annulation")
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error("Erreur lors de l'annulation")
    } finally {
      setCancelingPromotionId(null)
    }
  }

  if (loading) {
    return (
      <>
        <HostNavbar />
        <div className='container mx-auto px-4 py-8'>
          <div className='animate-pulse space-y-4'>
            <div className='h-8 bg-gray-200 rounded w-1/4'></div>
            <div className='h-32 bg-gray-200 rounded'></div>
            <div className='h-32 bg-gray-200 rounded'></div>
          </div>
        </div>
      </>
    )
  }

  // Extraire la liste des propriétaires uniques (pour le filtre admin)
  // Convertir en format compatible avec UserCombobox
  const uniqueOwners = Array.from(
    new Map(
      promotions
        .filter(p => p.product?.owner)
        .map(p => [p.product!.owner!.id, p.product!.owner!])
    ).values()
  ).map(owner => ({
    id: owner.id,
    email: owner.email,
    name: owner.name || null,
    lastname: null,
  }))

  // Filtrer les promotions selon le propriétaire sélectionné
  const filteredPromotions =
    selectedOwnerId === 'all'
      ? promotions
      : promotions.filter(p => p.product?.owner?.id === selectedOwnerId)

  const activePromotions = filteredPromotions.filter(p => p.isActive)
  const inactivePromotions = filteredPromotions.filter(p => !p.isActive)

  return (
    <>
      <HostNavbar />
      <div className='container mx-auto px-4 py-6 sm:py-8'>
        {/* Header */}
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8'>
        <div>
          <div className='flex items-center gap-3 flex-wrap'>
            <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>Mes Promotions</h1>
            {isAdminOrManager && (
              <Badge variant='outline' className='bg-amber-50 text-amber-700 border-amber-300'>
                <ShieldAlert className='w-3 h-3 mr-1' />
                Mode Admin - Toutes les promotions
              </Badge>
            )}
          </div>
          <p className='text-sm sm:text-base text-gray-600 mt-1'>
            {isAdminOrManager
              ? 'Visualisez et gérez toutes les promotions de la plateforme'
              : 'Gérez les promotions de vos logements'}
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className='w-full sm:w-auto'>
          <Plus className='w-4 h-4 mr-2' />
          {showForm ? 'Annuler' : 'Nouvelle promotion'}
        </Button>
      </div>

      {/* Owner Filter for Admin/Manager */}
      {isAdminOrManager && uniqueOwners.length > 0 && (
        <div className='mb-6 p-4 bg-white rounded-lg border shadow-sm'>
          <div className='flex flex-col gap-3'>
            <div className='flex items-center gap-2'>
              <Filter className='w-4 h-4 text-gray-600' />
              <label className='text-sm font-medium text-gray-700'>
                Filtrer par propriétaire
              </label>
              {selectedOwnerId !== 'all' && (
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => setSelectedOwnerId('all')}
                  className='text-xs text-blue-600 hover:text-blue-700'
                >
                  Réinitialiser
                </Button>
              )}
            </div>
            <UserCombobox
              users={uniqueOwners}
              value={selectedOwnerId === 'all' ? '' : selectedOwnerId}
              onValueChange={(userId) => setSelectedOwnerId(userId || 'all')}
              placeholder={`Tous les propriétaires (${promotions.length} promotions)`}
              className='w-full'
            />
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className='mb-6 sm:mb-8 p-4 sm:p-6 bg-white rounded-lg border-2 border-blue-200 shadow-sm'>
          <h2 className='text-lg sm:text-xl font-semibold mb-4'>Créer une nouvelle promotion</h2>
          <PromotionForm
            products={products}
            onSubmit={handleSubmit}
            loading={submitting}
            isAdminOrManager={isAdminOrManager}
            currentUserId={session?.user?.id || ''}
            users={users}
          />
        </div>
      )}

      {/* Active Promotions */}
      {activePromotions.length > 0 && (
        <div className='mb-6 sm:mb-8'>
          <h2 className='text-lg sm:text-xl font-semibold mb-4 text-gray-900'>
            Promotions actives ({activePromotions.length})
          </h2>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            {activePromotions.map(promo => (
              <AlertDialog key={promo.id}>
                <PromotionCard
                  promotion={promo}
                  onCancel={() => {}}
                  showActions
                  showOwner={isAdminOrManager}
                  AlertDialogTrigger={AlertDialogTrigger}
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmer l&apos;annulation</AlertDialogTitle>
                    <AlertDialogDescription>
                      Êtes-vous sûr de vouloir annuler cette promotion de{' '}
                      <strong>{promo.discountPercentage}%</strong> sur{' '}
                      <strong>{promo.product?.name}</strong> ? Cette action désactivera la promotion.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleCancelPromotion(promo.id)}
                      disabled={cancelingPromotionId === promo.id}
                      className='bg-red-600 hover:bg-red-700'
                    >
                      {cancelingPromotionId === promo.id ? 'Annulation...' : 'Confirmer'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ))}
          </div>
        </div>
      )}

      {/* Inactive Promotions */}
      {inactivePromotions.length > 0 && (
        <div>
          <h2 className='text-lg sm:text-xl font-semibold mb-4 text-gray-600'>
            Promotions désactivées ou expirées ({inactivePromotions.length})
          </h2>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            {inactivePromotions.map(promo => (
              <PromotionCard
                key={promo.id}
                promotion={promo}
                showActions={false}
                showOwner={isAdminOrManager}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {promotions.length === 0 && (
        <div className='text-center py-12 bg-gray-50 rounded-lg'>
          <p className='text-gray-600 text-base sm:text-lg'>Aucune promotion pour le moment</p>
          <Button onClick={() => setShowForm(true)} className='mt-4'>
            <Plus className='w-4 h-4 mr-2' />
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
    </>
  )
}
