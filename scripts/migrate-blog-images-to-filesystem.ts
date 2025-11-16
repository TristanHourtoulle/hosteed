#!/usr/bin/env tsx

/**
 * SCRIPT DE MIGRATION DES IMAGES BLOG BASE64 → FILE SYSTEM
 *
 * Migre toutes les images des blogs stockées en base64 dans la DB
 * vers le file system du VPS en format WebP optimisé
 *
 * Usage:
 *   pnpm tsx scripts/migrate-blog-images-to-filesystem.ts
 *   pnpm tsx scripts/migrate-blog-images-to-filesystem.ts --dry-run  # Test sans modifier
 *   pnpm tsx scripts/migrate-blog-images-to-filesystem.ts --limit 10 # Migrer seulement 10 posts
 *   pnpm tsx scripts/migrate-blog-images-to-filesystem.ts --force    # Force l'exécution en production
 *
 * ⚠️  ATTENTION: Ce script modifie la base de données!
 *    Testez d'abord avec: --dry-run
 */

import { PrismaClient } from '@prisma/client'
import { migrateBase64ToFileSystem } from '../src/lib/services/image.service'
import * as readline from 'readline'

const prisma = new PrismaClient()

interface MigrationOptions {
  dryRun: boolean
  limit?: number
  force: boolean
}

/**
 * Demande confirmation à l'utilisateur
 */
async function askConfirmation(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise(resolve => {
    rl.question(`${message} (yes/no): `, answer => {
      rl.close()
      resolve(answer.toLowerCase() === 'yes')
    })
  })
}

/**
 * Vérifie l'environnement et demande confirmation
 */
async function checkEnvironmentSafety(options: MigrationOptions): Promise<boolean> {
  const isProduction = process.env.NODE_ENV === 'production'
  const dbUrl = process.env.DATABASE_URL || ''

  console.log('\n🔍 === VÉRIFICATION DE SÉCURITÉ ===\n')

  // Vérifier l'environnement
  if (isProduction && !options.force) {
    console.log('⚠️  Environnement: PRODUCTION détecté')
    console.log('   Pour exécuter en production, utilisez --force')
    return false
  }

  if (dbUrl.includes('production') || dbUrl.includes('prod')) {
    console.log(`⚠️  DATABASE_URL semble pointer vers la production:`)
    console.log(`   ${dbUrl.substring(0, 50)}...`)

    if (!options.force) {
      console.log('\n❌ Migration annulée pour éviter de modifier la production.')
      console.log('   Utilisez --force si vous êtes certain de vouloir continuer.')
      return false
    }
  }

  // Mode dry-run, pas besoin de confirmation
  if (options.dryRun) {
    console.log('✅ Mode: DRY RUN (aucune modification)')
    return true
  }

  // En production avec --force, demander confirmation
  if (isProduction || dbUrl.includes('prod')) {
    console.log(
      '\n⚠️  ATTENTION: Vous êtes sur le point de modifier la BASE DE DONNÉES DE PRODUCTION!'
    )
    console.log('   Cette opération va:')
    console.log('   1. Créer des fichiers WebP sur le serveur')
    console.log('   2. Modifier les URLs des images dans la base de données')
    console.log("   3. Les données base64 d'origine seront remplacées\n")

    const confirmed = await askConfirmation('⚠️  Êtes-vous ABSOLUMENT sûr de vouloir continuer?')
    if (!confirmed) {
      console.log("\n❌ Migration annulée par l'utilisateur.")
      return false
    }

    // Double confirmation pour la prod
    const doubleConfirmed = await askConfirmation(
      '⚠️  Dernière confirmation. Tapez "yes" pour continuer'
    )
    return doubleConfirmed
  }

  // Environnement local
  console.log('✅ Environnement: LOCAL')
  console.log('✅ Mode: MIGRATION RÉELLE')

  const confirmed = await askConfirmation('\n📝 Procéder à la migration?')
  return confirmed
}

