/**
 * @jest-environment jsdom
 */
import { screen, waitFor } from '@testing-library/react'
import { renderWithClient } from '@/test-utils/renderWithClient'
import HighlightsPage from '../page'

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}))

const mockHighlights = [
  {
    id: 'h1',
    name: 'Piscine',
    description: 'Grande piscine chauffée',
    icon: 'Waves',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    _count: { products: 3 },
  },
]

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => mockHighlights,
  }) as unknown as typeof fetch
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('HighlightsPage (React Query migration)', () => {
  it('fetches highlights via useQuery and renders them', async () => {
    renderWithClient(<HighlightsPage />)

    await waitFor(() => expect(screen.getByText('Piscine')).toBeInTheDocument())

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/admin/highlights',
      expect.objectContaining({ cache: 'no-store' })
    )
    expect(screen.getByText('Grande piscine chauffée')).toBeInTheDocument()
  })
})
