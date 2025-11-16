#!/usr/bin/env node
/**
 * Script pour vider le cache de disponibilité d'un produit spécifique
 * Usage: node scripts/clear-availability-cache.js <productId>
 */

const Redis = require('ioredis')

const productId = process.argv[2]

if (!productId) {
  console.error('❌ Usage: node scripts/clear-availability-cache.js <productId>')
  process.exit(1)
}

const redis = new Redis()

console.log(`🔍 Recherche des clés de cache pour le produit: ${productId}`)

redis
  .keys(`availability:${productId}:*`)
  .then(keys => {
    if (keys.length > 0) {
      console.log(`📦 Trouvé ${keys.length} clés:`)
      keys.forEach(key => console.log(`  - ${key}`))

      return redis.del(...keys).then(count => {
        console.log(`✅ Cache invalidé pour ${count} clés`)
        redis.quit()
        process.exit(0)
      })
    } else {
      console.log('ℹ️  Aucune clé à supprimer')
      redis.quit()
      process.exit(0)
    }
  })
  .catch(err => {
    console.error('❌ Erreur:', err.message)
    redis.quit()
    process.exit(1)
  })
