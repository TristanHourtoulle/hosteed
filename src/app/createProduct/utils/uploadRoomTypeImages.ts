import type { RoomTypeFormData } from '../types/roomType'

/**
 * Persist the photos a host added to room types in the wizard.
 *
 * Images are stored on the filesystem, not in the DB: the client posts base64
 * to `/api/images/upload`, which writes three WebP variants and returns their
 * urls; only the `full` url is kept. This mirrors the establishment-photo path
 * exactly — same endpoint, same `entityType`/`entityId` (the product id, so a
 * listing's files stay in one folder).
 *
 * Returns a new room-type list where every uploaded `File` has been replaced by
 * its persisted url, ready for `buildRoomTypesPayload` to forward as
 * `imageUrls`. Room types with nothing new to upload are returned untouched.
 */

interface UploadedImage {
  thumb: string
  medium: string
  full: string
}

async function toBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error(`Erreur de lecture: ${file.name}`))
    reader.readAsDataURL(file)
  })
}

async function uploadFiles(files: File[], productId: string): Promise<string[]> {
  if (files.length === 0) return []

  const images = await Promise.all(files.map(toBase64))

  const response = await fetch('/api/images/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ images, entityType: 'products', entityId: productId }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || "Erreur lors de l'upload des photos des types de chambre")
  }

  const data = await response.json()
  return (data.images ?? []).map((image: UploadedImage) => image.full)
}

/** True when at least one room type holds a photo that is not yet persisted. */
export function hasPendingRoomTypeImages(roomTypes: RoomTypeFormData[]): boolean {
  return roomTypes.some(roomType => roomType.images.some(image => image.file !== null))
}

export async function uploadRoomTypeImages(
  roomTypes: RoomTypeFormData[],
  productId: string
): Promise<RoomTypeFormData[]> {
  return Promise.all(
    roomTypes.map(async roomType => {
      const pending = roomType.images.filter(image => image.file !== null)
      if (pending.length === 0) return roomType

      const urls = await uploadFiles(
        pending.map(image => image.file!),
        productId
      )

      // `urls` comes back in the order the files were sent, so consume it in
      // the same order while walking the original list — this preserves the
      // host's chosen photo order.
      const uploaded = urls[Symbol.iterator]()

      return {
        ...roomType,
        images: roomType.images.map(image => {
          if (image.file === null) return image
          const url = uploaded.next().value ?? image.preview
          return { ...image, file: null, url, preview: url, isExisting: true }
        }),
      }
    })
  )
}
