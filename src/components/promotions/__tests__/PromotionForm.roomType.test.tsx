/**
 * @jest-environment jsdom
 *
 * The shared PromotionForm must let a host scope a promotion to a room type,
 * but only for hotel products. We assert the room-type selector renders when
 * the selected product is a hotel with room types, stays hidden otherwise, and
 * that submitting forwards a `roomTypeId` (establishment-wide null by default).
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PromotionForm from '../PromotionForm'

const hotelProduct = {
  id: 'p1',
  name: 'Hotel Beau Rivage',
  basePrice: '100',
  isHotel: true,
  roomTypes: [
    { id: 'rt1', name: 'Suite' },
    { id: 'rt2', name: 'Double' },
  ],
}

const villaProduct = {
  id: 'p2',
  name: 'Villa Soleil',
  basePrice: '200',
  isHotel: false,
  roomTypes: [],
}

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ valid: true, maxAllowedPercentage: 90 }),
  }) as unknown as typeof fetch
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('PromotionForm room-type scoping', () => {
  it('renders the room-type selector for a hotel product', () => {
    render(<PromotionForm selectedProduct={hotelProduct} onSubmit={jest.fn()} />)

    expect(screen.getByText('Type de chambre')).toBeInTheDocument()
    // Establishment-wide default option must be offered.
    expect(screen.getAllByText("Tout l'établissement").length).toBeGreaterThan(0)
  })

  it('does not render the room-type selector for a non-hotel product', () => {
    render(<PromotionForm selectedProduct={villaProduct} onSubmit={jest.fn()} />)

    expect(screen.queryByText('Type de chambre')).not.toBeInTheDocument()
  })

  it('forwards roomTypeId (establishment-wide null by default) on submit', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(<PromotionForm selectedProduct={hotelProduct} onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText(/Pourcentage de réduction/i), {
      target: { value: '10' },
    })
    fireEvent.change(screen.getByLabelText(/Date de début/i), {
      target: { value: '2035-06-01' },
    })
    fireEvent.change(screen.getByLabelText(/Date de fin/i), {
      target: { value: '2035-06-10' },
    })

    // Wait for the commission check (fetch) to mark the form valid.
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Créer la promotion/i })).not.toBeDisabled()
    })

    fireEvent.click(screen.getByRole('button', { name: /Créer la promotion/i }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 'p1',
        discountPercentage: 10,
        roomTypeId: null,
      })
    )
  })
})
