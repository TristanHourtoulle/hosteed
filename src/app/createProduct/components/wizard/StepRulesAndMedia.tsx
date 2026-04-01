'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Camera,
  Upload,
  FileText,
  Plus,
  X,
  Users,
} from 'lucide-react'
import { ProductRulesForm } from '../ProductRulesForm'
import { ProductPropertyInfoForm } from '../ProductPropertyInfoForm'
import SortableImageGrid from '@/components/ui/SortableImageGrid'
import ImageGalleryPreview from '@/components/ui/ImageGalleryPreview'
import SEOFieldsCard from '@/components/ui/SEOFieldsCard'
import { UserCombobox } from '@/components/ui/UserCombobox'
import { MAX_IMAGES } from '../../utils/constants'
import type { FormData, ImageFile, NearbyPlace } from '../../types'

const stepVariants = {
  enter: { opacity: 0, x: 30 },
  center: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -30, transition: { duration: 0.2 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

interface SEOData {
  metaTitle?: string
  metaDescription?: string
  keywords?: string
  slug?: string
}

interface StepRulesAndMediaProps {
  formData: FormData
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
  imageUpload: {
    selectedFiles: ImageFile[]
    dragActive: boolean
    isUploadingImages: boolean
    handleFileSelect: (files: File[]) => Promise<void>
    handleDrag: (e: React.DragEvent, active: boolean) => void
    handleDrop: (e: React.DragEvent) => Promise<void>
    deleteImage: (id: string) => void
    setSelectedFiles: React.Dispatch<React.SetStateAction<ImageFile[]>>
  }
  seoData: SEOData
  setSeoData: React.Dispatch<React.SetStateAction<SEOData>>
  session: { user?: { roles?: string } } | null
  users: { id: string; email: string; name?: string | null }[]
  assignToOtherUser: boolean
  setAssignToOtherUser: (v: boolean) => void
  userSelected: string
  setUserSelected: (v: string) => void
}

export function StepRulesAndMedia({
  formData,
  setFormData,
  imageUpload,
  seoData,
  setSeoData,
  session,
  users,
  assignToOtherUser,
  setAssignToOtherUser,
  userSelected,
  setUserSelected,
}: StepRulesAndMediaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showGalleryPreview, setShowGalleryPreview] = useState(false)
  const [newPlace, setNewPlace] = useState<NearbyPlace>({
    name: '',
    distance: '',
    unit: 'mètres',
  })

  const handleFieldChange = (field: keyof FormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await imageUpload.handleFileSelect(Array.from(e.target.files))
    }
  }

  const addNearbyPlace = () => {
    if (newPlace.name.trim()) {
      setFormData(prev => ({
        ...prev,
        nearbyPlaces: [...prev.nearbyPlaces, { ...newPlace }],
      }))
      setNewPlace({ name: '', distance: '', unit: 'mètres' })
    }
  }

  const removeNearbyPlace = (index: number) => {
    setFormData(prev => ({
      ...prev,
      nearbyPlaces: prev.nearbyPlaces.filter((_, i) => i !== index),
    }))
  }

  return (
    <motion.div
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="space-y-6"
    >
      {/* Rules */}
      <ProductRulesForm
        formData={formData as never}
        onChange={handleFieldChange as never}
        itemVariants={itemVariants}
      />

      {/* Property Info */}
      <ProductPropertyInfoForm
        formData={formData as never}
        onChange={handleFieldChange as never}
        itemVariants={itemVariants}
      />

      {/* Additional Info (Nearby places, transportation, accessibility) */}
      <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl">
        <CardHeader className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-cyan-50 rounded-lg">
              <FileText className="h-5 w-5 text-cyan-600" />
            </div>
            <CardTitle className="text-lg">Informations complémentaires</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-2">
              <input
                id="accessibility"
                type="checkbox"
                checked={formData.accessibility}
                onChange={(e) => handleFieldChange('accessibility', e.target.checked)}
                className="w-4 h-4 text-cyan-600 bg-gray-100 border-gray-300 rounded focus:ring-cyan-500"
              />
              <label htmlFor="accessibility" className="text-sm font-medium text-slate-700">
                Accessible aux personnes à mobilité réduite
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                id="petFriendly"
                type="checkbox"
                checked={formData.petFriendly}
                onChange={(e) => handleFieldChange('petFriendly', e.target.checked)}
                className="w-4 h-4 text-cyan-600 bg-gray-100 border-gray-300 rounded focus:ring-cyan-500"
              />
              <label htmlFor="petFriendly" className="text-sm font-medium text-slate-700">
                Animaux acceptés
              </label>
            </div>
          </div>

          {/* Nearby Places */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-slate-700">Lieux à proximité</label>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-lg">
              <Input
                placeholder="Nom du lieu"
                value={newPlace.name}
                onChange={e => setNewPlace(prev => ({ ...prev, name: e.target.value }))}
                className="border-slate-200"
              />
              <Input
                placeholder="Distance"
                value={newPlace.distance}
                onChange={e => setNewPlace(prev => ({ ...prev, distance: e.target.value }))}
                className="border-slate-200"
              />
              <select
                value={newPlace.unit}
                onChange={e => setNewPlace(prev => ({ ...prev, unit: e.target.value as 'mètres' | 'kilomètres' }))}
                className="px-3 py-2 border border-slate-200 rounded-md focus:border-cyan-300 focus:ring-cyan-200"
              >
                <option value="mètres">mètres</option>
                <option value="kilomètres">kilomètres</option>
              </select>
              <Button type="button" onClick={addNearbyPlace} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>
            {formData.nearbyPlaces.length > 0 && (
              <div className="space-y-2">
                {formData.nearbyPlaces.map((place, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                    <span className="text-sm text-slate-700">
                      <strong>{place.name}</strong>
                      {place.distance && <span className="text-slate-500 ml-2">à {place.distance} {place.unit}</span>}
                    </span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeNearbyPlace(index)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="transportation" className="text-sm font-medium text-slate-700">
              Moyens de transport (séparés par des virgules)
            </label>
            <Input
              id="transportation"
              value={formData.transportation}
              onChange={e => handleFieldChange('transportation', e.target.value)}
              placeholder="Bus, Taxi, Taxi moto, Cyclo pousse, Tuk tuk"
              className="border-slate-200 focus:border-cyan-300 focus:ring-cyan-200"
            />
          </div>
        </CardContent>
      </Card>

      {/* Photos */}
      <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl">
        <CardHeader className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-pink-50 rounded-lg">
              <Camera className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Photos de l&apos;hébergement</CardTitle>
              <p className="text-slate-500 text-sm mt-0.5">
                Ajoutez des photos attrayantes (maximum {MAX_IMAGES})
                {imageUpload.selectedFiles.length > 0 && (
                  <span className="ml-2 font-medium text-blue-600">
                    {imageUpload.selectedFiles.length} photo{imageUpload.selectedFiles.length > 1 ? 's' : ''} sélectionnée{imageUpload.selectedFiles.length > 1 ? 's' : ''}
                  </span>
                )}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              imageUpload.dragActive
                ? 'border-pink-400 bg-pink-50'
                : 'border-slate-300 hover:border-pink-300 hover:bg-pink-25'
            }`}
            onDragEnter={e => imageUpload.handleDrag(e, true)}
            onDragLeave={e => imageUpload.handleDrag(e, false)}
            onDragOver={e => imageUpload.handleDrag(e, true)}
            onDrop={imageUpload.handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFiles}
              className="hidden"
            />
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <Upload className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Glissez vos photos ici ou{' '}
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="text-pink-600 hover:text-pink-700 underline">
                    parcourez
                  </button>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  PNG, JPG, JPEG, WEBP (compressées automatiquement)
                  {imageUpload.isUploadingImages && (
                    <span className="block mt-1 text-blue-600 font-medium animate-pulse">
                      Compression en cours...
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <SortableImageGrid
            images={imageUpload.selectedFiles}
            onReorder={newOrder => imageUpload.setSelectedFiles(newOrder)}
            onRemove={imageUpload.deleteImage}
            onPreview={() => setShowGalleryPreview(true)}
          />

          <ImageGalleryPreview
            images={imageUpload.selectedFiles}
            isOpen={showGalleryPreview}
            onClose={() => setShowGalleryPreview(false)}
          />
        </CardContent>
      </Card>

      {/* Admin - Assign to other user */}
      {session?.user?.roles === 'ADMIN' && (
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl">
          <CardHeader className="px-6 py-4 border-b border-orange-100">
            <CardTitle className="flex items-center gap-3 text-orange-800">
              <Users className="h-5 w-5 text-orange-600" />
              Administration - Assigner l&apos;annonce
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="assignToOtherUser"
                checked={assignToOtherUser}
                onChange={e => setAssignToOtherUser(e.target.checked)}
                className="rounded border-orange-300 focus:ring-orange-200"
              />
              <label htmlFor="assignToOtherUser" className="text-sm font-medium text-orange-700">
                Assigner cette annonce à un autre utilisateur
              </label>
            </div>
            {assignToOtherUser && (
              <UserCombobox
                users={users}
                value={userSelected}
                onValueChange={setUserSelected}
                placeholder="Choisir un utilisateur..."
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* SEO */}
      <SEOFieldsCard
        seoData={seoData}
        onSeoChange={setSeoData}
        articleTitle={formData.name}
      />
    </motion.div>
  )
}
