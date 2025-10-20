'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/shadcnui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcnui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/shadcnui/badge'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ExtraPriceType } from '@prisma/client'

interface ProductExtra {
  id: string
  name: string
  description: string | null
  priceEUR: number
  priceMGA: number
  type: ExtraPriceType
  createdAt: string
  updatedAt: string
  _count: {
    products: number
  }
}

const PRICE_TYPE_LABELS: Record<ExtraPriceType, string> = {
  PER_DAY: 'Par jour',
  PER_PERSON: 'Par personne',
  PER_DAY_PERSON: 'Par jour et par personne',
  PER_BOOKING: 'Par réservation',
}

export default function ExtrasPage() {
  const [extras, setExtras] = useState<ProductExtra[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingExtra, setEditingExtra] = useState<ProductExtra | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priceEUR: '',
    priceMGA: '',
    type: '' as ExtraPriceType | '',
  })

  useEffect(() => {
    fetchExtras()
  }, [])

  const fetchExtras = async () => {
    try {
      const response = await fetch('/api/admin/extras', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setExtras(data)
      } else {
        toast.error('Erreur lors du chargement des extras')
      }
    } catch {
      toast.error('Erreur lors du chargement des extras')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.priceEUR || !formData.priceMGA || !formData.type) {
      toast.error('Tous les champs obligatoires doivent être renseignés')
      return
    }

    // Validation des prix
    const priceEUR = parseFloat(formData.priceEUR)
    const priceMGA = parseFloat(formData.priceMGA)

    if (isNaN(priceEUR) || priceEUR < 0) {
      toast.error('Le prix en EUR doit être un nombre positif')
      return
    }

    if (isNaN(priceMGA) || priceMGA < 0) {
      toast.error('Le prix en MGA doit être un nombre positif')
      return
    }

    try {
      const url = editingExtra ? `/api/admin/extras/${editingExtra.id}` : '/api/admin/extras'

      const method = editingExtra ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          priceEUR,
          priceMGA,
        }),
      })

      if (response.ok) {
        toast.success(editingExtra ? 'Extra mis à jour avec succès' : 'Extra créé avec succès')
        setDialogOpen(false)
        resetForm()
        fetchExtras()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Une erreur est survenue')
      }
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleEdit = (extra: ProductExtra) => {
    setEditingExtra(extra)
    setFormData({
      name: extra.name,
      description: extra.description || '',
      priceEUR: extra.priceEUR.toString(),
      priceMGA: extra.priceMGA.toString(),
      type: extra.type,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (extra: ProductExtra) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet extra ?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/extras/${extra.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Extra supprimé avec succès')
        fetchExtras()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la suppression')
      }
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const resetForm = () => {
    setFormData({ name: '', description: '', priceEUR: '', priceMGA: '', type: '' })
    setEditingExtra(null)
  }

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      resetForm()
    }
  }

  if (loading) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
        </div>
      </div>
    )
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Extras</h1>
          <p className='text-gray-600 mt-2'>
            Gérez les options payantes disponibles pour les hébergements
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className='w-4 h-4 mr-2' />
              Ajouter un extra
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-md'>
            <DialogHeader>
              <DialogTitle>{editingExtra ? "Modifier l'extra" : 'Ajouter un extra'}</DialogTitle>
              <DialogDescription>
                {editingExtra
                  ? "Modifiez les informations de l'extra"
                  : 'Créez un nouvel extra payant pour les hébergements'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className='grid gap-4 py-4'>
                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label htmlFor='name' className='text-right'>
                    Nom *
                  </Label>
                  <Input
                    id='name'
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className='col-span-3'
                    placeholder='Ex: Petit déjeuner'
                    required
                  />
                </div>
                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label htmlFor='description' className='text-right'>
                    Description
                  </Label>
                  <Input
                    id='description'
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className='col-span-3'
                    placeholder="Description de l'extra (optionnel)"
                  />
                </div>
                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label htmlFor='priceEUR' className='text-right'>
                    Prix EUR *
                  </Label>
                  <Input
                    id='priceEUR'
                    type='number'
                    step='0.01'
                    min='0'
                    value={formData.priceEUR}
                    onChange={e => setFormData({ ...formData, priceEUR: e.target.value })}
                    className='col-span-3'
                    placeholder='0.00'
                    required
                  />
                </div>
                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label htmlFor='priceMGA' className='text-right'>
                    Prix MGA *
                  </Label>
                  <Input
                    id='priceMGA'
                    type='number'
                    step='1'
                    min='0'
                    value={formData.priceMGA}
                    onChange={e => setFormData({ ...formData, priceMGA: e.target.value })}
                    className='col-span-3'
                    placeholder='0'
                    required
                  />
                </div>
                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label htmlFor='type' className='text-right'>
                    Type *
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: ExtraPriceType) =>
                      setFormData({ ...formData, type: value })
                    }
                    required
                  >
                    <SelectTrigger className='col-span-3'>
                      <SelectValue placeholder='Sélectionner un type' />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRICE_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type='submit'>{editingExtra ? 'Mettre à jour' : 'Créer'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {extras.map(extra => (
          <Card key={extra.id}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <div className='flex items-center space-x-2'>
                <Plus className='w-5 h-5 text-green-600' />
                <CardTitle className='text-lg'>{extra.name}</CardTitle>
              </div>
              <div className='flex space-x-1'>
                <Button variant='ghost' size='sm' onClick={() => handleEdit(extra)}>
                  <Edit className='w-4 h-4' />
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => handleDelete(extra)}
                  className='text-red-600 hover:text-red-800'
                >
                  <Trash2 className='w-4 h-4' />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {extra.description && (
                <CardDescription className='mb-3'>{extra.description}</CardDescription>
              )}
              <div className='space-y-2 mb-3'>
                <div className='flex justify-between text-sm'>
                  <span className='font-medium'>Prix EUR:</span>
                  <span>{extra.priceEUR.toFixed(2)} €</span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='font-medium'>Prix MGA:</span>
                  <span>{extra.priceMGA.toLocaleString()} Ar</span>
                </div>
              </div>
              <div className='flex items-center justify-between'>
                <Badge variant='secondary'>
                  {extra._count.products} produit{extra._count.products !== 1 ? 's' : ''}
                </Badge>
                <Badge variant='outline'>{PRICE_TYPE_LABELS[extra.type]}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {extras.length === 0 && (
        <div className='text-center py-12'>
          <Plus className='w-12 h-12 text-gray-400 mx-auto mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>Aucun extra</h3>
          <p className='text-gray-500 mb-4'>Commencez par créer votre premier extra payant</p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className='w-4 h-4 mr-2' />
            Ajouter un extra
          </Button>
        </div>
      )}
    </div>
  )
}
