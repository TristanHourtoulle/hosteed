/**
 * Script de vérification des optimisations déployées
 * Vérifie que toutes les optimisations fonctionnent correctement en production
 *
 * Usage: npx tsx scripts/verify-optimizations.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface VerificationResult {
  category: string
  status: 'success' | 'warning' | 'error'
  message: string
  details?: any
}

const results: VerificationResult[] = []

async function verifyDatabaseIndexes() {
  console.log('🔍 Vérification des index de base de données...')

  try {
    // Vérifier que les index critiques existent
    const indexes = await prisma.$queryRaw<Array<{ indexname: string; tablename: string }>>`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname;
    `

    const criticalIndexes = [
      'idx_images_product_lookup',
      'idx_product_complex_search',
      'idx_rent_availability_check',
      'idx_special_prices_active_lookup',
    ]

    const existingIndexes = indexes.map(idx => idx.indexname)
    const missingIndexes = criticalIndexes.filter(idx => !existingIndexes.includes(idx))

    if (missingIndexes.length === 0) {
      results.push({
        category: 'Database Indexes',
        status: 'success',
        message: `Tous les index critiques sont présents (${existingIndexes.length} index trouvés)`,
        details: { totalIndexes: existingIndexes.length, criticalIndexes: criticalIndexes.length },
      })
    } else {
      results.push({
        category: 'Database Indexes',
        status: 'error',
        message: `Index manquants: ${missingIndexes.join(', ')}`,
        details: { missing: missingIndexes, existing: existingIndexes },
      })
    }
  } catch (error) {
    results.push({
      category: 'Database Indexes',
      status: 'error',
      message: 'Impossible de vérifier les index',
      details: error,
    })
  }
}

async function verifyImageOptimization() {
  console.log("🖼️ Vérification de l'optimisation des images...")

  try {
    // Compter les images WebP vs autres formats
    const totalImages = await prisma.images.count()

    const webpImages = await prisma.images.count({
      where: {
        img: { contains: 'data:image/webp' },
      },
    })

    const oldFormatImages = await prisma.images.count({
      where: {
        img: {
          contains: 'data:image/',
          not: { contains: 'data:image/webp' },
        },
      },
    })

    const webpPercentage = totalImages > 0 ? ((webpImages / totalImages) * 100).toFixed(1) : '0'

    if (oldFormatImages === 0) {
      results.push({
        category: 'Image Optimization',
        status: 'success',
        message: `Toutes les images sont optimisées (${webpImages} images WebP)`,
        details: { total: totalImages, webp: webpImages, webpPercentage: `${webpPercentage}%` },
      })
    } else if (webpImages > oldFormatImages) {
      results.push({
        category: 'Image Optimization',
        status: 'warning',
        message: `Migration en cours: ${webpPercentage}% des images sont optimisées`,
        details: {
          total: totalImages,
          webp: webpImages,
          oldFormat: oldFormatImages,
          webpPercentage: `${webpPercentage}%`,
        },
      })
    } else {
      results.push({
        category: 'Image Optimization',
        status: 'error',
        message: `Migration nécessaire: seulement ${webpPercentage}% des images sont optimisées`,
        details: {
          total: totalImages,
          webp: webpImages,
          oldFormat: oldFormatImages,
          webpPercentage: `${webpPercentage}%`,
        },
      })
    }
  } catch (error) {
    results.push({
      category: 'Image Optimization',
      status: 'error',
      message: "Impossible de vérifier l'optimisation des images",
      details: error,
    })
  }
}

async function verifyPerformanceQueries() {
  console.log('⚡ Vérification des performances des requêtes...')

  try {
    // Test de performance sur une requête critique
    const startTime = Date.now()

    const products = await prisma.product.findMany({
      where: { validate: 'Approve' },
      include: {
        img: {
          take: 1,
        },
        user: {
          select: { name: true, profilePicture: true },
        },
      },
      take: 10,
    })

    const queryTime = Date.now() - startTime

    if (queryTime < 200) {
      results.push({
        category: 'Query Performance',
        status: 'success',
        message: `Requête produits optimisée (${queryTime}ms)`,
        details: { queryTime, productsReturned: products.length },
      })
    } else if (queryTime < 500) {
      results.push({
        category: 'Query Performance',
        status: 'warning',
        message: `Performances correctes mais améliorables (${queryTime}ms)`,
        details: { queryTime, productsReturned: products.length },
      })
    } else {
      results.push({
        category: 'Query Performance',
        status: 'error',
        message: `Requête trop lente (${queryTime}ms) - Vérifier les index`,
        details: { queryTime, productsReturned: products.length },
      })
    }
  } catch (error) {
    results.push({
      category: 'Query Performance',
      status: 'error',
      message: 'Impossible de tester les performances des requêtes',
      details: error,
    })
  }
}

async function verifyEnvironmentVariables() {
  console.log("🔧 Vérification des variables d'environnement...")

  const requiredVars = ['DATABASE_URL', 'NEXTAUTH_URL', 'AUTH_SECRET']

  const optimizationVars = [
    'ENABLE_IMAGE_OPTIMIZATION',
    'ENABLE_PERFORMANCE_MONITORING',
    'ENABLE_ANALYTICS',
    'REDIS_URL',
  ]

  const missingRequired = requiredVars.filter(varName => !process.env[varName])
  const enabledOptimizations = optimizationVars.filter(varName => process.env[varName] === 'true')

  if (missingRequired.length > 0) {
    results.push({
      category: 'Environment Variables',
      status: 'error',
      message: `Variables requises manquantes: ${missingRequired.join(', ')}`,
      details: { missing: missingRequired },
    })
  } else {
    results.push({
      category: 'Environment Variables',
      status: 'success',
      message: `Variables requises présentes. Optimisations actives: ${enabledOptimizations.length}`,
      details: { enabledOptimizations },
    })
  }
}

async function verifyRedisConnection() {
  console.log('🚀 Vérification de la connexion Redis...')

  const redisEnabled = process.env.ENABLE_REDIS_CACHE === 'true'
  const redisUrl = process.env.REDIS_URL

  if (!redisEnabled) {
    results.push({
      category: 'Redis Cache',
      status: 'warning',
      message: 'Cache Redis désactivé',
      details: { enabled: false },
    })
    return
  }

  if (!redisUrl) {
    results.push({
      category: 'Redis Cache',
      status: 'error',
      message: 'REDIS_URL manquant alors que le cache est activé',
      details: { enabled: true, url: null },
    })
    return
  }

  try {
    // Test simple de connexion Redis si le module est disponible
    const { createClient } = require('redis')
    const client = createClient({ url: redisUrl })

    await client.connect()
    await client.ping()
    await client.disconnect()

    results.push({
      category: 'Redis Cache',
      status: 'success',
      message: 'Connexion Redis fonctionnelle',
      details: { enabled: true, url: redisUrl.replace(/\/\/.*@/, '//***@') },
    })
  } catch (error) {
    results.push({
      category: 'Redis Cache',
      status: 'error',
      message: 'Impossible de se connecter à Redis',
      details: { enabled: true, error: error instanceof Error ? error.message : error },
    })
  }
}

async function generateReport() {
  console.log('\n📊 Génération du rapport de vérification...')

  const successCount = results.filter(r => r.status === 'success').length
  const warningCount = results.filter(r => r.status === 'warning').length
  const errorCount = results.filter(r => r.status === 'error').length

  console.log('\n='.repeat(60))
  console.log('📋 RAPPORT DE VÉRIFICATION DES OPTIMISATIONS')
  console.log('='.repeat(60))

  console.log(`\n📈 Résumé: ${successCount} ✅ | ${warningCount} ⚠️ | ${errorCount} ❌\n`)

  results.forEach(result => {
    const icon = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌'
    console.log(`${icon} ${result.category}: ${result.message}`)

    if (result.details && typeof result.details === 'object') {
      Object.entries(result.details).forEach(([key, value]) => {
        console.log(`   └─ ${key}: ${JSON.stringify(value)}`)
      })
    }
    console.log('')
  })

  // Score global
  const totalChecks = results.length
  const score = ((successCount * 2 + warningCount) / (totalChecks * 2)) * 100

  console.log('='.repeat(60))
  console.log(`🎯 Score d'optimisation: ${score.toFixed(1)}%`)

  if (score >= 90) {
    console.log('🎉 Excellent ! Toutes les optimisations sont bien configurées.')
  } else if (score >= 70) {
    console.log('👍 Bon ! Quelques optimisations mineures possibles.')
  } else if (score >= 50) {
    console.log('⚠️  Attention ! Plusieurs optimisations nécessitent votre attention.')
  } else {
    console.log('🚨 Critique ! Des optimisations importantes sont manquantes.')
  }

  console.log('='.repeat(60))

  return {
    score,
    summary: { success: successCount, warning: warningCount, error: errorCount },
    results,
  }
}

async function main() {
  try {
    console.log('🔍 Démarrage de la vérification des optimisations...\n')

    await verifyEnvironmentVariables()
    await verifyDatabaseIndexes()
    await verifyImageOptimization()
    await verifyPerformanceQueries()
    await verifyRedisConnection()

    const report = await generateReport()

    // Sortir avec un code d'erreur si des problèmes critiques sont détectés
    if (report.summary.error > 0) {
      console.log(
        '\n❌ Des erreurs critiques ont été détectées. Veuillez les corriger avant de continuer.'
      )
      process.exit(1)
    } else if (report.summary.warning > 0) {
      console.log(
        '\n⚠️  Des avertissements ont été détectés. Recommandation: corriger avant la mise en production.'
      )
    } else {
      console.log('\n✅ Toutes les vérifications sont passées avec succès !')
    }
  } catch (error) {
    console.error('💥 Erreur lors de la vérification:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécution du script
if (require.main === module) {
  main()
}

export { verifyDatabaseIndexes, verifyImageOptimization, verifyPerformanceQueries }
