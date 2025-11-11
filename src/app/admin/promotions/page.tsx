'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { Button } from '@/components/ui/shadcnui/button'
import { Input } from '@/components/ui/shadcnui/input'
import { Label } from '@/components/ui/shadcnui/label'
import { Badge } from '@/components/ui/shadcnui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/shadcnui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcnui/select'
import { toast } from 'sonner'
import { Tag, Plus, Edit, Trash2, Eye, Percent, TrendingDown } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import OverlapConfirmationModal from '@/components/promotions/OverlapConfirmationModal'
import PromotionBadge from '@/components/promotions/PromotionBadge'
import { getFullSizeImageUrl } from '@/lib/utils/imageUtils'
import { ProductPromotion, ProductValidation } from '@prisma/client'

interface Promotion {
  id: string
  productId: string
  discountPercentage: number
  startDate: string
  endDate: string
  isActive: boolean
  product: {
    id: string
    name: string
    address: string
    basePrice: string
    img?: { img: string }[]
    user: {
      id: string
      name: string | null
      email: string
    }[]
  }
}

interface Product {
  id: string
  name: string
  address: string
  basePrice: string
  validate?: string
  img?: { img: string; id?: string }[]
  user: {
    id: string
    name: string | null
    email: string
  }[]
}

interface OverlappingPromotion {
  id: string
  discountPercentage: number
  startDate: string | Date
  endDate: string | Date
  product?: { name: string }
}

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)

  // Modal state for overlap confirmation
  const [showOverlapModal, setShowOverlapModal] = useState(false)
  const [overlappingPromotions, setOverlappingPromotions] = useState<OverlappingPromotion[]>([])
  const [pendingPromotion, setPendingPromotion] = useState<{
    productId: string
    discountPercentage: number
    startDate: string
    endDate: string
  } | null>(null)

  // Form state
  const [selectedProductId, setSelectedProductId] = useState('')
  const [discountPercentage, setDiscountPercentage] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch all promotions
      const promotionsRes = await fetch('/api/promotions')
      if (promotionsRes.ok) {
        const data = await promotionsRes.json()
        setPromotions(data)
      }

      // Fetch all products from admin API
      const productsRes = await fetch('/api/admin/products?limit=1000')
      if (productsRes.ok) {
        const data = await productsRes.json()

        // Filter only validated products (validate = 'Approve' in DB)
        const validatedProducts = data.products.filter(
          (p: Product) => p.validate === ProductValidation.Approve
        )
        setProducts(validatedProducts)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedProductId('')
    setDiscountPercentage('')
    setStartDate('')
    setEndDate('')
    setEditingPromotion(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedProductId || !discountPercentage || !startDate || !endDate) {
      toast.error('Veuillez remplir tous les champs')
      return
    }

    const discount = parseFloat(discountPercentage)
    if (discount <= 0 || discount >= 100) {
      toast.error('La réduction doit être entre 0 et 100%')
      return
    }

    if (new Date(startDate) >= new Date(endDate)) {
      toast.error('La date de fin doit être après la date de début')
      return
    }

    const promotionData = {
      productId: selectedProductId,
      discountPercentage: discount,
      startDate,
      endDate,
    }

    try {
      if (editingPromotion) {
        // Update existing promotion
        const res = await fetch(`/api/promotions/${editingPromotion.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(promotionData),
        })

        if (res.status === 409) {
          const { overlappingPromotions: overlapping } = await res.json()
          setPendingPromotion(promotionData)
          setOverlappingPromotions(overlapping)
          setShowOverlapModal(true)
          return
        }

        if (!res.ok) {
          const errorData = await res.json()
          toast.error(errorData.error || 'Erreur lors de la mise à jour')
          return
        }

        toast.success('Promotion mise à jour avec succès')
      } else {
        // Create new promotion
        const res = await fetch('/api/promotions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(promotionData),
        })

        if (res.status === 409) {
          const { overlappingPromotions: overlapping } = await res.json()
          setPendingPromotion(promotionData)
          setOverlappingPromotions(overlapping)
          setShowOverlapModal(true)
          return
        }

        if (!res.ok) {
          const errorData = await res.json()
          toast.error(errorData.error || 'Erreur lors de la création')
          return
        }

        toast.success('Promotion créée avec succès')
      }

      setIsDialogOpen(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Error submitting promotion:', error)
      toast.error('Une erreur est survenue')
    }
  }

  const handleConfirmOverlap = async () => {
    if (!pendingPromotion) return

    try {
      const res = await fetch('/api/promotions/confirm-overlap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promotionData: pendingPromotion,
          overlappingIds: overlappingPromotions.map(p => p.id),
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        toast.error(error.error || 'Erreur lors de la création')
        return
      }

      toast.success('Promotion créée avec succès')
      setShowOverlapModal(false)
      setIsDialogOpen(false)
      resetForm()
      setPendingPromotion(null)
      setOverlappingPromotions([])
      fetchData()
    } catch (error) {
      console.error('Error confirming overlap:', error)
      toast.error('Une erreur est survenue')
    }
  }

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion)
    setSelectedProductId(promotion.productId)
    setDiscountPercentage(promotion.discountPercentage.toString())
    setStartDate(format(new Date(promotion.startDate), "yyyy-MM-dd'T'HH:mm"))
    setEndDate(format(new Date(promotion.endDate), "yyyy-MM-dd'T'HH:mm"))
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette promotion ?')) return

    try {
      const res = await fetch(`/api/promotions/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        toast.error('Erreur lors de la suppression')
        return
      }

      toast.success('Promotion supprimée avec succès')
      fetchData()
    } catch (error) {
      console.error('Error deleting promotion:', error)
      toast.error('Une erreur est survenue')
    }
  }

  const isCurrentlyActive = (promotion: Promotion) => {
    const now = new Date()
    const start = new Date(promotion.startDate)
    const end = new Date(promotion.endDate)
    return promotion.isActive && start <= now && now <= end
  }

  const getDiscountedPrice = (basePrice: string, discount: number) => {
    const price = parseFloat(basePrice)
    return (price * (1 - discount / 100)).toFixed(2)
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold'>Gestion des Promotions</h1>
          <p className='text-gray-600 mt-2'>Gérez les réductions appliquées aux hébergements</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className='bg-blue-600 hover:bg-blue-700'>
              <Plus className='w-4 h-4 mr-2' />
              Nouvelle Promotion
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-lg sm:max-w-xl'>
            <DialogHeader>
              <DialogTitle>
                {editingPromotion ? 'Modifier la Promotion' : 'Nouvelle Promotion'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <Label htmlFor='product'>Hébergement</Label>
                <Select
                  value={selectedProductId}
                  onValueChange={setSelectedProductId}
                  disabled={!!editingPromotion}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Sélectionner un hébergement' />
                  </SelectTrigger>
                  <SelectContent className='max-w-[calc(100vw-2rem)] sm:max-w-lg'>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.id} className='max-w-full'>
                        <div className='flex flex-col truncate'>
                          <span className='font-medium truncate'>{product.name}</span>
                          <span className='text-xs text-gray-500 truncate'>{product.address}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor='discount'>Réduction (%)</Label>
                <Input
                  id='discount'
                  type='number'
                  min='1'
                  max='99'
                  step='1'
                  value={discountPercentage}
                  onChange={e => setDiscountPercentage(e.target.value)}
                  placeholder='Ex: 20'
                  required
                />
              </div>

              <div>
                <Label htmlFor='start'>Date de début</Label>
                <Input
                  id='start'
                  type='datetime-local'
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor='end'>Date de fin</Label>
                <Input
                  id='end'
                  type='datetime-local'
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  required
                />
              </div>

              <div className='flex justify-end space-x-2 pt-4'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    setIsDialogOpen(false)
                    resetForm()
                  }}
                >
                  Annuler
                </Button>
                <Button type='submit'>{editingPromotion ? 'Mettre à jour' : 'Créer'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8'>
        <Card>
          <CardContent className='p-4 sm:p-6'>
            <div className='flex items-center'>
              <Tag className='h-6 w-6 sm:h-8 sm:w-8 text-blue-500' />
              <div className='ml-3 sm:ml-4'>
                <p className='text-xs sm:text-sm font-medium text-gray-600'>Promotions actives</p>
                <p className='text-xl sm:text-2xl font-bold'>
                  {promotions.filter(p => isCurrentlyActive(p)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4 sm:p-6'>
            <div className='flex items-center'>
              <Percent className='h-6 w-6 sm:h-8 sm:w-8 text-green-500' />
              <div className='ml-3 sm:ml-4'>
                <p className='text-xs sm:text-sm font-medium text-gray-600'>Total promotions</p>
                <p className='text-xl sm:text-2xl font-bold'>{promotions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4 sm:p-6'>
            <div className='flex items-center'>
              <TrendingDown className='h-6 w-6 sm:h-8 sm:w-8 text-orange-500' />
              <div className='ml-3 sm:ml-4'>
                <p className='text-xs sm:text-sm font-medium text-gray-600'>Réduction moyenne</p>
                <p className='text-xl sm:text-2xl font-bold'>
                  {promotions.length > 0
                    ? (
                        promotions.reduce((acc, p) => acc + p.discountPercentage, 0) /
                        promotions.length
                      ).toFixed(0)
                    : 0}
                  %
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des promotions */}
      <div className='grid gap-4 sm:gap-6'>
        {promotions.map(promotion => (
          <Card key={promotion.id} className='overflow-hidden'>
            <CardContent className='p-0'>
              <div className='flex flex-col md:flex-row'>
                {/* Image */}
                <div className='md:w-48 h-48 md:h-auto relative'>
                  {promotion.product.img?.[0] ? (
                    <Image
                      src={getFullSizeImageUrl(promotion.product.img[0].img)}
                      alt={promotion.product.name}
                      fill
                      className='object-cover'
                      unoptimized={getFullSizeImageUrl(promotion.product.img[0].img).startsWith(
                        '/uploads/'
                      )}
                    />
                  ) : (
                    <div className='w-full h-full bg-gray-200 flex items-center justify-center'>
                      <span className='text-gray-400'>Pas d&apos;image</span>
                    </div>
                  )}
                  {/* Badge promotion sur l'image */}
                  <div className='absolute top-3 left-3'>
                    <PromotionBadge discountPercentage={promotion.discountPercentage} size='md' />
                  </div>
                </div>

                {/* Contenu */}
                <div className='flex-1 p-4 sm:p-6'>
                  <div className='flex flex-col sm:flex-row justify-between items-start gap-4'>
                    <div className='flex-1'>
                      <div className='flex flex-wrap items-center gap-2 sm:gap-3 mb-2'>
                        <h3 className='text-lg sm:text-xl font-semibold'>
                          {promotion.product.name}
                        </h3>
                        {isCurrentlyActive(promotion) && (
                          <Badge className='bg-green-100 text-green-800'>
                            <Tag className='w-3 h-3 mr-1' />
                            En cours
                          </Badge>
                        )}
                        {!promotion.isActive && <Badge variant='secondary'>Inactif</Badge>}
                      </div>

                      <p className='text-sm sm:text-base text-gray-600 mb-2'>
                        {promotion.product.address}
                      </p>

                      <div className='flex flex-col sm:flex-row sm:items-center gap-2 mb-3'>
                        <div className='flex items-baseline gap-2'>
                          <span className='text-base sm:text-lg font-medium text-gray-400 line-through'>
                            {promotion.product.basePrice}€
                          </span>
                          <span className='text-lg sm:text-xl font-bold text-green-600'>
                            {getDiscountedPrice(
                              promotion.product.basePrice,
                              promotion.discountPercentage
                            )}
                            €/nuit
                          </span>
                        </div>
                        <span className='text-xs sm:text-sm text-green-600 font-medium'>
                          (-{promotion.discountPercentage}%)
                        </span>
                      </div>

                      <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm'>
                        <div>
                          <span className='font-medium'>Début:</span>
                          <br />
                          {format(new Date(promotion.startDate), 'dd MMM yyyy HH:mm', {
                            locale: fr,
                          })}
                        </div>
                        <div>
                          <span className='font-medium'>Fin:</span>
                          <br />
                          {format(new Date(promotion.endDate), 'dd MMM yyyy HH:mm', { locale: fr })}
                        </div>
                      </div>

                      {/* Host info */}
                      <div className='mt-3 pt-3 border-t text-xs sm:text-sm text-gray-500'>
                        <span className='font-medium'>Hôte:</span>{' '}
                        {promotion.product.owner?.name || promotion.product.owner?.email}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className='flex sm:flex-col gap-2 w-full sm:w-auto'>
                      <Link href={`/host/${promotion.product.id}`} className='flex-1 sm:flex-none'>
                        <Button variant='outline' size='sm' className='w-full'>
                          <Eye className='w-4 h-4 sm:mr-1' />
                          <span className='hidden sm:inline'>Voir</span>
                        </Button>
                      </Link>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleEdit(promotion)}
                        className='flex-1 sm:flex-none'
                      >
                        <Edit className='w-4 h-4 sm:mr-1' />
                        <span className='hidden sm:inline'>Modifier</span>
                      </Button>
                      <Button
                        variant='destructive'
                        size='sm'
                        onClick={() => handleDelete(promotion.id)}
                        className='flex-1 sm:flex-none'
                      >
                        <Trash2 className='w-4 h-4 sm:mr-1' />
                        <span className='hidden sm:inline'>Supprimer</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {promotions.length === 0 && (
          <Card>
            <CardContent className='p-8 sm:p-12 text-center'>
              <Tag className='w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4' />
              <h3 className='text-base sm:text-lg font-medium text-gray-900 mb-2'>
                Aucune promotion configurée
              </h3>
              <p className='text-sm sm:text-base text-gray-600 mb-4'>
                Commencez par créer votre première promotion
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className='w-4 h-4 mr-2' />
                Nouvelle Promotion
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Overlap Confirmation Modal */}
      {pendingPromotion && (
        <OverlapConfirmationModal
          isOpen={showOverlapModal}
          onClose={() => {
            setShowOverlapModal(false)
            setPendingPromotion(null)
            setOverlappingPromotions([])
          }}
          onConfirm={handleConfirmOverlap}
          overlappingPromotions={
            overlappingPromotions as (ProductPromotion & { product?: { name: string } })[]
          }
          newPromotion={pendingPromotion}
          loading={false}
        />
      )}
    </div>
  )
}
