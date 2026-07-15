import imageCompression from 'browser-image-compression'
import type { ImageFile } from '@/types/product-form'
import { generateImageId } from './formHelpers'

/**
 * Client-side compression + preview generation, shared by `useImageUpload`
 * (establishment photos) and the per-room-type uploader. Extracted verbatim
 * from the hook so both paths compress identically — divergence here would mean
 * room-type photos uploaded at a different quality than establishment ones.
 */

const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
}

/** Compress each file; a file that fails compression is kept as-is. */
export async function compressImages(files: File[]): Promise<File[]> {
  return Promise.all(
    files.map(async file => {
      try {
        const compressed = await imageCompression(file, COMPRESSION_OPTIONS)
        return new File([compressed], file.name, {
          type: file.type,
          lastModified: Date.now(),
        })
      } catch {
        return file
      }
    })
  )
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Compress `files` and wrap them as new (not yet persisted) `ImageFile`s with a
 * base64 preview.
 */
export async function createImageFiles(files: File[]): Promise<ImageFile[]> {
  const compressed = await compressImages(files)

  return Promise.all(
    compressed.map(async file => ({
      file,
      preview: await readAsDataUrl(file),
      id: generateImageId(),
      isExisting: false,
    }))
  )
}
