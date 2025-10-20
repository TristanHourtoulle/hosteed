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
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface IncludedService {
  id: string
  name: string
  description: string | null
  icon: string | null
  userId: string | null
}

interface CreateServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onServiceCreated: (service: IncludedService) => void
  title: string
  description: string
}

export default function CreateServiceModal({
  isOpen,
  onClose,
  onServiceCreated,
  title,
  description,
}: CreateServiceModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Le nom du service est requis')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/user/included-services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const newService = await response.json()
        toast.success('Service personnalisé créé avec succès')
        onServiceCreated(newService)
        setFormData({ name: '', description: '', icon: '' })
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Une erreur est survenue')
      }
    } catch {
      toast.error('Erreur lors de la création du service')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({ name: '', description: '', icon: '' })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className='grid gap-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Nom du service *</Label>
              <Input
                id='name'
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder='Ex: Nettoyage de ma piscine privée'
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='description'>Description</Label>
              <Input
                id='description'
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder='Description détaillée (optionnel)'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='icon'>Icône</Label>
              <Input
                id='icon'
                value={formData.icon}
                onChange={e => setFormData({ ...formData, icon: e.target.value })}
                placeholder="Nom de l'icône Lucide (optionnel)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={handleClose}>
              Annuler
            </Button>
            <Button type='submit' disabled={loading}>
              {loading ? 'Création...' : 'Créer le service'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
