import Image from 'next/image'
import { ChevronLeft, ChevronRight, Grid3X3, Expand } from 'lucide-react'
import { useState } from 'react'
import { getFullSizeImageUrl } from '@/lib/utils/imageUtils'

interface ImageGalleryProps {
  images: { img: string }[]
  productName: string
  currentImageIndex: number
  nextImage: () => void
  prevImage: () => void
  setShowAllPhotos?: (show: boolean) => void
  setShowFullscreen: (show: boolean) => void
  setCurrentImageIndex?: (index: number) => void
}

export default function ImageGallery({
  images,
  productName,
  currentImageIndex,
  nextImage,
  prevImage,
  setShowAllPhotos,
  setShowFullscreen,
  setCurrentImageIndex,
}: ImageGalleryProps) {
  const [showAllPhotosLocal, setShowAllPhotosLocal] = useState(false)

  // Variable intentionally unused - kept for API compatibility
  void setShowAllPhotos

  if (!images || images.length === 0) {
    return (
      <div className='bg-gray-200 h-[400px] md:h-[500px] flex items-center justify-center rounded-xl mb-8'>
        <span className='text-gray-500'>Aucune image disponible</span>
      </div>
    )
  }

  return (
    <div className='relative mb-8'>
      <div className='grid grid-cols-1 md:grid-cols-4 gap-2 h-[400px] md:h-[500px] rounded-xl overflow-hidden'>
        {/* Main Image */}
        <div className='md:col-span-2 relative group'>
          <Image
            src={getFullSizeImageUrl(images[currentImageIndex]?.img || images[0].img)}
            alt={productName}
            fill
            className='object-cover'
            unoptimized
          />
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
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
        </div>

        {/* Side Images */}
        <div className='hidden md:grid grid-cols-1 gap-2'>
          {images.slice(1, 3).map((img, index) => (
            <div
              key={index}
              className='relative cursor-pointer group'
              onClick={() => {
                if (setCurrentImageIndex) {
                  setCurrentImageIndex(index + 1)
                  // Petit délai pour laisser le state se mettre à jour
                  setTimeout(() => setShowFullscreen(true), 10)
                } else {
                  setShowFullscreen(true)
                }
              }}
            >
              <Image
                src={getFullSizeImageUrl(img.img)}
                alt={`${productName} ${index + 2}`}
                fill
                className='object-cover transition-transform group-hover:scale-105'
                unoptimized
                sizes='(max-width: 768px) 50vw, 25vw'
              />
              <div className='absolute inset-0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center pointer-events-none'>
                <Expand className='h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none' />
              </div>
            </div>
          ))}
        </div>

        <div className='hidden md:grid grid-cols-1 gap-2'>
          {images.slice(3, 5).map((img, index) => (
            <div
              key={index}
              className='relative cursor-pointer group'
              onClick={() => {
                if (setCurrentImageIndex) {
                  setCurrentImageIndex(index + 3)
                  // Petit délai pour laisser le state se mettre à jour
                  setTimeout(() => setShowFullscreen(true), 10)
                } else {
                  setShowFullscreen(true)
                }
              }}
            >
              <Image
                src={getFullSizeImageUrl(img.img)}
                alt={`${productName} ${index + 4}`}
                fill
                className='object-cover transition-transform group-hover:scale-105'
                unoptimized
                sizes='(max-width: 768px) 50vw, 25vw'
              />
              <div className='absolute inset-0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center pointer-events-none'>
                <Expand className='h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none' />
              </div>
            </div>
          ))}
          {images.length > 5 && (
            <button
              onClick={() => setShowAllPhotosLocal(!showAllPhotosLocal)}
              className='relative bg-gray-900/50 hover:bg-gray-900/70 transition-colors flex items-center justify-center text-white font-medium'
            >
              <Grid3X3 className='h-5 w-5 mr-2' />
              {showAllPhotosLocal ? 'Moins' : `+${images.length - 5}`} photos
            </button>
          )}
        </div>
      </div>

      {/* Images supplémentaires */}
      {showAllPhotosLocal && images.length > 5 && (
        <div className='mt-4'>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
            {images.slice(5).map((img, index) => (
              <div
                key={index + 5}
                className='relative h-32 md:h-40 rounded-lg overflow-hidden cursor-pointer group'
                onClick={() => {
                  if (setCurrentImageIndex) {
                    setCurrentImageIndex(index + 5)
                    // Petit délai pour laisser le state se mettre à jour
                    setTimeout(() => setShowFullscreen(true), 10)
                  } else {
                    setShowFullscreen(true)
                  }
                }}
              >
                <Image
                  src={getFullSizeImageUrl(img.img)}
                  alt={`${productName} ${index + 6}`}
                  fill
                  className='object-cover transition-transform group-hover:scale-105'
                  unoptimized
                  sizes='(max-width: 768px) 50vw, 25vw'
                />
                <div className='absolute inset-0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center pointer-events-none'>
                  <Expand className='h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none' />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
