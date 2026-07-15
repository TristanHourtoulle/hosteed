/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import PropertyRules from '../PropertyRules'

const rules = {
  smokingAllowed: false,
  petsAllowed: true,
  eventsAllowed: false,
  checkInTime: '14:00',
  checkOutTime: '10:00',
  selfCheckIn: false,
}

describe('PropertyRules', () => {
  it('shows the maximum travellers bullet for a non-hotel product', () => {
    render(<PropertyRules maxPeople={4} rules={rules} isHotel={false} />)

    expect(screen.getByText(/Maximum 4 voyageurs/)).toBeInTheDocument()
  })

  it('hides the product-level maximum travellers bullet for a hotel', () => {
    render(<PropertyRules maxPeople={24} rules={rules} isHotel />)

    expect(screen.queryByText(/Maximum 24 voyageurs/)).not.toBeInTheDocument()
    // The rest of the house rules stay untouched.
    expect(screen.getByText(/Interdiction de fumer/)).toBeInTheDocument()
    expect(screen.getByText(/Animaux autorisés/)).toBeInTheDocument()
  })

  it('renders nothing for a hotel whose only content was maxPeople', () => {
    const defaultRules = {
      smokingAllowed: false,
      petsAllowed: false,
      eventsAllowed: false,
      checkInTime: '15:00',
      checkOutTime: '11:00',
      selfCheckIn: false,
    }

    const { container } = render(<PropertyRules maxPeople={24} rules={defaultRules} isHotel />)

    expect(container).toBeEmptyDOMElement()
  })
})
