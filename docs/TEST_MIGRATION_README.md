# Test de Migration des Images - Guide Rapide

## 🎯 Objectif

Tester en toute sécurité la migration des images de base64 → WebP sur votre environnement local **AVANT** de toucher à la production.

## ⚡ Quick Start

### 1. Test Basique (1 produit)

```bash
pnpm test:images:migrate
```

**Ce que ça fait**:
- ✅ Vérifie que vous êtes en LOCAL (pas de risque pour la prod)
- 🔍 Trouve 1 produit avec des images base64
- 🖼️ Convertit ses images en WebP (3 tailles: thumb, medium, full)
- 💾 Sauvegarde dans `/public/uploads/products/{productId}/`
- ❌ **NE modifie PAS la base de données**

**Résultat attendu**:

```
🧪 === TEST DE MIGRATION DES IMAGES ===

⚠️  MODE TEST: Aucune modification de la base de données

✅ Environnement: LOCAL
✅ Database URL: Safe

📦 Produits trouvés avec images base64: 1

📦 Produit 1/1: Nom du produit
   Images: 10

   📸 Image 1/10
      📊 Taille base64: 374.20 KB
      ✅ Migration réussie!
      📁 Thumb:  .../img_0_thumb.webp (12.55 KB)
      📁 Medium: .../img_0_medium.webp (94.43 KB)
      📁 Full:   .../img_0_full.webp (460.95 KB)
      💾 Économie: 51.8%

📊 === RÉSULTATS DU TEST ===

Produits testés:       1
✅ Migrations réussies: 1
📸 Images traitées:    10
📁 Fichiers générés:   30  (10 images × 3 tailles)
```

### 2. Vérifier les Images Générées

```bash
# Ouvrir le dossier avec les images
open public/uploads/products/

# Voir les détails des fichiers
ls -lh public/uploads/products/cmdx7825k0001l1046mwhxg8w/
```

**Vérifications**:
- ✅ Les images s'ouvrent correctement
- ✅ La qualité visuelle est bonne
- ✅ Les tailles sont correctes:
  - Thumb: 5-15 KB
  - Medium: 50-100 KB
  - Full: 200-500 KB

### 3. Tester avec Plus de Produits

```bash
# 5 produits
pnpm test:images:migrate:5

# Produit spécifique
pnpm test:images:migrate --product-id=abc123
```

### 4. Nettoyer les Fichiers de Test

```bash
# Supprimer tous les fichiers générés par le test
rm -rf public/uploads/products/
```

---

## 🔒 Protections de Sécurité

Le script de test a plusieurs protections:

### ❌ Bloque si en Production

```
❌ ERREUR: Ce script ne doit PAS être exécuté en production!
   Utilisez-le uniquement en local pour les tests.
```

### ❌ Bloque si DB de Production

```
❌ ERREUR: La DATABASE_URL semble pointer vers la production!
   DATABASE_URL: postgresql://user@prod-server...
   Vérifiez votre fichier .env
```

### ✅ N'écrit JAMAIS dans la DB

Le test crée les fichiers WebP mais ne modifie **JAMAIS** la base de données. Les données base64 restent intactes.

---

## 📊 Comprendre les Résultats

### Exemple de Sortie

```
📸 Image 1/10
   📊 Taille base64: 374.20 KB        # Taille originale en base64
   ✅ Migration réussie!
   📁 Thumb:  12.55 KB                # Thumbnail (300x200) : -97%
   📁 Medium: 94.43 KB                # Medium (800x600)   : -75%
   📁 Full:   460.95 KB               # Full (1920x1440)   : -23%
   💾 Économie: 51.8%                 # Économie globale
```

**Note sur l'économie**:
- Peut être **négative** si l'image full est plus lourde que le base64
- Ce n'est **pas un problème** car:
  - Le thumbnail (utilisé dans les listes) est -97% plus léger ✅
  - Le cache navigateur (1 an) rend le chargement instantané ✅
  - L'image full n'est chargée que sur la page produit ✅

### Calcul de l'Économie

```
Économie = (1 - (thumb + medium + full) / base64) × 100
```

**Exemples**:
- Image simple: +50% économie (bien compressible)
- Image complexe: -20% économie (mais gain en performance grâce au cache)

---

## 🐛 Dépannage

### Erreur: "Aucun produit avec images base64 trouvé"

