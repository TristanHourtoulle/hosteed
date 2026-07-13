/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { BedCounterGroup } from '../BedCounterGroup'
import type { RoomTypeBedFormData } from '../../../../types/roomType'

const zeroed: RoomTypeBedFormData[] = [
  { bedType: 'SIMPLE', count: 0 },
  { bedType: 'DOUBLE', count: 0 },
  { bedType: 'KING', count: 0 },
  { bedType: 'GRAND_KING', count: 0 },
]

describe('BedCounterGroup', () => {
  it('renders a counter for each bed type', () => {
    render(<BedCounterGroup beds={zeroed} onChange={jest.fn()} />)
    expect(screen.getByText('Lit simple')).toBeInTheDocument()
    expect(screen.getByText('Lit double')).toBeInTheDocument()
    expect(screen.getByText('Lit King')).toBeInTheDocument()
    expect(screen.getByText('Lit grand King')).toBeInTheDocument()
  })

  it('increments count when + is clicked', () => {
    const onChange = jest.fn()
    render(<BedCounterGroup beds={zeroed} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText('Augmenter Lit double'))
    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([{ bedType: 'DOUBLE', count: 1 }])
    )
  })

  it('disables the decrement button at 0 so the count cannot go negative', () => {
    const onChange = jest.fn()
    render(<BedCounterGroup beds={zeroed} onChange={onChange} />)
    const decrement = screen.getByLabelText('Diminuer Lit simple')
    expect(decrement).toBeDisabled()
    fireEvent.click(decrement)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('clamps the count at 0 when decrementing from 1', () => {
    const onChange = jest.fn()
    render(
      <BedCounterGroup
        beds={[
          { bedType: 'SIMPLE', count: 1 },
          { bedType: 'DOUBLE', count: 0 },
          { bedType: 'KING', count: 0 },
          { bedType: 'GRAND_KING', count: 0 },
        ]}
        onChange={onChange}
      />
    )
    fireEvent.click(screen.getByLabelText('Diminuer Lit simple'))
    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([{ bedType: 'SIMPLE', count: 0 }])
    )
  })

  it('displays the current count', () => {
    render(
      <BedCounterGroup
        beds={[
          { bedType: 'SIMPLE', count: 0 },
          { bedType: 'DOUBLE', count: 3 },
          { bedType: 'KING', count: 0 },
          { bedType: 'GRAND_KING', count: 0 },
        ]}
        onChange={jest.fn()}
      />
    )
    expect(screen.getByLabelText('Nombre Lit double')).toHaveTextContent('3')
  })
})
