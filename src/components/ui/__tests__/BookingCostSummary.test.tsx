/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { BookingCostSummary } from '../BookingCostSummary'
import type { RoomLineSummary } from '@/types/roomType'

const baseProps = {
  basePrice: 999, // deliberately unrelated to the room lines below
  numberOfDays: 3,
  guestCount: 2,
  selectedExtras: [],
  startDate: new Date('2026-08-01'),
  endDate: new Date('2026-08-04'),
}

const roomLines: RoomLineSummary[] = [
  { roomTypeId: 'A', name: 'Chambre Double', quantity: 2, unitPricePerNight: 100, lineSubtotal: 600 },
  { roomTypeId: 'B', name: 'Suite', quantity: 1, unitPricePerNight: 150, lineSubtotal: 450 },
]

describe('BookingCostSummary with roomLines', () => {
  it('renders one row per selected room type line', () => {
    render(<BookingCostSummary {...baseProps} roomLines={roomLines} />)

    expect(screen.getByText(/Chambre Double × 2/)).toBeInTheDocument()
    expect(screen.getByText(/Suite × 1/)).toBeInTheDocument()
  })

  it('sets the base total to the sum of line subtotals', () => {
    render(<BookingCostSummary {...baseProps} roomLines={roomLines} />)

    // 600 + 450 = 1050, independent of basePrice/numberOfDays.
    // fr-FR currency uses narrow no-break spaces → normalize whitespace.
    const normalize = (s: string) => s.replace(/[\s  ]/g, '')
    const matches = screen.getAllByText((_, node) =>
      Boolean(node?.textContent && normalize(node.textContent).includes('1050,00€'))
    )
    expect(matches.length).toBeGreaterThan(0)
  })

  it('falls back to single accommodation row when roomLines is undefined', () => {
    render(<BookingCostSummary {...baseProps} subtotalOverride={300} />)

    expect(screen.getByText(/Hébergement/)).toBeInTheDocument()
    expect(screen.queryByText(/Chambre Double/)).not.toBeInTheDocument()
  })
})
