import Image from 'next/image'
import { ChevronLeft, ChevronRight, Grid3X3 } from 'lucide-react'

interface ImageGalleryProps {
  images: { img: string }[]
  productName: string
  currentImageIndex: number
  nextImage: () => void
  prevImage: () => void
  setShowAllPhotos: (show: boolean) => void
}

export default function ImageGallery({
  images,
  productName,
  currentImageIndex,
  nextImage,
  prevImage,
  setShowAllPhotos,
}: ImageGalleryProps) {
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
            src={images[currentImageIndex]?.img || images[0].img}
            alt={productName}
            fill
            className='object-cover'
          />
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className='absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-lg'
              >
                <ChevronLeft className='h-4 w-4' />
              </button>
              <button
                onClick={nextImage}
                className='absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-lg'
              >
                <ChevronRight className='h-4 w-4' />
              </button>
            </>
          )}
        </div>

        {/* Side Images */}
        <div className='hidden md:grid grid-cols-1 gap-2'>
          {images.slice(1, 3).map((img, index) => (
            <div key={index} className='relative'>
              <Image
                src={img.img}
                alt={`${productName} ${index + 2}`}
                fill
                className='object-cover'
              />
            </div>
          ))}
        </div>

        <div className='hidden md:grid grid-cols-1 gap-2'>
          {images.slice(3, 5).map((img, index) => (
            <div key={index} className='relative'>
              <Image
                src={img.img}
                alt={`${productName} ${index + 4}`}
                fill
                className='object-cover'
              />
            </div>
          ))}
          {images.length > 5 && (
            <button
              onClick={() => setShowAllPhotos(true)}
              className='relative bg-gray-900/50 hover:bg-gray-900/70 transition-colors flex items-center justify-center text-white font-medium'
            >
              <Grid3X3 className='h-5 w-5 mr-2' />+{images.length - 5} photos
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
