'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcnui'
import { Button } from '@/components/ui/shadcnui/button'
import { Input } from '@/components/ui/shadcnui/input'
import { updateUserPersonalInfo } from '../actions'
import { toast } from 'sonner'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/shadcnui/tooltip'
import { AlertCircle } from 'lucide-react'

interface EditProfileDialogProps {
  user: {
    name: string | null
    lastname: string | null
    email: string
    password: string | null // Ajout du champ password pour vérifier si l'utilisateur est connecté via Google
  }
  isDialogOpen: boolean
  setIsDialogOpen: (isOpen: boolean) => void
  onUpdate: (updatedUser: unknown) => void
}

export function EditProfileDialog({
  user,
  isDialogOpen,
  setIsDialogOpen,
  onUpdate,
}: EditProfileDialogProps) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    lastname: user.lastname || '',
    email: user.email,
  })
  const [isLoading, setIsLoading] = useState(false)
  const isGoogleUser = !user.password

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Si c'est un utilisateur Google, on garde l'email inchangé
      const dataToUpdate = {
        name: formData.name,
        lastname: formData.lastname,
        email: user.email, // On utilise l'email original pour les utilisateurs Google
      }

      const result = await updateUserPersonalInfo(dataToUpdate)
      if (result.success) {
        toast.success('Profil mis à jour avec succès')
        onUpdate(result.user)
        setIsDialogOpen(false)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Erreur lors de la mise à jour du profil')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={() => setIsDialogOpen(false)}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Modifier le profil</DialogTitle>
          <DialogDescription>
            Modifiez vos informations personnelles. Cliquez sur enregistrer une fois terminé.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4 mt-4'>
          <div className='space-y-4'>
            <div>
              <label htmlFor='name' className='text-sm font-medium text-gray-700'>
                Prénom
              </label>
              <Input
                id='name'
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className='mt-1'
              />
            </div>
            <div>
              <label htmlFor='lastname' className='text-sm font-medium text-gray-700'>
                Nom
              </label>
              <Input
                id='lastname'
                value={formData.lastname}
                onChange={e => setFormData(prev => ({ ...prev, lastname: e.target.value }))}
                className='mt-1'
              />
            </div>
            <div>
              <div className='flex items-center gap-2'>
                <label htmlFor='email' className='text-sm font-medium text-gray-700'>
                  Email
                </label>
                {isGoogleUser && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertCircle className='h-4 w-4 text-yellow-500' />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          L&apos;email ne peut pas être modifié car vous êtes connecté(e) via Google
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <Input
                id='email'
                type='email'
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className='mt-1'
                disabled={isGoogleUser}
              />
            </div>
          </div>
          <div className='flex justify-end gap-3'>
            <Button type='button' variant='outline' onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button type='submit' disabled={isLoading}>
              {isLoading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
