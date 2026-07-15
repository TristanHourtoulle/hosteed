/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react'
import HotelBookingCard from '../HotelBookingCard'
import type { RoomTypeView } from '@/types/roomType'

const roomTypes: RoomTypeView[] = [
  {
    id: 'A',
    name: 'Suite',
    quantity: 2,
    capacity: 4,
    surface: null,
    smoking: false,
    basePrice: '100',
    priceMGA: '0',
    position: 0,
    beds: [],
  },
]

// 2 Suites of capacity 4 are selected => 8 seats. `exceedsCapacity` is derived
// from the guest count the card feeds the hook, exactly like the real hook does.
const SELECTED_CAPACITY = 8

jest.mock('@/hooks/useHotelBookingSelection', () => ({
  useHotelBookingSelection: ({ guestCount }: { guestCount: number }) => {
    const exceedsCapacity = guestCount > SELECTED_CAPACITY
    return {
      selection: { A: 2 },
      setQuantity: jest.fn(),
      dateRange: { from: new Date('2026-08-01'), to: new Date('2026-08-03') },
      setDateRange: jest.fn(),
      availabilities: [
        {
          roomTypeId: 'A',
          totalQuantity: 2,
          bookedQuantity: 0,
          availableQuantity: 2,
          available: true,
          blockedRanges: [],
        },
      ],
      lines: [],
      nights: 2,
      pricing: { subtotal: 400, totalAmount: 400 },
      isPricingLoading: false,
      roomLines: [
        { roomTypeId: 'A', name: 'Suite', quantity: 2, unitPricePerNight: 100, lineSubtotal: 400 },
      ],
      totalRooms: 2,
      selectedCapacity: SELECTED_CAPACITY,
      exceedsCapacity,
      canReserve: !exceedsCapacity,
      reservationHref: '/host/p1/reservation',
    }
  },
}))

/**
 * `maxPeople` / `minPeople` are wizard-typed PRODUCT-level fields describing a
 * single bookable unit. For a hotel nothing books the whole property, so they
 * must not bound the guest stepper: the selected rooms' capacity does.
 */
const product = {
  id: 'p1',
  name: 'Grand Hotel',
  owner: { id: 'o1' },
  minPeople: 3,
  maxPeople: 4,
  reviews: [],
}

function clickAddGuest(times: number) {
  const add = screen.getByLabelText('Ajouter un voyageur')
  for (let i = 0; i < times; i += 1) fireEvent.click(add)
}

describe('HotelBookingCard guest stepper', () => {
  it('starts at 1 guest, ignoring the product-level minPeople', () => {
    render(
      <HotelBookingCard
        product={product}
        roomTypes={roomTypes}
        globalGrade={4.5}
        today='2026-01-01'
      />
    )

    expect(screen.getByText('1 voyageur')).toBeInTheDocument()
    // The floor is 1 guest, not `minPeople`.
    expect(screen.getByLabelText('Retirer un voyageur')).toBeDisabled()
  })

  it('lets the guest count go past the product-level maxPeople when the selected rooms fit', () => {
    render(
      <HotelBookingCard
        product={product}
        roomTypes={roomTypes}
        globalGrade={4.5}
        today='2026-01-01'
      />
    )

    // maxPeople is 4, but 2 Suites of capacity 4 hold 8 travellers.
    clickAddGuest(5)

    expect(screen.getByText('6 voyageurs')).toBeInTheDocument()
    expect(screen.getByLabelText('Ajouter un voyageur')).not.toBeDisabled()
    // Within the real capacity => no warning, reservation stays open.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText('Réserver')).toBeInTheDocument()
  })

  it('still warns and blocks once the guests exceed the selected rooms capacity', () => {
    render(
      <HotelBookingCard
        product={product}
        roomTypes={roomTypes}
        globalGrade={4.5}
        today='2026-01-01'
      />
    )

    clickAddGuest(8) // 1 -> 9 guests, over the 8 seats offered.

    expect(screen.getByText('9 voyageurs')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(/accueillent au maximum 8 voyageurs/)
    expect(screen.getByText('Capacité insuffisante').closest('a')).toHaveAttribute(
      'aria-disabled',
      'true'
    )
  })
})
