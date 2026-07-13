/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { StepBasicInfo } from '../StepBasicInfo'
import { DEFAULT_FORM_DATA, type ProductFormData } from '@/types/product-form'
import type { TypeRentInterface } from '@/lib/interface/typeRentInterface'

jest.mock('@/components/ui/TiptapEditor', () => ({
  TiptapEditor: () => <div data-testid="tiptap" />,
}))

const types: TypeRentInterface[] = [
  { id: 't-hotel', name: 'Hôtel', description: '', isHotelType: true } as TypeRentInterface,
]

function renderStep(isHotel: boolean) {
  const formData: ProductFormData = {
    ...DEFAULT_FORM_DATA,
    roomTypes: [],
    isHotel,
    hotelName: 'Test',
  }
  render(
    <StepBasicInfo
      formData={formData}
      types={types}
      handleInputChange={jest.fn()}
      setFormData={jest.fn()}
      hasFieldError={() => false}
      getFieldError={() => undefined}
    />
  )
}

describe('StepBasicInfo', () => {
  it('does not render the deprecated availableRooms field for hotels', () => {
    renderStep(true)
    expect(screen.queryByLabelText(/Nombre de chambres disponibles/i)).not.toBeInTheDocument()
  })

  it('still renders the hotel name field for hotels', () => {
    renderStep(true)
    expect(screen.getByLabelText(/Nom de l'hôtel/i)).toBeInTheDocument()
  })

  it('does not render the hotel configuration card for non-hotels', () => {
    renderStep(false)
    expect(screen.queryByText('Configuration Hôtel')).not.toBeInTheDocument()
  })
})
