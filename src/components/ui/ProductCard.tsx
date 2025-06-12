import Link from 'next/link'
import Image from 'next/image'
import { Heart, Star, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react'
import { useState } from 'react'

interface Product {
  id: string
  name: string
  description: string
  address: string
  img?: { img: string }[] | null
  basePrice: string
  certified?: boolean
}

export default function ProductCard({ product }: { product: Product }) {
  const [isLiked, setIsLiked] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Generate a random rating for demo purposes (in real app, this would come from the product data)
  const rating = (4.0 + Math.random() * 1.0).toFixed(2)

  const images =
    product.img && product.img.length > 0
      ? product.img.filter(img => img.img && img.img.trim() !== '')
      : []
  const hasMultipleImages = images.length > 1
  const hasValidImages = images.length > 0

  const goToPrevious = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1))
    setImageError(false) // Reset error state when switching images
  }

  const goToNext = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1))
    setImageError(false) // Reset error state when switching images
  }

  const goToImage = (index: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex(index)
    setImageError(false) // Reset error state when switching images
  }

  return (
    <Link href={`/product/${product.id}`} className='block'>
      <div
        className='bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group'
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className='relative aspect-[4/3] w-full'>
          {hasValidImages && !imageError ? (
            <>
              <Image
                src={images[currentImageIndex].img}
                alt={product.name}
                fill
                className='object-cover transition-opacity duration-300'
                onError={() => setImageError(true)}
                sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
              />

              {/* Navigation Arrows - Only show on hover and with multiple images */}
              {hasMultipleImages && isHovered && (
                <>
                  <button
                    onClick={goToPrevious}
                    className='absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/80 hover:bg-white hover:scale-110 transition-all duration-200 shadow-lg opacity-0 group-hover:opacity-100'
                  >
                    <ChevronLeft className='w-4 h-4 text-gray-700' />
                  </button>

                  <button
                    onClick={goToNext}
                    className='absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/80 hover:bg-white hover:scale-110 transition-all duration-200 shadow-lg opacity-0 group-hover:opacity-100'
                  >
                    <ChevronRight className='w-4 h-4 text-gray-700' />
                  </button>
                </>
              )}
            </>
          ) : (
            <div className='bg-gradient-to-br from-gray-100 to-gray-200 h-full w-full flex flex-col items-center justify-center'>
              <ImageIcon className='w-12 h-12 text-gray-400 mb-3' />
              <span className='text-gray-500 text-sm font-medium'>Image non disponible</span>
              <span className='text-gray-400 text-xs mt-1'>Propriété sans photo</span>
            </div>
          )}

          {/* Heart Icon */}
          <button
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              setIsLiked(!isLiked)
            }}
            className='absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 hover:bg-white hover:scale-110 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md group/heart'
          >
            <Heart
              className={`w-4 h-4 transition-all duration-300 group-hover/heart:scale-110 ${
                isLiked
                  ? 'fill-red-500 text-red-500 drop-shadow-sm'
                  : 'text-gray-700 hover:text-red-400 group-hover/heart:text-red-500'
              }`}
            />
          </button>

          {/* Rating */}
          <div className='absolute top-3 left-3 z-10 bg-black/75 backdrop-blur-sm rounded-lg px-2.5 py-1.5 flex items-center gap-1'>
            <Star className='w-3.5 h-3.5 fill-white text-white' />
            <span className='text-sm font-medium text-white'>{rating}</span>
          </div>

          {/* Image Dots - Only show when there are multiple images */}
          {hasMultipleImages && hasValidImages && (
            <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1.5'>
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={e => goToImage(index, e)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentImageIndex
                      ? 'bg-white shadow-lg'
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <div className='p-4 space-y-2'>
          <div className='space-y-1'>
            <h3 className='font-semibold text-gray-900 text-base leading-tight line-clamp-1'>
              {product.address}
            </h3>
            <p className='text-gray-500 text-sm font-light line-clamp-1'>{product.name}</p>
          </div>

          <div className='flex items-center justify-between pt-1'>
            <div className='flex items-baseline gap-1'>
              <span className='font-bold text-gray-900 text-lg'>{product.basePrice}€</span>
              <span className='text-gray-400 text-sm font-light'>/ nuit</span>
            </div>
            {product.certified && (
              <div className='bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium'>
                Certifié
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
