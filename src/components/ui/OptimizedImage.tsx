'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { OptimizedImageData } from '@/lib/services/image-optimization.service'

// ================================
// PERFORMANCE OPTIMIZED IMAGE COMPONENT
// Addresses base64 performance issues from audit
// ================================

interface OptimizedImageProps {
  // Image data (supports both legacy base64 and new optimized format)
  src?: string // Legacy base64 or URL
  optimizedData?: OptimizedImageData // New optimized format
  alt: string

  // Display options
  width?: number
  height?: number
  fill?: boolean
  priority?: boolean // Load immediately (above fold)

  // Responsive behavior
  sizes?: string // Responsive sizes attribute
  quality?: number // Image quality (1-100)

  // Performance options
  lazy?: boolean // Lazy loading (default: true)
  placeholder?: 'blur' | 'empty' // Placeholder strategy
  blurDataURL?: string // Custom blur placeholder

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

  // Progressive enhancement
  showDominantColor?: boolean // Show dominant color while loading
  enableModernFormats?: boolean // Use WebP/AVIF when available
}

export function OptimizedImage({
  src,
  optimizedData,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 85,
  lazy = true,
  placeholder = 'blur',
  blurDataURL,
  objectFit = 'cover',
  objectPosition = 'center',
  className,
  loading,
  fetchPriority = 'auto',
  onLoad,
  onError,
  showDominantColor = true,
  enableModernFormats = true,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(priority) // Load immediately if priority
  const imgRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !lazy) {
      setIsInView(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before visible
        threshold: 0.1,
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [priority, lazy])

  // Handle image loading states
  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    setIsLoading(false)
    onError?.()
  }

  // Determine image source and format
  const getImageSource = () => {
    if (optimizedData) {
      // Use optimized CDN URLs
      if (enableModernFormats) {
        // Browser will choose the best supported format
        return optimizedData.avifUrl || optimizedData.webpUrl || optimizedData.originalUrl
      }
      return optimizedData.originalUrl
    }
    return src
  }

  // Generate blur placeholder
  const getBlurPlaceholder = (): string => {
    if (blurDataURL) return blurDataURL
    if (optimizedData?.blurhash) {
      // Convert blurhash to data URL (simplified)
      return `data:image/svg+xml;base64,${Buffer.from(
        `
        <svg width="${width || 400}" height="${height || 300}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="${optimizedData.dominantColor || '#f3f4f6'}"/>
        </svg>
      `
      ).toString('base64')}`
    }
    // Generate simple gray placeholder
    return `data:image/svg+xml;base64,${Buffer.from(
      `
      <svg width="${width || 400}" height="${height || 300}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
      </svg>
    `
    ).toString('base64')}`
  }

  // Error fallback component
  if (hasError) {
    return (
      <div
        ref={imgRef}
        className={cn('bg-gray-100 flex items-center justify-center text-gray-400', className)}
        style={{ width, height }}
        role='img'
        aria-label={`Image failed to load: ${alt}`}
      >
        <div className='text-center p-4'>
          <div className='w-12 h-12 mx-auto mb-2 bg-gray-200 rounded' />
          <p className='text-xs'>Image non disponible</p>
        </div>
      </div>
    )
  }

  // Loading state with dominant color or blur
  if (isLoading && showDominantColor && optimizedData?.dominantColor) {
    return (
      <div
        ref={imgRef}
        className={cn('animate-pulse', className)}
        style={{
          backgroundColor: optimizedData.dominantColor,
          width: fill ? '100%' : width,
          height: fill ? '100%' : height,
        }}
      />
    )
  }

  const imageSource = getImageSource()

  if (!imageSource || (!isInView && !priority)) {
    // Placeholder while not in view
    return (
      <div
        ref={imgRef}
        className={cn('bg-gray-200 animate-pulse', className)}
        style={{
          width: fill ? '100%' : width,
          height: fill ? '100%' : height,
        }}
      />
    )
  }

  // Render optimized modern image with picture element for best format support
  if (optimizedData && enableModernFormats) {
    return (
      <div ref={imgRef} className={cn('relative overflow-hidden', className)}>
        <picture>
          {/* AVIF for modern browsers (best compression) */}
          {optimizedData.avifUrl && (
            <source srcSet={optimizedData.avifUrl} type='image/avif' sizes={sizes} />
          )}

          {/* WebP for good browser support */}
          {optimizedData.webpUrl && (
            <source srcSet={optimizedData.webpUrl} type='image/webp' sizes={sizes} />
          )}

          {/* Fallback to original format */}
          <Image
            src={imageSource!}
            alt={alt}
            width={!fill ? width : undefined}
            height={!fill ? height : undefined}
            fill={fill}
            priority={priority}
            quality={quality}
            sizes={sizes}
            placeholder={placeholder}
            blurDataURL={getBlurPlaceholder()}
            loading={loading || (priority ? 'eager' : 'lazy')}
            fetchPriority={fetchPriority}
            className={cn(
              'transition-opacity duration-300',
              isLoading ? 'opacity-0' : 'opacity-100'
            )}
            style={{
              objectFit,
              objectPosition,
            }}
            onLoad={handleLoad}
            onError={handleError}
            {...props}
          />
        </picture>
      </div>
    )
  }

  // Fallback to standard Next.js Image for legacy base64 or simple cases
  return (
    <div ref={imgRef} className={cn('relative', className)}>
      <Image
        src={imageSource!}
        alt={alt}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        fill={fill}
        priority={priority}
        quality={quality}
        sizes={sizes}
        placeholder={placeholder}
        blurDataURL={getBlurPlaceholder()}
        loading={loading || (priority ? 'eager' : 'lazy')}
        fetchPriority={fetchPriority}
        className={cn('transition-opacity duration-300', isLoading ? 'opacity-0' : 'opacity-100')}
        style={{
          objectFit,
          objectPosition,
        }}
        onLoad={handleLoad}
        onError={handleError}
        // Disable Next.js optimization for base64 images
        unoptimized={imageSource?.startsWith('data:') || false}
        {...props}
      />
    </div>
  )
}

