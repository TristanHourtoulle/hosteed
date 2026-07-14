/**
 * @jest-environment jsdom
 */
import { act, fireEvent, waitFor } from '@testing-library/react'
import { renderWithClient } from '@/test-utils/renderWithClient'

// Mock the shared singleton QueryClient so invalidation calls can be asserted.
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

// Compression is a browser-only concern: return the file untouched.
jest.mock('browser-image-compression', () => ({
  __esModule: true,
  default: (file: File) => Promise.resolve(file),
}))

// next/image renders a plain <img> in jsdom (drop image-only props jsdom rejects).
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    src,
    alt,
  }: {
    src: string
    alt: string
    fill?: boolean
    sizes?: string
  }) =>
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />,
}))

import ImageUpload from '../ImageUpload'
import { CACHE_TAGS } from '@/lib/cache/query-client'

beforeEach(() => {
  invalidateQueriesMock.mockClear()
})

function selectFile(container: HTMLElement) {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement
  const file = new File(['content'], 'cover.png', { type: 'image/png' })
  return act(async () => {
    fireEvent.change(input, { target: { files: [file] } })
  })
}

describe('ImageUpload (type-rent) upload mutation', () => {
  it('uploads the image and invalidates the parent type-rent cache on success', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        images: [{ thumb: 't', medium: 'm', full: 'https://cdn/cover-full.jpg' }],
      }),
    })
    global.fetch = fetchMock as unknown as typeof fetch

    const onImageChange = jest.fn()
    const { container } = renderWithClient(
      <ImageUpload entityType='type-rent' entityId='type-1' onImageChange={onImageChange} />
    )

    await selectFile(container)

    await waitFor(() =>
      expect(onImageChange).toHaveBeenCalledWith('https://cdn/cover-full.jpg')
    )
    expect(fetchMock).toHaveBeenCalledWith('/api/images/upload', expect.any(Object))
    await waitFor(() =>
      expect(invalidateQueriesMock).toHaveBeenCalledWith({
        queryKey: CACHE_TAGS.adminTypeRent('type-1'),
      })
    )
  })

  it('falls back to the base64 preview and skips invalidation when upload fails', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) })
    global.fetch = fetchMock as unknown as typeof fetch

    const onImageChange = jest.fn()
    const { container } = renderWithClient(
      <ImageUpload entityType='type-rent' entityId='type-1' onImageChange={onImageChange} />
    )

    await selectFile(container)

    await waitFor(() => expect(onImageChange).toHaveBeenCalled())
    // Fallback passes a base64 data URL, not the CDN url.
    expect(onImageChange.mock.calls[0][0]).toMatch(/^data:/)
    expect(invalidateQueriesMock).not.toHaveBeenCalled()
  })
})
