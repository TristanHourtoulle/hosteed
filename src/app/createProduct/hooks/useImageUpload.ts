import { useState } from 'react'
import { toast } from 'sonner'
import imageCompression from 'browser-image-compression'
import { ImageFile } from '../types'
import { validateImages } from '../utils/validators'
import { generateImageId } from '../utils/formHelpers'
import { MAX_IMAGES } from '../utils/constants'

/**
 * Custom hook for managing image uploads, compression, and reordering
 */
export const useImageUpload = (initialImages?: ImageFile[]) => {
  const [selectedFiles, setSelectedFiles] = useState<ImageFile[]>(initialImages || [])
  const [dragActive, setDragActive] = useState(false)
  const [isUploadingImages, setIsUploadingImages] = useState(false)

  /**
   * Compress images before upload
   */
  const compressImages = async (files: File[]): Promise<File[]> => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    }

    const compressedFiles = await Promise.all(
      files.map(async file => {
        try {
          const compressedFile = await imageCompression(file, options)
          return new File([compressedFile], file.name, {
            type: file.type,
            lastModified: Date.now(),
          })
        } catch (error) {
          console.error('Error compressing image:', error)
          return file
        }
      })
    )

    return compressedFiles
  }

  /**
   * Handle file selection and compression
   */
  const handleFileSelect = async (files: File[]) => {
    // Check max images limit
    if (selectedFiles.length + files.length > MAX_IMAGES) {
      toast.error(`Vous ne pouvez télécharger que ${MAX_IMAGES} images maximum`)
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
      // Compress images
      const compressedFiles = await compressImages(files)

      // Create image files with previews
      const newImageFiles: ImageFile[] = await Promise.all(
        compressedFiles.map(async file => {
          const preview = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(file)
          })

          return {
            file,
            preview,
            id: generateImageId(),
            isExisting: false, // Mark as new image
          }
        })
      )

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
