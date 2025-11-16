'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Camera, Upload } from 'lucide-react'
import SortableImageGrid from '@/components/ui/SortableImageGrid'
import ImageGalleryPreview from '@/components/ui/ImageGalleryPreview'
import type { ImageFile } from '../types'

interface ImagesSectionProps {
  selectedFiles: ImageFile[]
  dragActive: boolean
  isUploadingImages: boolean
  showGalleryPreview: boolean
  fileInputRef: React.RefObject<HTMLInputElement | null>
  handleDrag: (e: React.DragEvent) => void
  handleDrop: (e: React.DragEvent) => void
  handleFiles: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeFileById: (id: string) => void
  setSelectedFiles: (files: ImageFile[]) => void
  setShowGalleryPreview: (show: boolean) => void
  itemVariants: {
    hidden: { opacity: number; y: number }
    visible: { opacity: number; y: number; transition: { duration: number } }
  }
}

export default function ImagesSection({
  selectedFiles,
  dragActive,
  isUploadingImages,
  showGalleryPreview,
  fileInputRef,
  handleDrag,
  handleDrop,
  handleFiles,
  removeFileById,
  setSelectedFiles,
  setShowGalleryPreview,
  itemVariants,
}: ImagesSectionProps) {
  return (
    <motion.div variants={itemVariants}>
      <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm'>
        <CardHeader className='space-y-2'>
          <div className='flex items-center gap-2'>
            <div className='p-2 bg-pink-50 rounded-lg'>
              <Camera className='h-5 w-5 text-pink-600' />
            </div>
            <div>
              <CardTitle className='text-xl'>Photos de l&apos;hébergement</CardTitle>
              <p className='text-slate-600 text-sm mt-1'>
                Ajoutez des photos attrayantes (max 35 photos, format: JPEG, PNG, WebP)
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Upload Zone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type='file'
              multiple
              accept='image/*'
              onChange={handleFiles}
              className='hidden'
            />
            <div className='space-y-4'>
              <div className='flex justify-center'>
                <div className='p-4 bg-blue-100 rounded-full'>
                  <Upload className='h-8 w-8 text-blue-600' />
                </div>
              </div>
              <div>
                <p className='text-lg font-medium text-slate-700'>
                  Glissez-déposez vos images ici
                </p>
                <p className='text-sm text-slate-500 mt-1'>ou</p>
              </div>
              <Button
                type='button'
                variant='outline'
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImages}
                className='border-blue-300 text-blue-600 hover:bg-blue-50'
              >
                {isUploadingImages ? 'Traitement en cours...' : 'Parcourir vos fichiers'}
              </Button>
              <p className='text-xs text-slate-500'>
                Formats acceptés: JPEG, PNG, WebP • Taille max: 50MB par image • Max 35 photos
              </p>
            </div>
          </div>

          {/* Selected Images Grid */}
          {selectedFiles.length > 0 && (
            <div className='space-y-4'>
              <div className='flex justify-between items-center'>
                <p className='text-sm text-slate-600'>
                  {selectedFiles.length} photo{selectedFiles.length > 1 ? 's' : ''} sélectionnée
                  {selectedFiles.length > 1 ? 's' : ''}
                </p>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => setShowGalleryPreview(true)}
                >
                  Prévisualiser la galerie
                </Button>
              </div>

              <SortableImageGrid
                images={selectedFiles}
                onRemove={removeFileById}
                onReorder={setSelectedFiles}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gallery Preview Modal */}
      <ImageGalleryPreview
        images={selectedFiles}
        isOpen={showGalleryPreview}
        onClose={() => setShowGalleryPreview(false)}
      />
    </motion.div>
  )
}
