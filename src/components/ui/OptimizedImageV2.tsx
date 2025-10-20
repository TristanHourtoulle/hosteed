'use client'

import React, { useState, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useLazyImageLoading } from '@/hooks/useIntersectionObserver'
import { usePerformanceTracking } from '@/hooks/usePerformanceTracking'
import { OptimizedImageData } from '@/lib/services/image-optimization.service'

/**
 * OptimizedImageV2 - Phase 5 UX Optimizations
 * Version améliorée avec Intersection Observer avancé et performance tracking
 * Améliore la performance perçue de +40% selon PERFORMANCE_ROADMAP.md
 */

interface OptimizedImageV2Props {
  // Image data (supports both legacy base64 and new optimized format)
  src?: string
  optimizedData?: OptimizedImageData
  alt: string

  // Display options
  width?: number
  height?: number
  fill?: boolean
  priority?: boolean

  // Responsive behavior
  sizes?: string
  quality?: number

  // Performance options - Phase 5 enhancements
  lazy?: boolean
  placeholder?: 'blur' | 'empty' | 'shimmer' | 'dominant-color'
  blurDataURL?: string
  preloadMargin?: string // Distance avant d'être visible pour commencer le chargement

  // Visual options
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  objectPosition?: string
  className?: string

  // Accessibility
  loading?: 'lazy' | 'eager'
  fetchPriority?: 'high' | 'low' | 'auto'

  // Event handlers
  onLoad?: () => void
  onError?: () => void
  onVisible?: () => void // Nouveau: quand l'image devient visible

  // Progressive enhancement - Phase 5
  showDominantColor?: boolean
  enableModernFormats?: boolean
  enableProgressiveLoading?: boolean // Charge l'image en plusieurs étapes
  trackPerformance?: boolean // Active le tracking de performance

  // Animation options
  fadeInDuration?: number
  animateOnLoad?: boolean
}

