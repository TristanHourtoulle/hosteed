'use client'

import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'
import SortableImageGrid from '@/components/ui/SortableImageGrid'
import { MAX_LISTING_PHOTOS } from '@/lib/photos/photoBudget'
import { createImageFiles } from '../../../utils/imageFileFactory'
import { validateImages } from '../../../utils/validators'
import type { ImageFile } from '@/types/product-form'

/**
 * Photo dropzone for a single room type.
 *
 * Controlled: the images live in the wizard's `RoomTypeFormData` so the parent
 * can tally them against the listing's shared budget. `remaining` is that
 * budget's leftover *for this room type* (the whole listing's leftover, since
 * the allowance is global); at 0 the dropzone is inert and says why, inline.
 */

interface RoomTypePhotoUploaderProps {
  index: number
  images: ImageFile[]
  onChange: (next: ImageFile[]) => void
  /** Photos still addable to the listing as a whole. */
  remaining: number
}

export function RoomTypePhotoUploader({
  index,
  images,
  onChange,
  remaining,
}: RoomTypePhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)

  const isDisabled = remaining <= 0

  const addFiles = async (files: File[]) => {
    if (files.length === 0) return

    if (isDisabled) return

    if (files.length > remaining) {
      toast.error(
        `Il ne reste que ${remaining} photo${remaining > 1 ? 's' : ''} sur les ${MAX_LISTING_PHOTOS} de l'annonce`
      )
      return
    }

    const validationErrors = validateImages(files)
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => toast.error(error.message))
      return
    }

    setIsCompressing(true)
    try {
      const newImages = await createImageFiles(files)
      onChange([...images, ...newImages])
      toast.success(`${newImages.length} photo(s) ajoutée(s)`)
    } catch {
      toast.error('Erreur lors du traitement des photos')
    } finally {
      setIsCompressing(false)
    }
  }

  const handleDrag = (e: React.DragEvent, active: boolean) => {
    e.preventDefault()
    e.stopPropagation()
    if (isDisabled) return
    setDragActive(active)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (isDisabled) return
    await addFiles(Array.from(e.dataTransfer.files))
  }

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    await addFiles(Array.from(e.target.files))
    e.target.value = ''
  }

  const removeImage = (id: string) => onChange(images.filter(image => image.id !== id))

  return (
    <div className='space-y-3'>
      <div
        data-testid={`room-type-photo-dropzone-${index}`}
        data-disabled={isDisabled}
        className={`rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
          isDisabled
            ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-70'
            : dragActive
              ? 'border-indigo-400 bg-indigo-50'
              : 'border-slate-300 hover:border-indigo-300'
        }`}
        onDragEnter={e => handleDrag(e, true)}
        onDragLeave={e => handleDrag(e, false)}
        onDragOver={e => handleDrag(e, true)}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type='file'
          multiple
          accept='image/*'
          onChange={handleFiles}
          disabled={isDisabled}
          className='hidden'
        />
        <div className='flex flex-col items-center gap-2'>
          <Upload className='h-5 w-5 text-slate-400' aria-hidden='true' />
          <p className='text-sm text-slate-600'>Glissez les photos de ce type de chambre ici</p>
          <button
            type='button'
            onClick={() => fileInputRef.current?.click()}
            disabled={isDisabled}
            className='text-sm font-medium text-indigo-600 underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline'
          >
            Parcourir
          </button>
          {isDisabled ? (
            <p className='text-xs font-medium text-red-600'>
              Limite de {MAX_LISTING_PHOTOS} photos atteinte pour cette annonce : supprimez une
              photo de l&apos;établissement ou d&apos;un type de chambre pour en ajouter ici.
            </p>
          ) : (
            <p className='text-xs text-slate-500'>
              PNG, JPG, JPEG, WEBP (compressées automatiquement) — {remaining} restante
              {remaining > 1 ? 's' : ''} sur l&apos;annonce
            </p>
          )}
          {isCompressing && (
            <p className='animate-pulse text-xs font-medium text-indigo-600'>
              Compression en cours...
            </p>
          )}
        </div>
      </div>

      {images.length > 0 && (
        <SortableImageGrid images={images} onReorder={onChange} onRemove={removeImage} />
      )}
    </div>
  )
}
