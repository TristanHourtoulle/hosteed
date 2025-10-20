'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, GripVertical, Eye } from 'lucide-react'
import { Button } from '@/components/ui/shadcnui/button'

interface ImageFile {
  file: File | null // null for existing images from DB
  preview: string
  id: string
  isExisting?: boolean
  url?: string
}

interface SortableImageGridProps {
  images: ImageFile[]
  onReorder: (newOrder: ImageFile[]) => void
  onRemove: (id: string) => void
  onPreview?: () => void
}

export default function SortableImageGrid({
  images,
  onReorder,
  onRemove,
  onPreview,
}: SortableImageGridProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()

    if (draggedIndex === null) return

    const newImages = [...images]
    const draggedImage = newImages[draggedIndex]

    // Remove from old position
    newImages.splice(draggedIndex, 1)

    // Insert at new position
    newImages.splice(dropIndex, 0, draggedImage)

    onReorder(newImages)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  if (images.length === 0) return null

  // Debug logs removed for production

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-slate-700'>
          Images sélectionnées ({images.length})
        </h3>
        {onPreview && (
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={onPreview}
            className='flex items-center gap-2'
          >
            <Eye className='h-4 w-4' />
            Prévisualiser la galerie
          </Button>
        )}
      </div>

      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4'>
        {images.map((image, index) => (
          <div
            key={image.id}
            draggable
            onDragStart={e => handleDragStart(e, index)}
            onDragOver={e => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`relative group border-2 rounded-lg overflow-hidden transition-all cursor-move ${
              draggedIndex === index
                ? 'opacity-50 scale-105'
                : dragOverIndex === index
                  ? 'border-blue-400 shadow-lg scale-105'
                  : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            {/* Numéro d'ordre */}
            <div className='absolute top-2 left-2 z-20'>
              <div className='bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg'>
                {index + 1}
              </div>
            </div>

            {/* Icône de glisser */}
            <div className='absolute top-2 right-8 z-20 opacity-0 group-hover:opacity-100 transition-opacity'>
              <div className='bg-black/50 text-white p-1 rounded'>
                <GripVertical className='h-3 w-3' />
              </div>
            </div>

            {/* Bouton de suppression */}
            <button
              type='button'
              onClick={() => onRemove(image.id)}
              className='absolute top-2 right-2 z-20 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600'
              title='Supprimer cette image'
            >
              <X className='h-3 w-3' />
            </button>

            {/* Image */}
            <div className='aspect-square relative overflow-hidden'>
              <Image
                src={image.preview}
                alt={`Image ${index + 1}`}
                fill
                className='object-cover transition-transform duration-200 group-hover:scale-110'
              />
            </div>

            {/* Overlay de drag */}
            {draggedIndex === index && (
              <div className='absolute inset-0 bg-blue-500/20 flex items-center justify-center z-10'>
                <div className='bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium'>
                  Déplacement...
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className='text-xs text-slate-500 bg-slate-50 p-3 rounded-lg'>
        <p className='font-medium mb-1'>💡 Conseils :</p>
        <ul className='space-y-1'>
          <li>• Glissez-déposez les images pour changer leur ordre</li>
          <li>• La première image sera utilisée comme photo principale</li>
          <li>• Les numéros indiquent l&apos;ordre d&apos;affichage dans la galerie</li>
        </ul>
      </div>
    </div>
  )
}
