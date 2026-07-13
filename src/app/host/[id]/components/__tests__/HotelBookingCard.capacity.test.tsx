/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import HotelBookingCard from '../HotelBookingCard'
import type { RoomTypeView } from '@/types/roomType'

const roomTypes: RoomTypeView[] = [
  { id: 'A', name: 'Chambre A', quantity: 5, capacity: 2, surface: null, smoking: false, basePrice: '100', priceMGA: '0', position: 0, beds: [] },
]

// A selection that over-fills capacity: 1 room (2 seats) for 8 guests.
jest.mock('@/hooks/useHotelBookingSelection', () => ({
  useHotelBookingSelection: () => ({
    selection: { A: 1 },
    setQuantity: jest.fn(),
    dateRange: { from: new Date('2026-08-01'), to: new Date('2026-08-03') },
    setDateRange: jest.fn(),
    availabilities: [
      { roomTypeId: 'A', totalQuantity: 5, bookedQuantity: 0, availableQuantity: 5, available: true, blockedRanges: [] },
    ],
    lines: [],
    nights: 2,
    pricing: { subtotal: 200, totalAmount: 200 },
    isPricingLoading: false,
    roomLines: [
      { roomTypeId: 'A', name: 'Chambre A', quantity: 1, unitPricePerNight: 100, lineSubtotal: 200 },
    ],
    totalRooms: 1,
    selectedCapacity: 2,
    exceedsCapacity: true,
    canReserve: false,
    reservationHref: '#',
  }),
}))

const product = {
  id: 'p1',
  name: 'Grand Hotel',
  owner: { id: 'o1' },
  minPeople: 8,
  maxPeople: 10,
  reviews: [],
}

describe('HotelBookingCard capacity feedback', () => {
  it('warns and disables reservation when guests exceed the selected capacity', () => {
    render(
      <HotelBookingCard product={product} roomTypes={roomTypes} globalGrade={4.5} today='2026-01-01' />
    )

    // Feedback message identifies the maximum seats of the selection.
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(/accueillent au maximum 2 voyageurs/)

    // Reserve link is disabled and relabelled.
    const reserve = screen.getByText('Capacité insuffisante').closest('a')
    expect(reserve).toHaveAttribute('aria-disabled', 'true')
  })
})
