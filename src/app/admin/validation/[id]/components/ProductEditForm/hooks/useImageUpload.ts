import { useState, useEffect, useRef } from 'react'
import type { ImageFile, Product } from '../types'
import type { ErrorDetails } from '@/components/ui/ErrorAlert'
import {
  initializeExistingImages,
  validateImageFile,
  validateImageCount,
  processImageFiles,
  convertFilesToBase64,
} from '../utils'

interface UseImageUploadProps {
  product: Product
}

export const useImageUpload = ({ product }: UseImageUploadProps) => {
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<ImageFile[]>([])
  const [showGalleryPreview, setShowGalleryPreview] = useState(false)
  const [error, setError] = useState<ErrorDetails | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize existing images
  useEffect(() => {
    if (product.img && product.img.length > 0) {
      const existingImages = initializeExistingImages(product.img)
      setSelectedFiles(existingImages)
    }
  }, [product.img])

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
      handleFiles({
        target: { files: e.dataTransfer.files },
      } as React.ChangeEvent<HTMLInputElement>)
    }
  }

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)

      // Validation des fichiers
      for (const file of filesArray) {
        const fileError = validateImageFile(file)
        if (fileError) {
          setError(fileError)
          return
        }
      }

      const countError = validateImageCount(selectedFiles.length, filesArray.length)
      if (countError) {
        setError(countError)
        return
      }

      try {
        setIsUploadingImages(true)
        setError(null)

        const imageFiles = await processImageFiles(filesArray)
        setSelectedFiles(prev => [...prev, ...imageFiles])
        setError(null)
      } catch (error) {
        console.error('Image compression failed:', error)
        setError({
          type: 'file',
          title: 'Erreur de compression',
          message: 'La compression automatique des images a échoué.',
          details: [
            'Certaines images peuvent être corrompues ou dans un format non supporté',
            `Erreur technique: ${error instanceof Error ? error.message : 'inconnue'}`,
          ],
          suggestions: [
            'Vérifiez que vos images ne sont pas corrompues',
            'Essayez de compresser vos images manuellement avant de les télécharger',
            "Utilisez des formats d'image standards (JPEG, PNG)",
            'Réduisez la résolution de vos images si elles sont très grandes',
          ],
          retryable: true,
        })
      } finally {
        setIsUploadingImages(false)
      }
    }
  }

  const removeFileById = (id: string) => {
    const imageFile = selectedFiles.find(img => img.id === id)
    if (imageFile?.preview && !imageFile.preview.startsWith('data:')) {
      URL.revokeObjectURL(imageFile.preview)
    }
    setSelectedFiles(prev => prev.filter(img => img.id !== id))
  }

  const prepareImagesForSubmit = async (): Promise<string[]> => {
    if (selectedFiles.length === 0) return []

    // Séparer les images existantes des nouvelles
    const existingImages = selectedFiles.filter(img => img.id.startsWith('existing-'))
    const newImages = selectedFiles.filter(img => !img.id.startsWith('existing-'))

    // Garder les images existantes (déjà en base64)
    const existingImageUrls = existingImages.map(img => img.preview)

    // Convertir les nouvelles images en base64
    let newImageBase64: string[] = []
    if (newImages.length > 0) {
      setIsUploadingImages(true)
      try {
        newImageBase64 = await convertFilesToBase64(newImages)
      } finally {
        setIsUploadingImages(false)
      }
    }

    // Combiner toutes les images
    return [...existingImageUrls, ...newImageBase64]
  }

  return {
    isUploadingImages,
    dragActive,
    selectedFiles,
    showGalleryPreview,
    setShowGalleryPreview,
    error,
    setError,
    fileInputRef,
    handleDrag,
    handleDrop,
    handleFiles,
    removeFileById,
    prepareImagesForSubmit,
  }
}
