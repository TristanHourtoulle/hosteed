'use client'

import { useEffect, useState } from 'react'
import {
  getAllPromotedProducts,
  getProductsAvailableForPromotion,
  createPromotedProduct,
  updatePromotedProduct,
  deletePromotedProduct,
} from '@/lib/services/promotedProduct.service'
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
import { CalendarIcon, Plus, Star, Edit, Trash2, Eye } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface PromotedProduct {
  id: string
  active: boolean
  start: Date
  end: Date
  productId: string
  product: {
    id: string
    name: string
    address: string
    basePrice: string
    img?: { img: string }[]
    type: { name: string }
    owner: {
      id: string
      name: string | null
      email: string
    }
  }
}

interface Product {
  id: string
  name: string
  address: string
  basePrice: string
  img?: { img: string }[]
  type: { name: string }
  owner: {
    id: string
    name: string | null
    email: string
  }
}

export default function PromotedProductsAdmin() {
  const [promotedProducts, setPromotedProducts] = useState<PromotedProduct[]>([])
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<PromotedProduct | null>(null)

  // Form state
  const [selectedProductId, setSelectedProductId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [promoted, available] = await Promise.all([
        getAllPromotedProducts(),
        getProductsAvailableForPromotion(),
      ])

      if (promoted) setPromotedProducts(promoted)
      if (available) setAvailableProducts(available)
    } catch {
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedProductId('')
    setStartDate('')
    setEndDate('')
    setIsActive(true)
    setEditingPromotion(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedProductId || !startDate || !endDate) {
      toast.error('Veuillez remplir tous les champs')
      return
    }

    if (new Date(startDate) >= new Date(endDate)) {
      toast.error('La date de fin doit être postérieure à la date de début')
      return
    }

    try {
      if (editingPromotion) {
        const result = await updatePromotedProduct(
          editingPromotion.id,
          isActive,
          new Date(startDate),
          new Date(endDate)
        )
        if (result) {
          toast.success('Promotion mise à jour avec succès')
        } else {
          toast.error('Erreur lors de la mise à jour')
        }
      } else {
        const result = await createPromotedProduct(
          isActive,
          new Date(startDate),
          new Date(endDate),
          selectedProductId
        )
        if (result) {
          toast.success('Promotion créée avec succès')
        } else {
          toast.error('Erreur lors de la création')
        }
      }

      setIsDialogOpen(false)
      resetForm()
      fetchData()
    } catch {
      toast.error('Une erreur est survenue')
    }
  }

  const handleEdit = (promotion: PromotedProduct) => {
    setEditingPromotion(promotion)
    setSelectedProductId(promotion.productId)
    setStartDate(format(new Date(promotion.start), 'yyyy-MM-dd'))
    setEndDate(format(new Date(promotion.end), 'yyyy-MM-dd'))
    setIsActive(promotion.active)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette promotion ?')) return

    try {
      const result = await deletePromotedProduct(id)
      if (result) {
        toast.success('Promotion supprimée avec succès')
        fetchData()
      } else {
        toast.error('Erreur lors de la suppression')
      }
    } catch {
      toast.error('Une erreur est survenue')
    }
  }

  const isCurrentlyActive = (promotion: PromotedProduct) => {
    const now = new Date()
    const start = new Date(promotion.start)
    const end = new Date(promotion.end)
    return promotion.active && start <= now && now <= end
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
      <div className='flex justify-between items-center mb-8'>
        <div>
          <h1 className='text-3xl font-bold'>Hébergements Sponsorisés</h1>
          <p className='text-gray-600 mt-2'>
            Gérez les hébergements mis en avant sur la plateforme
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className='bg-blue-600 hover:bg-blue-700'>
              <Plus className='w-4 h-4 mr-2' />
              Nouvelle Promotion
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-md'>
            <DialogHeader>
              <DialogTitle>
                {editingPromotion ? 'Modifier la Promotion' : 'Nouvelle Promotion'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className='space-y-4'>
              {!editingPromotion && (
                <div>
                  <Label htmlFor='product'>Hébergement</Label>
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder='Sélectionner un hébergement' />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProducts.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {product.address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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

              <div className='flex items-center space-x-2'>
                <input
                  id='active'
                  type='checkbox'
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                />
                <Label htmlFor='active'>Promotion active</Label>
              </div>

              <div className='flex justify-end space-x-2 pt-4'>
                <Button type='button' variant='outline' onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type='submit'>{editingPromotion ? 'Mettre à jour' : 'Créer'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center'>
              <Star className='h-8 w-8 text-yellow-500' />
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600'>Promotions actives</p>
                <p className='text-2xl font-bold'>
                  {promotedProducts.filter(p => isCurrentlyActive(p)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center'>
              <CalendarIcon className='h-8 w-8 text-blue-500' />
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600'>Total promotions</p>
                <p className='text-2xl font-bold'>{promotedProducts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center'>
              <Eye className='h-8 w-8 text-green-500' />
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600'>Hébergements disponibles</p>
                <p className='text-2xl font-bold'>{availableProducts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des promotions */}
      <div className='grid gap-6'>
        {promotedProducts.map(promotion => (
          <Card key={promotion.id} className='overflow-hidden'>
            <CardContent className='p-0'>
              <div className='flex flex-col md:flex-row'>
                {/* Image */}
                <div className='md:w-48 h-48 md:h-auto relative'>
                  {promotion.product.img?.[0] ? (
                    <Image
                      src={promotion.product.img[0].img}
                      alt={promotion.product.name}
                      fill
                      className='object-cover'
                    />
                  ) : (
                    <div className='w-full h-full bg-gray-200 flex items-center justify-center'>
                      <span className='text-gray-400'>Pas d&apos;image</span>
                    </div>
                  )}
                </div>

                {/* Contenu */}
                <div className='flex-1 p-6'>
                  <div className='flex justify-between items-start'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-3 mb-2'>
                        <h3 className='text-xl font-semibold'>{promotion.product.name}</h3>
                        {isCurrentlyActive(promotion) && (
                          <Badge className='bg-green-100 text-green-800'>
                            <Star className='w-3 h-3 mr-1' />
                            En cours
                          </Badge>
                        )}
                        {!promotion.active && <Badge variant='secondary'>Inactif</Badge>}
                      </div>

                      <p className='text-gray-600 mb-2'>{promotion.product.address}</p>
                      <p className='text-lg font-medium text-blue-600 mb-3'>
                        {promotion.product.basePrice}€/nuit
                      </p>

                      <div className='grid grid-cols-2 gap-4 text-sm'>
                        <div>
                          <span className='font-medium'>Début:</span>
                          <br />
                          {format(new Date(promotion.start), 'dd MMM yyyy HH:mm', { locale: fr })}
                        </div>
                        <div>
                          <span className='font-medium'>Fin:</span>
                          <br />
                          {format(new Date(promotion.end), 'dd MMM yyyy HH:mm', { locale: fr })}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className='flex flex-col gap-2 ml-4'>
                      <Link href={`/host/${promotion.product.id}`}>
                        <Button variant='outline' size='sm' className='w-full'>
                          <Eye className='w-4 h-4 mr-1' />
                          Voir
                        </Button>
                      </Link>
                      <Button variant='outline' size='sm' onClick={() => handleEdit(promotion)}>
                        <Edit className='w-4 h-4 mr-1' />
                        Modifier
                      </Button>
                      <Button
                        variant='destructive'
                        size='sm'
                        onClick={() => handleDelete(promotion.id)}
                      >
                        <Trash2 className='w-4 h-4 mr-1' />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {promotedProducts.length === 0 && (
          <Card>
            <CardContent className='p-12 text-center'>
              <Star className='w-12 h-12 text-gray-400 mx-auto mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                Aucune promotion configurée
              </h3>
              <p className='text-gray-600 mb-4'>
                Commencez par créer votre première promotion d&apos;hébergement
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className='w-4 h-4 mr-2' />
                Nouvelle Promotion
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
