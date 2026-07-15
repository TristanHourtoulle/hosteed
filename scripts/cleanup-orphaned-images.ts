#!/usr/bin/env tsx

/**
 * ORPHANED UPLOAD CLEANUP
 *
 * Deletes WebP files under `public/uploads/` that no DB row references any more.
 * Product photos leak today because `deleteImageFiles` in
 * `src/app/api/products/[id]/images/route.ts` matches `-thumb.webp` while
 * `image.service.ts` writes `_thumb_`; per-room-type photos add volume on top.
 *
 * The decision logic lives in `src/lib/images/orphanCleanup.ts` (unit-tested);
 * this file is only the CLI shell that supplies the real fs + Prisma boundaries.
 *
 * Usage:
 *   pnpm images:cleanup                      # dry-run (default), deletes nothing
 *   pnpm images:cleanup:apply                # actually delete
 *   pnpm tsx scripts/cleanup-orphaned-images.ts --older-than=30
 *
 * Flags:
 *   --dry-run            Report only. Default; deleting requires --apply.
 *   --apply              Perform the deletions.
 *   --older-than=<days>  Grace period, default 7. Files younger than this are never
 *                        deleted: createProduct uploads images BEFORE creating the DB
 *                        row, so a fresh unreferenced file is a wizard in progress.
 *
 * SCHEDULING (no cron infrastructure exists yet; deploy is SSH + PM2)
 * -------------------------------------------------------------------
 * Simplest fit — one system crontab line on the VPS. Install with:
 *
 *   ssh <vps> 'crontab -l 2>/dev/null; echo "30 4 * * 0 cd /var/www/hosteedv2.com && /usr/bin/env pnpm images:cleanup:apply >> /var/log/hosteed-image-cleanup.log 2>&1"' | ssh <vps> crontab -
 *
 * Runs Sundays 04:30. Run `pnpm images:cleanup` (dry-run) on the VPS first and read the
 * report before ever enabling the --apply schedule.
 */

import fs from 'fs/promises'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import {
  cleanupOrphanedUploads,
  UPLOAD_ENTITY_TYPES,
  DEFAULT_GRACE_DAYS,
  type UploadFile,
} from '../src/lib/images/orphanCleanup'

const prisma = new PrismaClient()

const UPLOADS_ROOT = path.join(process.cwd(), 'public', 'uploads')

interface CliOptions {
  apply: boolean
  olderThanDays: number
}

function parseArgs(argv: string[]): CliOptions {
  const apply = argv.includes('--apply')

  const olderThanArg = argv.find(arg => arg.startsWith('--older-than='))
  const olderThanDays = olderThanArg
    ? Number.parseInt(olderThanArg.split('=')[1] ?? '', 10)
    : DEFAULT_GRACE_DAYS

  if (!Number.isFinite(olderThanDays) || olderThanDays < 0) {
    throw new Error(`Invalid --older-than value: ${olderThanArg}`)
  }

  return { apply, olderThanDays }
}

/**
 * Walks only the entity directories that `saveImage` is allowed to write.
 * `saveImage` is the sole writer under public/uploads/, so anything outside these
 * directories was put there by something else and must never be touched.
 */
async function listUploadFiles(): Promise<UploadFile[]> {
  const files: UploadFile[] = []

  async function walk(absDir: string, relDir: string): Promise<void> {
    let entries
    try {
      entries = await fs.readdir(absDir, { withFileTypes: true })
    } catch {
      return // Directory does not exist yet.
    }

    for (const entry of entries) {
      const abs = path.join(absDir, entry.name)
      const rel = path.posix.join(relDir, entry.name)

      if (entry.isDirectory()) {
        await walk(abs, rel)
        continue
      }

      if (!entry.isFile()) continue

      const stats = await fs.stat(abs)
      files.push({ relativePath: rel, mtimeMs: stats.mtimeMs, sizeBytes: stats.size })
    }
  }

  for (const entityType of UPLOAD_ENTITY_TYPES) {
    await walk(path.join(UPLOADS_ROOT, entityType), entityType)
  }

  return files
}

/**
 * Every column that can hold an uploads URL. Missing one here means deleting live photos,
 * so an absent Prisma model aborts the run instead of silently under-counting references.
 */
