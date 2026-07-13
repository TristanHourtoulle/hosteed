/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { RoomTypeCard } from '../RoomTypeCard'
import { createEmptyRoomType } from '../../../../utils/roomTypeHelpers'
import type { RoomTypeFormData } from '../../../../types/roomType'

const meals = [{ id: 'm1', name: 'Petit-déjeuner' }]
const includedServices = [{ id: 's1', name: 'Wifi', description: null }]
const extras = [{ id: 'e1', name: 'Parking', priceEUR: 10, priceMGA: 50000 }]

function baseProps(value: RoomTypeFormData, over: Partial<React.ComponentProps<typeof RoomTypeCard>> = {}) {
  return {
    index: 0,
    value,
    otherTypes: [] as RoomTypeFormData[],
    meals,
    includedServices,
    extras,
    canRemove: true,
    onChange: jest.fn(),
    onRemove: jest.fn(),
    onCopyFrom: jest.fn(),
    ...over,
  }
}

describe('RoomTypeCard', () => {
  it('renders all 8 room type name options', () => {
    render(<RoomTypeCard {...baseProps(createEmptyRoomType())} />)
    const options = screen.getAllByRole('option').map(o => o.textContent)
    for (const name of ['Double', 'Triple', 'Quadruple', 'Suite', 'Familiale', 'Studio', 'Appartement', 'Lit en dortoir']) {
      expect(options).toContain(name)
    }
  })

  it('renders bed counters and price fields', () => {
    render(<RoomTypeCard {...baseProps(createEmptyRoomType())} />)
    expect(screen.getByLabelText(/Prix.*EUR/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Prix.*MGA/i)).toBeInTheDocument()
    expect(screen.getByText('Lit simple')).toBeInTheDocument()
    expect(screen.getByLabelText('Augmenter Lit double')).toBeInTheDocument()
  })

  it('calls onChange when the name select changes', () => {
    const onChange = jest.fn()
    render(<RoomTypeCard {...baseProps(createEmptyRoomType(), { onChange })} />)
    fireEvent.change(screen.getByRole('combobox', { name: /Type de chambre/i }), {
      target: { value: 'Suite' },
    })
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ name: 'Suite' }))
  })

  it('renders per-type meals, included services and extras', () => {
    render(<RoomTypeCard {...baseProps(createEmptyRoomType())} />)
    expect(screen.getByText('Petit-déjeuner')).toBeInTheDocument()
    expect(screen.getByText('Wifi')).toBeInTheDocument()
    expect(screen.getByText('Parking')).toBeInTheDocument()
  })

  it('hides the copy-from select when there is no other filled type', () => {
    render(<RoomTypeCard {...baseProps(createEmptyRoomType(), { otherTypes: [] })} />)
    expect(screen.queryByRole('button', { name: /Copier/i })).not.toBeInTheDocument()
  })

  it('shows the copy-from select and fires onCopyFrom', () => {
    const onCopyFrom = jest.fn()
    const source: RoomTypeFormData = { ...createEmptyRoomType(), id: 'src-1', name: 'Suite' }
    render(<RoomTypeCard {...baseProps(createEmptyRoomType(), { otherTypes: [source], onCopyFrom })} />)
    fireEvent.change(screen.getByLabelText(/Copier depuis/i), { target: { value: 'src-1' } })
    fireEvent.click(screen.getByRole('button', { name: /Copier/i }))
    expect(onCopyFrom).toHaveBeenCalledWith('src-1')
  })

  it('disables the remove button when canRemove is false', () => {
    render(<RoomTypeCard {...baseProps(createEmptyRoomType(), { canRemove: false })} />)
    expect(screen.getByRole('button', { name: /Supprimer ce type/i })).toBeDisabled()
  })

  it('shows a field error passed via the errors prop', () => {
    render(
      <RoomTypeCard
        {...baseProps(createEmptyRoomType(), { errors: { basePrice: 'Le prix EUR est requis' } })}
      />
    )
    expect(screen.getByText('Le prix EUR est requis')).toBeInTheDocument()
  })
})
