/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react'
import { TestQueryProvider } from '@/test-utils/renderWithClient'

// Mock the shared singleton QueryClient so we can assert invalidation calls.
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

// Mock toast so success/error messages can be asserted without a DOM toaster.
const toastSuccess = jest.fn()
const toastError = jest.fn()
jest.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}))

import { useMutationWithCache } from '../useMutationWithCache'
import { CACHE_TAGS } from '@/lib/cache/query-client'

beforeEach(() => {
  invalidateQueriesMock.mockClear()
  toastSuccess.mockClear()
  toastError.mockClear()
})

describe('useMutationWithCache (generic)', () => {
  it('calls the mutationFn with the given variables and exposes the result', async () => {
    const mutationFn = jest.fn().mockResolvedValue({ id: 'created-1' })

    const { result } = renderHook(() => useMutationWithCache({ mutationFn }), {
      wrapper: TestQueryProvider,
    })

    act(() => {
      result.current.mutate({ name: 'Villa' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mutationFn.mock.calls[0][0]).toEqual({ name: 'Villa' })
    expect(result.current.data).toEqual({ id: 'created-1' })
  })

  it('invalidates every provided query key on success', async () => {
    const mutationFn = jest.fn().mockResolvedValue(undefined)
    const keys = [CACHE_TAGS.adminExtras(), CACHE_TAGS.adminHighlights()]

    const { result } = renderHook(
      () => useMutationWithCache({ mutationFn, invalidateKeys: keys }),
      { wrapper: TestQueryProvider }
    )

    act(() => {
      result.current.mutate(undefined)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateQueriesMock).toHaveBeenCalledTimes(2)
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: CACHE_TAGS.adminExtras() })
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: CACHE_TAGS.adminHighlights() })
  })

  it('supports invalidateKeys as a function of (data, variables)', async () => {
    const mutationFn = jest.fn().mockResolvedValue({ id: 'p-9' })

    const { result } = renderHook(
      () =>
        useMutationWithCache<{ id: string }, { hostId: string }>({
          mutationFn,
          invalidateKeys: (data, variables) => [
            CACHE_TAGS.adminBlogPost(data.id),
            CACHE_TAGS.hostPromotions(variables.hostId),
          ],
        }),
      { wrapper: TestQueryProvider }
    )

    act(() => {
      result.current.mutate({ hostId: 'host-3' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: CACHE_TAGS.adminBlogPost('p-9') })
    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: CACHE_TAGS.hostPromotions('host-3'),
    })
  })

  it('runs the successMessage toast and onSuccess callback after invalidation', async () => {
    const mutationFn = jest.fn().mockResolvedValue('ok')
    const onSuccess = jest.fn()

    const { result } = renderHook(
      () =>
        useMutationWithCache({
          mutationFn,
          invalidateKeys: [CACHE_TAGS.adminUsers()],
          successMessage: 'Saved',
          onSuccess,
        }),
      { wrapper: TestQueryProvider }
    )

    act(() => {
      result.current.mutate(undefined)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toastSuccess).toHaveBeenCalledWith('Saved')
    expect(onSuccess).toHaveBeenCalledWith('ok', undefined)
  })

  it('surfaces the error, skips invalidation, and calls onError on failure', async () => {
    const failure = new Error('boom')
    const mutationFn = jest.fn().mockRejectedValue(failure)
    const onError = jest.fn()

    const { result } = renderHook(
      () =>
        useMutationWithCache({
          mutationFn,
          invalidateKeys: [CACHE_TAGS.adminUsers()],
          errorMessage: 'Failed',
          onError,
        }),
      { wrapper: TestQueryProvider }
    )

    act(() => {
      result.current.mutate(undefined)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBe(failure)
    expect(invalidateQueriesMock).not.toHaveBeenCalled()
    expect(toastError).toHaveBeenCalledWith('Failed')
    expect(onError).toHaveBeenCalledWith(failure, undefined, undefined)
  })

  it('runs the optimistic onMutate before the mutation and rolls back on error', async () => {
    const calls: string[] = []
    const mutationFn = jest.fn().mockImplementation(async () => {
      calls.push('mutate')
      throw new Error('nope')
    })
    const rollback = jest.fn()

    const { result } = renderHook(
      () =>
        useMutationWithCache<unknown, void, { snapshot: number }>({
          mutationFn,
          optimistic: {
            onMutate: () => {
              calls.push('onMutate')
              return { snapshot: 42 }
            },
            rollback,
          },
        }),
      { wrapper: TestQueryProvider }
    )

    act(() => {
      result.current.mutate()
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(calls).toEqual(['onMutate', 'mutate'])
    expect(rollback).toHaveBeenCalledWith({ snapshot: 42 }, undefined, expect.any(Error))
  })
})