**Cause**: Tous les produits ont déjà été migrés (ou il n'y a pas de produits).

**Solution**:
```bash
# Vérifier dans Prisma Studio
pnpm prisma studio

# Ou SQL direct
psql $DATABASE_URL -c "SELECT COUNT(*) FROM images WHERE img LIKE 'data:image%';"
```

### Erreur: "Permission denied"

**Cause**: Pas les droits d'écriture sur `/public/uploads/`.

**Solution**:
```bash
chmod -R 755 public/uploads/
```

### Erreur: "Sharp error"

**Cause**: La librairie Sharp n'est pas installée correctement.

**Solution**:
```bash
pnpm install --force
```

---

## 🎓 Comprendre le Process

### 1. Le Test NE Modifie PAS la DB

```typescript
// ❌ Ce code N'EST PAS exécuté dans le test
await prisma.images.update({
  where: { id },
  data: { img: newUrl }
})
```

### 2. Les Fichiers Créés

Pour chaque image, 3 fichiers sont créés:

```
/public/uploads/products/{productId}/
  img_0_thumb_1760088930568_98a408ea.webp   # 300x200px
  img_0_medium_1760088930568_2f9be803.webp  # 800x600px
  img_0_full_1760088930568_75bc4ea1.webp    # 1920x1440px
```

### 3. Nommage des Fichiers

```
img_{index}_{size}_{timestamp}_{hash}.webp

- index: 0, 1, 2... (position de l'image)
- size: thumb, medium, full
- timestamp: Date.now() pour éviter les collisions
- hash: 8 caractères aléatoires pour sécurité
```

---

## ✅ Validation Visuelle

Après le test, ouvrez quelques images:

```bash
# Ouvrir le dossier
open public/uploads/products/

# Ou ouvrir directement une image
open public/uploads/products/cmdx7825k0001l1046mwhxg8w/img_0_thumb_*.webp
```

**Checklist**:
- [ ] L'image s'ouvre correctement
- [ ] Les couleurs sont bonnes (pas de distorsion)
- [ ] La netteté est acceptable
- [ ] Le ratio d'aspect est respecté (pas d'étirement)

---

## 📝 Comparaison Avant/Après

| Critère | Avant (Base64) | Après (WebP) | Gain |
|---------|----------------|--------------|------|
| Format | JPEG/PNG | WebP | +30% compression |
| Stockage | PostgreSQL | File system | -95% charge DB |
| Cache | ❌ Aucun | ✅ 1 an | ♾️ |
| Taille (list) | 300 KB | 10 KB | **-97%** |
| Taille (detail) | 300 KB | 250 KB | -17% |
| Responsive | ❌ Non | ✅ 3 sizes | ✨ |

---

## 🚀 Prochaines Étapes

Une fois les tests validés en local:

1. **Lire le guide complet**: [docs/MIGRATION_IMAGES_GUIDE.md](./MIGRATION_IMAGES_GUIDE.md)

2. **Créer un backup de production**:
   ```bash
   # Sur le VPS
   pg_dump $DATABASE_URL > backup_pre_migration.sql
   ```

3. **Migration progressive** (recommandé):
   ```bash
   # Sur le VPS
   pnpm images:migrate --limit 10    # 10 produits d'abord
   # Vérifier que tout fonctionne
   pnpm images:migrate --limit 50    # 50 produits
   # etc.
   ```

4. **Ou migration complète**:
   ```bash
   # Sur le VPS (après double confirmation)
   pnpm images:migrate --force
   ```

---

## 📚 Documentation Complète

- [MIGRATION_IMAGES_GUIDE.md](./MIGRATION_IMAGES_GUIDE.md) - Guide complet de migration
- [IMAGE_MANAGEMENT_SYSTEM.md](./IMAGE_MANAGEMENT_SYSTEM.md) - Architecture du système
- [IMAGE_UPLOAD_EXAMPLE.md](./IMAGE_UPLOAD_EXAMPLE.md) - Exemples de code

---

## 🆘 Besoin d'Aide?

**En cas de problème lors des tests**:

1. Vérifier que Docker/PostgreSQL tourne: `docker ps`
2. Vérifier que Prisma est à jour: `pnpm prisma generate`
3. Vérifier les logs: console du terminal
4. Supprimer les fichiers: `rm -rf public/uploads/products/`
5. Réessayer: `pnpm test:images:migrate`

**Les tests sont 100% sûrs**: ils ne modifient jamais la base de données ! 🛡️

---

**Dernière mise à jour**: 2025-10-10
