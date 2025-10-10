/**
 * Script de test pour la migration des images
 *
 * Ce script permet de tester la migration en toute sécurité sur l'environnement local
 * SANS affecter la base de données de production
 *
 * Usage:
 * pnpm test:images:migrate              # Test avec 1 produit
 * pnpm test:images:migrate --limit 5    # Test avec 5 produits
 * pnpm test:images:migrate --product-id abc123  # Test un produit spécifique
 */

import { PrismaClient } from '@prisma/client'
import { migrateBase64ToFileSystem, deleteImage } from '@/lib/services/image.service'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface TestStats {
  testedProducts: number
  successfulMigrations: number
  failedMigrations: number
  totalImagesProcessed: number
  totalImagesFailed: number
  errors: Array<{ productId: string; error: string }>
  generatedFiles: string[]
}

async function testImageMigration() {
  const args = process.argv.slice(2)
  const limitArg = args.find((arg) => arg.startsWith('--limit'))
  const productIdArg = args.find((arg) => arg.startsWith('--product-id'))

  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 1
  const specificProductId = productIdArg ? productIdArg.split('=')[1] : null

  const stats: TestStats = {
    testedProducts: 0,
    successfulMigrations: 0,
    failedMigrations: 0,
    totalImagesProcessed: 0,
    totalImagesFailed: 0,
    errors: [],
    generatedFiles: [],
  }

  console.log('🧪 === TEST DE MIGRATION DES IMAGES ===\n')
  console.log('⚠️  MODE TEST: Aucune modification de la base de données\n')

  // Vérification de l'environnement
  const isProduction = process.env.NODE_ENV === 'production'
  const dbUrl = process.env.DATABASE_URL || ''

  if (isProduction) {
    console.error('❌ ERREUR: Ce script ne doit PAS être exécuté en production!')
    console.error('   Utilisez-le uniquement en local pour les tests.')
    process.exit(1)
  }

  if (dbUrl.includes('production') || dbUrl.includes('prod')) {
    console.error('❌ ERREUR: La DATABASE_URL semble pointer vers la production!')
    console.error('   DATABASE_URL:', dbUrl.substring(0, 30) + '...')
    console.error('   Vérifiez votre fichier .env')
    process.exit(1)
  }

  console.log('✅ Environnement: LOCAL')
  console.log('✅ Database URL: Safe\n')

  try {
    // Récupérer les produits à tester
    const whereClause = specificProductId
      ? { id: specificProductId }
      : {
          img: {
            some: {
              // Seulement les images en base64 (pas encore migrées)
              img: {
                startsWith: 'data:image',
              },
            },
          },
        }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        img: true,
      },
      take: limit,
    })

    console.log(`📦 Produits trouvés avec images base64: ${products.length}\n`)

    if (products.length === 0) {
      console.log('ℹ️  Aucun produit avec des images base64 trouvé.')
      console.log('   Tous les produits ont peut-être déjà été migrés.')
      return
    }

    // Créer un dossier de test temporaire
    const testDir = path.join(process.cwd(), 'public', 'uploads', 'test-migration')
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true })
    }

    console.log(`🔧 Dossier de test: ${testDir}\n`)
    console.log('─'.repeat(80))

    // Tester la migration pour chaque produit
    for (const product of products) {
      stats.testedProducts++
      console.log(`\n📦 Produit ${stats.testedProducts}/${products.length}: ${product.name}`)
      console.log(`   ID: ${product.id}`)
      console.log(`   Images: ${product.img.length}`)

      let productSuccess = true

      for (let i = 0; i < product.img.length; i++) {
        const image = product.img[i]
        console.log(`\n   📸 Image ${i + 1}/${product.img.length} (ID: ${image.id})`)

        // Vérifier si c'est du base64
        if (!image.img.startsWith('data:image')) {
          console.log('      ⏭️  Déjà migrée, ignorée')
          continue
        }

        try {
          // Extraire info sur l'image base64
          const base64Size = Buffer.from(
            image.img.split(',')[1] || '',
            'base64'
          ).length
          console.log(`      📊 Taille base64: ${(base64Size / 1024).toFixed(2)} KB`)

          // Tester la migration (dans le dossier test)
          const imageUrls = await migrateBase64ToFileSystem(
            image.img,
            'products',
            product.id,
            i
          )

          stats.totalImagesProcessed++

          // Vérifier que les fichiers ont été créés
          const thumbPath = path.join(process.cwd(), 'public', imageUrls.thumb)
          const mediumPath = path.join(process.cwd(), 'public', imageUrls.medium)
          const fullPath = path.join(process.cwd(), 'public', imageUrls.full)

          const thumbExists = fs.existsSync(thumbPath)
          const mediumExists = fs.existsSync(mediumPath)
          const fullExists = fs.existsSync(fullPath)

          if (thumbExists && mediumExists && fullExists) {
            const thumbSize = fs.statSync(thumbPath).size
            const mediumSize = fs.statSync(mediumPath).size
            const fullSize = fs.statSync(fullPath).size

            console.log('      ✅ Migration réussie!')
            console.log(`      📁 Thumb:  ${imageUrls.thumb} (${(thumbSize / 1024).toFixed(2)} KB)`)
            console.log(`      📁 Medium: ${imageUrls.medium} (${(mediumSize / 1024).toFixed(2)} KB)`)
            console.log(`      📁 Full:   ${imageUrls.full} (${(fullSize / 1024).toFixed(2)} KB)`)
            console.log(`      💾 Économie: ${((1 - (thumbSize + mediumSize + fullSize) / base64Size) * 100).toFixed(1)}%`)

            stats.generatedFiles.push(thumbPath, mediumPath, fullPath)
          } else {
            throw new Error('Fichiers non créés correctement')
          }
        } catch (error) {
          productSuccess = false
          stats.totalImagesFailed++
          const errorMsg = error instanceof Error ? error.message : String(error)
          console.log(`      ❌ Échec: ${errorMsg}`)
          stats.errors.push({
            productId: product.id,
            error: `Image ${i + 1}: ${errorMsg}`,
          })
        }
      }

      if (productSuccess) {
        stats.successfulMigrations++
      } else {
        stats.failedMigrations++
      }
    }

    console.log('\n' + '─'.repeat(80))
    console.log('\n📊 === RÉSULTATS DU TEST ===\n')
    console.log(`Produits testés:              ${stats.testedProducts}`)
    console.log(`✅ Migrations réussies:       ${stats.successfulMigrations}`)
    console.log(`❌ Migrations échouées:       ${stats.failedMigrations}`)
    console.log(`📸 Images traitées:           ${stats.totalImagesProcessed}`)
    console.log(`⚠️  Images échouées:          ${stats.totalImagesFailed}`)
    console.log(`📁 Fichiers générés:          ${stats.generatedFiles.length}`)

    if (stats.errors.length > 0) {
      console.log('\n⚠️  Erreurs rencontrées:')
      stats.errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. Produit ${err.productId}: ${err.error}`)
      })
    }

    console.log('\n🔍 === VÉRIFICATION MANUELLE ===\n')
    console.log('Les fichiers générés sont dans:')
    console.log(`   ${testDir}`)
    console.log('\nVous pouvez les vérifier visuellement avant de lancer la migration réelle.')

    console.log('\n⚠️  NOTE IMPORTANTE:')
    console.log('   Ce test N\'A PAS modifié la base de données.')
    console.log('   Les images base64 sont toujours présentes.')
    console.log('   Pour migrer réellement, utilisez: pnpm images:migrate')

    console.log('\n🧹 === NETTOYAGE ===\n')
    console.log('Pour supprimer les fichiers de test:')
    console.log(`   rm -rf ${testDir}`)

  } catch (error) {
    console.error('\n❌ Erreur fatale:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le test
testImageMigration()
  .then(() => {
    console.log('\n✅ Test terminé avec succès\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur lors du test:', error)
    process.exit(1)
  })
