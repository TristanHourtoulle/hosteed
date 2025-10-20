# Guide de Déploiement des Optimisations en Production

## 🚨 Prérequis Critiques

**IMPORTANT**: Ces optimisations nécessitent des actions spécifiques en production pour être effectives.

## 1. 📊 Base de Données - Index et Optimisations

### Application des Index

```bash
# 1. Connectez-vous à votre base de données de production
psql $DATABASE_URL

# 2. Exécutez le script d'optimisation (SANS DOWNTIME)
\i database-optimizations.sql

# 3. Vérifiez que les index sont créés
\d+ Product
\d+ Images
\d+ Rent
```

### Monitoring des performances

```sql
-- Vérifier l'utilisation des index
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Vérifier les requêtes lentes
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## 2. 🖼️ Optimisation des Images

### Migration des Images Existantes

Les images actuelles en base64 doivent être converties en WebP :

```typescript
// Script de migration à exécuter UNE SEULE FOIS
// Créer : scripts/migrate-images.ts

import { PrismaClient } from '@prisma/client'
import { optimizeImageForDatabase } from '../src/lib/services/image-optimization.service'

const prisma = new PrismaClient()

async function migrateImages() {
  console.log('🚀 Début de la migration des images...')

  const images = await prisma.images.findMany({
    where: {
      img: { contains: 'data:image/' }, // Images base64 non optimisées
    },
  })

  console.log(`📸 ${images.length} images à optimiser`)

  for (const image of images) {
    try {
      if (image.img && image.img.startsWith('data:image/')) {
        const optimizedImage = await optimizeImageForDatabase(image.img)

        await prisma.images.update({
          where: { id: image.id },
          data: { img: optimizedImage },
        })

        console.log(`✅ Image ${image.id} optimisée`)
      }
    } catch (error) {
      console.error(`❌ Erreur image ${image.id}:`, error)
    }
  }

  console.log('✨ Migration terminée')
}

migrateImages().catch(console.error)
```

### Exécution de la Migration

```bash
# 1. Créer le script de migration
npx tsx scripts/migrate-images.ts

# 2. Surveiller l'espace disque pendant la migration
# Les images optimisées sont ~70% plus petites

# 3. Vérifier que les nouvelles images sont bien WebP
SELECT COUNT(*) FROM "Images" WHERE img LIKE 'data:image/webp%';
```

## 3. ⚡ Cache Redis (Optionnel mais Recommandé)

### Installation Redis

```bash
# Sur le serveur de production
sudo apt update
sudo apt install redis-server

# Configuration Redis pour production
sudo nano /etc/redis/redis.conf
# Modifier : maxmemory 1gb
# Modifier : maxmemory-policy allkeys-lru

sudo systemctl restart redis
sudo systemctl enable redis
```

### Variables d'Environnement pour Redis

```env
# Ajouter à votre .env de production
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password # Si authentification activée
ENABLE_REDIS_CACHE=true
```

## 4. 🔧 Variables d'Environnement Requises

### Nouvelles Variables à Ajouter

```env
# === OPTIMISATIONS PERFORMANCE ===

# Cache Redis (recommandé)
REDIS_URL=redis://localhost:6379
ENABLE_REDIS_CACHE=true

# Optimisation des images
ENABLE_IMAGE_OPTIMIZATION=true
WEBP_QUALITY=80
IMAGE_MAX_WIDTH=1920
IMAGE_MAX_HEIGHT=1080

# Monitoring des performances
ENABLE_PERFORMANCE_MONITORING=true
PERFORMANCE_ALERT_THRESHOLD=5000  # ms
PERFORMANCE_ALERT_EMAIL=admin@hosteed.com

# Analytics
ENABLE_ANALYTICS=true
ANALYTICS_SAMPLE_RATE=0.1  # 10% des requêtes

