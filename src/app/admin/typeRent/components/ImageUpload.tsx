'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/shadcnui/button'
import { Label } from '@/components/ui/shadcnui/label'
import imageCompression from 'browser-image-compression'
import Image from 'next/image'

interface ImageUploadProps {
  currentImage?: string | null
  onImageChange: (imageUrl: string | null) => void
  entityType: 'type-rent' | 'homepage'
  entityId?: string
}

export default function ImageUpload({
  currentImage,
  onImageChange,
  entityType,
  entityId,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)

      // Configuration de compression selon le type d'entité
      // Homepage : haute qualité, pas de limitation de taille
      // Autres : compression standard
      const options =
        entityType === 'homepage'
          ? {
              maxSizeMB: 10, // Pas de limite stricte pour homepage
              maxWidthOrHeight: 3840, // Support 4K
              useWebWorker: true,
              initialQuality: 0.98, // Qualité maximale
            }
          : {
              maxSizeMB: 1,
              maxWidthOrHeight: 1920,
              useWebWorker: true,
            }

      const compressedFile = await imageCompression(file, options)

      // Convert to base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64String = reader.result as string
        setPreview(base64String)

        // If we have an entityId, upload immediately
        if (entityId) {
          try {
            const response = await fetch('/api/images/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                images: [base64String],
                entityType,
                entityId,
              }),
            })

            if (response.ok) {
              const data = await response.json()
              const uploadedUrl = data.images[0]?.full || base64String
              onImageChange(uploadedUrl)
            } else {
              // Fallback to base64 if upload fails
              onImageChange(base64String)
            }
          } catch (error) {
            console.error('Upload error:', error)
            // Fallback to base64 if upload fails
            onImageChange(base64String)
          }
        } else {
          // No entityId yet (creation), just use base64 for preview
          onImageChange(base64String)
        }

        setIsUploading(false)
      }

      reader.readAsDataURL(compressedFile)
    } catch (error) {
      console.error('Image compression error:', error)
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onImageChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className='space-y-2'>
      <Label>Image de couverture</Label>

      {preview ? (
        <div className='relative w-full h-48 rounded-lg overflow-hidden border-2 border-gray-200'>
          <Image
            src={preview}
            alt='Preview'
            fill
            className='object-cover'
            sizes='(max-width: 768px) 100vw, 400px'
          />
          <Button
            type='button'
            variant='destructive'
            size='icon'
            className='absolute top-2 right-2'
            onClick={handleRemove}
            disabled={isUploading}
          >
            <X className='h-4 w-4' />
          </Button>
        </div>
      ) : (
        <div
          className='w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition-colors'
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <div className='flex flex-col items-center gap-2'>
              <div className='w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin' />
              <p className='text-sm text-gray-500'>Upload en cours...</p>
            </div>
          ) : (
            <>
              <ImageIcon className='h-12 w-12 text-gray-400 mb-2' />
              <p className='text-sm text-gray-600 mb-1'>Cliquez pour uploader une image</p>
              <p className='text-xs text-gray-400'>
                {entityType === 'homepage'
                  ? 'PNG, JPG, WEBP haute qualité (recommandé: 3840x2160 ou plus)'
                  : "PNG, JPG, WEBP jusqu'à 10MB"}
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type='file'
        accept='image/*'
        className='hidden'
        onChange={handleFileSelect}
        disabled={isUploading}
      />

      {!preview && !isUploading && (
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => fileInputRef.current?.click()}
          className='w-full'
        >
          <Upload className='h-4 w-4 mr-2' />
          Choisir une image
        </Button>
      )}
    </div>
  )
}
