/**
 * Script de migration des images pour la production
 * Convertit toutes les images base64 existantes en format WebP optimisé
 *
 * Usage: npx tsx scripts/migrate-images.ts
 *
 * IMPORTANT: Exécuter ce script SEULEMENT en production après avoir déployé
 * les nouvelles optimisations d'images.
 */

import { PrismaClient } from '@prisma/client'
import { optimizeImageForDatabase } from '../src/lib/services/image-optimization.service'

const prisma = new PrismaClient()

interface MigrationStats {
  total: number
  processed: number
  optimized: number
  errors: number
  spaceSaved: number
}

async function migrateImages() {
  console.log('🚀 Début de la migration des images vers WebP...')
  console.log("⚠️  Cette opération peut prendre du temps selon le nombre d'images")

  const stats: MigrationStats = {
    total: 0,
    processed: 0,
    optimized: 0,
    errors: 0,
    spaceSaved: 0,
  }

  try {
    // Compter le nombre total d'images à migrer
    const totalImages = await prisma.images.count({
      where: {
        img: {
          contains: 'data:image/',
        },
      },
    })

    if (totalImages === 0) {
      console.log('✅ Aucune image à migrer trouvée.')
      return
    }

    stats.total = totalImages
    console.log(`📸 ${totalImages} images trouvées à optimiser`)

    // Traiter les images par batch de 10 pour éviter la surcharge mémoire
    const batchSize = 10
    let offset = 0

    while (offset < totalImages) {
      console.log(
        `\n📦 Traitement du batch ${Math.floor(offset / batchSize) + 1}/${Math.ceil(totalImages / batchSize)}`
      )

      const images = await prisma.images.findMany({
        where: {
          img: {
            contains: 'data:image/',
          },
        },
        select: {
          id: true,
          img: true,
          Product: {
            select: {
              id: true,
            },
          },
        },
        skip: offset,
        take: batchSize,
      })

      for (const image of images) {
        try {
          stats.processed++

          if (!image.img || !image.img.startsWith('data:image/')) {
            console.log(`⏭️  Image ${image.id} - Format non supporté, ignorée`)
            continue
          }

          // Calculer la taille avant optimisation
          const originalSize = Buffer.from(image.img.split(',')[1] || '', 'base64').length

          // Optimiser l'image
          const optimizedImage = await optimizeImageForDatabase(image.img)

          // Calculer la taille après optimisation
          const optimizedSize = Buffer.from(optimizedImage.split(',')[1] || '', 'base64').length
          const savedBytes = originalSize - optimizedSize
          const savedPercent = ((savedBytes / originalSize) * 100).toFixed(1)

          // Mettre à jour en base de données
          await prisma.images.update({
            where: { id: image.id },
            data: { img: optimizedImage },
          })

          stats.optimized++
          stats.spaceSaved += savedBytes

          const productIds = image.Product.map(p => p.id).join(', ') || 'no-product'
          console.log(
            `✅ Image ${image.id} (Products: ${productIds}) - Optimisée (-${savedPercent}%)`
          )

          // Pause courte pour éviter la surcharge
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error) {
          stats.errors++
          console.error(
            `❌ Erreur image ${image.id}:`,
            error instanceof Error ? error.message : error
          )

          // Continuer malgré les erreurs individuelles
          continue
        }
      }

      offset += batchSize

      // Afficher les statistiques intermédiaires
      const progress = ((offset / totalImages) * 100).toFixed(1)
      const spaceSavedMB = (stats.spaceSaved / (1024 * 1024)).toFixed(2)
      console.log(
        `\n📊 Progression: ${progress}% | Optimisées: ${stats.optimized} | Erreurs: ${stats.errors} | Espace économisé: ${spaceSavedMB} MB`
      )
    }

    // Statistiques finales
    console.log('\n🎉 Migration terminée !')
    console.log('📊 Statistiques finales:')
    console.log(`   • Images traitées: ${stats.processed}/${stats.total}`)
    console.log(`   • Images optimisées: ${stats.optimized}`)
    console.log(`   • Erreurs: ${stats.errors}`)
    console.log(`   • Espace économisé: ${(stats.spaceSaved / (1024 * 1024)).toFixed(2)} MB`)

    if (stats.optimized > 0) {
      const avgSavings = (stats.spaceSaved / stats.optimized / 1024).toFixed(1)
      console.log(`   • Économie moyenne par image: ${avgSavings} KB`)
    }

    // Vérification finale
    const remainingImages = await prisma.images.count({
      where: {
        img: {
          contains: 'data:image/',
          not: { contains: 'data:image/webp' },
        },
      },
    })

    if (remainingImages > 0) {
      console.log(
        `\n⚠️  ${remainingImages} images non-WebP restantes (probablement des erreurs ou formats non supportés)`
      )
    } else {
      console.log('\n✅ Toutes les images ont été converties en WebP !')
    }
  } catch (error) {
    console.error('💥 Erreur fatale lors de la migration:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Fonction de vérification avant migration
async function verifyEnvironment() {
  console.log("🔍 Vérification de l'environnement...")

  // Vérifier que l'optimisation d'images est activée
  const imageOptimizationEnabled = process.env.ENABLE_IMAGE_OPTIMIZATION === 'true'
  if (!imageOptimizationEnabled) {
    console.error(
      "❌ ENABLE_IMAGE_OPTIMIZATION doit être activé dans les variables d'environnement"
    )
    process.exit(1)
  }

  // Vérifier la connexion à la base de données
  try {
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Connexion à la base de données OK')
  } catch (error) {
    console.error('❌ Impossible de se connecter à la base de données:', error)
    process.exit(1)
  }

  // Vérifier l'espace disque disponible (estimation)
  const totalImages = await prisma.images.count()

  console.log(`📊 ${totalImages} images trouvées en base de données`)
  console.log(
    "⚠️  Assurez-vous d'avoir suffisamment d'espace disque (environ 30% de libre recommandé)"
  )

  return true
}

// Fonction principale avec gestion d'erreurs
async function main() {
  try {
    await verifyEnvironment()

    // Demander confirmation en production
    if (process.env.NODE_ENV === 'production') {
      console.log('\n🚨 ATTENTION: Vous êtes en PRODUCTION')
      console.log('Cette migration va modifier toutes les images en base de données.')
      console.log("Assurez-vous d'avoir fait une sauvegarde récente !")
      console.log('\nPour continuer, définissez la variable CONFIRM_MIGRATION=true')

      if (process.env.CONFIRM_MIGRATION !== 'true') {
        console.log('❌ Migration annulée (CONFIRM_MIGRATION != true)')
        process.exit(0)
      }
    }

    await migrateImages()
  } catch (error) {
    console.error('💥 Échec de la migration:', error)
    process.exit(1)
  }
}

// Gestion des signaux pour arrêt propre
process.on('SIGINT', async () => {
  console.log("\n⏹️  Migration interrompue par l'utilisateur")
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n⏹️  Migration interrompue par le système')
  await prisma.$disconnect()
  process.exit(0)
})

// Exécution du script
if (require.main === module) {
  main()
}

export { migrateImages, verifyEnvironment }
