import Link from 'next/link'
import Image from 'next/image'
import { Heart, Star, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react'
import { useState } from 'react'
import { getCityFromAddress, calculateAverageRating } from '@/lib/utils'
import { useFavorites } from '@/hooks/useFavorites'
import { motion } from 'framer-motion'

interface Review {
  grade: number
  welcomeGrade: number
  staff: number
  comfort: number
  equipment: number
  cleaning: number
}

interface Product {
  id: string
  name: string
  description: string
  address: string
  img?: { img: string }[] | null
  basePrice: string
  certified?: boolean
  reviews?: Review[]
}

export default function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { isFavorite, isLoading, toggleFavorite } = useFavorites(product.id)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const rating = product.reviews ? calculateAverageRating(product.reviews) : null

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
    setImageError(false)
  }

  const goToNext = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1))
    setImageError(false)
  }

  const goToImage = (index: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex(index)
    setImageError(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
    >
      <Link href={`/host/${product.id}`} className='block'>
        <motion.div
          className='bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group'
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          layoutId={`card-${product.id}`}
        >
          <div className='relative aspect-[4/3] w-full'>
            {hasValidImages && !imageError ? (
              <>
                <motion.div
                  key={currentImageIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className='w-full h-full'
                >
                  <Image
                    src={images[currentImageIndex].img}
                    alt={product.name}
                    fill
                    className='object-cover'
                    onError={() => setImageError(true)}
                    sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                  />
                </motion.div>

                {/* Navigation Arrows - Only show on hover and with multiple images */}
                {hasMultipleImages && isHovered && (
                  <>
                    <motion.button
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={goToPrevious}
                      className='absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/80 hover:bg-white hover:scale-110 transition-all duration-200 shadow-lg'
                    >
                      <ChevronLeft className='w-4 h-4 text-gray-700' />
                    </motion.button>

                    <motion.button
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={goToNext}
                      className='absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/80 hover:bg-white hover:scale-110 transition-all duration-200 shadow-lg'
                    >
                      <ChevronRight className='w-4 h-4 text-gray-700' />
                    </motion.button>
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
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              initial={false}
              animate={
                isFavorite
                  ? {
                      scale: [1, 1.2, 0.95, 1],
                      transition: {
                        duration: 0.4,
                        times: [0, 0.1, 0.3, 0.4],
                      },
                    }
                  : {}
              }
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                toggleFavorite()
              }}
              disabled={isLoading}
              className='absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <motion.div
                initial={false}
                animate={
                  isFavorite
                    ? {
                        scale: [1, 0.8, 1.3, 1],
                        transition: { duration: 0.4 },
                      }
                    : {}
                }
              >
                <Heart
                  className={`w-4 h-4 transition-all duration-300 ${
                    isFavorite
                      ? 'fill-red-500 text-red-500 drop-shadow-sm'
                      : 'text-gray-700 hover:text-red-400'
                  }`}
                />
              </motion.div>
            </motion.button>

            {/* Rating */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className='absolute top-3 left-3 z-10 bg-black/35 backdrop-blur-md rounded-lg px-2.5 py-1.5 flex items-center gap-1'
            >
              <div className='flex items-center gap-2'>
                <div className='flex items-center gap-1'>
                  {rating ? (
                    <>
                      <Star className='h-4 w-4 fill-white text-white' />
                      <span className='text-sm font-medium text-white'>{rating}</span>
                      <span className='text-sm text-white/80'>({product.reviews?.length})</span>
                    </>
                  ) : (
                    <>
                      <Star className='h-4 w-4 text-white/60' />
                      <span className='text-sm text-white/80'>(aucune note)</span>
                    </>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Image Dots */}
            {hasMultipleImages && hasValidImages && (
              <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1.5'>
                {images.map((_, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.2 }}
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

          <motion.div
            className='p-4 space-y-2'
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className='space-y-1'>
              <h3 className='font-semibold text-gray-900 text-base leading-tight line-clamp-1'>
                {getCityFromAddress(product.address)}
              </h3>
              <p className='text-gray-500 text-sm font-light line-clamp-1'>{product.name}</p>
            </div>

            <div className='flex items-center justify-between pt-1'>
              <div className='flex items-baseline gap-1'>
                <span className='font-bold text-gray-900 text-lg'>{product.basePrice}€</span>
                <span className='text-gray-400 text-sm font-light'>/ nuit</span>
              </div>
              {product.certified && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className='bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium'
                >
                  Certifié
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </Link>
    </motion.div>
  )
}
