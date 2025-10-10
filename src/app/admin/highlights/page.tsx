'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/shadcnui/button'
import { Input } from '@/components/ui/input'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
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
import { Plus, Edit, Trash2, Highlighter } from 'lucide-react'
import { toast } from 'sonner'

interface PropertyHighlight {
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

export default function HighlightsPage() {
  const [highlights, setHighlights] = useState<PropertyHighlight[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingHighlight, setEditingHighlight] = useState<PropertyHighlight | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
  })

  useEffect(() => {
    fetchHighlights()
  }, [])

  const fetchHighlights = async () => {
    try {
      const response = await fetch('/api/admin/highlights', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setHighlights(data)
      } else {
        toast.error('Erreur lors du chargement des points forts')
      }
    } catch {
      toast.error('Erreur lors du chargement des points forts')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Le nom du point fort est requis')
      return
    }

    try {
      const url = editingHighlight 
        ? `/api/admin/highlights/${editingHighlight.id}`
        : '/api/admin/highlights'
      
      const method = editingHighlight ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success(
          editingHighlight 
            ? 'Point fort mis à jour avec succès' 
            : 'Point fort créé avec succès'
        )
        setDialogOpen(false)
        resetForm()
        fetchHighlights()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Une erreur est survenue')
      }
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleEdit = (highlight: PropertyHighlight) => {
    setEditingHighlight(highlight)
    setFormData({
      name: highlight.name,
      description: highlight.description || '',
      icon: highlight.icon || '',
    })
    setDialogOpen(true)
  }

  const handleDelete = async (highlight: PropertyHighlight) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce point fort ?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/highlights/${highlight.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Point fort supprimé avec succès')
        fetchHighlights()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la suppression')
      }
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const resetForm = () => {
    setFormData({ name: '', description: '', icon: '' })
    setEditingHighlight(null)
  }

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      resetForm()
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Points forts</h1>
          <p className="text-gray-600 mt-2">
            Gérez les points forts disponibles pour valoriser les hébergements
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un point fort
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingHighlight ? 'Modifier le point fort' : 'Ajouter un point fort'}
              </DialogTitle>
              <DialogDescription>
                {editingHighlight 
                  ? 'Modifiez les informations du point fort'
                  : 'Créez un nouveau point fort pour valoriser les hébergements'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nom *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="col-span-3"
                    placeholder="Ex: Spa, Massage, Piscine"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="col-span-3"
                    placeholder="Description du point fort (optionnel)"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="icon" className="text-right">
                    Icône
                  </Label>
                  <Input
                    id="icon"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="col-span-3"
                    placeholder="Nom de l'icône Lucide (optionnel)"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">
                  {editingHighlight ? 'Mettre à jour' : 'Créer'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {highlights.map((highlight) => (
          <Card key={highlight.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                <Highlighter className="w-5 h-5 text-yellow-600" />
                <CardTitle className="text-lg">{highlight.name}</CardTitle>
              </div>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(highlight)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(highlight)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {highlight.description && (
                <CardDescription className="mb-3">
                  {highlight.description}
                </CardDescription>
              )}
              <div className="flex items-center justify-between">
                <Badge variant="secondary">
                  {highlight._count.products} produit{highlight._count.products !== 1 ? 's' : ''}
                </Badge>
                {highlight.icon && (
                  <Badge variant="outline">
                    Icône: {highlight.icon}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {highlights.length === 0 && (
        <div className="text-center py-12">
          <Highlighter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun point fort
          </h3>
          <p className="text-gray-500 mb-4">
            Commencez par créer votre premier point fort
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un point fort
          </Button>
        </div>
      )}
    </div>
  )
}