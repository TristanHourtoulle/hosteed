/**
 * @jest-environment jsdom
 */
import { useState } from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { StepRoomTypes } from '../StepRoomTypes'
import { createEmptyRoomType } from '../../../utils/roomTypeHelpers'
import type { RoomTypeFormData } from '../../../types/roomType'
import type { ImageFile } from '@/types/product-form'

jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }))

const meals = [{ id: 'm1', name: 'Petit-déjeuner' }]
const includedServices = [{ id: 's1', name: 'Wifi', description: null }]
const extras = [{ id: 'e1', name: 'Parking', priceEUR: 10, priceMGA: 50000 }]

function Harness({
  initial,
  establishmentPhotoCount = 0,
}: {
  initial: RoomTypeFormData[]
  establishmentPhotoCount?: number
}) {
  const [roomTypes, setRoomTypes] = useState(initial)
  return (
    <StepRoomTypes
      roomTypes={roomTypes}
      setRoomTypes={setRoomTypes}
      meals={meals}
      includedServices={includedServices}
      extras={extras}
      establishmentPhotoCount={establishmentPhotoCount}
    />
  )
}

function photos(count: number): ImageFile[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `img-${i}`,
    file: null,
    preview: `/uploads/products/p1/img_${i}_full_1_a.webp`,
    url: `/uploads/products/p1/img_${i}_full_1_a.webp`,
    isExisting: true,
  }))
}

function typeWithPhotos(count: number): RoomTypeFormData {
  return { ...createEmptyRoomType(), images: photos(count) }
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

describe('StepRoomTypes photo budget banner', () => {
  it('counts establishment photos and every room type against the shared cap', () => {
    render(
      <Harness initial={[typeWithPhotos(2), typeWithPhotos(3)]} establishmentPhotoCount={4} />
    )
    const banner = screen.getByTestId('photo-budget-banner')
    // 4 establishment + 2 + 3 = 9 used, 11 of 20 left.
    expect(within(banner).getByText(/9\s*\/\s*20/)).toBeInTheDocument()
    expect(banner).toHaveTextContent(/11/)
    expect(banner).toHaveAttribute('data-tone', 'ok')
  })

  it('re-computes the banner when a room type is added', () => {
    render(<Harness initial={[typeWithPhotos(2)]} establishmentPhotoCount={1} />)
    expect(screen.getByTestId('photo-budget-banner')).toHaveTextContent(/3\s*\/\s*20/)
    fireEvent.click(screen.getByRole('button', { name: /Ajouter un autre type de chambre/i }))
    // A new type carries no photo, so the tally is unchanged.
    expect(screen.getByTestId('photo-budget-banner')).toHaveTextContent(/3\s*\/\s*20/)
  })

  it('warns when 3 or fewer photos remain', () => {
    render(<Harness initial={[typeWithPhotos(2)]} establishmentPhotoCount={16} />)
    expect(screen.getByTestId('photo-budget-banner')).toHaveAttribute('data-tone', 'warning')
  })

  it('turns red and disables every room-type dropzone once the budget is spent', () => {
    render(<Harness initial={[typeWithPhotos(4)]} establishmentPhotoCount={16} />)

    const banner = screen.getByTestId('photo-budget-banner')
    expect(banner).toHaveAttribute('data-tone', 'full')
    expect(banner).toHaveTextContent(/20\s*\/\s*20/)

    expect(screen.getByRole('button', { name: /Parcourir/i })).toBeDisabled()
    expect(screen.getByTestId('room-type-photo-dropzone-0')).toHaveAttribute(
      'data-disabled',
      'true'
    )
    // The reason is stated inline, next to the dropzone - no modal, no toast.
    expect(screen.getByTestId('room-type-photo-dropzone-0')).toHaveTextContent(
      /limite de 20 photos/i
    )
  })

  it('keeps the dropzone enabled while photos remain', () => {
    render(<Harness initial={[typeWithPhotos(1)]} establishmentPhotoCount={1} />)
    expect(screen.getByRole('button', { name: /Parcourir/i })).toBeEnabled()
    expect(screen.getByTestId('room-type-photo-dropzone-0')).toHaveAttribute(
      'data-disabled',
      'false'
    )
  })
})
