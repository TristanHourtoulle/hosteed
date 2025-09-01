'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/shadcnui/button'
import { Input } from '@/components/ui/input'
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
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ExtraPriceType } from '@prisma/client'

interface ProductExtra {
  id: string
  name: string
  description: string | null
  priceEUR: number
  priceMGA: number
  type: ExtraPriceType
  userId: string | null
}

interface CreateExtraModalProps {
  isOpen: boolean
  onClose: () => void
  onExtraCreated: (extra: ProductExtra) => void
}

const PRICE_TYPE_LABELS: Record<ExtraPriceType, string> = {
  PER_DAY: 'Par jour',
  PER_PERSON: 'Par personne',
  PER_DAY_PERSON: 'Par jour et par personne',
  PER_BOOKING: 'Par réservation'
}

export default function CreateExtraModal({
  isOpen,
  onClose,
  onExtraCreated,
}: CreateExtraModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priceEUR: '',
    priceMGA: '',
    type: '' as ExtraPriceType | '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.priceEUR || !formData.priceMGA || !formData.type) {
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

    setLoading(true)

    try {
      const response = await fetch('/api/user/extras', {
        method: 'POST',
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
        const newExtra = await response.json()
        toast.success('Extra personnalisé créé avec succès')
        onExtraCreated(newExtra)
        setFormData({ name: '', description: '', priceEUR: '', priceMGA: '', type: '' })
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Une erreur est survenue')
      }
    } catch {
      toast.error('Erreur lors de la création de l&apos;extra')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({ name: '', description: '', priceEUR: '', priceMGA: '', type: '' })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un extra personnalisé</DialogTitle>
          <DialogDescription>
            Créez une option payante spécifique à votre hébergement
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l&apos;extra *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Petit déjeuner maison"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description détaillée (optionnel)"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priceEUR">Prix EUR *</Label>
                <Input
                  id="priceEUR"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.priceEUR}
                  onChange={(e) => setFormData({ ...formData, priceEUR: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceMGA">Prix MGA *</Label>
                <Input
                  id="priceMGA"
                  type="number"
                  step="1"
                  min="0"
                  value={formData.priceMGA}
                  onChange={(e) => setFormData({ ...formData, priceMGA: e.target.value })}
                  placeholder="0"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type de tarification *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: ExtraPriceType) => setFormData({ ...formData, type: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
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
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer l&apos;extra'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}