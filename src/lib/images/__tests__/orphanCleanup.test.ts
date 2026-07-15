import {
  parseUploadUrl,
  buildReferencedGroups,
  cleanupOrphanedUploads,
  type UploadFile,
  type CleanupDeps,
} from '../orphanCleanup'

const DAY_MS = 24 * 60 * 60 * 1000
const NOW = Date.UTC(2026, 6, 15)

/** A file older than the default 7-day grace period. */
const OLD = NOW - 30 * DAY_MS
/** A file uploaded 1h ago — inside the create-wizard window. */
const FRESH = NOW - 60 * 60 * 1000

function file(relativePath: string, mtimeMs = OLD, sizeBytes = 1000): UploadFile {
  return { relativePath, mtimeMs, sizeBytes }
}

function makeDeps(overrides: Partial<CleanupDeps> = {}): CleanupDeps & { deleteFile: jest.Mock } {
  const deleteFile = jest.fn().mockResolvedValue(undefined)
  return {
    listFiles: async () => [],
    getReferencedUrls: async () => [],
    deleteFile,
    now: NOW,
    olderThanDays: 7,
    apply: false,
    ...overrides,
    // Keep the mock identity when callers do not override it.
    ...(overrides.deleteFile ? { deleteFile: overrides.deleteFile as jest.Mock } : { deleteFile }),
  } as CleanupDeps & { deleteFile: jest.Mock }
}

describe('parseUploadUrl', () => {
  it('parses a full-size product image URL into a group key', () => {
    expect(
      parseUploadUrl('/uploads/products/prod1/img_0_full_1712000000000_ab12cd34.webp')
    ).toEqual({
      entityType: 'products',
      entityId: 'prod1',
      fileName: 'img_0_full_1712000000000_ab12cd34.webp',
      groupKey: 'products/prod1/img_0',
    })
  })

  it('parses a thumb URL into the SAME group as its full sibling', () => {
    const thumb = parseUploadUrl('/uploads/products/prod1/img_0_thumb_1712000000001_ffffffff.webp')
    const full = parseUploadUrl('/uploads/products/prod1/img_0_full_1712000000000_ab12cd34.webp')

    expect(thumb?.groupKey).toBe(full?.groupKey)
  })

  it('returns null for a legacy base64 value instead of throwing', () => {
    expect(parseUploadUrl('data:image/png;base64,iVBORw0KGgoAAAANSU')).toBeNull()
  })

  it('returns null for an unrecognised filename shape', () => {
    expect(parseUploadUrl('/uploads/products/prod1/legacy-photo.jpg')).toBeNull()
  })

  it('does not confuse img_1 with img_10', () => {
    const one = parseUploadUrl('/uploads/products/p/img_1_full_1712000000000_aaaaaaaa.webp')
    const ten = parseUploadUrl('/uploads/products/p/img_10_full_1712000000000_bbbbbbbb.webp')

    expect(one?.groupKey).toBe('products/p/img_1')
    expect(ten?.groupKey).toBe('products/p/img_10')
    expect(one?.groupKey).not.toBe(ten?.groupKey)
  })
})

describe('buildReferencedGroups', () => {
  it('ignores base64 and non-upload values without crashing', () => {
    const groups = buildReferencedGroups([
      'data:image/png;base64,iVBORw0KGgo',
      'https://cdn.example.com/x.png',
      '',
      '/uploads/products/p1/img_0_full_1712000000000_ab12cd34.webp',
    ])

    expect(Array.from(groups)).toEqual(['products/p1/img_0'])
  })
})

