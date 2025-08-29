'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/shadcnui/dialog'
import { Button } from '@/components/ui/shadcnui/button'
import { Camera, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { compressImage, formatFileSize } from '@/lib/utils/imageCompression'

interface EditPhotoDialogProps {
  currentPhoto?: string
  onPhotoUpdate: (base64Image: string) => void
}

export function EditPhotoDialog({ currentPhoto, onPhotoUpdate }: EditPhotoDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleFileSelect = async (file: File) => {
    // Vérifier la taille (max 20MB avant compression)
    if (file.size > 20 * 1024 * 1024) {
      toast.error('La taille du fichier ne doit pas dépasser 20MB')
      return
    }

    // Vérifier le type
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image valide')
      return
    }

    try {
      setIsUploading(true)
      toast.info("Compression de l'image en cours...")

      // Compress the image
      const compressedFile = await compressImage(file, {
        maxSizeMB: 0.5, // Max 500KB for profile pictures
        maxWidthOrHeight: 800, // Max 800px for profile pictures
        useWebWorker: true,
        quality: 0.8,
      })

      console.log(
        `Profile image compressed: ${formatFileSize(file.size)} → ${formatFileSize(compressedFile.size)}`
      )

      const reader = new FileReader()
      reader.onload = e => {
        const result = e.target?.result as string
        setPreview(result)
        toast.success('Image compressée avec succès')
      }
      reader.readAsDataURL(compressedFile)
    } catch (error) {
      console.error('Image compression failed:', error)
      toast.error("Erreur lors de la compression de l'image")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleUpload = async () => {
    if (!preview) return

    setIsUploading(true)

    try {
      const response = await fetch('/api/profile/photo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photo: preview,
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour de la photo')
      }

      await response.json()
      onPhotoUpdate(preview)
      setIsOpen(false)
      setPreview(null)
      toast.success('Photo de profil mise à jour avec succès')
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la mise à jour de la photo')
    } finally {
      setIsUploading(false)
    }
  }

  const resetPreview = () => {
    setPreview(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='h-8 px-3 text-xs hover:bg-gray-50 transition-colors'
        >
          <Camera className='h-3 w-3 mr-1.5' />
          Modifier
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Modifier la photo de profil</DialogTitle>
          <DialogDescription>Ajoutez ou modifiez votre photo de profil</DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Zone de drag & drop */}
          <div
            className={`
              border-2 border-dashed rounded-lg p-6 text-center transition-colors
              ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            `}
            onDrop={handleDrop}
            onDragOver={e => {
              e.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={() => setDragActive(false)}
          >
            {preview ? (
              <div className='space-y-4'>
                <div className='relative w-32 h-32 mx-auto'>
                  <Image src={preview} alt='Aperçu' fill className='rounded-full object-cover' />
                  <button
                    onClick={resetPreview}
                    className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors'
                  >
                    <X className='h-4 w-4' />
                  </button>
                </div>
                <p className='text-sm text-gray-600'>Aperçu de votre nouvelle photo</p>
              </div>
            ) : (
              <div className='space-y-4'>
                {currentPhoto ? (
                  <div className='w-24 h-24 mx-auto relative'>
                    <Image
                      src={currentPhoto}
                      alt='Photo actuelle'
                      fill
                      className='rounded-full object-cover'
                    />
                  </div>
                ) : (
                  <div className='w-24 h-24 mx-auto bg-gray-200 rounded-full flex items-center justify-center'>
                    <Camera className='h-8 w-8 text-gray-400' />
                  </div>
                )}

                <div>
                  <Upload className='h-8 w-8 mx-auto text-gray-400 mb-2' />
                  <p className='text-sm text-gray-600'>
                    Glissez une image ici ou cliquez pour sélectionner
                  </p>
                  <p className='text-xs text-gray-500 mt-1'>
                    PNG, JPG jusqu&apos;à 20MB (compressée automatiquement)
                  </p>
                </div>
              </div>
            )}

            <input
              type='file'
              accept='image/*'
              onChange={handleInputChange}
              className='hidden'
              id='photo-upload'
            />

            {!preview && (
              <label
                htmlFor='photo-upload'
                className='mt-4 inline-block cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors'
              >
                Sélectionner une image
              </label>
            )}
          </div>

          {/* Boutons d'action */}
          {preview && (
            <div className='flex gap-2'>
              <Button onClick={resetPreview} variant='outline' className='flex-1'>
                Annuler
              </Button>
              <Button onClick={handleUpload} disabled={isUploading} className='flex-1'>
                {isUploading ? 'Envoi...' : 'Confirmer'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
