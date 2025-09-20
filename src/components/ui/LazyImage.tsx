'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LazyImageProps {
  src: string
  alt: string
  fill?: boolean
  width?: number
  height?: number
  className?: string
  priority?: boolean
  quality?: number
  onLoad?: () => void
  onError?: () => void
}

export function LazyImage({
  src,
  alt,
  fill = false,
  width,
  height,
  className,
  priority = false,
  quality = 75,
  onLoad,
  onError
}: LazyImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(priority) // Si priority=true, charger immédiatement
  const imgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (priority) return // Si priority=true, pas besoin d'intersection observer

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '100px', // Commencer à charger 100px avant d'être visible
        threshold: 0.1
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [priority])

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    setIsLoading(false)
    onError?.()
  }

  if (hasError) {
    return (
      <div
        ref={imgRef}
        className={cn(
          'bg-gray-100 flex items-center justify-center text-gray-400',
          className
        )}
        style={{ width, height }}
      >
        <div className='text-center'>
          <div className='w-8 h-8 mx-auto mb-2 rounded bg-gray-200' />
          <p className='text-xs'>Image non disponible</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={imgRef} className={cn('relative', className)}>
      {/* Placeholder pendant le chargement */}
      {isLoading && (
        <div
          className={cn(
            'absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center',
            fill ? 'w-full h-full' : ''
          )}
          style={!fill ? { width, height } : undefined}
        >
          <div className='w-8 h-8 bg-gray-300 rounded animate-pulse' />
        </div>
      )}

      {/* Image réelle - seulement chargée quand en vue */}
      {isInView && (
        <Image
          src={src}
          alt={alt}
          fill={fill}
          width={!fill ? width : undefined}
          height={!fill ? height : undefined}
          className={cn(
            'transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            className
          )}
          quality={quality}
          priority={priority}
          onLoad={handleLoad}
          onError={handleError}
          sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
        />
      )}
    </div>
  )
}