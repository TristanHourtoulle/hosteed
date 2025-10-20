'use client'

import { useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcnui/dialog'
import { Button } from '@/components/ui/shadcnui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
}

interface UnavailabilityModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: UnavailabilityData) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  selectedDate?: Date
  existingUnavailability?: {
    id: string
    title: string
    description: string | null
    startDate: Date
    endDate: Date
    productId?: string
  } | null
  mode: 'create' | 'edit'
  preselectedPropertyId?: string | null
}

export interface UnavailabilityData {
  startDate: Date
  endDate: Date
  title: string
  description: string
  productId: string
}

export default function UnavailabilityModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  selectedDate,
  existingUnavailability,
  mode,
  preselectedPropertyId,
}: UnavailabilityModalProps) {
  const [formData, setFormData] = useState<UnavailabilityData>({
    startDate: selectedDate || new Date(),
    endDate: selectedDate || new Date(),
    title: '',
    description: '',
    productId: preselectedPropertyId || '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  // Charger la liste des produits de l'hôte
  useEffect(() => {
    const fetchProducts = async () => {
      if (!isOpen) return

      setLoadingProducts(true)
      try {
        const response = await fetch('/api/host/products?limit=50')
        if (response.ok) {
          const data = await response.json()
          setProducts(data.products || [])
        } else {
          toast.error('Erreur lors du chargement des propriétés')
        }
      } catch (error) {
        console.error('Erreur chargement produits:', error)
        toast.error('Erreur lors du chargement des propriétés')
      } finally {
        setLoadingProducts(false)
      }
    }

    fetchProducts()
  }, [isOpen])

  useEffect(() => {
    if (mode === 'edit' && existingUnavailability) {
      setFormData({
        startDate: existingUnavailability.startDate,
        endDate: existingUnavailability.endDate,
        title: existingUnavailability.title,
        description: existingUnavailability.description || '',
        productId: existingUnavailability.productId || preselectedPropertyId || '',
      })
    } else if (mode === 'create' && selectedDate) {
      setFormData({
        startDate: selectedDate,
        endDate: selectedDate,
        title: '',
        description: '',
        productId: preselectedPropertyId || '',
      })
    }
  }, [mode, existingUnavailability, selectedDate, preselectedPropertyId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.productId) {
      setError('Veuillez sélectionner une propriété')
      return
    }

    if (!formData.title.trim()) {
      setError('Le titre est obligatoire')
      return
    }

    if (formData.endDate < formData.startDate) {
      setError('La date de fin doit être après la date de début')
      return
    }

    setIsSubmitting(true)
    try {
      await onSave(formData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!existingUnavailability?.id || !onDelete) return

    if (!confirm('Êtes-vous sûr de vouloir supprimer ce blocage ?')) return

    setIsDeleting(true)
    try {
      await onDelete(existingUnavailability.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Bloquer des dates' : 'Modifier le blocage'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Créez un blocage pour rendre votre propriété indisponible pendant une période.'
              : 'Modifiez les informations de ce blocage.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className='grid gap-4 py-4'>
            {error && (
              <div className='bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm'>
                {error}
              </div>
            )}

            {/* Sélecteur de propriété */}
            <div className='space-y-2'>
              <Label htmlFor='property'>
                Propriété <span className='text-red-500'>*</span>
              </Label>
              {loadingProducts ? (
                <div className='flex items-center justify-center py-2 text-sm text-gray-500'>
                  Chargement des propriétés...
                </div>
              ) : (
                <select
                  id='property'
                  value={formData.productId}
                  onChange={e => setFormData({ ...formData, productId: e.target.value })}
                  className='flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50'
                  disabled={mode === 'edit'}
                  required
                >
                  <option value=''>Sélectionnez une propriété</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              )}
              {mode === 'edit' && (
                <p className='text-xs text-gray-500'>
                  La propriété ne peut pas être modifiée après création
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='title'>
                Titre <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='title'
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder='Ex: Travaux de rénovation'
                required
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='description'>
                Description <span className='text-gray-500 text-xs'>(optionnel)</span>
              </Label>
              <textarea
                id='description'
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className='flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]'
                placeholder='Détails supplémentaires...'
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='startDate'>Date de début</Label>
                <Input
                  id='startDate'
                  type='date'
                  value={formData.startDate.toISOString().split('T')[0]}
                  onChange={e => setFormData({ ...formData, startDate: new Date(e.target.value) })}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='endDate'>Date de fin</Label>
                <Input
                  id='endDate'
                  type='date'
                  value={formData.endDate.toISOString().split('T')[0]}
                  onChange={e => setFormData({ ...formData, endDate: new Date(e.target.value) })}
                  min={formData.startDate.toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>
          </div>

          <DialogFooter className='flex items-center justify-between sm:justify-between'>
            {mode === 'edit' && onDelete ? (
              <Button
                type='button'
                variant='destructive'
                onClick={handleDelete}
                disabled={isDeleting}
                className='mr-auto'
              >
                <Trash2 className='w-4 h-4 mr-2' />
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </Button>
            ) : (
              <div />
            )}
            <div className='flex items-center gap-2'>
              <Button type='button' variant='outline' onClick={onClose}>
                Annuler
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Enregistrement...' : mode === 'create' ? 'Créer' : 'Modifier'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
