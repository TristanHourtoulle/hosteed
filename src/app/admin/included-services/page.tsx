'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CACHE_TAGS } from '@/lib/cache/query-client'
import { useMutationWithCache } from '@/hooks/useMutationWithCache'
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
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/shadcnui/badge'
import { Plus, Edit, Trash2, Package } from 'lucide-react'
import { toast } from 'sonner'

interface IncludedService {
  id: string
  name: string
  description: string | null
  icon: string | null
  createdAt: string
  updatedAt: string
  _count: {
    products: number
  }
}

interface ServiceFormData {
  name: string
  description: string
  icon: string
}

async function fetchServices(): Promise<IncludedService[]> {
  const response = await fetch('/api/admin/included-services', {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
    },
  })
  if (!response.ok) {
    throw new Error('Erreur lors du chargement des services')
  }
  return response.json()
}

export default function IncludedServicesPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<IncludedService | null>(null)
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    icon: '',
  })

  const {
    data: services = [],
    isLoading: loading,
    isError,
  } = useQuery({
    queryKey: CACHE_TAGS.adminIncludedServices(),
    queryFn: fetchServices,
  })

  useEffect(() => {
    if (isError) {
      toast.error('Erreur lors du chargement des services')
    }
  }, [isError])

  const resetForm = () => {
    setFormData({ name: '', description: '', icon: '' })
    setEditingService(null)
  }

  const saveService = useMutationWithCache<unknown, { id?: string; body: ServiceFormData }>({
    mutationFn: async ({ id, body }) => {
      const url = id ? `/api/admin/included-services/${id}` : '/api/admin/included-services'
      const method = id ? 'PUT' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Une erreur est survenue')
      }
      return response.json().catch(() => null)
    },
    invalidateKeys: [CACHE_TAGS.adminIncludedServices()],
    onSuccess: (_data, variables) => {
      toast.success(variables.id ? 'Service mis à jour avec succès' : 'Service créé avec succès')
      setDialogOpen(false)
      resetForm()
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde')
    },
  })

  const deleteService = useMutationWithCache<unknown, string>({
    mutationFn: async id => {
      const response = await fetch(`/api/admin/included-services/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Erreur lors de la suppression')
      }
      return response.json().catch(() => null)
    },
    invalidateKeys: [CACHE_TAGS.adminIncludedServices()],
    successMessage: 'Service supprimé avec succès',
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Le nom du service est requis')
      return
    }

    saveService.mutate({ id: editingService?.id, body: formData })
  }

  const handleEdit = (service: IncludedService) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      description: service.description || '',
      icon: service.icon || '',
    })
    setDialogOpen(true)
  }

  const handleDelete = (service: IncludedService) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) {
      return
    }

    deleteService.mutate(service.id)
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
          <h1 className='text-3xl font-bold text-gray-900'>Services inclus</h1>
          <p className='text-gray-600 mt-2'>
            Gérez les services inclus disponibles pour les hébergements
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className='w-4 h-4 mr-2' />
              Ajouter un service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingService ? 'Modifier le service' : 'Ajouter un service inclus'}
              </DialogTitle>
              <DialogDescription>
                {editingService
                  ? 'Modifiez les informations du service inclus'
                  : 'Créez un nouveau service inclus pour les hébergements'}
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
                    placeholder='Ex: Service de ménage'
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
                    placeholder='Description du service (optionnel)'
                  />
                </div>
                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label htmlFor='icon' className='text-right'>
                    Icône
                  </Label>
                  <Input
                    id='icon'
                    value={formData.icon}
                    onChange={e => setFormData({ ...formData, icon: e.target.value })}
                    className='col-span-3'
                    placeholder="Nom de l'icône Lucide (optionnel)"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type='submit' disabled={saveService.isPending}>
                  {editingService ? 'Mettre à jour' : 'Créer'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {services.map(service => (
          <Card key={service.id}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <div className='flex items-center space-x-2'>
                <Package className='w-5 h-5 text-blue-600' />
                <CardTitle className='text-lg'>{service.name}</CardTitle>
              </div>
              <div className='flex space-x-1'>
                <Button variant='ghost' size='sm' onClick={() => handleEdit(service)}>
                  <Edit className='w-4 h-4' />
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => handleDelete(service)}
                  className='text-red-600 hover:text-red-800'
                >
                  <Trash2 className='w-4 h-4' />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {service.description && (
                <CardDescription className='mb-3'>{service.description}</CardDescription>
              )}
              <div className='flex items-center justify-between'>
                <Badge variant='secondary'>
                  {service._count.products} produit{service._count.products !== 1 ? 's' : ''}
                </Badge>
                {service.icon && <Badge variant='outline'>Icône: {service.icon}</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {services.length === 0 && (
        <div className='text-center py-12'>
          <Package className='w-12 h-12 text-gray-400 mx-auto mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>Aucun service inclus</h3>
          <p className='text-gray-500 mb-4'>Commencez par créer votre premier service inclus</p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className='w-4 h-4 mr-2' />
            Ajouter un service
          </Button>
        </div>
      )}
    </div>
  )
}
