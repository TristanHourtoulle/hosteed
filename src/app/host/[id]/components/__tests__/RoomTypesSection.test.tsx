/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { RoomTypesSection } from '../RoomTypesSection'
import type { RoomTypeView, RoomTypeAvailabilityView } from '@/types/roomType'
import type { RoomTypeSelection } from '../../lib/roomTypeSelection'

const roomTypes: RoomTypeView[] = [
  {
    id: 'A',
    name: 'Chambre A',
    quantity: 5,
    capacity: 2,
    surface: null,
    smoking: false,
    basePrice: '100',
    priceMGA: '500000',
    position: 0,
    beds: [],
  },
  {
    id: 'B',
    name: 'Chambre B',
    quantity: 5,
    capacity: 3,
    surface: null,
    smoking: false,
    basePrice: '150',
    priceMGA: '700000',
    position: 1,
    beds: [],
  },
]

function availability(over: Partial<RoomTypeAvailabilityView> & { roomTypeId: string }): RoomTypeAvailabilityView {
  return {
    totalQuantity: 5,
    bookedQuantity: 0,
    availableQuantity: 5,
    available: true,
    blockedRanges: [],
    ...over,
  }
}

/** Controlled wrapper that re-renders with the latest selection. */
function ControlledSection({
  availabilities,
  onChange,
}: {
  availabilities?: RoomTypeAvailabilityView[]
  onChange: (s: RoomTypeSelection) => void
}) {
  let selection: RoomTypeSelection = {}
  function Wrapper() {
    const [sel, setSel] = require('react').useState<RoomTypeSelection>({})
    selection = sel
    return (
      <RoomTypesSection
        roomTypes={roomTypes}
        availabilities={availabilities}
        selection={sel}
        onSelectionChange={next => {
          setSel(next)
          onChange(next)
        }}
      />
    )
  }
  void selection
  return <Wrapper />
}

describe('RoomTypesSection', () => {
  it('updates the selection when a room type quantity increases', () => {
    const onChange = jest.fn()
    render(<ControlledSection onChange={onChange} />)

    fireEvent.click(screen.getByLabelText('Ajouter une chambre Chambre B'))

    expect(onChange).toHaveBeenLastCalledWith({ B: 1 })
  })

  it('supports selecting multiple room types simultaneously', () => {
    const onChange = jest.fn()
    render(<ControlledSection onChange={onChange} />)

    fireEvent.click(screen.getByLabelText('Ajouter une chambre Chambre A'))
    fireEvent.click(screen.getByLabelText('Ajouter une chambre Chambre B'))

    expect(onChange).toHaveBeenLastCalledWith({ A: 1, B: 1 })
  })

  it('caps each type independently by its own availability', () => {
    const onChange = jest.fn()
    render(
      <ControlledSection
        onChange={onChange}
        availabilities={[
          availability({ roomTypeId: 'A', availableQuantity: 1 }),
          availability({ roomTypeId: 'B', availableQuantity: 5 }),
        ]}
      />
    )

    const plusA = screen.getByLabelText('Ajouter une chambre Chambre A')
    fireEvent.click(plusA)
    expect(onChange).toHaveBeenLastCalledWith({ A: 1 })
    // A is now at its cap of 1 → button disabled, no further increment.
    expect(screen.getByLabelText('Ajouter une chambre Chambre A')).toBeDisabled()
    // B still has room.
    expect(screen.getByLabelText('Ajouter une chambre Chambre B')).not.toBeDisabled()
  })
})
