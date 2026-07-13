/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react'
import { TestQueryProvider } from '@/test-utils/renderWithClient'
import { useHotelBookingSelection } from '../useHotelBookingSelection'
import type { RoomTypeView } from '@/types/roomType'

// Availability: report every type as fully available.
jest.mock('../useRoomTypeAvailability', () => {
  const actual = jest.requireActual('../useRoomTypeAvailability')
  return {
    ...actual,
    useRoomTypeAvailability: () => ({
      data: [
        { roomTypeId: 'A', totalQuantity: 5, bookedQuantity: 0, availableQuantity: 5, available: true, blockedRanges: [] },
        { roomTypeId: 'B', totalQuantity: 5, bookedQuantity: 0, availableQuantity: 5, available: true, blockedRanges: [] },
      ],
    }),
  }
})

// Pricing: total = 100 × total rooms selected.
const calculateHotelBookingPriceMock = jest.fn()
jest.mock('@/lib/services/booking-pricing.service', () => ({
  calculateHotelBookingPrice: (...a: unknown[]) => calculateHotelBookingPriceMock(...a),
}))

const roomTypes: RoomTypeView[] = [
  { id: 'A', name: 'Chambre A', quantity: 5, capacity: 2, surface: null, smoking: false, basePrice: '100', priceMGA: '0', position: 0, beds: [] },
  { id: 'B', name: 'Chambre B', quantity: 5, capacity: 2, surface: null, smoking: false, basePrice: '100', priceMGA: '0', position: 1, beds: [] },
]

const DATE_RANGE = { from: new Date('2026-08-01'), to: new Date('2026-08-03') }

beforeEach(() => {
  jest.clearAllMocks()
  calculateHotelBookingPriceMock.mockImplementation(
    (_productId: string, lines: Array<{ roomTypeId: string; quantity: number }>) => {
      const totalRooms = lines.reduce((s, l) => s + l.quantity, 0)
      return Promise.resolve({
        lines: lines.map(l => ({
          roomTypeId: l.roomTypeId,
          quantity: l.quantity,
          unitPrice: '100',
          unitPricing: { averageNightlyPrice: 100 },
          lineSubtotal: 100 * l.quantity,
        })),
        subtotal: 100 * totalRooms,
        extrasTotal: 0,
        extrasDetails: [],
        totalSavings: 0,
        clientCommission: 0,
        hostCommission: 0,
        platformAmount: 0,
        hostAmount: 100 * totalRooms,
        totalAmount: 100 * totalRooms,
        summary: {
          numberOfNights: 2,
          subtotal: 100 * totalRooms,
          totalSavings: 0,
          extrasTotal: 0,
          clientCommission: 0,
          totalAmount: 100 * totalRooms,
          promotionApplied: false,
          specialPriceApplied: false,
        },
      })
    }
  )
})

function setup() {
  return renderHook(
    () =>
      useHotelBookingSelection({
        productId: 'p1',
        roomTypes,
        guestCount: 2,
        initialDateRange: DATE_RANGE,
      }),
    { wrapper: TestQueryProvider }
  )
}

describe('useHotelBookingSelection', () => {
  it('recomputes the summary total when a room type is added', async () => {
    const { result } = setup()

    act(() => result.current.setQuantity('A', 1))
    await waitFor(() => expect(result.current.pricing?.totalAmount).toBe(100))

    act(() => result.current.setQuantity('B', 1))
    await waitFor(() => expect(result.current.pricing?.totalAmount).toBe(200))
  })

  it('builds the reservation href with the encoded selection', () => {
    const { result } = setup()

    act(() => result.current.setQuantity('A', 1))
    act(() => result.current.setQuantity('B', 2))

    expect(result.current.reservationHref).toContain('roomTypes=A:1;B:2')
    expect(result.current.reservationHref).toContain('checkIn=2026-08-01')
    expect(result.current.reservationHref).toContain('guests=2')
  })

  it('disables reservation when no room type is selected', () => {
    const { result } = setup()
    expect(result.current.canReserve).toBe(false)
  })
})