// ================================
// SPECIALIZED IMAGE COMPONENTS
// ================================

/**
 * Product card image - optimized for grid listings
 */
export function ProductCardImage({
  src,
  optimizedData,
  alt,
  className,
  ...props
}: Omit<OptimizedImageProps, 'width' | 'height' | 'fill'>) {
  return (
    <OptimizedImage
      src={src}
      optimizedData={optimizedData}
      alt={alt}
      fill
      sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
      className={cn('aspect-[4/3] rounded-lg overflow-hidden', className)}
      priority={false} // Grid images shouldn't be priority
      quality={75} // Slightly lower quality for list views
      {...props}
    />
  )
}

/**
 * Hero image - optimized for above-the-fold loading
 */
export function HeroImage({
  src,
  optimizedData,
  alt,
  className,
  ...props
}: Omit<OptimizedImageProps, 'priority' | 'fetchPriority'>) {
  return (
    <OptimizedImage
      src={src}
      optimizedData={optimizedData}
      alt={alt}
      priority={true} // Always priority for hero images
      fetchPriority='high'
      quality={90} // Higher quality for hero images
      className={cn('w-full h-full', className)}
      {...props}
    />
  )
}

/**
 * Thumbnail image - optimized for small sizes
 */
export function ThumbnailImage({
  src,
  optimizedData,
  alt,
  size = 100,
  className,
  ...props
}: Omit<OptimizedImageProps, 'width' | 'height'> & {
  size?: number
}) {
  // Use thumbnail URL if available
  const thumbnailSrc = optimizedData?.thumbnailUrl || src

  return (
    <OptimizedImage
      src={thumbnailSrc}
      optimizedData={optimizedData}
      alt={alt}
      width={size}
      height={size}
      quality={70} // Lower quality for thumbnails
      className={cn('rounded-md', className)}
      {...props}
    />
  )
}

/**
 * Gallery image - optimized for lightbox/modal viewing
 */
export function GalleryImage({
  src,
  optimizedData,
  alt,
  className,
  ...props
}: OptimizedImageProps) {
  return (
    <OptimizedImage
      src={src}
      optimizedData={optimizedData}
      alt={alt}
      quality={95} // High quality for gallery viewing
      sizes='(max-width: 768px) 100vw, 80vw'
      className={cn('max-w-full max-h-full object-contain', className)}
      {...props}
    />
  )
}

// ================================
// PERFORMANCE UTILITIES
// ================================

/**
 * Preload critical images for better performance
 */
export function preloadImage(src: string, priority: 'high' | 'low' = 'low') {
  if (typeof window === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'image'
  link.href = src
  link.fetchPriority = priority
  document.head.appendChild(link)
}

/**
 * Lazy load images when they enter viewport
 */
export function useLazyImage(threshold: number = 0.1) {
  const [isInView, setIsInView] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold])

  return { ref, isInView }
}

export default OptimizedImage
