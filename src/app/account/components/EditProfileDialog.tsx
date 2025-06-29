'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Button,
  Input,
  Label,
} from '@/components/ui/shadcnui'
import { Edit2 } from 'lucide-react'
import { toast } from 'sonner'

interface EditProfileDialogProps {
  user: {
    name: string | null
    lastname: string | null
    email: string
  }
  onSave: (data: { name: string; lastname: string }) => Promise<void>
}

export function EditProfileDialog({ user, onSave }: EditProfileDialogProps) {
  const [name, setName] = useState(user.name || '')
  const [lastname, setLastname] = useState(user.lastname || '')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await onSave({ name, lastname })
      toast.success('Profil mis à jour avec succès')
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du profil')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='outline' className='gap-2'>
          <Edit2 className='w-4 h-4' />
          Modifier
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Modifier le profil</DialogTitle>
          <DialogDescription>
            Modifiez vos informations personnelles. Cliquez sur enregistrer une fois terminé.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4 mt-4'>
          <div className='space-y-2'>
            <Label htmlFor='name'>Prénom</Label>
            <Input
              id='name'
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder='Votre prénom'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='lastname'>Nom</Label>
            <Input
              id='lastname'
              value={lastname}
              onChange={e => setLastname(e.target.value)}
              placeholder='Votre nom'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='email'>Email</Label>
            <Input id='email' value={user.email} disabled type='email' />
          </div>
          <div className='flex justify-end gap-3'>
            <DialogTrigger asChild>
              <Button variant='outline' type='button'>
                Annuler
              </Button>
            </DialogTrigger>
            <Button type='submit' disabled={isLoading}>
              {isLoading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
