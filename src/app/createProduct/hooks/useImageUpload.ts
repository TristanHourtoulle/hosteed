import { useState } from 'react'
import { toast } from 'sonner'
import { ImageFile } from '../types'
import { validateImages } from '../utils/validators'
import { createImageFiles } from '../utils/imageFileFactory'
import { MAX_IMAGES } from '../utils/constants'

export interface UseImageUploadOptions {
  /**
   * Cap for this uploader. Defaults to `MAX_IMAGES` — the whole listing budget
   * — which is the correct cap whenever nothing else draws from it (every
   * non-hotel listing). Hotels pass the establishment's remaining share, since
   * room-type photos spend the same allowance.
   * @see src/lib/photos/photoBudget.ts
   */
  maxImages?: number
}

/**
 * Custom hook for managing image uploads, compression, and reordering
 */
export const useImageUpload = (
  initialImages?: ImageFile[],
  options: UseImageUploadOptions = {}
) => {
  const maxImages = options.maxImages ?? MAX_IMAGES
  const [selectedFiles, setSelectedFiles] = useState<ImageFile[]>(initialImages || [])
  const [dragActive, setDragActive] = useState(false)
  const [isUploadingImages, setIsUploadingImages] = useState(false)

  /**
   * Handle file selection and compression
   */
  const handleFileSelect = async (files: File[]) => {
    // Check max images limit
    if (selectedFiles.length + files.length > maxImages) {
      toast.error(`Vous ne pouvez télécharger que ${maxImages} images maximum`)
      return
    }

    // Validate images
    const validationErrors = validateImages(files)
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => {
        toast.error(error.message)
      })
      return
    }

    setIsUploadingImages(true)

    try {
      const newImageFiles = await createImageFiles(files)

      setSelectedFiles(prev => [...prev, ...newImageFiles])
      toast.success(`${newImageFiles.length} image(s) ajoutée(s)`)
    } catch (error) {
      console.error('Error processing images:', error)
      toast.error('Erreur lors du traitement des images')
    } finally {
      setIsUploadingImages(false)
    }
  }

  /**
   * Handle drag events
   */
  const handleDrag = (e: React.DragEvent, active: boolean) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(active)
  }

  /**
   * Handle drop event
   */
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      await handleFileSelect(files)
    }
  }

  /**
   * Reorder images (for drag and drop sorting)
   */
  const reorderImages = (startIndex: number, endIndex: number) => {
    setSelectedFiles(prev => {
      const result = Array.from(prev)
      const [removed] = result.splice(startIndex, 1)
      result.splice(endIndex, 0, removed)
      return result
    })
  }

  /**
   * Delete an image
   */
  const deleteImage = (id: string) => {
    setSelectedFiles(prev => prev.filter(img => img.id !== id))
    toast.success('Image supprimée')
  }

  /**
   * Clear all images
   */
  const clearAllImages = () => {
    setSelectedFiles([])
  }

  return {
    selectedFiles,
    dragActive,
    isUploadingImages,
    handleFileSelect,
    handleDrag,
    handleDrop,
    reorderImages,
    deleteImage,
    clearAllImages,
    setSelectedFiles, // Export for direct manipulation if needed
  }
}
