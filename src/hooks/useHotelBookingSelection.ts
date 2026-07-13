'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { calculateHotelBookingPrice } from '@/lib/services/booking-pricing.service'
import { useRoomTypeAvailability, availabilityCapsById } from './useRoomTypeAvailability'
import {
  setRoomTypeQuantity,
  getSelectedLines,
  selectionToLines,
  encodeRoomTypeSelection,
  totalSelectedRooms,
  type RoomTypeSelection,
} from '@/app/host/[id]/lib/roomTypeSelection'
import type { RoomTypeView, RoomLineSummary, SelectedRoomLine } from '@/types/roomType'
import type { HotelBookingPriceResult } from '@/lib/services/booking-pricing.service'

interface UseHotelBookingSelectionParams {
  productId: string
  roomTypes: RoomTypeView[]
  ownerId?: string
  guestCount: number
  selectedExtras?: Array<{ extraId: string; quantity: number }>
  initialDateRange?: DateRange
  initialSelection?: RoomTypeSelection
}

export interface UseHotelBookingSelectionResult {
  selection: RoomTypeSelection
  setQuantity: (roomTypeId: string, quantity: number) => void
  dateRange: DateRange | undefined
  setDateRange: (range: DateRange | undefined) => void
  availabilities: ReturnType<typeof useRoomTypeAvailability>['data']
  lines: SelectedRoomLine[]
  nights: number
  pricing: HotelBookingPriceResult | null
  isPricingLoading: boolean
  roomLines: RoomLineSummary[]
  totalRooms: number
  canReserve: boolean
  reservationHref: string
}

/** Nights between two dates (0 if incomplete/invalid). */
function nightsBetween(range: DateRange | undefined): number {
  if (!range?.from || !range?.to) return 0
  const diff = range.to.getTime() - range.from.getTime()
  return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0
}

/**
 * Owns the guest hotel booking selection: room quantities + date range,
 * per-type availability caps, and the server-authoritative price (via
 * `calculateHotelBookingPrice`). Drives {@link HotelBookingCard} and the
 * reservation deep-link.
 */
export function useHotelBookingSelection({
  productId,
  roomTypes,
  ownerId,
  guestCount,
  selectedExtras = [],
  initialDateRange,
  initialSelection = {},
}: UseHotelBookingSelectionParams): UseHotelBookingSelectionResult {
  const [selection, setSelection] = useState<RoomTypeSelection>(initialSelection)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(initialDateRange)

  const arrivalDate = dateRange?.from ?? null
  const leavingDate = dateRange?.to ?? null
  const nights = nightsBetween(dateRange)

  const { data: availabilities } = useRoomTypeAvailability({
    productId,
    arrivalDate,
    leavingDate,
    enabled: roomTypes.length > 0,
  })

  const availabilityCaps = useMemo(() => availabilityCapsById(availabilities), [availabilities])

  const setQuantity = (roomTypeId: string, quantity: number) => {
    const cap = availabilityCaps[roomTypeId] ?? roomTypes.find(rt => rt.id === roomTypeId)?.quantity ?? 0
    setSelection(prev => setRoomTypeQuantity(prev, roomTypeId, quantity, cap))
  }

  const lines = useMemo(
    () => getSelectedLines(selection, roomTypes, availabilityCaps),
    [selection, roomTypes, availabilityCaps]
  )

  const requestLines = useMemo(() => selectionToLines(selection), [selection])
  const encodedSelection = useMemo(() => encodeRoomTypeSelection(selection), [selection])
  const totalRooms = totalSelectedRooms(selection)

  const pricingEnabled = requestLines.length > 0 && nights > 0 && !!arrivalDate && !!leavingDate

  const { data: pricing, isFetching: isPricingLoading } = useQuery<HotelBookingPriceResult>({
    queryKey: [
      'hotel-booking-pricing',
      productId,
      encodedSelection,
      arrivalDate?.toISOString() ?? '',
      leavingDate?.toISOString() ?? '',
      guestCount,
    ],
    queryFn: () =>
      calculateHotelBookingPrice(
        productId,
        requestLines,
        arrivalDate!,
        leavingDate!,
        guestCount,
        selectedExtras,
        ownerId
      ),
    enabled: pricingEnabled,
    staleTime: 1000 * 60,
  })

  const nameById = useMemo(
    () => new Map(roomTypes.map(rt => [rt.id, rt.name])),
    [roomTypes]
  )

  const roomLines: RoomLineSummary[] = useMemo(() => {
    if (!pricing) return []
    return pricing.lines.map(line => ({
      roomTypeId: line.roomTypeId,
      name: nameById.get(line.roomTypeId) ?? line.roomTypeId,
      quantity: line.quantity,
      unitPricePerNight:
        line.unitPricing?.averageNightlyPrice ?? (Number.parseFloat(line.unitPrice) || 0),
      lineSubtotal: line.lineSubtotal,
    }))
  }, [pricing, nameById])

  const allSelectedAvailable = lines.every(l => l.quantity <= l.availableQuantity)
  const canReserve = totalRooms > 0 && nights > 0 && allSelectedAvailable

  const checkIn = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : ''
  const checkOut = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : ''
  // `:` and `;` are valid in a query value and survive `searchParams.get`,
  // so the selection stays human-readable (`roomTypes=A:1;B:2`).
  const reservationHref =
    `/host/${productId}/reservation?roomTypes=${encodedSelection}` +
    `&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guestCount}`

  return {
    selection,
    setQuantity,
    dateRange,
    setDateRange,
    availabilities,
    lines,
    nights,
    pricing: pricing ?? null,
    isPricingLoading,
    roomLines,
    totalRooms,
    canReserve,
    reservationHref,
  }
}
