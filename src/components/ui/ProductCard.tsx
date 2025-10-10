import React, { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, Star, ImageIcon } from 'lucide-react'
import { getCityFromAddress, calculateAverageRating, isProductSponsored } from '@/lib/utils'
import { useFavoritesOptimized } from '@/hooks/useFavoritesOptimized'
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
  originalBasePrice?: string
  specialPriceApplied?: boolean
  specialPriceInfo?: {
    pricesMga: string
    pricesEuro: string
    day: string[]
    startDate: Date | null
    endDate: Date | null
  }
  certified?: boolean
  reviews?: Review[]
  PromotedProduct?: Array<{
    id: string
    active: boolean
    start: Date
    end: Date
  }>
}

function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { isFavorite, isLoading, toggleFavorite } = useFavoritesOptimized(product.id)
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Debug logging
  console.log(`ProductCard ${product.id} - img structure:`, product.img)
  console.log(`ProductCard ${product.id} - img length:`, product.img?.length)

  // Memoize expensive calculations to prevent recalculation on every render
  const isSponsored = useMemo(() => 
    isProductSponsored(product.PromotedProduct), 
    [product.PromotedProduct]
  )

  const rating = useMemo(() => 
    product.reviews ? calculateAverageRating(product.reviews) : null, 
    [product.reviews]
  )

  // ✅ PERFORMANCE FIX: Utiliser directement l'URL de l'image migrée ou l'API thumbnail
  const hasImages = useMemo(() =>
    product.img && product.img.length > 0,
    [product.img]
  )

  // Générer l'URL de l'image en taille originale (pas de thumbnail pixelisé)
  const thumbnailUrl = useMemo(() => {
    if (product.img && product.img.length > 0 && product.img[0].img) {
      const imageUrl = product.img[0].img

      // Si l'image est migrée (commence par /uploads/), utiliser le format FULL
      if (imageUrl.startsWith('/uploads/')) {
        // Remplacer _thumb_ par _full_ pour avoir l'image en haute résolution
        return imageUrl.replace('_thumb_', '_full_')
      }

      // Si c'est une URL externe (Unsplash, etc.) ou base64, l'utiliser directement
      if (imageUrl.startsWith('http') || imageUrl.startsWith('data:image')) {
        return imageUrl
      }
    }

    // Fallback: pas d'image
    return ''
  }, [product.img, product.id])

  const hasValidImages = hasImages

  // Memoize motion props to prevent recreation
  const cardMotionProps = useMemo(() => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay: index * 0.1 },
    whileHover: { y: -5 }
  }), [index])

  const imageMotionProps = useMemo(() => ({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.3 }
  }), [])

  const contentMotionProps = useMemo(() => ({
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: 0.3 }
  }), [])

  // Memoize event handlers to prevent recreation and unnecessary re-renders
  const handleToggleFavorite = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite()
  }, [toggleFavorite])

  const handleImageError = useCallback(() => {
    setImageError(true)
  }, [])

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
  }, [])

  return (
    <motion.div {...cardMotionProps}>
      <Link href={`/host/${product.id}`} className='block'>
        <motion.div
          className='bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group'
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          layoutId={`card-${product.id}`}
        >
          <div className='relative aspect-[4/3] w-full'>
            {hasValidImages && !imageError ? (
              <motion.div
                {...imageMotionProps}
                className='w-full h-full'
              >
                {/* ✅ PERFORMANCE: Utiliser l'URL optimisée au lieu du base64 */}
                <Image
                  src={thumbnailUrl}
                  alt={product.name}
                  fill
                  className='object-cover'
                  onError={handleImageError}
                  sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                  loading='lazy'
                  placeholder='blur'
                  blurDataURL='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg=='
                />
              </motion.div>
            ) : (
              <div className='bg-gradient-to-br from-gray-100 to-gray-200 h-full w-full flex flex-col items-center justify-center'>
                <ImageIcon className='w-12 h-12 text-gray-400 mb-3' />
                <span className='text-gray-500 text-sm font-medium'>Image non disponible</span>
                <span className='text-gray-400 text-xs mt-1'>Propriété sans photo</span>
              </div>
            )}

            {/* Sponsored Badge */}
            {isSponsored && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className='absolute top-3 left-3 z-10 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg border border-white/20'
              >
                <div className='flex items-center gap-1'>
                  <Star className='w-3 h-3 fill-current' />
                  Sponsorisé
                </div>
              </motion.div>
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
              onClick={handleToggleFavorite}
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
                      <span className='text-sm text-white/80'>(aucun avis)</span>
                    </>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Image Dots - Removed for performance (single thumbnail only) */}
          </div>

          <motion.div
            className='p-4 space-y-2'
            {...contentMotionProps}
          >
            <div className='space-y-1'>
              <h3 className='font-semibold text-gray-900 text-base leading-tight line-clamp-1'>
                {getCityFromAddress(product.address)}
              </h3>
              <p className='text-gray-500 text-sm font-light line-clamp-1'>{product.name}</p>
            </div>

            <div className='flex items-center justify-between pt-1'>
              <div className='flex flex-col gap-1'>
                <div className='flex items-baseline gap-1'>
                  <span className='font-bold text-gray-900 text-lg'>{product.basePrice}€</span>
                  <span className='text-gray-400 text-sm font-light'>/ nuit</span>
                </div>
                {product.specialPriceApplied && product.originalBasePrice && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='bg-gradient-to-r from-orange-100 to-red-100 border border-orange-200 rounded-lg px-2 py-1'
                  >
                    <div className='flex items-center gap-1'>
                      <span className='text-xs text-orange-700 font-medium'>Prix de base:</span>
                      <span className='text-xs text-orange-800 font-semibold line-through'>{product.originalBasePrice}€</span>
                    </div>
                  </motion.div>
                )}
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

// Custom comparison function for React.memo to optimize re-renders
const arePropsEqual = (prevProps: { product: Product; index?: number }, nextProps: { product: Product; index?: number }) => {
  // Check if it's the same product by id
  if (prevProps.product.id !== nextProps.product.id) {
    return false
  }

  // Check if index changed
  if (prevProps.index !== nextProps.index) {
    return false
  }

  // Check critical product properties that affect rendering
  const prev = prevProps.product
  const next = nextProps.product

  if (
    prev.name !== next.name ||
    prev.address !== next.address ||
    prev.basePrice !== next.basePrice ||
    prev.originalBasePrice !== next.originalBasePrice ||
    prev.specialPriceApplied !== next.specialPriceApplied ||
    prev.certified !== next.certified
  ) {
    return false
  }

  // Check images array (shallow comparison)
  if (prev.img?.length !== next.img?.length) {
    return false
  }

  // Check if PromotedProduct status changed (for sponsored badge)
  const prevPromoted = prev.PromotedProduct?.length || 0
  const nextPromoted = next.PromotedProduct?.length || 0
  if (prevPromoted !== nextPromoted) {
    return false
  }

  // Check reviews for rating calculation (shallow comparison)
  if (prev.reviews?.length !== next.reviews?.length) {
    return false
  }

  return true
}

export default React.memo(ProductCard, arePropsEqual)
