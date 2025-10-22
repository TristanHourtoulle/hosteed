'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { isFullAdmin } from '@/hooks/useAdminAuth'
import { Button } from '@/components/ui/shadcnui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcnui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/shadcnui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcnui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcnui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcnui/table'
import { Textarea } from '@/components/ui/textarea'
import { Percent, DollarSign, Save, Plus, Edit2, Trash2, Power, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, formatPercentage } from '@/lib/utils/formatNumber'

interface PropertyType {
  id: string
  name: string
  description: string
}

interface Commission {
  id: string
  title: string
  description: string | null
  hostCommissionRate: number
  hostCommissionFixed: number
  clientCommissionRate: number
  clientCommissionFixed: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  typeRent: PropertyType
}

interface FormData {
  title: string
  description: string
  hostCommissionRate: string
  hostCommissionFixed: string
  clientCommissionRate: string
  clientCommissionFixed: string
  typeRentId: string
  isActive: boolean
}

export default function CommissionsPage() {
  const {
    session,
    isLoading: isAuthLoading,
    isAuthenticated,
  } = useAuth({ required: true, redirectTo: '/auth' })
  const router = useRouter()
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [unassignedTypes, setUnassignedTypes] = useState<PropertyType[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCommission, setEditingCommission] = useState<Commission | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    hostCommissionRate: '0',
    hostCommissionFixed: '0',
    clientCommissionRate: '0',
    clientCommissionFixed: '0',
    typeRentId: '',
    isActive: true,
  })

  // Security check - Only ADMIN can access commission settings
  useEffect(() => {
    if (isAuthenticated && (!session?.user?.roles || !isFullAdmin(session.user.roles))) {
      router.push('/')
    }
  }, [isAuthenticated, session, router])

  useEffect(() => {
    fetchCommissions()
  }, [])

  const fetchCommissions = async () => {
    try {
      const response = await fetch('/api/admin/commissions?includeUnassigned=true', {
        cache: 'no-store', // Force fresh data
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Fetched commissions:', data.commissions.length)
        setCommissions([...data.commissions]) // Force new array reference
        setUnassignedTypes(data.unassignedTypes || [])
      } else {
        toast.error('Erreur lors du chargement des commissions')
      }
    } catch (error) {
      console.error('Error fetching commissions:', error)
      toast.error('Erreur lors du chargement des commissions')
    } finally {
      setLoading(false)
    }
  }

  const openCreateDialog = () => {
    setEditingCommission(null)
    setFormData({
      title: '',
      description: '',
      hostCommissionRate: '0',
      hostCommissionFixed: '0',
      clientCommissionRate: '0',
      clientCommissionFixed: '0',
      typeRentId: '',
      isActive: true,
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (commission: Commission) => {
    setEditingCommission(commission)
    setFormData({
      title: commission.title,
      description: commission.description || '',
      hostCommissionRate: (commission.hostCommissionRate * 100).toString(),
      hostCommissionFixed: commission.hostCommissionFixed.toString(),
      clientCommissionRate: (commission.clientCommissionRate * 100).toString(),
      clientCommissionFixed: commission.clientCommissionFixed.toString(),
      typeRentId: commission.typeRent.id,
      isActive: commission.isActive,
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const hostRate = parseFloat(formData.hostCommissionRate) / 100
    const clientRate = parseFloat(formData.clientCommissionRate) / 100
    const hostFixed = parseFloat(formData.hostCommissionFixed)
    const clientFixed = parseFloat(formData.clientCommissionFixed)

    if (
      isNaN(hostRate) ||
      hostRate < 0 ||
      hostRate > 1 ||
      isNaN(clientRate) ||
      clientRate < 0 ||
      clientRate > 1 ||
      isNaN(hostFixed) ||
      hostFixed < 0 ||
      isNaN(clientFixed) ||
      clientFixed < 0
    ) {
      toast.error('Les taux doivent être entre 0 et 100% et les frais fixes positifs')
      return
    }

    if (!formData.title.trim()) {
      toast.error('Le titre est requis')
      return
    }

    if (!formData.typeRentId) {
      toast.error('Le type de logement est requis')
      return
    }

    setSaving(true)
    try {
      const url = editingCommission
        ? `/api/admin/commissions/${editingCommission.id}`
        : '/api/admin/commissions'

      const method = editingCommission ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          hostCommissionRate: hostRate,
          hostCommissionFixed: hostFixed,
          clientCommissionRate: clientRate,
          clientCommissionFixed: clientFixed,
          typeRentId: formData.typeRentId,
          isActive: formData.isActive,
        }),
      })

      if (response.ok) {
        toast.success(
          editingCommission ? 'Commission mise à jour avec succès' : 'Commission créée avec succès'
        )
        setIsDialogOpen(false)
        fetchCommissions()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Une erreur est survenue')
      }
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette commission ?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/commissions/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Commission supprimée avec succès')
        fetchCommissions()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Une erreur est survenue')
      }
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleToggleStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/commissions/${id}`, {
        method: 'PATCH',
      })

      if (response.ok) {
        toast.success('Statut mis à jour')
        fetchCommissions()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Une erreur est survenue')
      }
    } catch {
      toast.error('Erreur lors de la mise à jour')
    }
  }


  if (isAuthLoading || loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='flex flex-col items-center gap-4'>
          <div className='w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin'></div>
          <p className='text-slate-600 text-lg'>Chargement...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Gestion des Commissions</h1>
          <p className='text-gray-600 mt-2'>Configurez les commissions par type de logement</p>
        </div>
        <Button onClick={openCreateDialog} disabled={unassignedTypes.length === 0}>
          <Plus className='w-4 h-4 mr-2' />
          Nouvelle Commission
        </Button>
      </div>

      {unassignedTypes.length > 0 && (
        <Card className='mb-6 border-yellow-200 bg-yellow-50'>
          <CardHeader>
            <CardTitle className='text-yellow-800'>Types sans commission</CardTitle>
            <CardDescription>
              Les types de logement suivants n'ont pas encore de commission configurée
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex flex-wrap gap-2'>
              {unassignedTypes.map(type => (
                <Badge key={type.id} variant='secondary'>
                  {type.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type de logement</TableHead>
              <TableHead>Titre</TableHead>
              <TableHead>Commission Hôte</TableHead>
              <TableHead>Commission Client</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {commissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className='text-center text-gray-500 py-8'>
                  Aucune commission configurée
                </TableCell>
              </TableRow>
            ) : (
              commissions.map(commission => (
                <TableRow key={`${commission.id}-${commission.updatedAt}`}>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <Building2 className='w-4 h-4 text-gray-500' />
                      <span className='font-medium'>{commission.typeRent.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className='font-medium'>{commission.title}</div>
                      {commission.description && (
                        <div className='text-sm text-gray-500 truncate max-w-xs'>
                          {commission.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='space-y-1'>
                      <div className='flex items-center gap-1'>
                        <Percent className='w-3 h-3 text-gray-400' />
                        <span>{formatPercentage(commission.hostCommissionRate, 1)}</span>
                      </div>
                      <div className='flex items-center gap-1'>
                        <DollarSign className='w-3 h-3 text-gray-400' />
                        <span>{formatCurrency(commission.hostCommissionFixed)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='space-y-1'>
                      <div className='flex items-center gap-1'>
                        <Percent className='w-3 h-3 text-gray-400' />
                        <span>{formatPercentage(commission.clientCommissionRate, 1)}</span>
                      </div>
                      <div className='flex items-center gap-1'>
                        <DollarSign className='w-3 h-3 text-gray-400' />
                        <span>{formatCurrency(commission.clientCommissionFixed)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={commission.isActive ? 'default' : 'secondary'}>
                      {commission.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex items-center justify-end gap-2'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleToggleStatus(commission.id)}
                        title={commission.isActive ? 'Désactiver' : 'Activer'}
                      >
                        <Power className='w-4 h-4' />
                      </Button>
                      <Button variant='ghost' size='sm' onClick={() => openEditDialog(commission)}>
                        <Edit2 className='w-4 h-4' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleDelete(commission.id)}
                        className='text-red-600 hover:text-red-700'
                      >
                        <Trash2 className='w-4 h-4' />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              {editingCommission ? 'Modifier la Commission' : 'Nouvelle Commission'}
            </DialogTitle>
            <DialogDescription>
              Configurez les taux de commission pour ce type de logement
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className='space-y-4'>
              <div>
                <Label htmlFor='typeRentId'>Type de logement *</Label>
                <Select
                  value={formData.typeRentId}
                  onValueChange={value => setFormData({ ...formData, typeRentId: value })}
                  disabled={!!editingCommission}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Sélectionnez un type' />
                  </SelectTrigger>
                  <SelectContent>
                    {editingCommission ? (
                      <SelectItem value={editingCommission.typeRent.id}>
                        {editingCommission.typeRent.name}
                      </SelectItem>
                    ) : (
                      unassignedTypes.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor='title'>Titre *</Label>
                <Input
                  id='title'
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder='Ex: Commission Appartement Standard'
                  required
                />
              </div>

              <div>
                <Label htmlFor='description'>Description</Label>
                <Textarea
                  id='description'
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder='Description optionnelle...'
                  rows={3}
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <Card>
                  <CardHeader>
                    <CardTitle className='text-lg'>Commission Hôte</CardTitle>
                    <CardDescription>Déduite du prix de base</CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div>
                      <Label htmlFor='hostCommissionRate'>Taux (%)</Label>
                      <Input
                        id='hostCommissionRate'
                        type='number'
                        step='0.1'
                        min='0'
                        max='100'
                        value={formData.hostCommissionRate}
                        onChange={e =>
                          setFormData({ ...formData, hostCommissionRate: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor='hostCommissionFixed'>Frais fixes (€)</Label>
                      <Input
                        id='hostCommissionFixed'
                        type='number'
                        step='0.01'
                        min='0'
                        value={formData.hostCommissionFixed}
                        onChange={e =>
                          setFormData({ ...formData, hostCommissionFixed: e.target.value })
                        }
                        required
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className='text-lg'>Commission Client</CardTitle>
                    <CardDescription>Ajoutée au prix de base</CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div>
                      <Label htmlFor='clientCommissionRate'>Taux (%)</Label>
                      <Input
                        id='clientCommissionRate'
                        type='number'
                        step='0.1'
                        min='0'
                        max='100'
                        value={formData.clientCommissionRate}
                        onChange={e =>
                          setFormData({ ...formData, clientCommissionRate: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor='clientCommissionFixed'>Frais fixes (€)</Label>
                      <Input
                        id='clientCommissionFixed'
                        type='number'
                        step='0.01'
                        min='0'
                        value={formData.clientCommissionFixed}
                        onChange={e =>
                          setFormData({ ...formData, clientCommissionFixed: e.target.value })
                        }
                        required
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <DialogFooter className='mt-6'>
              <Button type='button' variant='outline' onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button type='submit' disabled={saving}>
                <Save className='w-4 h-4 mr-2' />
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
