'use client'

import { BedDouble } from 'lucide-react'
import { RoomTypeCard } from './RoomTypeCard'
import {
  setRoomTypeQuantity,
  type RoomTypeSelection,
} from '../lib/roomTypeSelection'
import type { RoomTypeView, RoomTypeAvailabilityView } from '@/types/roomType'

interface RoomTypesSectionProps {
  roomTypes: RoomTypeView[]
  availabilities?: RoomTypeAvailabilityView[]
  selection: RoomTypeSelection
  onSelectionChange: (selection: RoomTypeSelection) => void
  currency?: 'EUR' | 'MGA'
  /** Compact heading variant for the booking card. */
  heading?: boolean
}

/**
 * Multi-select composition of {@link RoomTypeCard}s. Each card's quantity
 * change is lifted through the pure {@link setRoomTypeQuantity} (which clamps
 * to the type's availability), producing a new selection map.
 */
export function RoomTypesSection({
  roomTypes,
  availabilities,
  selection,
  onSelectionChange,
  currency = 'EUR',
  heading = true,
}: RoomTypesSectionProps) {
  const availabilityById = new Map(
    (availabilities ?? []).map(a => [a.roomTypeId, a])
  )

  const sortedTypes = roomTypes.slice().sort((a, b) => a.position - b.position)

  const handleQuantityChange = (roomTypeId: string, quantity: number) => {
    const availability = availabilityById.get(roomTypeId)
    const maxQuantity =
      availability?.availableQuantity ??
      roomTypes.find(rt => rt.id === roomTypeId)?.quantity ??
      0
    onSelectionChange(setRoomTypeQuantity(selection, roomTypeId, quantity, maxQuantity))
  }

  return (
    <section className='space-y-4'>
      {heading && (
        <div className='flex items-center gap-2'>
          <BedDouble className='h-5 w-5 text-gray-700' />
          <h3 className='text-lg font-semibold text-gray-900'>Types de chambres</h3>
        </div>
      )}
      <div className='space-y-3'>
        {sortedTypes.map(roomType => (
          <RoomTypeCard
            key={roomType.id}
            roomType={roomType}
            availability={availabilityById.get(roomType.id)}
            selectedQuantity={selection[roomType.id] ?? 0}
            onQuantityChange={handleQuantityChange}
            currency={currency}
          />
        ))}
      </div>
    </section>
  )
}