# Cache TTL (en secondes)
CACHE_TTL_PRODUCTS=3600      # 1 heure
CACHE_TTL_IMAGES=86400       # 24 heures
CACHE_TTL_USER_DATA=1800     # 30 minutes
```

## 5. 📦 Déploiement par Étapes

### Étape 1: Préparation (SANS IMPACT)

```bash
# 1. Déployer le code avec les optimisations DÉSACTIVÉES
ENABLE_REDIS_CACHE=false
ENABLE_IMAGE_OPTIMIZATION=false
ENABLE_PERFORMANCE_MONITORING=false

# 2. Vérifier que l'application fonctionne normalement
```

### Étape 2: Base de Données (SANS DOWNTIME)

```bash
# 1. Appliquer les index en production
psql $DATABASE_URL -f database-optimizations.sql

# 2. Vérifier les performances
# Les requêtes doivent être plus rapides immédiatement
```

### Étape 3: Activation Progressive

```bash
# 1. Activer le monitoring SEULEMENT
ENABLE_PERFORMANCE_MONITORING=true

# 2. Redémarrer l'application
# 3. Surveiller /api/analytics/performance pendant 1h

# 4. Si tout va bien, activer l'optimisation d'images
ENABLE_IMAGE_OPTIMIZATION=true

# 5. Enfin, activer Redis si disponible
ENABLE_REDIS_CACHE=true
```

### Étape 4: Migration des Images

```bash
# 1. Exécuter la migration des images (peut prendre du temps)
npx tsx scripts/migrate-images.ts

# 2. Surveiller l'espace disque et les performances
```

## 6. 📈 Monitoring Post-Déploiement

### Métriques à Surveiller

```bash
# 1. Performances des requêtes
curl https://your-domain.com/api/analytics/performance

# 2. Utilisation du cache Redis
redis-cli info memory
redis-cli info stats

# 3. Taille de la base de données
SELECT pg_size_pretty(pg_database_size(current_database()));

# 4. Performances des index
SELECT * FROM pg_stat_user_indexes WHERE idx_scan > 0;
```

### Alertes Recommandées

- Temps de réponse > 5 secondes
- Utilisation mémoire Redis > 80%
- Requêtes lentes > 50 par minute
- Échec de conversion d'images > 5%

## 7. 🔄 Rollback en Cas de Problème

### Désactivation Rapide

```env
# En cas de problème, désactiver immédiatement :
ENABLE_REDIS_CACHE=false
ENABLE_IMAGE_OPTIMIZATION=false
ENABLE_PERFORMANCE_MONITORING=false
```

### Suppression des Index (en dernier recours)

```sql
-- SEULEMENT si les index causent des problèmes
DROP INDEX IF EXISTS idx_images_product_lookup;
DROP INDEX IF EXISTS idx_product_complex_search;
-- etc.
```

## 8. 📊 Gains Attendus

### Performances

- **Requêtes produits** : 200ms → 50ms (-75%)
- **Chargement images** : 500ms → 150ms (-70%)
- **Recherche** : 1200ms → 300ms (-75%)
- **Dashboard admin** : 800ms → 200ms (-75%)

### Ressources

- **Taille images** : -70% d'espace disque
- **Bande passante** : -60% de transfert
- **CPU base de données** : -40% d'utilisation

## ⚠️ Points d'Attention

1. **Sauvegarde** : Faire un backup complet avant la migration des images
2. **Espace disque** : Prévoir 30% d'espace libre pendant la migration
3. **Monitoring** : Surveiller activement les 24h suivant le déploiement
4. **Tests** : Tester intensivement en staging d'abord
5. **Rollback** : Avoir un plan de retour en arrière prêt

## 🚀 Commandes de Déploiement Complètes

```bash
# 1. Backup de sécurité
pg_dump $DATABASE_URL > backup-before-optimization.sql

# 2. Application des optimisations DB
psql $DATABASE_URL -f database-optimizations.sql

# 3. Déploiement avec variables d'environnement
# Mettre à jour vos variables d'environnement de production

# 4. Redémarrer l'application
# Selon votre plateforme (Vercel, Railway, etc.)

# 5. Migration des images (optionnel, peut être fait plus tard)
npx tsx scripts/migrate-images.ts

# 6. Vérification
curl https://your-domain.com/api/analytics/performance
```
