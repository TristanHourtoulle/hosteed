/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TestQueryProvider } from '@/test-utils/renderWithClient'

// Mock the shared singleton QueryClient so we can assert invalidation calls
// (useMutationWithCache invalidates through this instance, not the context one).
const invalidateQueriesMock = jest.fn().mockResolvedValue(undefined)
jest.mock('@/lib/cache/query-client', () => {
  const actual = jest.requireActual('@/lib/cache/query-client')
  return {
    ...actual,
    queryClient: {
      invalidateQueries: (...args: unknown[]) => invalidateQueriesMock(...args),
    },
  }
})

const toastSuccess = jest.fn()
const toastError = jest.fn()
jest.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}))

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    session: { user: { id: 'user-1' } },
    isLoading: false,
    isAuthenticated: true,
  }),
}))

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { id: 'user-1' } } }),
}))

jest.mock('next/image', () => ({
  __esModule: true,
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  default: (props: Record<string, unknown>) => <img {...props} />,
}))

import FavoritesPage from '../page'
import { CACHE_TAGS } from '@/lib/cache/query-client'

const favoritesPayload = {
  favorites: [
    {
      id: 'fav-1',
      productId: 'prod-1',
      createdAt: '2026-01-01T00:00:00.000Z',
      product: {
        id: 'prod-1',
        name: 'Villa Test',
        description: 'A nice place',
        address: 'Antananarivo, Madagascar',
        basePrice: '100',
        img: [],
        reviews: [],
      },
    },
  ],
}

describe('FavoritesPage (React Query migration)', () => {
  beforeEach(() => {
    invalidateQueriesMock.mockClear()
    toastSuccess.mockClear()
    toastError.mockClear()
    global.fetch = jest.fn((_url: string, init?: RequestInit) => {
      if (init?.method === 'DELETE') {
        return Promise.resolve({ ok: true, json: async () => ({ success: true }) } as Response)
      }
      return Promise.resolve({ ok: true, json: async () => favoritesPayload } as Response)
    }) as unknown as typeof fetch
  })

  it('renders the favorites list from the query', async () => {
    render(<FavoritesPage />, { wrapper: TestQueryProvider })

    expect(await screen.findByText('Villa Test')).toBeInTheDocument()
  })

  it('removes a favorite and invalidates the favorites cache', async () => {
    render(<FavoritesPage />, { wrapper: TestQueryProvider })
    await screen.findByText('Villa Test')

    // The only button rendered inside a favorite card is the remove button.
    fireEvent.click(screen.getAllByRole('button')[0])

    await waitFor(() => {
      expect(invalidateQueriesMock).toHaveBeenCalledWith({
        queryKey: CACHE_TAGS.favorites('user-1'),
      })
    })
    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: CACHE_TAGS.favoriteStatus('user-1', 'prod-1'),
    })
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/favorites',
      expect.objectContaining({ method: 'DELETE' })
    )

    // Optimistic update removes the card from the list.
    await waitFor(() => {
      expect(screen.queryByText('Villa Test')).not.toBeInTheDocument()
    })
  })
})
