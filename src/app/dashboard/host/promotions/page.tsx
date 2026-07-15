'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CACHE_TAGS } from '@/lib/cache/query-client'
import { useMutationWithCache } from '@/hooks/useMutationWithCache'
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
  // Hotel multi-room-type (Lot 5): drives the room-type selector in PromotionForm.
  isHotel?: boolean
  roomTypes?: { id: string; name: string }[]
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

interface PromotionInput {
  productId: string
  discountPercentage: number
  startDate: string
  endDate: string
  roomTypeId: string | null
}

type CreatePromotionResult =
  | { type: 'created' }
  | { type: 'conflict'; overlapping: ProductPromotion[] }

/** Convert the string dates returned by the API into `Date` objects. */
const withPromotionDates = <T extends ProductPromotion>(promo: T): T => ({
  ...promo,
  startDate: new Date(promo.startDate),
  endDate: new Date(promo.endDate),
  createdAt: new Date(promo.createdAt),
  updatedAt: new Date(promo.updatedAt),
})

async function fetchPromotions(): Promise<PromotionWithProduct[]> {
  const res = await fetch('/api/promotions')
  if (!res.ok) return []
  const data = await res.json()
  if (!Array.isArray(data)) return []
  return data.map(withPromotionDates)
}

async function fetchHostProducts(): Promise<Product[]> {
  const res = await fetch('/api/host/products')
  if (!res.ok) return []
  const data = await res.json()
  // The API returns a paginated object with `products`, `currentPage`, etc.
  const productsArray = data.products || data
  if (!Array.isArray(productsArray)) return []
  return productsArray.map(
    (p: Product & { owner?: { id: string; name: string; email: string } }) => ({
      id: p.id,
      name: p.name,
      basePrice: p.basePrice,
      // Hotel multi-room-type (Lot 5): keep the metadata the PromotionForm
      // needs to offer a room-type selector for hotel products.
      isHotel: p.isHotel ?? false,
      roomTypes: p.roomTypes ?? [],
      owner: p.owner
        ? { id: p.owner.id, name: p.owner.name, email: p.owner.email }
        : undefined,
    })
  )
}

async function fetchPromotionUsers(): Promise<User[]> {
  const res = await fetch('/api/users')
  if (!res.ok) return []
  const data = await res.json()
  if (!Array.isArray(data)) return []
  return data.map((u: { id: string; email: string; name?: string; lastname?: string }) => ({
    id: u.id,
    email: u.email,
    name: u.name || null,
    lastname: u.lastname || null,
  }))
}