describe('cleanupOrphanedUploads', () => {
  it('keeps a file referenced by Images.img', async () => {
    const referenced = '/uploads/products/p1/img_0_full_1712000000000_ab12cd34.webp'
    const deps = makeDeps({
      listFiles: async () => [file('products/p1/img_0_full_1712000000000_ab12cd34.webp')],
      getReferencedUrls: async () => [referenced],
      apply: true,
    })

    const summary = await cleanupOrphanedUploads(deps)

    expect(summary.kept).toBe(1)
    expect(summary.orphaned).toBe(0)
    expect(deps.deleteFile).not.toHaveBeenCalled()
  })

  // THE TRAP: thumb/medium siblings carry a different timestamp AND a different uuid
  // than the stored `full` URL, so they can never be derived from it. They must survive
  // via group membership, not name derivation.
  it('keeps the thumb/medium siblings of a referenced full image', async () => {
    const deps = makeDeps({
      listFiles: async () => [
        file('products/p1/img_0_full_1712000000000_ab12cd34.webp'),
        file('products/p1/img_0_thumb_1712000000111_99887766.webp'),
        file('products/p1/img_0_medium_1712000000222_55443322.webp'),
      ],
      getReferencedUrls: async () => [
        '/uploads/products/p1/img_0_full_1712000000000_ab12cd34.webp',
      ],
      apply: true,
    })

    const summary = await cleanupOrphanedUploads(deps)

    expect(summary.kept).toBe(3)
    expect(summary.orphaned).toBe(0)
    expect(deps.deleteFile).not.toHaveBeenCalled()
  })

  // Migrated legacy rows store the THUMB url (scripts/migrate-images-to-filesystem.ts),
  // not the full one. The full sibling must still survive.
  it('keeps the full sibling when the DB stores the thumb URL', async () => {
    const deps = makeDeps({
      listFiles: async () => [
        file('products/p1/img_0_thumb_1712000000111_99887766.webp'),
        file('products/p1/img_0_full_1712000000000_ab12cd34.webp'),
      ],
      getReferencedUrls: async () => [
        '/uploads/products/p1/img_0_thumb_1712000000111_99887766.webp',
      ],
      apply: true,
    })

    const summary = await cleanupOrphanedUploads(deps)

    expect(summary.kept).toBe(2)
    expect(deps.deleteFile).not.toHaveBeenCalled()
  })

  it('keeps a file referenced by RoomTypeImage.img', async () => {
    const deps = makeDeps({
      listFiles: async () => [
        file('products/prod9/img_2_full_1712000000000_deadbeef.webp'),
        file('products/prod9/img_2_thumb_1712000000333_cafebabe.webp'),
      ],
      getReferencedUrls: async () => [
        '/uploads/products/prod9/img_2_full_1712000000000_deadbeef.webp',
      ],
      apply: true,
    })

    const summary = await cleanupOrphanedUploads(deps)

    expect(summary.kept).toBe(2)
    expect(deps.deleteFile).not.toHaveBeenCalled()
  })

  it('deletes a genuinely unreferenced file older than the grace period with --apply', async () => {
    const deps = makeDeps({
      listFiles: async () => [
        file('products/p1/img_0_full_1712000000000_ab12cd34.webp'),
        file('products/ghost/img_0_full_1712000000000_11112222.webp', OLD, 4096),
        file('products/ghost/img_0_thumb_1712000000444_33334444.webp', OLD, 512),
      ],
      getReferencedUrls: async () => [
        '/uploads/products/p1/img_0_full_1712000000000_ab12cd34.webp',
      ],
      apply: true,
    })

    const summary = await cleanupOrphanedUploads(deps)

    expect(summary.orphaned).toBe(2)
    expect(summary.deleted).toBe(2)
    expect(summary.bytesReclaimed).toBe(4608)
    expect(deps.deleteFile).toHaveBeenCalledTimes(2)
    expect(deps.deleteFile).toHaveBeenCalledWith(
      'products/ghost/img_0_full_1712000000000_11112222.webp'
    )
    expect(deps.deleteFile).toHaveBeenCalledWith(
      'products/ghost/img_0_thumb_1712000000444_33334444.webp'
    )
  })

  it('keeps an unreferenced file younger than the grace period (create-wizard window)', async () => {
    const deps = makeDeps({
      listFiles: async () => [
        file('products/pending/img_0_full_1712000000000_55556666.webp', FRESH),
      ],
      getReferencedUrls: async () => [],
      apply: true,
    })

    const summary = await cleanupOrphanedUploads(deps)

    expect(summary.withinGrace).toBe(1)
    expect(summary.orphaned).toBe(0)
    expect(deps.deleteFile).not.toHaveBeenCalled()
  })

  it('honours a custom --older-than window', async () => {
    const listFiles = async () => [
      file('products/ghost/img_0_full_1712000000000_77778888.webp', NOW - 10 * DAY_MS),
    ]

    const strict = makeDeps({ listFiles, olderThanDays: 30, apply: true })
    expect((await cleanupOrphanedUploads(strict)).deleted).toBe(0)

    const loose = makeDeps({ listFiles, olderThanDays: 3, apply: true })
    expect((await cleanupOrphanedUploads(loose)).deleted).toBe(1)
  })

  it('deletes nothing in dry-run mode but still reports the orphans', async () => {
    const deps = makeDeps({
      listFiles: async () => [
        file('products/ghost/img_0_full_1712000000000_99990000.webp', OLD, 2048),
      ],
      getReferencedUrls: async () => [],
      apply: false,
    })

    const summary = await cleanupOrphanedUploads(deps)

    expect(summary.orphaned).toBe(1)
    expect(summary.deleted).toBe(0)
    expect(summary.bytesReclaimed).toBe(2048)
    expect(deps.deleteFile).not.toHaveBeenCalled()
  })

  it('skips files whose name does not match the generated pattern', async () => {
    const deps = makeDeps({
      listFiles: async () => [
        file('products/p1/legacy-photo.jpg'),
        file('products/p1/.DS_Store'),
        file('products/p1/img_0_full_1712000000000_ab12cd34.webp'),
      ],
      getReferencedUrls: async () => [],
      apply: true,
    })

    const summary = await cleanupOrphanedUploads(deps)

    expect(summary.skippedUnparseable).toBe(2)
    expect(summary.orphaned).toBe(1)
    expect(deps.deleteFile).toHaveBeenCalledTimes(1)
    expect(deps.deleteFile).toHaveBeenCalledWith(
      'products/p1/img_0_full_1712000000000_ab12cd34.webp'
    )
  })

  it('does not treat files as orphans because a sibling row is legacy base64', async () => {
    const deps = makeDeps({
      listFiles: async () => [file('products/p1/img_0_full_1712000000000_ab12cd34.webp')],
      getReferencedUrls: async () => [
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg',
        '/uploads/products/p1/img_0_full_1712000000000_ab12cd34.webp',
      ],
      apply: true,
    })

    const summary = await cleanupOrphanedUploads(deps)

    expect(summary.kept).toBe(1)
    expect(summary.orphaned).toBe(0)
    expect(deps.deleteFile).not.toHaveBeenCalled()
  })

  it('reclaims a whole unreferenced entity directory', async () => {
    const deps = makeDeps({
      listFiles: async () => [
        file('products/deleted-product/img_0_full_1712000000000_aaaa1111.webp', OLD, 100),
        file('products/deleted-product/img_0_thumb_1712000000001_bbbb2222.webp', OLD, 100),
        file('products/deleted-product/img_1_full_1712000000002_cccc3333.webp', OLD, 100),
      ],
      getReferencedUrls: async () => [],
      apply: true,
    })

    const summary = await cleanupOrphanedUploads(deps)

    expect(summary.orphaned).toBe(3)
    expect(summary.deleted).toBe(3)
    expect(summary.bytesReclaimed).toBe(300)
  })

  it('continues and reports when an individual delete fails', async () => {
    const deleteFile = jest
      .fn()
      .mockRejectedValueOnce(new Error('EACCES'))
      .mockResolvedValueOnce(undefined)

    const deps = makeDeps({
      listFiles: async () => [
        file('products/ghost/img_0_full_1712000000000_aaaa1111.webp'),
        file('products/ghost/img_1_full_1712000000001_bbbb2222.webp'),
      ],
      getReferencedUrls: async () => [],
      apply: true,
      deleteFile,
    })

    const summary = await cleanupOrphanedUploads(deps)

    expect(summary.deleted).toBe(1)
    expect(summary.failed).toBe(1)
  })
})
