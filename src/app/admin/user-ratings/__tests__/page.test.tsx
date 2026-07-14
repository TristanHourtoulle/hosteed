/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TestQueryProvider } from '@/test-utils/renderWithClient'
import { CACHE_TAGS } from '@/lib/cache/query-client'

// Mock the shared singleton QueryClient used by useMutationWithCache for
// invalidation so we can assert the correct cache tag is invalidated.
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

import AdminUserRatingsPage from '../page'

const rating = {
  id: 'r1',
  rating: 5,
  comment: 'Great stay',
  type: 'GUEST_TO_HOST' as const,
  createdAt: new Date('2026-01-01').toISOString(),
  rater: { name: 'Alice', lastname: 'Martin', email: 'alice@test.com' },
  rated: { name: 'Bob', lastname: 'Durand', email: 'bob@test.com' },
  rent: { product: { name: 'Villa Test' } },
}

beforeEach(() => {
  invalidateQueriesMock.mockClear()
  global.fetch = jest.fn((url: string | URL | Request, options?: RequestInit) => {
    const href = typeof url === 'string' ? url : url.toString()
    if (href.includes('/api/admin/user-ratings/') && options?.method === 'PATCH') {
      return Promise.resolve({ ok: true, json: async () => ({ success: true }) })
    }
    return Promise.resolve({ ok: true, json: async () => ({ pendingRatings: [rating] }) })
  }) as unknown as typeof fetch
})

describe('AdminUserRatingsPage (React Query migration)', () => {
  it('loads and renders pending ratings from the query', async () => {
    render(<AdminUserRatingsPage />, { wrapper: TestQueryProvider })

    expect(await screen.findByText(/Villa Test/)).toBeInTheDocument()
    expect(screen.getByText(/Great stay/)).toBeInTheDocument()
  })

  it('validates a rating via the mutation and invalidates adminUserRatings', async () => {
    render(<AdminUserRatingsPage />, { wrapper: TestQueryProvider })

    const validateButton = await screen.findByText('Valider')
    fireEvent.click(validateButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/user-ratings/r1',
        expect.objectContaining({ method: 'PATCH' })
      )
    })

    await waitFor(() => {
      expect(invalidateQueriesMock).toHaveBeenCalledWith({
        queryKey: CACHE_TAGS.adminUserRatings(),
      })
    })
  })
})
