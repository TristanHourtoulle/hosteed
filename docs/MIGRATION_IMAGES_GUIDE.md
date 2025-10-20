# Guide de Migration des Images Base64 → File System

Ce guide explique comment migrer en toute sécurité les images de base64 (stockées dans PostgreSQL) vers le système de fichiers du VPS avec conversion WebP.

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Avantages de la migration](#avantages-de-la-migration)
3. [Test en local (OBLIGATOIRE)](#test-en-local-obligatoire)
4. [Migration en production](#migration-en-production)
5. [Vérification post-migration](#vérification-post-migration)
6. [Rollback en cas de problème](#rollback-en-cas-de-problème)

---

## 🎯 Vue d'ensemble

### Situation actuelle

- **Stockage**: Images en base64 dans PostgreSQL (table `images`)
- **Taille**: ~300-400 KB par image en base64
- **Performance**: Lent, pas de cache navigateur, charge la DB

### Situation après migration

- **Stockage**: Fichiers WebP sur le VPS dans `/public/uploads/products/{productId}/`
- **3 tailles par image**:
  - **Thumb** (300x200px) : ~10 KB
  - **Medium** (800x600px) : ~60 KB
  - **Full** (1920x1440px) : ~250 KB
- **Performance**: Rapide, cache navigateur 1 an, décharge la DB

---

## ✅ Avantages de la migration

| Critère             | Avant (Base64) | Après (WebP) | Gain             |
| ------------------- | -------------- | ------------ | ---------------- |
| Taille thumbnail    | 300-400 KB     | ~10 KB       | **-97%**         |
| Cache navigateur    | ❌ Aucun       | ✅ 1 an      | ♾️               |
| Format              | JPEG/PNG       | WebP         | +30% compression |
| Charge DB           | ❌ Élevée      | ✅ Minimale  | -95%             |
| Temps de chargement | 5 secondes     | <500ms       | **-90%**         |

---

## 🧪 Test en local (OBLIGATOIRE)

### Étape 1: Vérifier l'environnement

```bash
# S'assurer d'être en local
echo $NODE_ENV  # Doit être vide ou "development"

# Vérifier la DB
cat .env | grep DATABASE_URL  # Doit pointer vers localhost
```

⚠️ **ATTENTION**: Ne JAMAIS tester avec la base de données de production !

### Étape 2: Lancer le test sur 1 produit

```bash
pnpm test:images:migrate
```

**Ce script va**:

1. ✅ Vérifier que vous êtes en local
2. ✅ Trouver 1 produit avec des images base64
3. ✅ Convertir ses images en WebP (3 tailles)
4. ✅ Sauvegarder dans `/public/uploads/products/{productId}/`
5. ❌ **NE PAS modifier la base de données** (c'est un test)

**Exemple de sortie**:

```
🧪 === TEST DE MIGRATION DES IMAGES ===

⚠️  MODE TEST: Aucune modification de la base de données

✅ Environnement: LOCAL
✅ Database URL: Safe

📦 Produits trouvés avec images base64: 1

📦 Produit 1/1: Luxe et confort - Appartement spacieux
   ID: cmdx7825k0001l1046mwhxg8w
   Images: 10

   📸 Image 1/10
      📊 Taille base64: 374.20 KB
      ✅ Migration réussie!
      📁 Thumb:  /uploads/products/.../img_0_thumb.webp (12.55 KB)
      📁 Medium: /uploads/products/.../img_0_medium.webp (94.43 KB)
      📁 Full:   /uploads/products/.../img_0_full.webp (460.95 KB)
      💾 Économie: 51.8%
```

### Étape 3: Vérifier les images générées

Les images de test sont dans:

```
/public/uploads/products/{productId}/
```

**Vérifications à faire**:

1. **Ouvrir les images** pour vérifier la qualité visuelle:

   ```bash
   open public/uploads/products/cmdx7825k0001l1046mwhxg8w/
   ```

2. **Vérifier les tailles**:

   ```bash
   ls -lh public/uploads/products/cmdx7825k0001l1046mwhxg8w/
   ```

   - Thumb: ~5-15 KB ✅
   - Medium: ~50-100 KB ✅
   - Full: ~200-500 KB ✅

3. **Vérifier le format WebP**:
   ```bash
   file public/uploads/products/cmdx7825k0001l1046mwhxg8w/*.webp
   # Doit afficher: "Web/P image"
   ```

### Étape 4: Tester avec plus de produits

```bash
# Tester 5 produits
pnpm test:images:migrate:5

# Tester un produit spécifique
pnpm test:images:migrate --product-id=abc123
```

### Étape 5: Nettoyer les fichiers de test

```bash
rm -rf public/uploads/products/
```

---

## 🚀 Migration en production

### ⚠️ AVANT DE COMMENCER

**Checklist de sécurité**:

- [ ] ✅ Test en local réussi
- [ ] ✅ Images de test vérifiées visuellement
- [ ] ✅ Backup de la base de données créé
- [ ] ✅ Accès SSH au VPS disponible
- [ ] ✅ Espace disque suffisant sur le VPS (vérifier avec `df -h`)
- [ ] ✅ Notification aux utilisateurs (temps d'arrêt potentiel)

### Option 1: Migration progressive (RECOMMANDÉ)

Cette approche minimise les risques en migrant par petits lots.

#### 1. Première vague (10 produits)

```bash
# Sur le VPS, en mode dry-run d'abord
pnpm images:migrate:preview

# Si OK, migration réelle de 10 produits
pnpm images:migrate --limit 10
```

**Le script va**:

1. Demander confirmation
2. Migrer 10 produits
3. Modifier les URLs dans la DB
4. Afficher un résumé

#### 2. Vérifier le fonctionnement

- Visiter les pages produits migrés
- Vérifier que les images s'affichent
- Vérifier la console navigateur (pas d'erreurs 404)
- Tester sur mobile

#### 3. Vagues suivantes

Si tout fonctionne, augmenter progressivement:

```bash
pnpm images:migrate --limit 50   # 50 produits
pnpm images:migrate --limit 100  # 100 produits
pnpm images:migrate              # Tous les restants
```

### Option 2: Migration complète

**⚠️ Plus risqué mais plus rapide**

```bash
# Dry-run complet (ne modifie rien)
pnpm images:migrate:dry-run

# Migration complète (après confirmation)
pnpm images:migrate --force
```

**Le script va**:

1. ✅ Vérifier l'environnement
2. ⚠️ Demander DOUBLE confirmation (production)
3. 🔄 Migrer TOUS les produits
4. 💾 Modifier toutes les URLs dans la DB
5. 📊 Afficher statistiques

---

## 🔍 Vérification post-migration

### 1. Vérifier les fichiers créés

```bash
# Sur le VPS
ls -lh public/uploads/products/ | head -20

# Compter les fichiers
find public/uploads/products/ -name "*.webp" | wc -l
# Doit être = (nombre d'images) × 3
```

### 2. Vérifier la base de données

```bash
# Lancer Prisma Studio
pnpm prisma studio

# Ou via SQL direct
psql $DATABASE_URL -c "
  SELECT
    COUNT(*) as total_images,
    COUNT(CASE WHEN img LIKE '/uploads/%' THEN 1 END) as migrated,
    COUNT(CASE WHEN img LIKE 'data:image%' THEN 1 END) as base64_remaining
  FROM images;
"
```

**Résultat attendu**:

```
 total_images | migrated | base64_remaining
--------------+----------+-----------------
          500 |      500 |               0
```

### 3. Tester le site

**Pages à vérifier**:

- [ ] Page d'accueil (`/`)
- [ ] Page de recherche (`/host`)
- [ ] Page produit (`/host/[id]`)
- [ ] Dashboard host (`/dashboard/host`)
- [ ] Admin validation (`/admin/validation`)

**Vérifications**:

- [ ] Images s'affichent correctement
- [ ] Pas d'erreurs 404 dans la console
- [ ] Chargement rapide (< 1 seconde)
- [ ] Cache fonctionne (rechargement instantané)

### 4. Vérifier les performances

```bash
# Taille du dossier images
du -sh public/uploads/

# Comparer avec la taille DB (avant)
# Avant: ~300 KB × nombre d'images
# Après: ~10 KB × nombre d'images (pour thumbs)
```

### 5. Vérifier les headers HTTP

Ouvrir DevTools → Network → Cliquer sur une image:

```
Cache-Control: public, max-age=31536000, immutable ✅
Content-Type: image/webp ✅
Content-Length: ~10000 bytes ✅ (pour thumb)
```

---

## 🔄 Rollback en cas de problème

### Si les images ne s'affichent pas

**Diagnostic**:

```bash
# Vérifier les permissions
ls -la public/uploads/products/

# Doit être accessible en lecture
# drwxr-xr-x (755)
```

**Solution**:

```bash
chmod -R 755 public/uploads/
```

### Si les URLs sont cassées

**Diagnostic**:

1. Ouvrir une page produit
2. Inspecter l'image (clic droit → Inspecter)
3. Vérifier le `src`:
   - ✅ `/uploads/products/{id}/img_0_thumb_....webp`
   - ❌ `data:image/jpeg;base64,...`

**Si c'est cassé**, vérifier la DB:

```sql
SELECT img FROM images WHERE id = 'xxx';
-- Doit retourner: /uploads/products/.../img_X_thumb_....webp
-- PAS: data:image/...
```

### Restaurer depuis backup (dernier recours)

Si tout est cassé, restaurer le backup:

```bash
# Arrêter l'app
pm2 stop hosteed

# Restaurer la DB depuis backup
psql $DATABASE_URL < backup_pre_migration.sql

# Supprimer les fichiers migrés
rm -rf public/uploads/products/

# Redémarrer
pm2 start hosteed
```

---

## 📝 Commandes utiles

### Scripts disponibles

```bash
# Test (pas de modification DB)
pnpm test:images:migrate           # 1 produit
pnpm test:images:migrate:5         # 5 produits
pnpm test:images:migrate --product-id=abc123  # Produit spécifique

# Migration réelle
pnpm images:migrate:dry-run        # Simulation complète
pnpm images:migrate:preview        # Dry-run de 10 produits
pnpm images:migrate --limit 10     # Migrer 10 produits
pnpm images:migrate                # Migrer TOUS les produits
pnpm images:migrate --force        # Force en production

# Nettoyage
rm -rf public/uploads/test-migration  # Supprimer tests
```

### Monitoring

```bash
# Suivre la migration en temps réel
tail -f /var/log/pm2/hosteed-out.log

# Voir l'espace disque
df -h

# Compter les fichiers migrés
find public/uploads/products -name "*.webp" | wc -l
```

---

## 🎉 Après la migration réussie

### 1. Nettoyer les données base64 (optionnel)

⚠️ **ATTENTION**: Uniquement si vous êtes 100% certain que tout fonctionne !

Les anciennes données base64 restent dans la DB mais ne sont plus utilisées. Pour les supprimer:

```sql
-- NE PAS EXÉCUTER AVANT D'ÊTRE SÛR À 100% !
UPDATE images
SET img = '/uploads/placeholder.webp'  -- ou garder l'URL actuelle
WHERE img LIKE 'data:image%';
```

**Alternative**: Garder les données base64 comme backup pendant 1-2 semaines, puis nettoyer.

### 2. Monitorer l'espace disque

Ajouter un cron job pour vérifier l'espace:

```bash
# Crontab
0 0 * * * df -h /public/uploads > /var/log/disk-usage.log
```

### 3. Configurer les backups

Sauvegarder le dossier `/public/uploads/` régulièrement:

```bash
# Backup quotidien
0 2 * * * tar -czf /backups/uploads-$(date +\%Y\%m\%d).tar.gz /var/www/hosteed/public/uploads/
```

### 4. Mesurer les gains

**Avant/Après**:

| Métrique               | Avant  | Après  | Gain |
| ---------------------- | ------ | ------ | ---- |
| Temps chargement /host | 5s     | 0.5s   | -90% |
| Taille JSON API        | 3 MB   | 300 KB | -90% |
| Taille DB              | 500 MB | 50 MB  | -90% |
| Requêtes DB/page       | 6      | 1      | -83% |

---

## 🆘 Support

**En cas de problème**:

1. Vérifier les logs: `/var/log/pm2/hosteed-error.log`
2. Vérifier les permissions: `ls -la public/uploads/`
3. Vérifier la DB: `pnpm prisma studio`
4. Rollback si nécessaire (voir section dédiée)

**Checklist de debug**:

- [ ] Les fichiers existent-ils? `ls public/uploads/products/{id}/`
- [ ] Les permissions sont-elles OK? `ls -la public/uploads/`
- [ ] Les URLs en DB sont-elles correctes? `SELECT img FROM images LIMIT 5;`
- [ ] Le serveur a-t-il accès au dossier? `curl http://localhost:3000/uploads/...`
- [ ] Les images sont-elles valides? `file public/uploads/products/{id}/*.webp`

---

**Dernière mise à jour**: 2025-10-10
**Version**: 1.0.0
