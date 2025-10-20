import imageCompression from 'browser-image-compression'

export interface CompressionOptions {
  maxSizeMB: number
  maxWidthOrHeight: number
  useWebWorker: boolean
  quality: number
}

export const defaultCompressionOptions: CompressionOptions = {
  maxSizeMB: 0.8, // Compress to max 800KB
  maxWidthOrHeight: 1920, // Max dimension 1920px
  useWebWorker: true,
  quality: 0.8, // 80% quality
}

export async function compressImage(
  file: File,
  options: CompressionOptions = defaultCompressionOptions
): Promise<File> {
  try {
    // If file is already small enough, return as is
    if (file.size <= options.maxSizeMB * 1024 * 1024) {
      return file
    }

    const compressedFile = await imageCompression(file, {
      maxSizeMB: options.maxSizeMB,
      maxWidthOrHeight: options.maxWidthOrHeight,
      useWebWorker: options.useWebWorker,
      initialQuality: options.quality,
    })

    // Create a new File object with the original name
    const newFile = new File([compressedFile], file.name, {
      type: compressedFile.type,
      lastModified: Date.now(),
    })

    console.log(
      `Compressed ${file.name}: ${(file.size / 1024).toFixed(2)}KB → ${(newFile.size / 1024).toFixed(2)}KB`
    )

    return newFile
  } catch (error) {
    console.error('Compression failed for', file.name, error)
    // Return original file if compression fails
    return file
  }
}

export async function compressImages(
  files: File[],
  options: CompressionOptions = defaultCompressionOptions,
  onProgress?: (progress: number, currentFile: string) => void
): Promise<File[]> {
  const compressedFiles: File[] = []

  for (let i = 0; i < files.length; i++) {
    try {
      if (onProgress) {
        onProgress((i / files.length) * 100, files[i].name)
      }

      const compressed = await compressImage(files[i], options)
      compressedFiles.push(compressed)

      if (onProgress) {
        onProgress(((i + 1) / files.length) * 100, files[i].name)
      }
    } catch (error) {
      console.error(`Failed to compress image ${i + 1}:`, error)
      // Keep original file on compression failure
      compressedFiles.push(files[i])
    }
  }

  return compressedFiles
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