export default function HostPromotionsPage() {
  const { session } = useAuth({ required: true, redirectTo: '/auth' })
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('all')
  const [cancelingPromotionId, setCancelingPromotionId] = useState<string | null>(null)

  // Vérifier si l'utilisateur est admin ou host manager
  const isAdminOrManager =
    session?.user?.roles === 'ADMIN' || session?.user?.roles === 'HOST_MANAGER'

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [pendingPromotion, setPendingPromotion] = useState<PromotionInput | null>(null)
  const [overlappingPromotions, setOverlappingPromotions] = useState<ProductPromotion[]>([])

  // --- Server reads (React Query) ---
  const promotionsQuery = useQuery({
    queryKey: CACHE_TAGS.promotions(),
    queryFn: fetchPromotions,
  })
  const productsQuery = useQuery({
    queryKey: CACHE_TAGS.hostProductsList(),
    queryFn: fetchHostProducts,
  })
  const usersQuery = useQuery({
    queryKey: CACHE_TAGS.users,
    queryFn: fetchPromotionUsers,
    enabled: isAdminOrManager,
  })

  const promotions = promotionsQuery.data ?? []
  const products = productsQuery.data ?? []
  const users = usersQuery.data ?? []
  const loading = promotionsQuery.isLoading || productsQuery.isLoading

  // --- Mutations (React Query) ---
  const createPromotion = useMutationWithCache<CreatePromotionResult, PromotionInput>({
    mutationFn: async data => {
      let res: Response
      try {
        res = await fetch('/api/promotions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
      } catch {
        throw new Error('Erreur lors de la création de la promotion')
      }
      const responseData = await res.json().catch(() => ({}))
      if (res.status === 409) {
        const overlapping = (responseData.overlappingPromotions ?? []).map(withPromotionDates)
        return { type: 'conflict', overlapping }
      }
      if (!res.ok) {
        throw new Error(responseData.error || 'Erreur lors de la création')
      }
      return { type: 'created' }
    },
    invalidateKeys: (result, vars) =>
      result.type === 'created'
        ? [CACHE_TAGS.promotions(), CACHE_TAGS.product(vars.productId)]
        : [],
    onSuccess: (result, vars) => {
      if (result.type === 'conflict') {
        setPendingPromotion(vars)
        setOverlappingPromotions(result.overlapping)
        setShowModal(true)
      } else {
        toast.success('Promotion créée avec succès !')
        setShowForm(false)
      }
    },
    onError: error => {
      toast.error(
        error instanceof Error ? error.message : 'Erreur lors de la création de la promotion'
      )
    },
  })

  const confirmOverlap = useMutationWithCache<true, void>({
    mutationFn: async () => {
      let res: Response
      try {
        res = await fetch('/api/promotions/confirm-overlap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            promotionData: pendingPromotion,
            overlappingIds: overlappingPromotions.map(p => p.id),
          }),
        })
      } catch {
        throw new Error('Erreur lors de la confirmation')
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erreur lors de la création')
      }
      return true
    },
    invalidateKeys: () =>
      pendingPromotion
        ? [CACHE_TAGS.promotions(), CACHE_TAGS.product(pendingPromotion.productId)]
        : [CACHE_TAGS.promotions()],
    onSuccess: () => {
      toast.success('Promotion créée ! Les promotions précédentes ont été désactivées.')
      setShowModal(false)
      setShowForm(false)
      setPendingPromotion(null)
      setOverlappingPromotions([])
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la confirmation')
    },
  })

  const cancelPromotion = useMutationWithCache<
    string,
    string,
    { previous?: PromotionWithProduct[] }
  >({
    mutationFn: async promotionId => {
      let res: Response
      try {
        res = await fetch(`/api/promotions/${promotionId}`, { method: 'DELETE' })
      } catch {
        throw new Error("Erreur lors de l'annulation")
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Erreur lors de l'annulation")
      }
      return promotionId
    },
    optimistic: {
      onMutate: promotionId => {
        const previous = queryClient.getQueryData<PromotionWithProduct[]>(CACHE_TAGS.promotions())
        queryClient.setQueryData<PromotionWithProduct[]>(CACHE_TAGS.promotions(), old =>
          old ? old.map(p => (p.id === promotionId ? { ...p, isActive: false } : p)) : old
        )
        return { previous }
      },
      rollback: context => {
        if (context?.previous) {
          queryClient.setQueryData(CACHE_TAGS.promotions(), context.previous)
        }
      },
    },
    invalidateKeys: promotionId => {
      const productId = promotions.find(p => p.id === promotionId)?.product?.id
      return productId
        ? [CACHE_TAGS.promotions(), CACHE_TAGS.product(productId)]
        : [CACHE_TAGS.promotions()]
    },
    successMessage: 'Promotion annulée',
    onSuccess: () => setCancelingPromotionId(null),
    onError: error => {
      setCancelingPromotionId(null)
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'annulation")
    },
  })

  const submitting = createPromotion.isPending || confirmOverlap.isPending

  const handleCancelPromotion = (promotionId: string) => {
    setCancelingPromotionId(promotionId)
    cancelPromotion.mutate(promotionId)
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
            onSubmit={async data => {
              await createPromotion.mutateAsync(data).catch(() => {})
            }}
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
        onConfirm={() => confirmOverlap.mutate()}
        overlappingPromotions={overlappingPromotions}
        newPromotion={pendingPromotion || { discountPercentage: 0, startDate: '', endDate: '' }}
        loading={submitting}
      />
      </div>
    </>
  )
}
