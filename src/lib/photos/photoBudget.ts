/**
 * Global photo budget for a listing.
 *
 * The cap is per listing, not per section: establishment photos and every room
 * type's photos are drawn from the same allowance. A hotel already holding
 * MAX_LISTING_PHOTOS establishment photos can therefore add no room-type photo.
 *
 * Framework-free on purpose: this module is imported from React components,
 * API route handlers and services alike.
 */

export const MAX_LISTING_PHOTOS = 20

export interface PhotoBudgetInput {
  /** Number of photos attached to the listing itself. */
  establishmentCount: number
  /** Number of photos attached to each room type of the listing. */
  roomTypeCounts: number[]
}

export interface PhotoBudget {
  /** Total photos currently attached to the listing, all sections combined. */
  used: number
  /** Photos that can still be added, clamped at zero. */
  remaining: number
  /** The global cap this budget is measured against. */
  max: number
}

export class PhotoBudgetExceededError extends Error {
  readonly used: number
  readonly max: number

  constructor(used: number, max: number) {
    super(
      `Limite de ${max} photos par annonce dépassée : ${used} photos au total ` +
        `(photos de l'établissement et des types de chambre confondues). ` +
        `Supprimez ${used - max} photo(s) avant d'en ajouter de nouvelles.`
    )
    this.name = 'PhotoBudgetExceededError'
    this.used = used
    this.max = max
  }
}

export function computePhotoBudget(input: PhotoBudgetInput): PhotoBudget {
  const used = input.roomTypeCounts.reduce((total, count) => total + count, input.establishmentCount)

  return {
    used,
    remaining: Math.max(0, MAX_LISTING_PHOTOS - used),
    max: MAX_LISTING_PHOTOS,
  }
}

/**
 * @throws {PhotoBudgetExceededError} when the listing exceeds the global cap.
 */
export function assertPhotoBudget(input: PhotoBudgetInput): void {
  const { used, max } = computePhotoBudget(input)

  if (used > max) {
    throw new PhotoBudgetExceededError(used, max)
  }
}
