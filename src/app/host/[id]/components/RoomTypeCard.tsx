'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Users, Maximize2, BedDouble, Minus, Plus, CalendarOff, Cigarette } from 'lucide-react'
import { Button } from '@/components/ui/shadcnui/button'
import { formatCurrency } from '@/lib/utils/formatNumber'
import { getFullSizeImageUrl } from '@/lib/utils/imageUtils'
import type { RoomTypeView, RoomTypeAvailabilityView } from '@/types/roomType'
import { RoomTypeAvailabilityCalendar } from './RoomTypeAvailabilityCalendar'
import { RoomTypePhotosLightbox } from './RoomTypePhotosLightbox'

interface RoomTypeCardProps {
  roomType: RoomTypeView
  availability?: RoomTypeAvailabilityView
  selectedQuantity: number
  onQuantityChange: (roomTypeId: string, quantity: number) => void
  currency?: 'EUR' | 'MGA'
  /** Informational display without the quantity stepper. */
  readOnly?: boolean
}

/**
 * A single selectable room type: shows beds/capacity/surface, the "from
 * {price}/nuit" price, an optional blocked-date calendar, and a quantity
 * stepper. The `+` button is capped at the type's `availableQuantity`; when
 * no rooms are available the card shows a sold-out state.
 *
 * When the type has its own photos, a thumbnail opens a lightbox limited to
 * that type. Types without photos render without a thumbnail slot and never
 * fall back to establishment photos, which would misrepresent the room.
 */
export function RoomTypeCard({
  roomType,
  availability,
  selectedQuantity,
  onQuantityChange,
  currency = 'EUR',
  readOnly = false,
}: RoomTypeCardProps) {
  const [showCalendar, setShowCalendar] = useState(false)
  const [showPhotos, setShowPhotos] = useState(false)

  const images = roomType.images ?? []
  const hasPhotos = images.length > 0
  const cover = images[0]
  const availableQuantity = availability?.availableQuantity ?? roomType.quantity
  const isSoldOut = availableQuantity <= 0
  const canIncrement = selectedQuantity < availableQuantity
  const price = Number.parseFloat(roomType.basePrice) || 0
  const blockedRanges = availability?.blockedRanges ?? []

  const bedsLabel = roomType.beds
    .filter(b => b.count > 0)
    .map(b => `${b.count} ${formatBedType(b.bedType)}`)
    .join(', ')

  return (
    <div className='border border-gray-200 rounded-xl p-4 space-y-3'>
      <div className='flex items-start justify-between gap-3'>
        {cover && (
          <button
            type='button'
            onClick={() => setShowPhotos(true)}
            aria-label={`Voir les photos de ${roomType.name}`}
            className='group relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg cursor-pointer'
          >
            <Image
              src={getFullSizeImageUrl(cover.img)}
              alt={roomType.name}
              fill
              unoptimized
              sizes='96px'
              className='object-cover transition-transform group-hover:scale-105'
            />
            {images.length > 1 && (
              <span className='absolute bottom-1 right-1 rounded-md bg-black/60 px-1.5 py-0.5 text-xs font-medium text-white'>
                +{images.length - 1}
              </span>
            )}
          </button>
        )}
        <div className={hasPhotos ? 'min-w-0 flex-1' : 'min-w-0'}>
          <h4 className='font-semibold text-gray-900'>{roomType.name}</h4>
          <div className='mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600'>
            <span className='inline-flex items-center gap-1'>
              <Users className='h-4 w-4 text-gray-400' />
              {roomType.capacity} pers. max
            </span>
            {bedsLabel && (
              <span className='inline-flex items-center gap-1'>
                <BedDouble className='h-4 w-4 text-gray-400' />
                {bedsLabel}
              </span>
            )}
            {roomType.surface != null && roomType.surface > 0 && (
              <span className='inline-flex items-center gap-1'>
                <Maximize2 className='h-4 w-4 text-gray-400' />
                {roomType.surface} m²
              </span>
            )}
            {roomType.smoking && (
              <span className='inline-flex items-center gap-1'>
                <Cigarette className='h-4 w-4 text-gray-400' />
                Fumeur
              </span>
            )}
          </div>
        </div>
        <div className='text-right flex-shrink-0'>
          <div className='text-xs text-gray-500'>à partir de</div>
          <div className='font-semibold text-gray-900'>{formatCurrency(price, currency)}</div>
          <div className='text-xs text-gray-500'>/ nuit</div>
        </div>
      </div>

      {blockedRanges.length > 0 && (
        <div>
          <button
            type='button'
            onClick={() => setShowCalendar(v => !v)}
            className='inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-800 transition-colors'
          >
            <CalendarOff className='h-3.5 w-3.5' />
            {showCalendar ? 'Masquer les indisponibilités' : 'Voir les dates indisponibles'}
          </button>
          {showCalendar && (
            <div className='mt-2'>
              <RoomTypeAvailabilityCalendar blockedRanges={blockedRanges} />
            </div>
          )}
        </div>
      )}

      <div className='flex items-center justify-between pt-1'>
        {isSoldOut ? (
          <span className='text-sm font-medium text-red-600'>Complet pour ces dates</span>
        ) : (
          <span className='text-xs text-gray-500'>
            {availableQuantity} chambre{availableQuantity > 1 ? 's' : ''} disponible
            {availableQuantity > 1 ? 's' : ''}
          </span>
        )}

        {!readOnly && (
          <div className='flex items-center gap-3'>
            <Button
              type='button'
              variant='outline'
              size='icon'
              className='rounded-full h-8 w-8'
              aria-label={`Retirer une chambre ${roomType.name}`}
              disabled={selectedQuantity <= 0}
              onClick={() => onQuantityChange(roomType.id, selectedQuantity - 1)}
            >
              <Minus className='h-4 w-4' />
            </Button>
            <span className='w-6 text-center font-medium' aria-live='polite'>
              {selectedQuantity}
            </span>
            <Button
              type='button'
              variant='outline'
              size='icon'
              className='rounded-full h-8 w-8'
              aria-label={`Ajouter une chambre ${roomType.name}`}
              disabled={!canIncrement}
              onClick={() => onQuantityChange(roomType.id, selectedQuantity + 1)}
            >
              <Plus className='h-4 w-4' />
            </Button>
          </div>
        )}
      </div>

      {showPhotos && hasPhotos && (
        <RoomTypePhotosLightbox
          roomTypeName={roomType.name}
          images={images}
          onClose={() => setShowPhotos(false)}
        />
      )}
    </div>
  )
}

/** Human-readable bed label from a Prisma `BedType` enum value. */
function formatBedType(bedType: string): string {
  switch (bedType) {
    case 'SIMPLE':
      return 'lit simple'
    case 'DOUBLE':
      return 'lit double'
    case 'KING':
      return 'lit king'
    case 'GRAND_KING':
      return 'lit grand king'
    default:
      return 'lit'
  }
}
