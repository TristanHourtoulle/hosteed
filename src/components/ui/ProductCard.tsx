import React, { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, Star, ImageIcon, Clock } from 'lucide-react'
import { getCityFromAddress, calculateAverageRating, isProductSponsored } from '@/lib/utils'
import { useFavoritesOptimized } from '@/hooks/useFavoritesOptimized'
import { motion } from 'framer-motion'
import PromotionBadge from '@/components/promotions/PromotionBadge'
import { getDaysUntilEnd, getUrgencyMessage } from '@/lib/utils/promotion'
import { getProductUrl } from '@/lib/utils/routing'

interface Review {
  grade: number
  welcomeGrade: number
  staff: number
  comfort: number
  equipment: number
  cleaning: number
}

interface ProductPromotion {
  id: string
  discountPercentage: number
  startDate: Date
  endDate: Date
  isActive: boolean
}

interface Product {
  id: string
  name: string
  description: string
  address: string
  slug?: string | null
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
  promotions?: ProductPromotion[]
}

function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { isFavorite, isLoading, toggleFavorite } = useFavoritesOptimized(product.id)
  const [imageError, setImageError] = useState(false)
  const [, setIsHovered] = useState(false)

  // Debug logging
  console.log(`ProductCard ${product.id} - img structure:`, product.img)
  console.log(`ProductCard ${product.id} - img length:`, product.img?.length)

  // Memoize expensive calculations to prevent recalculation on every render
  const isSponsored = useMemo(
    () => isProductSponsored(product.PromotedProduct),
    [product.PromotedProduct]
  )

  const rating = useMemo(
    () => (product.reviews ? calculateAverageRating(product.reviews) : null),
    [product.reviews]
  )

  // Promotion logic
  const activePromotion = useMemo(() => {
    if (!product.promotions || product.promotions.length === 0) return null
    const now = new Date()
    return (
      product.promotions.find(
        promo =>
          promo.isActive && new Date(promo.startDate) <= now && new Date(promo.endDate) >= now
      ) || null
    )
  }, [product.promotions])

  const hasActivePromotion = activePromotion !== null

  const { displayPrice, originalPrice, savings } = useMemo(() => {
    const basePrice = parseFloat(product.basePrice)

    if (hasActivePromotion && activePromotion) {
      const discounted = basePrice * (1 - activePromotion.discountPercentage / 100)
      return {
        displayPrice: discounted.toFixed(2),
        originalPrice: basePrice.toFixed(2),
        savings: (basePrice - discounted).toFixed(2),
      }
    }

    // Fallback to special price if exists
    if (product.specialPriceApplied && product.originalBasePrice) {
      return {
        displayPrice: product.basePrice,
        originalPrice: product.originalBasePrice,
        savings: (parseFloat(product.originalBasePrice) - basePrice).toFixed(2),
      }
    }

    return {
      displayPrice: basePrice.toFixed(2),
      originalPrice: null,
      savings: null,
    }
  }, [
    product.basePrice,
    product.originalBasePrice,
    product.specialPriceApplied,
    hasActivePromotion,
    activePromotion,
  ])

  const urgencyInfo = useMemo(() => {
    if (!activePromotion) return null
    const daysUntilEnd = getDaysUntilEnd(new Date(activePromotion.endDate))
    const message = getUrgencyMessage(new Date(activePromotion.endDate))
    return daysUntilEnd > 0 && daysUntilEnd <= 7 ? message : null
  }, [activePromotion])

  // ✅ PERFORMANCE FIX: Utiliser directement l'URL de l'image migrée ou l'API thumbnail
  const hasImages = useMemo(() => product.img && product.img.length > 0, [product.img])

  // Générer l'URL de l'image (DB contient déjà les URLs _full_ après migration)
  const thumbnailUrl = useMemo(() => {
    if (product.img && product.img.length > 0 && product.img[0].img) {
      console.log(`[ProductCard ${product.id}] Image URL:`, product.img[0].img)
      return product.img[0].img
    }
    console.log(
      `[ProductCard ${product.id}] NO IMAGE - hasImg:`,
      !!product.img,
      'length:',
      product.img?.length
    )
    return ''
  }, [product.img, product.id])

  const hasValidImages = hasImages

  // Memoize motion props to prevent recreation
  const cardMotionProps = useMemo(
    () => ({
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.5, delay: index * 0.1 },
      whileHover: { y: -5 },
    }),
    [index]
  )

  const imageMotionProps = useMemo(
    () => ({
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.3 },
    }),
    []
  )

  const contentMotionProps = useMemo(
    () => ({
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      transition: { delay: 0.3 },
    }),
    []
  )

  // Memoize event handlers to prevent recreation and unnecessary re-renders
  const handleToggleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      toggleFavorite()
    },
    [toggleFavorite]
  )

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
      <Link href={getProductUrl(product)} className='block'>
        <motion.div
          className='bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group'
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          layoutId={`card-${product.id}`}
        >
          <div className='relative aspect-[4/3] w-full'>
            {hasValidImages && !imageError ? (
              <motion.div {...imageMotionProps} className='w-full h-full'>
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
                  unoptimized={thumbnailUrl.startsWith('/uploads/')}
                />
              </motion.div>
            ) : (
              <div className='bg-gradient-to-br from-gray-100 to-gray-200 h-full w-full flex flex-col items-center justify-center'>
                <ImageIcon className='w-12 h-12 text-gray-400 mb-3' />
                <span className='text-gray-500 text-sm font-medium'>Image non disponible</span>
                <span className='text-gray-400 text-xs mt-1'>Propriété sans photo</span>
              </div>
            )}

            {/* Promotion Badge */}
            {hasActivePromotion && activePromotion && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className='absolute top-3 left-3 z-10'
              >
                <PromotionBadge discountPercentage={activePromotion.discountPercentage} size='md' />
              </motion.div>
            )}

            {/* Urgency Badge */}
            {urgencyInfo && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className='absolute top-14 left-3 z-10 bg-red-100 text-red-700 px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm font-medium border border-red-200 flex items-center gap-1'
              >
                <Clock className='w-3 h-3' />
                {urgencyInfo}
              </motion.div>
            )}

            {/* Sponsored Badge (moved to right if promotion exists) */}
            {isSponsored && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`absolute top-3 z-10 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg border border-white/20 ${
                  hasActivePromotion ? 'right-3' : 'left-3'
                }`}
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

          <motion.div className='p-4 space-y-2' {...contentMotionProps}>
            <div className='space-y-1'>
              <h3 className='font-semibold text-gray-900 text-base leading-tight line-clamp-1'>
                {getCityFromAddress(product.address)}
              </h3>
              <p className='text-gray-500 text-sm font-light line-clamp-1'>{product.name}</p>
            </div>

            <div className='flex items-center justify-between pt-1'>
              <div className='flex flex-col gap-1'>
                {/* Prix avec ou sans promotion */}
                <div className='flex flex-col gap-1'>
                  {originalPrice && (
                    <span className='text-sm text-gray-400 line-through'>{originalPrice}€</span>
                  )}
                  <div className='flex items-baseline gap-1'>
                    <span
                      className={`font-bold text-lg ${hasActivePromotion ? 'text-green-600' : 'text-gray-900'}`}
                    >
                      {displayPrice}€
                    </span>
                    <span className='text-gray-400 text-sm font-light'>/ nuit</span>
                  </div>
                  {savings && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className='bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg px-2 py-1'
                    >
                      <span className='text-xs text-green-700 font-semibold'>
                        Économisez {savings}€
                      </span>
                    </motion.div>
                  )}
                </div>
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
const arePropsEqual = (
  prevProps: { product: Product; index?: number },
  nextProps: { product: Product; index?: number }
) => {
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
