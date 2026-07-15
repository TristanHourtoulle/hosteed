/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react'
import { toast } from 'sonner'
import { useImageUpload } from '../useImageUpload'
import { MAX_IMAGES } from '../../utils/constants'

jest.mock('sonner', () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}))

// Compression is a boundary (browser-only worker): stub it to the identity.
jest.mock('browser-image-compression', () => ({
  __esModule: true,
  default: jest.fn((file: File) => Promise.resolve(file)),
}))

function makeFile(name: string): File {
  return new File(['x'], name, { type: 'image/png' })
}

function makeFiles(count: number): File[] {
  return Array.from({ length: count }, (_, i) => makeFile(`img-${i}.png`))
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('useImageUpload cap', () => {
  it('defaults to MAX_IMAGES when no options are passed (non-hotel path)', async () => {
    const { result } = renderHook(() => useImageUpload())

    await act(async () => {
      await result.current.handleFileSelect(makeFiles(MAX_IMAGES + 1))
    })

    expect(toast.error).toHaveBeenCalledWith(
      `Vous ne pouvez télécharger que ${MAX_IMAGES} images maximum`
    )
    expect(result.current.selectedFiles).toHaveLength(0)
  })

  it('accepts exactly MAX_IMAGES with no options', async () => {
    const { result } = renderHook(() => useImageUpload())

    await act(async () => {
      await result.current.handleFileSelect(makeFiles(MAX_IMAGES))
    })

    await waitFor(() => expect(result.current.selectedFiles).toHaveLength(MAX_IMAGES))
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('caps at the provided maxImages', async () => {
    const { result } = renderHook(() => useImageUpload([], { maxImages: 3 }))

    await act(async () => {
      await result.current.handleFileSelect(makeFiles(4))
    })

    expect(toast.error).toHaveBeenCalledWith('Vous ne pouvez télécharger que 3 images maximum')
    expect(result.current.selectedFiles).toHaveLength(0)
  })

  it('counts already-selected images against the provided maxImages', async () => {
    const { result } = renderHook(() => useImageUpload([], { maxImages: 2 }))

    await act(async () => {
      await result.current.handleFileSelect(makeFiles(2))
    })
    await waitFor(() => expect(result.current.selectedFiles).toHaveLength(2))

    await act(async () => {
      await result.current.handleFileSelect([makeFile('one-too-many.png')])
    })

    expect(toast.error).toHaveBeenCalledWith('Vous ne pouvez télécharger que 2 images maximum')
    expect(result.current.selectedFiles).toHaveLength(2)
  })

  it('rejects every upload when maxImages is 0', async () => {
    const { result } = renderHook(() => useImageUpload([], { maxImages: 0 }))

    await act(async () => {
      await result.current.handleFileSelect([makeFile('a.png')])
    })

    expect(result.current.selectedFiles).toHaveLength(0)
  })
})
