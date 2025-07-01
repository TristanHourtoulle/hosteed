'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/shadcnui'
import { Button } from '@/components/ui/shadcnui/button'
import { Camera } from 'lucide-react'
import { toast } from 'sonner'
import { getProfileImageUrl } from '@/lib/utils'

interface EditPhotoDialogProps {
  user: {
    name: string | null
    image: string | null
  }
  onSave: (base64Image: string) => Promise<void>
}

export function EditPhotoDialog({ user, onSave }: EditPhotoDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const profileImage = getProfileImageUrl(user.image)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La taille du fichier ne doit pas dépasser 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Veuillez sélectionner une image')
        return
      }
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setPreview(base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!preview) return

    setIsLoading(true)
    try {
      await onSave(preview)
      toast.success('Photo de profil mise à jour avec succès')
      setSelectedFile(null)
      setPreview(null)
    } catch (error) {
      toast.error('Erreur lors de la mise à jour de la photo')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant='outline'
          size='icon'
          className='absolute bottom-0 right-0 rounded-full bg-white shadow-lg'
        >
          <Camera className='w-4 h-4' />
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Modifier la photo de profil</DialogTitle>
          <DialogDescription>
            Choisissez une nouvelle photo de profil. Taille maximale : 5MB.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4 mt-4'>
          <div className='flex flex-col items-center gap-4'>
            <div className='relative w-32 h-32 rounded-full overflow-hidden bg-gray-200'>
              {(preview || profileImage) && (
                <Image
                  src={preview || profileImage || ''}
                  alt={user.name || 'Profile'}
                  fill
                  className='object-cover'
                />
              )}
              {!preview && !profileImage && (
                <div className='absolute inset-0 flex items-center justify-center text-2xl font-medium text-gray-600'>
                  {user.name?.charAt(0) || '?'}
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              onChange={handleFileSelect}
              className='hidden'
            />
            <Button type='button' variant='outline' onClick={() => fileInputRef.current?.click()}>
              Choisir une photo
            </Button>
          </div>
          <div className='flex justify-end gap-3'>
            <DialogTrigger asChild>
              <Button variant='outline' type='button'>
                Annuler
              </Button>
            </DialogTrigger>
            <Button type='submit' disabled={!preview || isLoading}>
              {isLoading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
