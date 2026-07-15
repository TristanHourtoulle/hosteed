/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { RoomTypeCard } from '../RoomTypeCard'
import type { RoomTypeView, RoomTypeAvailabilityView } from '@/types/roomType'

function makeRoomType(over: Partial<RoomTypeView> = {}): RoomTypeView {
  return {
    id: 'rt-1',
    name: 'Chambre Double',
    quantity: 5,
    capacity: 2,
    surface: 20,
    smoking: false,
    basePrice: '120',
    priceMGA: '600000',
    position: 0,
    beds: [{ bedType: 'DOUBLE', count: 1 }],
    ...over,
  }
}

function makeAvailability(over: Partial<RoomTypeAvailabilityView> = {}): RoomTypeAvailabilityView {
  return {
    roomTypeId: 'rt-1',
    totalQuantity: 5,
    bookedQuantity: 3,
    availableQuantity: 2,
    available: true,
    blockedRanges: [],
    ...over,
  }
}

describe('RoomTypeCard', () => {
  it('caps the quantity selector at availableQuantity', () => {
    const onQuantityChange = jest.fn()
    const { rerender } = render(
      <RoomTypeCard
        roomType={makeRoomType()}
        availability={makeAvailability({ availableQuantity: 2 })}
        selectedQuantity={0}
        onQuantityChange={onQuantityChange}
      />
    )

    const plus = screen.getByLabelText(/Ajouter une chambre/)

    // Simulate the controlled increments the parent would apply.
    fireEvent.click(plus)
    expect(onQuantityChange).toHaveBeenLastCalledWith('rt-1', 1)

    rerender(
      <RoomTypeCard
        roomType={makeRoomType()}
        availability={makeAvailability({ availableQuantity: 2 })}
        selectedQuantity={1}
        onQuantityChange={onQuantityChange}
      />
    )
    fireEvent.click(plus)
    expect(onQuantityChange).toHaveBeenLastCalledWith('rt-1', 2)

    // At the cap the + button is disabled and no further change fires.
    rerender(
      <RoomTypeCard
        roomType={makeRoomType()}
        availability={makeAvailability({ availableQuantity: 2 })}
        selectedQuantity={2}
        onQuantityChange={onQuantityChange}
      />
    )
    expect(screen.getByLabelText(/Ajouter une chambre/)).toBeDisabled()
    onQuantityChange.mockClear()
    fireEvent.click(screen.getByLabelText(/Ajouter une chambre/))
    expect(onQuantityChange).not.toHaveBeenCalled()
  })

  it('disables selection and shows sold-out label when availableQuantity is 0', () => {
    render(
      <RoomTypeCard
        roomType={makeRoomType()}
        availability={makeAvailability({ availableQuantity: 0, available: false })}
        selectedQuantity={0}
        onQuantityChange={jest.fn()}
      />
    )

    expect(screen.getByText('Complet pour ces dates')).toBeInTheDocument()
    expect(screen.getByLabelText(/Ajouter une chambre/)).toBeDisabled()
  })

  it('renders the per-night base price and capacity', () => {
    render(
      <RoomTypeCard
        roomType={makeRoomType({ basePrice: '120' })}
        availability={makeAvailability()}
        selectedQuantity={0}
        onQuantityChange={jest.fn()}
      />
    )

    expect(screen.getByText(/€/)).toBeInTheDocument()
    expect(screen.getByText(/2 pers\. max/)).toBeInTheDocument()
  })
})