async function getReferencedUrls(): Promise<string[]> {
  const requiredModels = ['images', 'roomTypeImage', 'user', 'post', 'typeRent', 'homepageSettings']
  for (const model of requiredModels) {
    if (!(model in prisma)) {
      throw new Error(
        `Prisma model "${model}" is missing from the generated client. Aborting: ` +
          `cleaning up without it could delete referenced images. Run \`pnpm prisma generate\`.`
      )
    }
  }

  let images, roomTypeImages, users, posts, typeRents, homepageSettings
  try {
    ;[images, roomTypeImages, users, posts, typeRents, homepageSettings] = await Promise.all([
      prisma.images.findMany({ select: { img: true } }),
      prisma.roomTypeImage.findMany({ select: { img: true } }),
      prisma.user.findMany({ where: { image: { not: null } }, select: { image: true } }),
      prisma.post.findMany({ where: { image: { not: null } }, select: { image: true } }),
      prisma.typeRent.findMany({
        where: { coverImage: { not: null } },
        select: { coverImage: true },
      }),
      prisma.homepageSettings.findMany({
        select: { heroBackgroundImage: true, howItWorksImage: true },
      }),
    ])
  } catch (error) {
    // P2021 = table missing: the schema and the database are out of sync. A referenced
    // table we cannot read looks identical to "zero references", which would make every
    // image it protects an orphan. Refuse to run rather than delete live photos.
    if (
      typeof error === 'object' &&
      error !== null &&
      (error as { code?: string }).code === 'P2021'
    ) {
      const table = (error as { meta?: { table?: string } }).meta?.table ?? 'unknown'
      throw new Error(
        `Table "${table}" is missing from the database, so its image references cannot be read. ` +
          `Aborting: continuing would treat every image it references as an orphan and delete it. ` +
          `Run \`pnpm prisma migrate deploy\` to sync the database, then re-run this script.`
      )
    }
    throw error
  }

  const urls: string[] = [
    ...images.map(row => row.img),
    ...roomTypeImages.map(row => row.img),
    ...users.map(row => row.image),
    ...posts.map(row => row.image),
    ...typeRents.map(row => row.coverImage),
    ...homepageSettings.flatMap(row => [row.heroBackgroundImage, row.howItWorksImage]),
  ].filter((url): url is string => typeof url === 'string' && url.length > 0)

  console.log(
    `🔍 References: ${images.length} Images.img, ${roomTypeImages.length} RoomTypeImage.img, ` +
      `${users.length} User.image, ${posts.length} Post.image, ${typeRents.length} TypeRent.coverImage, ` +
      `${homepageSettings.length} HomepageSettings rows → ${urls.length} non-empty values`
  )

  return urls
}

async function deleteFile(relativePath: string): Promise<void> {
  await fs.unlink(path.join(UPLOADS_ROOT, relativePath))
}

/** Removes directories left empty after a cleanup pass. */
async function pruneEmptyDirs(): Promise<number> {
  let pruned = 0

  async function prune(absDir: string): Promise<void> {
    let entries
    try {
      entries = await fs.readdir(absDir, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      if (entry.isDirectory()) await prune(path.join(absDir, entry.name))
    }

    const remaining = await fs.readdir(absDir)
    if (remaining.length === 0) {
      await fs.rmdir(absDir).then(
        () => {
          pruned += 1
        },
        () => undefined
      )
    }
  }

  for (const entityType of UPLOAD_ENTITY_TYPES) {
    const entityRoot = path.join(UPLOADS_ROOT, entityType)
    let entries
    try {
      entries = await fs.readdir(entityRoot, { withFileTypes: true })
    } catch {
      continue
    }
    // Prune entity directories but never the entityType root itself.
    for (const entry of entries) {
      if (entry.isDirectory()) await prune(path.join(entityRoot, entry.name))
    }
  }

  return pruned
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

async function main(): Promise<void> {
  const { apply, olderThanDays } = parseArgs(process.argv.slice(2))

  console.log('🧹 Orphaned upload cleanup')
  console.log(`   Mode:        ${apply ? '⚠️  APPLY (files will be deleted)' : '🔎 DRY-RUN'}`)
  console.log(`   Grace:       ${olderThanDays} day(s)`)
  console.log(`   Uploads dir: ${UPLOADS_ROOT}\n`)

  const summary = await cleanupOrphanedUploads({
    listFiles: listUploadFiles,
    getReferencedUrls,
    deleteFile,
    olderThanDays,
    apply,
  })

  console.log('\n📊 Summary')
  console.log(`   Scanned:            ${summary.scanned}`)
  console.log(`   Kept (referenced):  ${summary.kept}`)
  console.log(`   Kept (within grace):${summary.withinGrace}`)
  console.log(`   Skipped (unknown):  ${summary.skippedUnparseable}`)
  console.log(`   Orphaned:           ${summary.orphaned}`)
  console.log(`   Deleted:            ${summary.deleted}`)
  console.log(`   Failed:             ${summary.failed}`)
  console.log(`   Reclaimable:        ${formatBytes(summary.bytesReclaimed)}`)

  if (summary.sample.length > 0) {
    console.log(`\n   Sample orphans (${summary.sample.length} of ${summary.orphaned}):`)
    for (const item of summary.sample) console.log(`     - ${item}`)
  }

  if (apply && summary.deleted > 0) {
    const pruned = await pruneEmptyDirs()
    if (pruned > 0) console.log(`\n🧹 Pruned ${pruned} empty director${pruned === 1 ? 'y' : 'ies'}`)
  }

  if (!apply && summary.orphaned > 0) {
    console.log('\n💡 Dry-run: nothing was deleted. Re-run with --apply to remove these files.')
  }
}

main()
  .catch(error => {
    console.error('❌ Cleanup failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