async function migrateBlogImages(options: MigrationOptions) {
  const { dryRun, limit } = options

  console.log('\n🚀 === MIGRATION DES IMAGES DE BLOG ===\n')
  console.log(
    `Mode: ${dryRun ? 'DRY RUN (aucune modification)' : 'PRODUCTION (modifications réelles)'}`
  )
  if (limit) console.log(`Limit: ${limit} posts`)

  // Récupérer tous les posts avec des images base64
  const posts = await prisma.post.findMany({
    where: {
      image: {
        startsWith: 'data:image', // Seulement les images base64
      },
    },
    take: limit,
  })

  console.log(`\n📊 Found ${posts.length} posts with base64 images`)

  if (posts.length === 0) {
    console.log('\n✅ No posts with base64 images found. Nothing to migrate!')
    return
  }

  if (dryRun) {
    console.log('\n🔍 DRY RUN - Would migrate the following:')
    posts.forEach((post, index) => {
      const imageSize = post.image ? Math.round(post.image.length / 1024) : 0
      console.log(`  ${index + 1}. "${post.title}" (${imageSize} KB)`)
      console.log(`     ID: ${post.id}`)
      console.log(`     Slug: ${post.slug || 'N/A'}`)
    })
    console.log('\n💡 Run without --dry-run to actually migrate')
    return
  }

  let migratedPosts = 0
  let failedPosts = 0
  let totalSizeBefore = 0
  let totalSizeAfter = 0

  for (const post of posts) {
    if (!post.image) continue

    try {
      const sizeBefore = Math.round(post.image.length / 1024)
      totalSizeBefore += sizeBefore

      console.log(`\n📝 Migrating post: "${post.title}"`)
      console.log(`   ID: ${post.id}`)
      console.log(`   Size: ${sizeBefore} KB`)

      // Migrer l'image vers le file system
      const urls = await migrateBase64ToFileSystem(post.image, 'posts', post.id, 0)

      // Mettre à jour la base de données avec la nouvelle URL
      await prisma.post.update({
        where: { id: post.id },
        data: {
          image: urls.full, // On utilise l'image full pour les blogs
        },
      })

      // Estimer la taille après (en supposant une compression ~70%)
      const sizeAfter = Math.round(sizeBefore * 0.3)
      totalSizeAfter += sizeAfter

      migratedPosts++
      console.log(`   ✅ Migrated successfully`)
      console.log(`   📁 New URL: ${urls.full}`)
      console.log(`   💾 Estimated size reduction: ${sizeBefore} KB → ${sizeAfter} KB`)
    } catch (error) {
      console.error(`   ❌ Failed to migrate post "${post.title}":`, error)
      failedPosts++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 MIGRATION SUMMARY')
  console.log('='.repeat(60))
  console.log(`✅ Posts migrated: ${migratedPosts}/${posts.length}`)
  if (failedPosts > 0) {
    console.log(`❌ Failed posts: ${failedPosts}`)
  }
  console.log(`💾 Total size before: ~${Math.round(totalSizeBefore / 1024)} MB`)
  console.log(`💾 Estimated size after: ~${Math.round(totalSizeAfter / 1024)} MB`)
  console.log(
    `📉 Space saved: ~${Math.round((totalSizeBefore - totalSizeAfter) / 1024)} MB (${Math.round(((totalSizeBefore - totalSizeAfter) / totalSizeBefore) * 100)}%)`
  )
  console.log('='.repeat(60))
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const force = args.includes('--force')
  const limitIndex = args.indexOf('--limit')
  const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : undefined

  const options: MigrationOptions = { dryRun, limit, force }

  try {
    // Vérification de sécurité et confirmation
    const canProceed = await checkEnvironmentSafety(options)
    if (!canProceed) {
      console.log('\n❌ Migration annulée.\n')
      process.exit(0)
    }

    await migrateBlogImages(options)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .then(() => {
    console.log('\n✨ Migration complete!')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })
