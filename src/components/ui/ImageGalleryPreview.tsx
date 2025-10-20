'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Grid3X3, Expand } from 'lucide-react'
import { Button } from '@/components/ui/shadcnui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/shadcnui/dialog'

interface ImageFile {
  file: File | null // null for existing images from DB
  preview: string
  id: string
  isExisting?: boolean
  url?: string
}

interface ImageGalleryPreviewProps {
  images: ImageFile[]
  isOpen: boolean
  onClose: () => void
}

export default function ImageGalleryPreview({ images, isOpen, onClose }: ImageGalleryPreviewProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showAllPhotos, setShowAllPhotos] = useState(false)
  const [showFullscreen, setShowFullscreen] = useState(false)

  const nextImage = () => {
    setCurrentImageIndex(prev => (prev + 1) % images.length)
  }

  const previousImage = () => {
    setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length)
  }

  // Debug logs removed for production

  if (images.length === 0) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-6xl max-h-[90vh] p-0 overflow-hidden'>
        <DialogHeader className='p-6 pb-4 bg-white border-b'>
          <DialogTitle className='flex items-center justify-between'>
            <div>
              <h2 className='text-xl font-semibold'>Prévisualisation de la galerie</h2>
              <p className='text-sm text-gray-600 mt-1'>
                Aperçu de l&apos;affichage final sur votre annonce
              </p>
            </div>
            <Button onClick={onClose} variant='outline' size='sm'>
              Fermer
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className='p-6 bg-gray-50 max-h-[80vh] overflow-y-auto'>
          {/* Reproduction exacte de la galerie de la page produit */}
          <div className='relative mb-8'>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-2 h-[400px] md:h-[500px] rounded-xl overflow-hidden'>
              {/* Image principale */}
              <div className='md:col-span-2 relative group bg-gray-200'>
                {images[currentImageIndex]?.preview ? (
                  <Image
                    src={images[currentImageIndex].preview}
                    alt={`Aperçu ${currentImageIndex + 1}`}
                    fill
                    className='object-cover'
                    unoptimized
                  />
                ) : (
                  <div className='w-full h-full flex items-center justify-center text-gray-500'>
                    Image en cours de chargement...
                  </div>
                )}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={previousImage}
                      className='cursor-pointer absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-lg'
                    >
                      <ChevronLeft className='h-4 w-4' />
                    </button>
                    <button
                      onClick={nextImage}
                      className='cursor-pointer absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-lg'
                    >
                      <ChevronRight className='h-4 w-4' />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowFullscreen(true)}
                  className='cursor-pointer absolute right-4 top-4 bg-white/80 hover:bg-white rounded-full p-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-lg'
                >
                  <Expand className='h-4 w-4' />
                </button>
                {/* Badge image principale */}
                <div className='absolute bottom-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium'>
                  Photo #{currentImageIndex + 1}
                  {currentImageIndex === 0 && <span className='ml-1 text-xs'>(Principale)</span>}
                </div>
              </div>

              {/* Images secondaires - colonne 1 */}
              <div className='hidden md:grid grid-cols-1 gap-2'>
                {images.slice(1, 3).map((img, index) => (
                  <div
                    key={img.id}
                    className='relative cursor-pointer group bg-gray-200'
                    onClick={() => setCurrentImageIndex(index + 1)}
                  >
                    {img.preview ? (
                      <Image
                        src={img.preview}
                        alt={`Aperçu ${index + 2}`}
                        fill
                        className='object-cover transition-transform group-hover:scale-105'
                        unoptimized
                        sizes='(max-width: 768px) 50vw, 25vw'
                      />
                    ) : (
                      <div className='w-full h-full flex items-center justify-center text-gray-500 text-xs'>
                        Chargement...
                      </div>
                    )}
                    <div className='absolute inset-0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center pointer-events-none'>
                      <Expand className='h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none' />
                    </div>
                    {/* Numéro d'ordre */}
                    <div className='absolute top-2 left-2 bg-black/70 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-medium'>
                      {index + 2}
                    </div>
                  </div>
                ))}
              </div>

              {/* Images secondaires - colonne 2 */}
              <div className='hidden md:grid grid-cols-1 gap-2'>
                {images.slice(3, 5).map((img, index) => (
                  <div
                    key={img.id}
                    className='relative cursor-pointer group bg-gray-200'
                    onClick={() => setCurrentImageIndex(index + 3)}
                  >
                    {img.preview ? (
                      <Image
                        src={img.preview}
                        alt={`Aperçu ${index + 4}`}
                        fill
                        className='object-cover transition-transform group-hover:scale-105'
                        unoptimized
                        sizes='(max-width: 768px) 50vw, 25vw'
                      />
                    ) : (
                      <div className='w-full h-full flex items-center justify-center text-gray-500 text-xs'>
                        Chargement...
                      </div>
                    )}
                    <div className='absolute inset-0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center pointer-events-none'>
                      <Expand className='h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none' />
                    </div>
                    {/* Numéro d'ordre */}
                    <div className='absolute top-2 left-2 bg-black/70 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-medium'>
                      {index + 4}
                    </div>
                  </div>
                ))}
                {images.length > 5 && (
                  <button
                    onClick={() => setShowAllPhotos(!showAllPhotos)}
                    className='relative bg-gray-900/50 hover:bg-gray-900/70 transition-colors flex items-center justify-center text-white font-medium'
                  >
                    <Grid3X3 className='h-5 w-5 mr-2' />
                    {showAllPhotos ? 'Moins' : `+${images.length - 5}`} photos
                  </button>
                )}
              </div>
            </div>

            {/* Images supplémentaires */}
            {showAllPhotos && images.length > 5 && (
              <div className='mt-4'>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
                  {images.slice(5).map((img, index) => (
                    <div
                      key={img.id}
                      className='relative h-32 md:h-40 rounded-lg overflow-hidden cursor-pointer group bg-gray-200'
                      onClick={() => setCurrentImageIndex(index + 5)}
                    >
                      {img.preview ? (
                        <Image
                          src={img.preview}
                          alt={`Aperçu ${index + 6}`}
                          fill
                          className='object-cover transition-transform group-hover:scale-105'
                          unoptimized
                          sizes='(max-width: 768px) 50vw, 25vw'
                        />
                      ) : (
                        <div className='w-full h-full flex items-center justify-center text-gray-500 text-xs'>
                          Chargement...
                        </div>
                      )}
                      <div className='absolute inset-0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center pointer-events-none'>
                        <Expand className='h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none' />
                      </div>
                      {/* Numéro d'ordre */}
                      <div className='absolute top-2 left-2 bg-black/70 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-medium'>
                        {index + 6}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Info supplémentaire */}
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800'>
            <div className='flex items-start justify-between'>
              <div>
                <p className='font-medium'>✨ Aperçu de votre galerie d&apos;images</p>
                <p className='mt-1'>
                  Cette vue simule exactement l&apos;affichage final sur votre annonce publique.
                </p>
                <ul className='mt-2 space-y-1 text-blue-700'>
                  <li>• La première image sera votre photo principale</li>
                  <li>• Les visiteurs pourront naviguer entre les images</li>
                  <li>• L&apos;ordre des numéros correspond à votre organisation</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Modal plein écran */}
        {showFullscreen && (
          <div className='fixed inset-0 bg-black/90 z-[100] flex items-center justify-center'>
            <button
              onClick={() => setShowFullscreen(false)}
              className='absolute top-4 right-4 text-white/70 hover:text-white z-10 p-2'
            >
              <X className='h-6 w-6' />
            </button>
            <div className='relative w-full h-full max-w-5xl max-h-[90vh]'>
              {images[currentImageIndex]?.preview ? (
                <Image
                  src={images[currentImageIndex].preview}
                  alt={`Image ${currentImageIndex + 1}`}
                  fill
                  className='object-contain'
                  unoptimized
                />
              ) : (
                <div className='w-full h-full flex items-center justify-center text-white'>
                  Image en cours de chargement...
                </div>
              )}
              {/* Navigation en plein écran */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={previousImage}
                    className='absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-colors'
                  >
                    <ChevronLeft className='h-6 w-6' />
                  </button>
                  <button
                    onClick={nextImage}
                    className='absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-colors'
                  >
                    <ChevronRight className='h-6 w-6' />
                  </button>
                </>
              )}
              {/* Compteur */}
              <div className='absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm'>
                {currentImageIndex + 1} / {images.length}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
