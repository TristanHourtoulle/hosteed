#!/usr/bin/env tsx

/**
 * SCRIPT DE MIGRATION DES IMAGES BASE64 → FILE SYSTEM
 *
 * Migre toutes les images stockées en base64 dans la DB
 * vers le file system du VPS en format WebP optimisé
 *
 * Usage:
 *   pnpm tsx scripts/migrate-images-to-filesystem.ts
 *   pnpm tsx scripts/migrate-images-to-filesystem.ts --dry-run  # Test sans modifier
 *   pnpm tsx scripts/migrate-images-to-filesystem.ts --limit 10 # Migrer seulement 10 produits
 *   pnpm tsx scripts/migrate-images-to-filesystem.ts --force    # Force l'exécution en production
 *
 * ⚠️  ATTENTION: Ce script modifie la base de données!
 *    Testez d'abord avec: pnpm test:images:migrate
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

  return new Promise((resolve) => {
    rl.question(`${message} (yes/no): `, (answer) => {
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
    console.log('\n⚠️  ATTENTION: Vous êtes sur le point de modifier la BASE DE DONNÉES DE PRODUCTION!')
    console.log('   Cette opération va:')
    console.log('   1. Créer des fichiers WebP sur le serveur')
    console.log('   2. Modifier les URLs des images dans la base de données')
    console.log('   3. Les données base64 d\'origine seront remplacées\n')

    const confirmed = await askConfirmation('⚠️  Êtes-vous ABSOLUMENT sûr de vouloir continuer?')
    if (!confirmed) {
      console.log('\n❌ Migration annulée par l\'utilisateur.')
      return false
    }

    // Double confirmation pour la prod
    const doubleConfirmed = await askConfirmation('⚠️  Dernière confirmation. Tapez "yes" pour continuer')
    return doubleConfirmed
  }

  // Environnement local
  console.log('✅ Environnement: LOCAL')
  console.log('✅ Mode: MIGRATION RÉELLE')

  const confirmed = await askConfirmation('\n📝 Procéder à la migration?')
  return confirmed
}

async function migrateProductImages(options: MigrationOptions) {
  const { dryRun, limit } = options

  console.log('\n🚀 === MIGRATION DES IMAGES ===\n')
  console.log(`Mode: ${dryRun ? 'DRY RUN (aucune modification)' : 'PRODUCTION (modifications réelles)'}`)
  if (limit) console.log(`Limit: ${limit} produits`)

  // Récupérer tous les produits avec des images base64
  const products = await prisma.product.findMany({
    where: {
      AND: [
        {
          img: {
            some: {
              img: {
                startsWith: 'data:image', // Seulement les images base64
              },
            },
          },
        },
        {
          id: {
            not: 'cmdqxal2e000mitiugc7d7gor', // Ignorer le produit avec images corrompues
          },
        },
      ],
    },
    include: {
      img: true,
    },
    take: limit,
  })

  console.log(`\n📊 Found ${products.length} products with base64 images`)

  if (dryRun) {
    console.log('\n🔍 DRY RUN - Would migrate the following:')
    products.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.name} (${product.img.length} images)`)
    })
    console.log('\nRun without --dry-run to actually migrate')
    return
  }

  let migratedProducts = 0
  let migratedImages = 0
  let failedProducts = 0

  for (const product of products) {
    try {
      console.log(`\n📦 Migrating product: ${product.name} (ID: ${product.id})`)
      console.log(`   Images: ${product.img.length}`)

      const newImageUrls: Array<{ id: string; thumb: string; medium: string; full: string }> = []

      // Migrer chaque image
      for (let i = 0; i < product.img.length; i++) {
        const image = product.img[i]

        try {
          const urls = await migrateBase64ToFileSystem(
            image.img,
            'products',
            product.id,
            i
          )

          newImageUrls.push({
            id: image.id,
            ...urls,
          })

          migratedImages++
          console.log(`   ✅ Migrated image ${i + 1}/${product.img.length}`)
        } catch (error) {
          console.error(`   ❌ Failed to migrate image ${i + 1}:`, error)
        }
      }

      // Mettre à jour la base de données avec les nouvelles URLs
      if (newImageUrls.length > 0) {
        await Promise.all(
          newImageUrls.map(({ id, thumb }) =>
            prisma.images.update({
              where: { id },
              data: {
                img: thumb, // Stocker l'URL du thumbnail
                // On pourrait ajouter des champs medium et full au schéma
              },
            })
          )
        )

        migratedProducts++
        console.log(`   ✅ Updated database for ${newImageUrls.length} images`)
      }
    } catch (error) {
      console.error(`   ❌ Failed to migrate product ${product.name}:`, error)
      failedProducts++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 MIGRATION SUMMARY')
  console.log('='.repeat(60))
  console.log(`✅ Products migrated: ${migratedProducts}/${products.length}`)
  console.log(`✅ Images migrated: ${migratedImages}`)
  if (failedProducts > 0) {
    console.log(`❌ Failed products: ${failedProducts}`)
  }
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

    await migrateProductImages(options)
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
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })
