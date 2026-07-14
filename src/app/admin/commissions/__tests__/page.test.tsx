/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/cache/query-client'

// --- Mocks -----------------------------------------------------------------

// Authenticated full-admin session.
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    session: { user: { roles: 'ADMIN' } },
    isLoading: false,
    isAuthenticated: true,
  }),
}))

jest.mock('@/hooks/useAdminAuth', () => ({
  isFullAdmin: () => true,
}))

const pushMock = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

const toastSuccess = jest.fn()
const toastError = jest.fn()
jest.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}))

import CommissionsPage from '../page'

const commission = {
  id: 'c-1',
  title: 'Commission Appartement',
  description: null,
  hostCommissionRate: 0.1,
  hostCommissionFixed: 2,
  clientCommissionRate: 0.05,
  clientCommissionFixed: 1,
  isActive: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  typeRent: { id: 't-1', name: 'Appartement', description: '' },
}

function renderPage() {
  return render(
    <QueryClientProvider client={queryClient}>
      <CommissionsPage />
    </QueryClientProvider>
  )
}

beforeEach(() => {
  queryClient.clear()
  pushMock.mockClear()
  toastSuccess.mockClear()
  toastError.mockClear()
  jest.spyOn(window, 'confirm').mockReturnValue(true)
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('CommissionsPage (React Query migration)', () => {
  it('loads commissions from the admin endpoint and renders them', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ commissions: [commission], unassignedTypes: [] }),
    })
    global.fetch = fetchMock as unknown as typeof fetch

    renderPage()

    expect(await screen.findByText('Commission Appartement')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/commissions?includeUnassigned=true',
      expect.objectContaining({ cache: 'no-store' })
    )
  })

  it('toggles status via PATCH and refetches through cache invalidation', async () => {
    const fetchMock = jest.fn((url: string, init?: RequestInit) => {
      if (init?.method === 'PATCH') {
        return Promise.resolve({ ok: true, json: async () => ({}) })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ commissions: [commission], unassignedTypes: [] }),
      })
    })
    global.fetch = fetchMock as unknown as typeof fetch

    renderPage()

    await screen.findByText('Commission Appartement')

    const getCallsBefore = fetchMock.mock.calls.filter(([, init]) => !init?.method).length

    fireEvent.click(screen.getByTitle('Désactiver'))

    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(([url, init]) => url === '/api/admin/commissions/c-1' && init?.method === 'PATCH')
      ).toBe(true)
    )
    // Invalidation of adminCommissions() must trigger a refetch (extra GET).
    await waitFor(() =>
      expect(fetchMock.mock.calls.filter(([, init]) => !init?.method).length).toBeGreaterThan(getCallsBefore)
    )
    expect(toastSuccess).toHaveBeenCalledWith('Statut mis à jour')
  })
})
