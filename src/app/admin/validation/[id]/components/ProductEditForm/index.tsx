'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit3, Save } from 'lucide-react'
import { resubmitProductWithChange } from '@/lib/services/product.service'
import ErrorAlert from '@/components/ui/ErrorAlert'
import CreateServiceModal from '@/components/ui/CreateServiceModal'
import CreateExtraModal from '@/components/ui/CreateExtraModal'
import CreateHighlightModal from '@/components/ui/CreateHighlightModal'

// Import createProduct components for reuse
import {
  BasicInfoSection,
  ProductCharacteristicsForm,
  ProductPricingForm,
} from '@/app/createProduct/components'

// Import custom sections for admin edit
import {
  ImagesSection,
  EquipmentServicesSection,
  ServicesOptionsSection,
} from './sections'

// Import hooks
import {
  useProductEditData,
  useProductEditForm,
  useImageUpload,
} from './hooks'

// Import utils
import {
  containerVariants,
  itemVariants,
  validateFormData,
} from './utils'

// Import types
import type { Product, ProductEditFormProps } from './types'

export function ProductEditForm({ product, onSave, onCancel }: ProductEditFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  // États pour les modaux de création personnalisée
  const [serviceModalOpen, setServiceModalOpen] = useState(false)
  const [extraModalOpen, setExtraModalOpen] = useState(false)
  const [highlightModalOpen, setHighlightModalOpen] = useState(false)


  // Custom hooks
  const {
    types,
    equipments,
    meals,
    securities,
    services,
    includedServices,
    extras,
    highlights,
    error: dataError,
    setError: setDataError,
    handleServiceCreated,
    handleExtraCreated,
    handleHighlightCreated,
  } = useProductEditData()

  const {
    formData,
    setFormData,
    handleInputChange,
    handleCheckboxChange,
  } = useProductEditForm({ product, types })

  const {
    isUploadingImages,
    dragActive,
    selectedFiles,
    showGalleryPreview,
    setShowGalleryPreview,
    error: imageError,
    setError: setImageError,
    fileInputRef,
    handleDrag,
    handleDrop,
    handleFiles,
    removeFileById,
    prepareImagesForSubmit,
  } = useImageUpload({ product })


  // Unified error state
  const error = dataError || imageError
  const setError = (err: typeof error) => {
    setDataError(err)
    setImageError(err)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validation basique
    const validationError = validateFormData(formData)
    if (validationError) {
      setError(validationError)
      setIsLoading(false)
      return
    }

    try {
      // Préparer les images
      const finalImages = await prepareImagesForSubmit()

      const updatedProduct = await resubmitProductWithChange(
        product.id,
        {
          name: formData.name,
          description: formData.description,
          address: formData.address,
          longitude: 0,
          latitude: 0,
          basePrice: formData.basePrice,
          room: formData.room ? parseInt(formData.room) : null,
          bathroom: formData.bathroom ? parseInt(formData.bathroom) : null,
          arriving: parseInt(formData.arriving),
          leaving: parseInt(formData.leaving),
          typeId: formData.typeId,
          securities: formData.securityIds,
          equipments: formData.equipmentIds,
          services: formData.serviceIds,
          meals: formData.mealIds,
          images: finalImages,
        },
        product.owner?.id
      )

      if (updatedProduct) {
        onSave(updatedProduct as unknown as Product)
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du produit:', error)
      setError({
        type: 'general',
        title: 'Erreur de sauvegarde',
        message: 'Une erreur est survenue lors de la sauvegarde',
        details: ['Impossible de sauvegarder les modifications'],
        suggestions: ['Vérifiez votre connexion internet', 'Réessayez dans quelques instants'],
        retryable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
      <motion.div
        className='max-w-7xl mx-auto p-6 space-y-8'
        variants={containerVariants}
        initial='hidden'
        animate='visible'
      >
        {/* Header with breadcrumb */}
        <motion.div className='flex items-center gap-4' variants={itemVariants}>
          <Button
            variant='ghost'
            size='sm'
            className='text-slate-600 hover:text-slate-800'
            onClick={onCancel}
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Retour
          </Button>
        </motion.div>

        {/* Page Header */}
        <motion.div className='text-center space-y-4' variants={itemVariants}>
          <div className='inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium'>
            <Edit3 className='h-4 w-4' />
            Modifier l&apos;annonce
          </div>
          <h1 className='text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700'>
            Modifier l&apos;annonce
          </h1>
          <p className='text-slate-600 max-w-2xl mx-auto text-lg'>
            Modifiez les informations de votre hébergement
          </p>
        </motion.div>

        {error && (
          <motion.div variants={itemVariants}>
            <ErrorAlert
              error={error}
              onClose={() => setError(null)}
              onRetry={
                error.retryable
                  ? () => {
                      setError(null)
                    }
                  : undefined
              }
            />
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className='space-y-8'>
          <div className='grid grid-cols-1 gap-8'>
            {/* Reuse BasicInfoSection from createProduct */}
            <BasicInfoSection
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore - FormData types are compatible but not identical
              formData={formData}
              types={types}
              handleInputChange={handleInputChange}
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore - FormData types are compatible but not identical
              setFormData={setFormData}
              itemVariants={itemVariants}
            />

            {/* Reuse ProductCharacteristicsForm from createProduct */}
            <ProductCharacteristicsForm
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore - FormData types are compatible but not identical
              formData={formData}
              onInputChange={handleInputChange}
              itemVariants={itemVariants}
            />

            {/* Reuse ProductPricingForm from createProduct */}
            <ProductPricingForm
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore - FormData types are compatible but not identical
              formData={formData}
              onInputChange={handleInputChange}
              onSpecialPriceCreated={() => {
                // Special prices are managed separately, no-op for now
              }}
              onRemoveSpecialPrice={() => {
                // Special prices are managed separately, no-op for now
              }}
              itemVariants={itemVariants}
            />

            {/* Custom EquipmentServicesSection */}
            <EquipmentServicesSection
              formData={formData}
              equipments={equipments}
              meals={meals}
              securities={securities}
              services={services}
              handleCheckboxChange={handleCheckboxChange}
              itemVariants={itemVariants}
            />

            {/* Custom ServicesOptionsSection */}
            <ServicesOptionsSection
              formData={formData}
              includedServices={includedServices}
              extras={extras}
              highlights={highlights}
              handleCheckboxChange={handleCheckboxChange}
              setServiceModalOpen={setServiceModalOpen}
              setExtraModalOpen={setExtraModalOpen}
              setHighlightModalOpen={setHighlightModalOpen}
              itemVariants={itemVariants}
            />

            {/* Custom ImagesSection */}
            <ImagesSection
              selectedFiles={selectedFiles}
              dragActive={dragActive}
              isUploadingImages={isUploadingImages}
              showGalleryPreview={showGalleryPreview}
              fileInputRef={fileInputRef}
              handleDrag={handleDrag}
              handleDrop={handleDrop}
              handleFiles={handleFiles}
              removeFileById={removeFileById}
              setSelectedFiles={(files) => {
                // Update the selected files state
                const imageInput = fileInputRef.current
                if (imageInput) {
                  const dataTransfer = new DataTransfer()
                  files.forEach(f => {
                    if (f.file) dataTransfer.items.add(f.file)
                  })
                  imageInput.files = dataTransfer.files
                }
              }}
              setShowGalleryPreview={setShowGalleryPreview}
              itemVariants={itemVariants}
            />
          </div>

          {/* Submit Button */}
          <motion.div variants={itemVariants} className='flex justify-end gap-4'>
            <Button type='button' variant='outline' onClick={onCancel} disabled={isLoading}>
              Annuler
            </Button>
            <Button
              type='submit'
              disabled={isLoading || isUploadingImages}
              className='bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
            >
              <Save className='h-4 w-4 mr-2' />
              {isLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </motion.div>
        </form>
      </motion.div>

      {/* Modals */}
      <CreateServiceModal
        isOpen={serviceModalOpen}
        onClose={() => setServiceModalOpen(false)}
        onServiceCreated={handleServiceCreated}
        title="Créer un service inclus"
        description="Ajoutez un nouveau service inclus à votre hébergement"
      />

      <CreateExtraModal
        isOpen={extraModalOpen}
        onClose={() => setExtraModalOpen(false)}
        onExtraCreated={handleExtraCreated}
      />

      <CreateHighlightModal
        isOpen={highlightModalOpen}
        onClose={() => setHighlightModalOpen(false)}
        onHighlightCreated={handleHighlightCreated}
      />
    </div>
  )
}
