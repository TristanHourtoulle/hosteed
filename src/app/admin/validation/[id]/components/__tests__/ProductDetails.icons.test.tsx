/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react'
import { ProductDetails } from '../ProductDetails'

// next/image is not needed for the equipment section; provide a lightweight mock
jest.mock('next/image', () => ({
  __esModule: true,
  default: () => null,
}))

// MarkdownRenderer pulls in ESM-only deps (remark-gfm) that Jest can't transform; stub it
jest.mock('@/components/ui/MarkdownRenderer', () => ({
  __esModule: true,
  default: ({ content }: { content: string }) => content,
}))

function buildProduct() {
  return {
    id: 'p1',
    name: 'Test Product',
    description: 'A description',
    address: '1 Main St',
    basePrice: '100',
    arriving: 14,
    leaving: 11,
    owner: {
      id: 'o1',
      name: 'Owner',
      lastname: 'Name',
      email: 'owner@test.com',
    },
    equipments: [{ name: 'Wifi', icon: 'CheckCircle' }],
  }
}

describe('ProductDetails equipment icons (TRI-1008)', () => {
  it('renders a lucide icon (svg) instead of the raw icon name string', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { queryByText, getByText } = render(<ProductDetails product={buildProduct() as any} />)

    // The literal icon name must NOT be rendered as text anywhere
    expect(queryByText('CheckCircle')).toBeNull()

    // The equipment row must render an actual svg icon next to its label
    const equipmentRow = getByText('Wifi').parentElement
    expect(equipmentRow?.querySelector('svg')).not.toBeNull()
  })
})
