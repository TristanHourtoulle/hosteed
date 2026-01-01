/**
 * Script de migration des adresses existantes
 *
 * Ce script parse les adresses existantes dans le champ `address` et
 * extrait les composants (neighborhood, city, region, country) pour
 * les stocker dans les nouveaux champs.
 *
 * Usage:
 * npx ts-node --compiler-options '{"module":"CommonJS"}' src/lib/scripts/migrate-addresses.ts
 *
 * Ou via un endpoint API temporaire pour exécution en production.
 */

import { PrismaClient } from '@prisma/client'
import { parseAddress } from '../services/location.service'

const prisma = new PrismaClient()

interface MigrationResult {
  totalProducts: number
  migratedCount: number
  skippedCount: number
  errorCount: number
  errors: Array<{ productId: string; error: string }>
}

/**
 * Migre toutes les adresses existantes vers les nouveaux champs structurés
 */
export async function migrateExistingAddresses(): Promise<MigrationResult> {
  console.log('🚀 Démarrage de la migration des adresses...')

  const result: MigrationResult = {
    totalProducts: 0,
    migratedCount: 0,
    skippedCount: 0,
    errorCount: 0,
    errors: [],
  }

  try {
    // Récupérer tous les produits qui n'ont pas encore les nouveaux champs remplis
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { city: null },
          { city: '' },
        ],
      },
      select: {
        id: true,
        address: true,
        neighborhood: true,
        city: true,
        region: true,
        country: true,
      },
    })

    result.totalProducts = products.length
    console.log(`📊 ${products.length} produits à migrer`)

    for (const product of products) {
      try {
        if (!product.address || product.address.trim() === '') {
          console.log(`⏭️ Produit ${product.id}: Pas d'adresse, ignoré`)
          result.skippedCount++
          continue
        }

        // Parser l'adresse existante
        const parsed = parseAddress(product.address)

        // Mettre à jour le produit avec les nouveaux champs
        await prisma.product.update({
          where: { id: product.id },
          data: {
            neighborhood: parsed.neighborhood,
            city: parsed.city,
            region: parsed.region,
            country: parsed.country || 'Madagascar',
          },
        })

        console.log(
          `✅ Produit ${product.id}: ${product.address} → ` +
          `neighborhood="${parsed.neighborhood}", city="${parsed.city}", country="${parsed.country}"`
        )
        result.migratedCount++
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
        console.error(`❌ Erreur pour le produit ${product.id}:`, errorMessage)
        result.errorCount++
        result.errors.push({ productId: product.id, error: errorMessage })
      }
    }

    console.log('\n📈 Résumé de la migration:')
    console.log(`   Total: ${result.totalProducts}`)
    console.log(`   Migrés: ${result.migratedCount}`)
    console.log(`   Ignorés: ${result.skippedCount}`)
    console.log(`   Erreurs: ${result.errorCount}`)

    return result
  } catch (error) {
    console.error('Erreur fatale lors de la migration:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Vérifie le statut de la migration
 */
export async function checkMigrationStatus(): Promise<{
  total: number
  migrated: number
  pending: number
  percentage: number
}> {
  const total = await prisma.product.count()
  const migrated = await prisma.product.count({
    where: {
      city: { not: null },
    },
  })
  const pending = total - migrated

  await prisma.$disconnect()

  return {
    total,
    migrated,
    pending,
    percentage: total > 0 ? Math.round((migrated / total) * 100) : 100,
  }
}

/**
 * Rollback: Efface les nouveaux champs (pour tests)
 */
export async function rollbackMigration(): Promise<void> {
  console.log('⚠️ Rollback de la migration...')

  await prisma.product.updateMany({
    data: {
      neighborhood: null,
      city: null,
      region: null,
      // country reste "Madagascar" par défaut
    },
  })

  console.log('✅ Rollback terminé')
  await prisma.$disconnect()
}

// Exécution directe si appelé en tant que script
if (require.main === module) {
  migrateExistingAddresses()
    .then(result => {
      console.log('\n✅ Migration terminée avec succès!')
      process.exit(result.errorCount > 0 ? 1 : 0)
    })
    .catch(error => {
      console.error('\n❌ Migration échouée:', error)
      process.exit(1)
    })
}
