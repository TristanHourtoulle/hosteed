/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, within } from '@testing-library/react'
import { RoomTypeCard } from '../RoomTypeCard'
import { getFullSizeImageUrl } from '@/lib/utils/imageUtils'
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

  describe('room-type photos', () => {
    const uploads = (n: number) =>
      Array.from({ length: n }, (_, i) => ({ img: `/uploads/room-types/rt-1/img_${i}_thumb_1_a.webp` }))

    it('renders no thumbnail and no badge when the room type has no photos', () => {
      const { container } = render(
        <RoomTypeCard
          roomType={makeRoomType({ images: [] })}
          availability={makeAvailability()}
          selectedQuantity={0}
          onQuantityChange={jest.fn()}
        />
      )

      expect(container.querySelectorAll('img')).toHaveLength(0)
      expect(screen.queryByRole('button', { name: /photos/i })).not.toBeInTheDocument()
      expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument()
    })

    it('renders identically whether images is an empty array or undefined', () => {
      const { container: withEmpty, unmount } = render(
        <RoomTypeCard
          roomType={makeRoomType({ images: [] })}
          availability={makeAvailability()}
          selectedQuantity={0}
          onQuantityChange={jest.fn()}
        />
      )
      const emptyHtml = withEmpty.innerHTML
      unmount()

      const { container: withUndefined } = render(
        <RoomTypeCard
          roomType={makeRoomType()}
          availability={makeAvailability()}
          selectedQuantity={0}
          onQuantityChange={jest.fn()}
        />
      )

      expect(withUndefined.innerHTML).toBe(emptyHtml)
    })

    it('renders the first photo as a thumbnail routed through getFullSizeImageUrl', () => {
      const images = uploads(1)
      render(
        <RoomTypeCard
          roomType={makeRoomType({ images })}
          availability={makeAvailability()}
          selectedQuantity={0}
          onQuantityChange={jest.fn()}
        />
      )

      const thumbnail = screen.getByRole('img', { name: /Chambre Double/ })
      expect(thumbnail).toHaveAttribute('src', getFullSizeImageUrl(images[0].img))
      expect(getFullSizeImageUrl(images[0].img)).toContain('/api/images/serve')
      expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument()
    })

    it('shows a +2 badge when the room type has 3 photos', () => {
      render(
        <RoomTypeCard
          roomType={makeRoomType({ images: uploads(3) })}
          availability={makeAvailability()}
          selectedQuantity={0}
          onQuantityChange={jest.fn()}
        />
      )

      expect(screen.getByText('+2')).toBeInTheDocument()
    })

    it('opens a lightbox with only that room type photos when the thumbnail is clicked', () => {
      const images = uploads(3)
      render(
        <RoomTypeCard
          roomType={makeRoomType({ images })}
          availability={makeAvailability()}
          selectedQuantity={0}
          onQuantityChange={jest.fn()}
        />
      )

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: /photos de Chambre Double/i }))

      const dialog = screen.getByRole('dialog')

      // The strip holds exactly this room type's photos — no establishment shots.
      const thumbs = within(dialog).getAllByRole('button', { name: /Voir la photo/i })
      expect(thumbs).toHaveLength(images.length)
      expect(thumbs.map(b => within(b).getByRole('img').getAttribute('src'))).toEqual(
        images.map(i => getFullSizeImageUrl(i.img))
      )

      // The large view starts on the first photo of this type.
      expect(within(dialog).getByRole('img', { name: /photo 1 sur 3/i })).toHaveAttribute(
        'src',
        getFullSizeImageUrl(images[0].img)
      )
    })

    it('does not open a lightbox when the room type has no photos', () => {
      render(
        <RoomTypeCard
          roomType={makeRoomType({ images: [] })}
          availability={makeAvailability()}
          selectedQuantity={0}
          onQuantityChange={jest.fn()}
        />
      )

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /photos/i })).not.toBeInTheDocument()
    })
  })
})