const OptimizedImageV2: React.FC<OptimizedImageV2Props> = ({
  src,
  optimizedData,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 85,
  // lazy = true, // Currently not used in this implementation
  placeholder = 'shimmer',
  blurDataURL,
  preloadMargin = '100px',
  objectFit = 'cover',
  objectPosition = 'center',
  className,
  loading,
  fetchPriority = 'auto',
  onLoad,
  onError,
  onVisible,
  // showDominantColor = true, // Currently not used in this implementation
  enableModernFormats = true,
  enableProgressiveLoading = true,
  trackPerformance = true,
  fadeInDuration = 300,
  animateOnLoad = true,
}) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [lowQualityLoaded, setLowQualityLoaded] = useState(false)

  // Performance tracking - Phase 5
  const {
    // markInteraction, // Currently not used in this implementation
    measureOperation,
    sendMetric,
    isEnabled: performanceEnabled,
  } = usePerformanceTracking({
    componentName: 'OptimizedImageV2',
    trackInteractions: false,
    disabled: !trackPerformance,
  })

  // Intersection Observer pour lazy loading avancé
  const {
    ref: imageRef,
    isVisible,
    // loaded, // Currently not used in this implementation
    // error, // Currently not used in this implementation
    handleLoad: handleIntersectionLoad,
    handleError: handleIntersectionError,
    shouldLoad,
  } = useLazyImageLoading<HTMLDivElement>({
    onVisible: () => {
      onVisible?.()
      if (performanceEnabled) {
        sendMetric('imageVisible', 1, { alt, src: getImageSource() || 'unknown' })
      }
    },
    preloadMargin,
    freezeOnceVisible: true,
  })

  // Determine image source and format
  const getImageSource = useCallback(() => {
    if (optimizedData) {
      if (enableModernFormats) {
        return optimizedData.avifUrl || optimizedData.webpUrl || optimizedData.originalUrl
      }
      return optimizedData.originalUrl
    }
    return src
  }, [optimizedData, enableModernFormats, src])

  // Get low quality placeholder for progressive loading
  const getLowQualitySource = useCallback(() => {
    if (optimizedData?.thumbnailUrl) {
      return optimizedData.thumbnailUrl
    }
    // Generate a very low quality version by appending quality parameter
    const source = getImageSource()
    if (source && !source.startsWith('data:')) {
      return `${source}?q=10&w=50` // Very low quality, small size
    }
    return null
  }, [optimizedData, getImageSource])

  // Generate blur data URL
  const getBlurDataURL = useCallback((): string => {
    if (blurDataURL) return blurDataURL

    if (optimizedData?.dominantColor) {
      return `data:image/svg+xml;base64,${Buffer.from(
        `
        <svg width="${width || 400}" height="${height || 300}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:${optimizedData.dominantColor};stop-opacity:1" />
              <stop offset="100%" style="stop-color:${optimizedData.dominantColor};stop-opacity:0.7" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grad)"/>
        </svg>
      `
      ).toString('base64')}`
    }

    return `data:image/svg+xml;base64,${Buffer.from(
      `
      <svg width="${width || 400}" height="${height || 300}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
      </svg>
    `
    ).toString('base64')}`
  }, [blurDataURL, optimizedData, width, height])

  // Generate enhanced placeholders
  const getPlaceholderContent = useMemo(() => {
    const baseStyle = {
      width: fill ? '100%' : width,
      height: fill ? '100%' : height,
    }

    switch (placeholder) {
      case 'shimmer':
        return (
          <div
            className={cn(
              'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse',
              'bg-[length:200%_100%] animate-[shimmer_2s_infinite]',
              className
            )}
            style={baseStyle}
          />
        )

      case 'dominant-color':
        if (optimizedData?.dominantColor) {
          return (
            <div
              className={cn('animate-pulse', className)}
              style={{
                backgroundColor: optimizedData.dominantColor,
                ...baseStyle,
              }}
            />
          )
        }
        break

      case 'blur':
        if (blurDataURL || optimizedData?.blurhash) {
          return (
            <div
              className={cn('bg-gray-200', className)}
              style={{
                backgroundImage: `url(${getBlurDataURL()})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(2px)',
                ...baseStyle,
              }}
            />
          )
        }
        break

      default:
        return <div className={cn('bg-gray-200', className)} style={baseStyle} />
    }

    return <div className={cn('bg-gray-200 animate-pulse', className)} style={baseStyle} />
  }, [placeholder, optimizedData, blurDataURL, className, fill, width, height, getBlurDataURL])

  // Handle image loading with performance tracking
  const handleImageLoad = useCallback(() => {
    measureOperation('imageLoadComplete', () => {
      setImageState('loaded')
      handleIntersectionLoad()
      onLoad?.()

      if (performanceEnabled) {
        sendMetric('imageLoaded', 1, {
          alt,
          src: getImageSource() || 'unknown',
          progressive: enableProgressiveLoading && lowQualityLoaded,
        })
      }
    })
  }, [
    measureOperation,
    handleIntersectionLoad,
    onLoad,
    performanceEnabled,
    sendMetric,
    alt,
    getImageSource,
    enableProgressiveLoading,
    lowQualityLoaded,
  ])

  const handleImageError = useCallback(() => {
    setImageState('error')
    handleIntersectionError()
    onError?.()

    if (performanceEnabled) {
      sendMetric('imageError', 1, { alt, src: getImageSource() || 'unknown' })
    }
  }, [handleIntersectionError, onError, performanceEnabled, sendMetric, alt, getImageSource])

  // Handle progressive loading
  const handleLowQualityLoad = useCallback(() => {
    setLowQualityLoaded(true)
    if (performanceEnabled) {
      sendMetric('lowQualityImageLoaded', 1, { alt })
    }
  }, [performanceEnabled, sendMetric, alt])

  const imageSource = getImageSource()
  const lowQualitySource = getLowQualitySource()
  const shouldLoadImage = priority || shouldLoad || isVisible

  // Error state
  if (imageState === 'error') {
    return (
      <div
        ref={imageRef}
        className={cn(
          'bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200 rounded',
          className
        )}
        style={{ width: fill ? '100%' : width, height: fill ? '100%' : height }}
        role='img'
        aria-label={`Image failed to load: ${alt}`}
      >
        <div className='text-center p-4'>
          <div className='w-8 h-8 mx-auto mb-2 bg-gray-300 rounded opacity-50' />
          <p className='text-xs text-gray-500'>Image indisponible</p>
        </div>
      </div>
    )
  }

  // Placeholder state
  if (!shouldLoadImage || !imageSource) {
    return (
      <div ref={imageRef} className={cn('relative overflow-hidden', className)}>
        {getPlaceholderContent}
      </div>
    )
  }

  // Progressive loading with low quality first
  if (
    enableProgressiveLoading &&
    lowQualitySource &&
    !lowQualityLoaded &&
    imageState === 'loading'
  ) {
    return (
      <div ref={imageRef} className={cn('relative overflow-hidden', className)}>
        {/* Low quality image */}
        <Image
          src={lowQualitySource}
          alt={alt}
          width={width}
          height={height}
          fill={fill}
          className='object-cover filter blur-sm transition-opacity duration-200 opacity-80'
          onLoad={handleLowQualityLoad}
          onError={handleLowQualityLoad}
          priority={priority}
          sizes={sizes}
          quality={10}
        />

        {/* High quality image overlay */}
        {lowQualityLoaded && (
          <Image
            src={imageSource}
            alt={alt}
            width={width}
            height={height}
            fill={fill}
            className={cn(
              'object-cover transition-opacity duration-300 opacity-0',
              objectFit ? `object-${objectFit}` : ''
            )}
            style={{ objectPosition }}
            onLoad={handleImageLoad}
            onError={handleImageError}
            priority={priority}
            sizes={sizes}
            quality={quality}
            loading={loading}
          />
        )}
      </div>
    )
  }

  // Standard image loading
  return (
    <div ref={imageRef} className={cn('relative overflow-hidden', className)}>
      {imageState === 'loading' && getPlaceholderContent}

      <Image
        src={imageSource}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        className={cn(
          'object-cover',
          objectFit ? `object-${objectFit}` : '',
          animateOnLoad && {
            'transition-opacity duration-300': true,
            'opacity-0': imageState === 'loading',
            'opacity-100': imageState === 'loaded',
          }
        )}
        style={{
          objectPosition,
          transitionDuration: animateOnLoad ? `${fadeInDuration}ms` : undefined,
        }}
        onLoad={handleImageLoad}
        onError={handleImageError}
        priority={priority}
        sizes={sizes}
        quality={quality}
        loading={loading}
        fetchPriority={fetchPriority}
        placeholder={placeholder === 'blur' ? 'blur' : 'empty'}
        blurDataURL={placeholder === 'blur' ? getBlurDataURL() : undefined}
      />
    </div>
  )
}

/**
 * Composants spécialisés pour différents cas d'usage
 */

// Pour ProductCard - optimisé pour les listes
export const ProductCardImage: React.FC<
  Omit<OptimizedImageV2Props, 'placeholder' | 'enableProgressiveLoading'>
> = props => (
  <OptimizedImageV2
    {...props}
    placeholder='shimmer'
    enableProgressiveLoading={true}
    preloadMargin='200px'
    trackPerformance={true}
  />
)

// Pour Hero sections - qualité maximale
export const HeroImage: React.FC<Omit<OptimizedImageV2Props, 'priority' | 'lazy'>> = props => (
  <OptimizedImageV2
    {...props}
    priority={true}
    lazy={false}
    placeholder='dominant-color'
    quality={95}
    trackPerformance={true}
  />
)

// Pour thumbnails - chargement rapide
export const ThumbnailImage: React.FC<
  Omit<OptimizedImageV2Props, 'quality' | 'enableProgressiveLoading'>
> = props => (
  <OptimizedImageV2
    {...props}
    quality={70}
    enableProgressiveLoading={false}
    placeholder='shimmer'
    fadeInDuration={200}
  />
)

// Styles CSS personnalisés à ajouter au global.css
export const imageOptimizationStyles = `
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
`

export { OptimizedImageV2 }
export default OptimizedImageV2
