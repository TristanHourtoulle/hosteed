/**
 * @jest-environment jsdom
 */
import { useState } from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { StepRoomTypes } from '../StepRoomTypes'
import { createEmptyRoomType } from '../../../utils/roomTypeHelpers'
import type { RoomTypeFormData } from '../../../types/roomType'

const meals = [{ id: 'm1', name: 'Petit-déjeuner' }]
const includedServices = [{ id: 's1', name: 'Wifi', description: null }]
const extras = [{ id: 'e1', name: 'Parking', priceEUR: 10, priceMGA: 50000 }]

function Harness({ initial }: { initial: RoomTypeFormData[] }) {
  const [roomTypes, setRoomTypes] = useState(initial)
  return (
    <StepRoomTypes
      roomTypes={roomTypes}
      setRoomTypes={setRoomTypes}
      meals={meals}
      includedServices={includedServices}
      extras={extras}
    />
  )
}

describe('StepRoomTypes', () => {
  it('renders one room type card by default', () => {
    render(<Harness initial={[createEmptyRoomType()]} />)
    expect(screen.getByText('Type de chambre #1')).toBeInTheDocument()
    expect(screen.queryByText('Type de chambre #2')).not.toBeInTheDocument()
  })

  it('adds a card when "Ajouter un autre type de chambre" is clicked', () => {
    render(<Harness initial={[createEmptyRoomType()]} />)
    fireEvent.click(screen.getByRole('button', { name: /Ajouter un autre type de chambre/i }))
    expect(screen.getByText('Type de chambre #2')).toBeInTheDocument()
  })

  it('disables removal when a single type remains', () => {
    render(<Harness initial={[createEmptyRoomType()]} />)
    expect(screen.getByRole('button', { name: /Supprimer ce type/i })).toBeDisabled()
  })

  it('removes a card when trash is clicked and more than one exists', () => {
    render(<Harness initial={[createEmptyRoomType(), createEmptyRoomType()]} />)
    expect(screen.getByText('Type de chambre #2')).toBeInTheDocument()
    const removeButtons = screen.getAllByRole('button', { name: /Supprimer ce type/i })
    fireEvent.click(removeButtons[1])
    expect(screen.queryByText('Type de chambre #2')).not.toBeInTheDocument()
  })

  it('copies data from another filled type', () => {
    const first: RoomTypeFormData = { ...createEmptyRoomType(), name: 'Suite', basePrice: '120' }
    render(<Harness initial={[first, createEmptyRoomType()]} />)
    // The copy-from select lives inside the second card and lists the first (named) type.
    const secondCard = screen.getByText('Type de chambre #2').closest('div[class*="rounded-2xl"]')!
    const copySelect = within(secondCard as HTMLElement).getByLabelText(/Copier depuis/i)
    fireEvent.change(copySelect, { target: { value: first.id } })
    fireEvent.click(within(secondCard as HTMLElement).getByRole('button', { name: /Copier/i }))
    // After copy, the second card's EUR price input holds the copied value.
    const priceInput = within(secondCard as HTMLElement).getByLabelText(/Prix.*EUR/i) as HTMLInputElement
    expect(priceInput.value).toBe('120')
  })
})
