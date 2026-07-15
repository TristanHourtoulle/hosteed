/**
 * ORPHANED UPLOAD CLEANUP — pure logic
 *
 * Physical WebP files under `public/uploads/<entityType>/<entityId>/` outlive the DB rows
 * that reference them: `deleteImageFiles` in `src/app/api/products/[id]/images/route.ts`
 * strips `-(?:thumb|medium|full)\.webp$` (hyphens) while `image.service.ts` generates
 * `img_0_full_1712000000000_ab12cd34.webp` (underscores), so it never matches anything.
 *
 * WHY FILES CANNOT BE MATCHED BY NAME
 * -----------------------------------
 * `saveImage` calls `generateFileName` once per size, and each call re-reads `Date.now()`
 * and mints a fresh `randomUUID()`. The three sizes of one logical image therefore share
 * ONLY the `img_<index>` prefix:
 *
 *   img_0_thumb_1712000000111_99887766.webp
 *   img_0_medium_1712000000222_55443322.webp
 *   img_0_full_1712000000000_ab12cd34.webp
 *
 * A stored URL is one arbitrary variant — `createProduct` stores `full`, while rows migrated
 * by `scripts/migrate-images-to-filesystem.ts` store `thumb`. The other variants are NOT
 * derivable from it. So a naive "file not in the URL set → delete" would wipe the
 * thumb/medium of every live image on the site.
 *
 * ALGORITHM (group-level, size-agnostic, conservative)
 * ----------------------------------------------------
 * 1. Collect every uploads URL from every image-bearing column into a referenced set.
 * 2. Reduce each URL to its group key: `<entityType>/<entityId>/img_<index>`.
 * 3. Reduce each file on disk to its group key the same way.
 * 4. A file is an orphan only if its group key is absent from the referenced set — so one
 *    surviving reference of ANY size keeps the whole group, siblings included.
 * 5. Files that do not match the generated pattern are skipped, never deleted.
 * 6. Files younger than the grace period are kept: `createProduct` uploads images BEFORE
 *    the DB row exists, so a fresh file with no reference is expected, not garbage.
 *
 * The unit of decision is the group, never the individual file. Deleting a live thumb would
 * require its whole group to be unreferenced, which means the image itself is unreferenced.
 * Where the grouping is ambiguous (two uploads reusing `img_0` in one directory), the
 * ambiguity resolves toward KEEPING files, never deleting them.
 */

/** Entity types accepted by `saveImage` — each is a directory under `public/uploads/`. */
export const UPLOAD_ENTITY_TYPES = ['products', 'users', 'posts', 'type-rent', 'homepage'] as const

/**
 * Filenames produced by `generateFileName`: `img_<index>_<size>_<timestamp>_<uuid8>.webp`.
 * Anything else is treated as unknown and left untouched.
 */
const GENERATED_FILE_NAME = /^(img_\d+)_(?:thumb|medium|full)_\d+_[0-9a-f]+\.webp$/

const UPLOADS_PREFIX = '/uploads/'
const DAY_MS = 24 * 60 * 60 * 1000

export const DEFAULT_GRACE_DAYS = 7

export interface ParsedUploadPath {
  entityType: string
  entityId: string
  fileName: string
  /** `<entityType>/<entityId>/img_<index>` — shared by all sizes of one logical image. */
  groupKey: string
}

/** A file discovered on disk, relative to `public/uploads/`. */
export interface UploadFile {
  relativePath: string
  mtimeMs: number
  sizeBytes: number
}

export interface CleanupDeps {
  /** Lists every file under `public/uploads/`, paths relative to that root. */
  listFiles: () => Promise<UploadFile[]>
  /** Every value from every image-bearing column; base64/non-upload values are tolerated. */
  getReferencedUrls: () => Promise<string[]>
  deleteFile: (relativePath: string) => Promise<void>
  now?: number
  olderThanDays?: number
  /** Deletion only happens when true. Dry-run is the default. */
  apply?: boolean
}

export interface CleanupSummary {
  scanned: number
  kept: number
  orphaned: number
  deleted: number
  failed: number
  withinGrace: number
  skippedUnparseable: number
  bytesReclaimed: number
  sample: string[]
}

const SAMPLE_LIMIT = 10

/**
 * Reduces a stored URL or a relative disk path to its group key.
 * Returns null for base64 blobs, remote URLs and any unrecognised filename.
 */
export function parseUploadUrl(value: string): ParsedUploadPath | null {
  if (!value || typeof value !== 'string') return null

  const withoutDomain = value.replace(/^https?:\/\/[^/]+/, '')
  const relative = withoutDomain.startsWith(UPLOADS_PREFIX)
    ? withoutDomain.slice(UPLOADS_PREFIX.length)
    : withoutDomain

  // Reject base64 payloads and absolute/remote references early.
  if (relative.startsWith('data:') || relative.includes('://')) return null

  const segments = relative.split('/').filter(Boolean)
  if (segments.length !== 3) return null

  const [entityType, entityId, fileName] = segments
  if (!entityType || !entityId || !fileName) return null

  const match = GENERATED_FILE_NAME.exec(fileName)
  if (!match) return null

  const prefix = match[1]

  return {
    entityType,
    entityId,
    fileName,
    groupKey: `${entityType}/${entityId}/${prefix}`,
  }
}

/** Builds the set of group keys that at least one DB row still references. */
export function buildReferencedGroups(urls: readonly string[]): Set<string> {
  const groups = new Set<string>()

  for (const url of urls) {
    const parsed = parseUploadUrl(url)
    if (parsed) groups.add(parsed.groupKey)
  }

  return groups
}

/**
 * Scans `public/uploads/` and removes files whose group is referenced by no DB row.
 * Dry-run unless `apply` is true.
 */
export async function cleanupOrphanedUploads(deps: CleanupDeps): Promise<CleanupSummary> {
  const {
    listFiles,
    getReferencedUrls,
    deleteFile,
    now = Date.now(),
    olderThanDays = DEFAULT_GRACE_DAYS,
    apply = false,
  } = deps

  const [files, referencedUrls] = await Promise.all([listFiles(), getReferencedUrls()])
  const referencedGroups = buildReferencedGroups(referencedUrls)
  const graceCutoff = now - olderThanDays * DAY_MS

  const summary: CleanupSummary = {
    scanned: files.length,
    kept: 0,
    orphaned: 0,
    deleted: 0,
    failed: 0,
    withinGrace: 0,
    skippedUnparseable: 0,
    bytesReclaimed: 0,
    sample: [],
  }

  for (const file of files) {
    const parsed = parseUploadUrl(file.relativePath)

    // Unknown shape: never delete what we cannot reason about.
    if (!parsed) {
      summary.skippedUnparseable += 1
      continue
    }

    // One reference of any size keeps the whole group — this is what saves the siblings.
    if (referencedGroups.has(parsed.groupKey)) {
      summary.kept += 1
      continue
    }

    // Uploaded before its DB row exists (create wizard): too young to judge.
    if (file.mtimeMs >= graceCutoff) {
      summary.withinGrace += 1
      continue
    }

    summary.orphaned += 1
    summary.bytesReclaimed += file.sizeBytes
    if (summary.sample.length < SAMPLE_LIMIT) summary.sample.push(file.relativePath)

    if (!apply) continue

    try {
      await deleteFile(file.relativePath)
      summary.deleted += 1
    } catch {
      summary.failed += 1
    }
  }

  return summary
}
