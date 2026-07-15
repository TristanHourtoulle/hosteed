import { bedsSummary } from './roomTypeView'
import type { RoomTypeWithRelations } from './roomTypeTypes'

/**
 * Room-type diffing for the admin comparison view (draft vs original).
 * Types are matched by DB `id` first, falling back to `name` for drafts whose
 * types were created without a persisted id. Pure & framework-free so it can be
 * unit-tested under the node Jest env.
 */

export type RoomTypeDiffKind = 'added' | 'removed' | 'changed'

export interface RoomTypeFieldChange {
  field: string
  label: string
  from: string | number | boolean | null
  to: string | number | boolean | null
}

export interface RoomTypeDiff {
  kind: RoomTypeDiffKind
  /** Display label for the room type (its name). */
  label: string
  /** Only populated when `kind === 'changed'`. */
  fields?: RoomTypeFieldChange[]
}

interface HasRoomTypes {
  roomTypes?: RoomTypeWithRelations[]
}

function keyOf(roomType: RoomTypeWithRelations): string {
  return roomType.id || `name:${roomType.name}`
}

const COMPARED_FIELDS: Array<{
  field: keyof RoomTypeWithRelations
  label: string
}> = [
  { field: 'name', label: 'Nom' },
  { field: 'quantity', label: 'Quantité' },
  { field: 'capacity', label: 'Capacité' },
  { field: 'surface', label: 'Surface' },
  { field: 'smoking', label: 'Fumeur' },
  { field: 'basePrice', label: 'Prix EUR' },
  { field: 'priceMGA', label: 'Prix MGA' },
]

function normalizeScalar(
  value: string | number | boolean | null | undefined
): string | number | boolean | null {
  return value ?? null
}

function diffFields(
  draft: RoomTypeWithRelations,
  original: RoomTypeWithRelations
): RoomTypeFieldChange[] {
  const changes: RoomTypeFieldChange[] = []

  for (const { field, label } of COMPARED_FIELDS) {
    const to = normalizeScalar(draft[field] as string | number | boolean | null | undefined)
    const from = normalizeScalar(original[field] as string | number | boolean | null | undefined)
    if (to !== from) {
      changes.push({ field, label, from, to })
    }
  }

  const draftBeds = bedsSummary(draft.beds ?? [])
  const originalBeds = bedsSummary(original.beds ?? [])
  if (draftBeds !== originalBeds) {
    changes.push({ field: 'beds', label: 'Lits', from: originalBeds, to: draftBeds })
  }

  return changes
}

/**
 * Build the list of room-type differences between a draft and its original.
 * Returns `[]` when the room-type sets are identical.
 */
export function buildRoomTypeDiffs(draft: HasRoomTypes, original: HasRoomTypes): RoomTypeDiff[] {
  const draftTypes = draft.roomTypes ?? []
  const originalTypes = original.roomTypes ?? []

  const draftByKey = new Map(draftTypes.map(rt => [keyOf(rt), rt]))
  const originalByKey = new Map(originalTypes.map(rt => [keyOf(rt), rt]))

  const diffs: RoomTypeDiff[] = []

  // Added (present in draft, absent in original) and changed.
  for (const draftType of draftTypes) {
    const match = originalByKey.get(keyOf(draftType))
    if (!match) {
      diffs.push({ kind: 'added', label: draftType.name })
      continue
    }
    const fields = diffFields(draftType, match)
    if (fields.length > 0) {
      diffs.push({ kind: 'changed', label: draftType.name, fields })
    }
  }

  // Removed (present in original, absent in draft).
  for (const originalType of originalTypes) {
    if (!draftByKey.has(keyOf(originalType))) {
      diffs.push({ kind: 'removed', label: originalType.name })
    }
  }

  return diffs
}
