'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit3, Save, Users, Home } from 'lucide-react'
import ErrorAlert from '@/components/ui/ErrorAlert'
import SEOFieldsCard from '@/components/ui/SEOFieldsCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcnui/card'
import { Input } from '@/components/ui/shadcnui/input'
import { Label } from '@/components/ui/shadcnui/label'
import CreateServiceModal from '@/components/ui/CreateServiceModal'
import CreateExtraModal from '@/components/ui/CreateExtraModal'
import CreateHighlightModal from '@/components/ui/CreateHighlightModal'
import CreateSpecialPriceModal from '@/components/ui/CreateSpecialPriceModal'

// Import createProduct components for reuse
import {
  BasicInfoSection,
  LocationContactSection,
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
import type { Product, ProductEditFormProps, SpecialPrice } from './types'

export function ProductEditForm({ product, onSave, onCancel }: ProductEditFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  // États pour les modaux de création personnalisée
  const [serviceModalOpen, setServiceModalOpen] = useState(false)
  const [extraModalOpen, setExtraModalOpen] = useState(false)
  const [highlightModalOpen, setHighlightModalOpen] = useState(false)
  const [specialPriceModalOpen, setSpecialPriceModalOpen] = useState(false)

  // Special prices state - initialized from product or empty
  const [specialPrices, setSpecialPrices] = useState<SpecialPrice[]>([])


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
    seoData,
    setSeoData,
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

  // Special price handlers
  const handleSpecialPriceCreated = (newSpecialPrice: Omit<SpecialPrice, 'id'>) => {
    const specialPriceWithId: SpecialPrice = {
      ...newSpecialPrice,
      id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    }
    setSpecialPrices(prev => [...prev, specialPriceWithId])
    // Sync with formData
    setFormData(prev => ({
      ...prev,
      specialPrices: [...prev.specialPrices, specialPriceWithId],
    }))
  }

  const handleRemoveSpecialPrice = (id: string) => {
    setSpecialPrices(prev => prev.filter(sp => sp.id !== id))
    // Sync with formData
    setFormData(prev => ({
      ...prev,
      specialPrices: prev.specialPrices.filter(sp => sp.id !== id),
    }))
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

    // Helper to convert "HH:mm" to hour integer
    const parseHour = (timeStr: string): number => {
      if (!timeStr) return 0
      const hour = parseInt(timeStr.split(':')[0])
      return isNaN(hour) ? 0 : hour
    }

    try {
      // Préparer les images
      const finalImages = await prepareImagesForSubmit()

      // Prepare complete update data with all fields
      const updateData = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        completeAddress: formData.completeAddress || null,
        longitude: formData.longitude || product.longitude || 0,
        latitude: formData.latitude || product.latitude || 0,
        basePrice: formData.basePrice,
        priceMGA: formData.priceMGA || null,
        room: formData.room ? parseInt(formData.room) : null,
        bathroom: formData.bathroom ? parseInt(formData.bathroom) : null,
        arriving: parseHour(formData.arriving), // Convert "14:00" to 14
        leaving: parseHour(formData.leaving), // Convert "12:00" to 12
        phone: formData.phone,
        phoneCountry: formData.phoneCountry || 'MG',
        typeId: formData.typeId,
        maxPeople: formData.maxPeople ? parseInt(formData.maxPeople) : null,
        // Relations
        equipmentIds: formData.equipmentIds,
        serviceIds: formData.serviceIds,
        mealIds: formData.mealIds,
        securityIds: formData.securityIds,
        includedServiceIds: formData.includedServiceIds,
        extraIds: formData.extraIds,
        highlightIds: formData.highlightIds,
        // Nearby places
        nearbyPlaces: formData.nearbyPlaces.map(place => ({
          name: place.name,
          distance: place.distance ? Number(place.distance) : 0,
          duration: 0,
          transport: place.unit === 'kilomètres' ? 'voiture' : 'à pied',
        })),
        proximityLandmarks: formData.proximityLandmarks,
        // Hotel info
        isHotel: formData.isHotel,
        hotelInfo: formData.isHotel
          ? {
              name: formData.hotelName,
              availableRooms: Number(formData.availableRooms) || 0,
            }
          : undefined,
        // SEO data
        seoData: {
          metaTitle: seoData.metaTitle,
          metaDescription: seoData.metaDescription,
          keywords: seoData.keywords,
          slug: seoData.slug,
        },
      }

      console.log('📤 Sending update to API:', updateData)

      // Use API endpoint instead of service function
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la mise à jour')
      }

      const updatedProduct = await response.json()

      // Update images separately if needed
      if (finalImages.length > 0) {
        await fetch(`/api/products/${product.id}/images`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageUrls: finalImages }),
        })
      }

      onSave(updatedProduct as unknown as Product)
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
              formData={formData}
              types={types}
              handleInputChange={handleInputChange}
              setFormData={setFormData}
              itemVariants={itemVariants}
            />

            {/* Hotel Configuration - Conditional */}
            {formData.isHotel && (
              <motion.div variants={itemVariants}>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-2xl">
                  <CardHeader className="px-6 py-4 border-b border-amber-100">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <Users className="h-5 w-5 text-amber-700" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-amber-900">Configuration Hôtel</CardTitle>
                        <p className="text-amber-700 text-sm mt-0.5">
                          Configuration spécifique pour la gestion hôtelière
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="hotelName" className="text-amber-800">
                          Nom de l&apos;hôtel
                        </Label>
                        <Input
                          id="hotelName"
                          name="hotelName"
                          type="text"
                          placeholder="Ex: Hôtel des Jardins"
                          value={formData.hotelName}
                          onChange={handleInputChange}
                          className="bg-white/80 border-amber-200 focus:border-amber-400 focus:ring-amber-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="availableRooms" className="text-amber-800">
                          Nombre de chambres disponibles
                        </Label>
                        <Input
                          id="availableRooms"
                          name="availableRooms"
                          type="number"
                          min="1"
                          placeholder="Ex: 5"
                          value={formData.availableRooms}
                          onChange={handleInputChange}
                          className="bg-white/80 border-amber-200 focus:border-amber-400 focus:ring-amber-200"
                        />
                      </div>
                    </div>
                    <div className="bg-amber-100 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-amber-200 rounded-full">
                          <Home className="h-4 w-4 text-amber-700" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-amber-800 mb-1">
                            Fonctionnement Hôtelier
                          </h4>
                          <p className="text-xs text-amber-700 leading-relaxed">
                            Cette chambre représente un type de chambre dans votre hôtel. Si vous avez{' '}
                            <span className="font-semibold">{formData.availableRooms || 'X'}</span>{' '}
                            chambres de ce type, plusieurs clients pourront réserver en même temps.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Location & Contact Section */}
            <LocationContactSection
              formData={formData}
              setFormData={setFormData}
              itemVariants={itemVariants}
            />

            {/* Reuse ProductCharacteristicsForm from createProduct */}
            <ProductCharacteristicsForm
              formData={formData}
              onInputChange={handleInputChange}
              itemVariants={itemVariants}
            />

            {/* Reuse ProductPricingForm from createProduct */}
            <ProductPricingForm
              formData={{
                basePrice: formData.basePrice,
                basePriceMGA: formData.basePriceMGA,
              }}
              onInputChange={handleInputChange}
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
            {/* SEO Fields */}
            <motion.div variants={itemVariants}>
              <SEOFieldsCard
                seoData={seoData}
                onSeoChange={setSeoData}
                articleTitle={formData.name}
              />
            </motion.div>
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

      <CreateSpecialPriceModal
        isOpen={specialPriceModalOpen}
        onClose={() => setSpecialPriceModalOpen(false)}
        onSpecialPriceCreated={handleSpecialPriceCreated}
      />
    </div>
  )
}
