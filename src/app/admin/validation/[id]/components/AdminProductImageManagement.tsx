'use client'

import { useState, useRef } from 'react'
import { motion, Variants } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, Upload } from 'lucide-react'
import { compressImages, formatFileSize } from '@/lib/utils/imageCompression'
import SortableImageGrid from '@/components/ui/SortableImageGrid'
import ImageGalleryPreview from '@/components/ui/ImageGalleryPreview'
import ErrorAlert, { ErrorDetails } from '@/components/ui/ErrorAlert'

interface ImageFile {
  file: File
  preview: string
  id: string
}

interface AdminProductImageManagementProps {
  selectedFiles: ImageFile[]
  setSelectedFiles: React.Dispatch<React.SetStateAction<ImageFile[]>>
  isUploadingImages: boolean
  setIsUploadingImages: React.Dispatch<React.SetStateAction<boolean>>
  error: ErrorDetails | null
  setError: React.Dispatch<React.SetStateAction<ErrorDetails | null>>
  itemVariants: Variants
}

export default function AdminProductImageManagement({
  selectedFiles,
  setSelectedFiles,
  isUploadingImages,
  setIsUploadingImages,
  error,
  setError,
  itemVariants
}: AdminProductImageManagementProps) {
  const [dragActive, setDragActive] = useState(false)
  const [showGalleryPreview, setShowGalleryPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles({ target: { files: e.dataTransfer.files } } as React.ChangeEvent<HTMLInputElement>)
    }
  }

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      if (selectedFiles.length + files.length > 35) {
        setError({
          type: 'file',
          title: 'Limite d\'images dépassée',
          message: 'Le produit ne peut avoir que 35 images maximum.',
          details: [
            `Images actuelles: ${selectedFiles.length}`,
            `Images à ajouter: ${files.length}`,
            `Total: ${selectedFiles.length + files.length} (limite: 35)`
          ],
          suggestions: [
            'Supprimez quelques images existantes avant d\'en ajouter de nouvelles',
            'Sélectionnez moins d\'images à la fois'
          ],
          retryable: false
        })
        return
      }

      setIsUploadingImages(true)

      try {
        const filesArray = Array.from(files)
        const compressedFiles = await compressImages(filesArray, {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          quality: 0.8,
        })

        // Create ImageFile objects with previews and unique IDs
        const imageFiles: ImageFile[] = compressedFiles.map((file, index) => ({
          file,
          preview: URL.createObjectURL(file),
          id: `img-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 11)}`
        }))

        setSelectedFiles(prev => [...prev, ...imageFiles])
        setError(null) // Clear any previous errors

        // Log compression results
        compressedFiles.forEach((file, index) => {
          const originalSize = filesArray[index].size
          console.log(
            `Compressed ${file.name}: ${formatFileSize(originalSize)} → ${formatFileSize(file.size)}`
          )
        })
      } catch (error) {
        console.error('Image compression failed:', error)
        setError({
          type: 'file',
          title: 'Erreur de compression',
          message: 'La compression automatique des images a échoué.',
          details: [
            'Certaines images peuvent être corrompues ou dans un format non supporté',
            `Erreur technique: ${error instanceof Error ? error.message : 'inconnue'}`
          ],
          suggestions: [
            'Vérifiez que les images ne sont pas corrompues',
            'Essayez de compresser les images manuellement avant de les télécharger',
            'Utilisez des formats d\'image standards (JPEG, PNG)',
            'Réduisez la résolution des images si elles sont très grandes'
          ],
          retryable: true
        })
      } finally {
        setIsUploadingImages(false)
      }
    }
  }

  const removeFileById = (id: string) => {
    const imageFile = selectedFiles.find(img => img.id === id)
    if (imageFile?.preview) {
      URL.revokeObjectURL(imageFile.preview)
    }
    setSelectedFiles(prev => prev.filter(img => img.id !== id))
  }

  return (
    <motion.div variants={itemVariants}>
      <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm'>
        <CardHeader className='space-y-2'>
          <div className='flex items-center gap-2'>
            <div className='p-2 bg-pink-50 rounded-lg'>
              <Camera className='h-5 w-5 text-pink-600' />
            </div>
            <div>
              <CardTitle className='text-xl'>Gestion des Images</CardTitle>
              <p className='text-slate-600 text-sm mt-1'>
                Gérez les photos du produit (maximum 35)
                {selectedFiles.length > 0 && (
                  <span className='ml-2 font-medium text-blue-600'>
                    {selectedFiles.length} photo{selectedFiles.length > 1 ? 's' : ''}{' '}
                    actuelle{selectedFiles.length > 1 ? 's' : ''}
                  </span>
                )}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-6'>
          {error && error.type === 'file' && (
            <ErrorAlert
              error={error}
              onClose={() => setError(null)}
              onRetry={() => {
                setError(null)
                fileInputRef.current?.click()
              }}
            />
          )}

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-pink-400 bg-pink-50'
                : 'border-slate-300 hover:border-pink-300 hover:bg-pink-25'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
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
              <div className='mx-auto w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center'>
                <Upload className='h-6 w-6 text-pink-600' />
              </div>
              <div>
                <p className='text-sm font-medium text-slate-700'>
                  Glissez les images ici ou{' '}
                  <button
                    type='button'
                    onClick={() => fileInputRef.current?.click()}
                    className='text-pink-600 hover:text-pink-700 underline'
                  >
                    parcourez
                  </button>
                </p>
                <p className='text-xs text-slate-500 mt-1'>
                  PNG, JPG, JPEG, WEBP jusqu&apos;à 50MB chacune (compressées automatiquement)
                  {selectedFiles.length > 0 && (
                    <span className='block mt-1 text-green-600 font-medium'>
                      ✓ {selectedFiles.length}/35 photos actuelles
                    </span>
                  )}
                  {isUploadingImages && (
                    <span className='block mt-1 text-blue-600 font-medium animate-pulse'>
                      🔄 Compression en cours...
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <SortableImageGrid
            images={selectedFiles}
            onReorder={setSelectedFiles}
            onRemove={removeFileById}
            onPreview={() => setShowGalleryPreview(true)}
          />

          <ImageGalleryPreview
            images={selectedFiles}
            isOpen={showGalleryPreview}
            onClose={() => setShowGalleryPreview(false)}
          />
        </CardContent>
      </Card>
    </motion.div>
  )
}