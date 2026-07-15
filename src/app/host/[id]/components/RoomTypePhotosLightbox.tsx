'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { getFullSizeImageUrl } from '@/lib/utils/imageUtils'
import type { RoomTypeImageView } from '@/types/roomType'

interface RoomTypePhotosLightboxProps {
  roomTypeName: string
  /** Photos of a single room type — never establishment photos. */
  images: RoomTypeImageView[]
  onClose: () => void
}

/**
 * Fullscreen viewer for one room type's photos: a large image, prev/next
 * navigation and a thumbnail strip. Its index is local, so it is independent
 * from the establishment `ImageGallery` on the same page.
 */
export function RoomTypePhotosLightbox({
  roomTypeName,
  images,
  onClose,
}: RoomTypePhotosLightboxProps) {
  const [index, setIndex] = useState(0)
  const total = images.length

  const go = useCallback(
    (delta: number) => setIndex(current => (current + delta + total) % total),
    [total]
  )

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft') go(-1)
      if (event.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [go, onClose])

  const current = images[index]
  if (!current) return null

  return (
    <div
      role='dialog'
      aria-modal='true'
      aria-label={`Photos de ${roomTypeName}`}
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4'
      onClick={onClose}
    >
      <div className='relative w-full max-w-3xl' onClick={event => event.stopPropagation()}>
        <button
          type='button'
          onClick={onClose}
          aria-label='Fermer'
          className='absolute -top-3 -right-3 z-10 rounded-full bg-white p-2 shadow-lg hover:bg-gray-100'
        >
          <X className='h-5 w-5 text-gray-700' />
        </button>

        <div className='relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-black'>
          <Image
            src={getFullSizeImageUrl(current.img)}
            alt={`${roomTypeName} — photo ${index + 1} sur ${total}`}
            fill
            unoptimized
            sizes='(max-width: 768px) 100vw, 768px'
            className='object-contain'
          />
          {total > 1 && (
            <>
              <button
                type='button'
                onClick={() => go(-1)}
                aria-label='Précédent'
                className='absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-lg hover:bg-white'
              >
                <ChevronLeft className='h-5 w-5 text-gray-700' />
              </button>
              <button
                type='button'
                onClick={() => go(1)}
                aria-label='Suivant'
                className='absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-lg hover:bg-white'
              >
                <ChevronRight className='h-5 w-5 text-gray-700' />
              </button>
            </>
          )}
        </div>

        <div className='mt-3 flex justify-center gap-2 overflow-x-auto'>
          {images.map((image, position) => (
            <button
              key={image.img}
              type='button'
              onClick={() => setIndex(position)}
              aria-label={`Voir la photo ${position + 1}`}
              aria-current={position === index}
              className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md transition-opacity ${
                position === index ? 'ring-2 ring-white' : 'opacity-60 hover:opacity-100'
              }`}
            >
              <Image
                src={getFullSizeImageUrl(image.img)}
                alt={`${roomTypeName} ${position + 1}`}
                fill
                unoptimized
                sizes='64px'
                className='object-cover'
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
