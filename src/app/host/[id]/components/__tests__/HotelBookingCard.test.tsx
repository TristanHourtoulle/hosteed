/**
 * @jest-environment jsdom
 */
import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import HotelBookingCard from '../HotelBookingCard'
import type { RoomTypeView } from '@/types/roomType'
import type { RoomTypeSelection } from '../../lib/roomTypeSelection'

const roomTypes: RoomTypeView[] = [
  { id: 'A', name: 'Chambre A', quantity: 5, capacity: 2, surface: null, smoking: false, basePrice: '100', priceMGA: '0', position: 0, beds: [] },
  { id: 'B', name: 'Chambre B', quantity: 5, capacity: 2, surface: null, smoking: false, basePrice: '150', priceMGA: '0', position: 1, beds: [] },
]

// Reactive mock: selection lives in state so clicking a stepper updates the
// derived roomLines/total the card renders.
jest.mock('@/hooks/useHotelBookingSelection', () => ({
  useHotelBookingSelection: () => {
    const [selection, setSelection] = useState<RoomTypeSelection>({})
    const priceById: Record<string, number> = { A: 100, B: 150 }
    const roomLines = Object.entries(selection).map(([id, qty]) => ({
      roomTypeId: id,
      name: id === 'A' ? 'Chambre A' : 'Chambre B',
      quantity: qty,
      unitPricePerNight: priceById[id],
      lineSubtotal: priceById[id] * qty * 2, // 2 nights
    }))
    const subtotal = roomLines.reduce((s, l) => s + l.lineSubtotal, 0)
    const totalRooms = Object.values(selection).reduce((s, q) => s + q, 0)
    return {
      selection,
      setQuantity: (id: string, qty: number) =>
        setSelection(prev => {
          const next = { ...prev }
          if (qty <= 0) delete next[id]
          else next[id] = qty
          return next
        }),
      dateRange: { from: new Date('2026-08-01'), to: new Date('2026-08-03') },
      setDateRange: jest.fn(),
      availabilities: [
        { roomTypeId: 'A', totalQuantity: 5, bookedQuantity: 0, availableQuantity: 5, available: true, blockedRanges: [] },
        { roomTypeId: 'B', totalQuantity: 5, bookedQuantity: 0, availableQuantity: 5, available: true, blockedRanges: [] },
      ],
      lines: [],
      nights: 2,
      pricing: { subtotal, totalAmount: subtotal },
      isPricingLoading: false,
      roomLines,
      totalRooms,
      canReserve: totalRooms > 0,
      reservationHref: '/host/p1/reservation?roomTypes=&checkIn=2026-08-01&checkOut=2026-08-03&guests=2',
    }
  },
}))

const product = {
  id: 'p1',
  name: 'Grand Hotel',
  owner: { id: 'o1' },
  minPeople: 1,
  maxPeople: 4,
  reviews: [],
}

describe('HotelBookingCard', () => {
  it('updates the displayed total after selecting rooms', () => {
    render(
      <HotelBookingCard product={product} roomTypes={roomTypes} globalGrade={4.5} today='2026-01-01' />
    )

    // No summary before any room is picked.
    expect(screen.queryByText(/Récapitulatif des coûts/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Ajouter une chambre Chambre A'))

    // Summary now shows the A line (100 × 2 nights = 200).
    expect(screen.getByText(/Récapitulatif des coûts/)).toBeInTheDocument()
    expect(screen.getByText(/Chambre A × 1/)).toBeInTheDocument()

    // Reserve link becomes active.
    const reserve = screen.getByText('Réserver').closest('a')
    expect(reserve).toHaveAttribute('aria-disabled', 'false')
  })
})
