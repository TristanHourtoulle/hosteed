# 🖼️ Migration Images: Base64 → Stockage VPS

## Problème Actuel

**Base64 dans la base de données**:

- ❌ JSON énorme (1 image = ~500KB en base64)
- ❌ Ralentit les requêtes Prisma
- ❌ Consomme énormément de RAM
- ❌ Impossible à optimiser/compresser
- ❌ Pas de cache CDN/navigateur

**Avec 6 produits**: ~3MB de données JSON transférées !
**Avec 100 produits**: ~50MB de données JSON ! 💀

---

## Solution: Stockage sur le VPS

### Architecture Proposée

```
/var/www/hosteed/public/uploads/
├── products/
│   ├── {productId}/
│   │   ├── thumb_image1.webp    (200x150, ~10KB)
│   │   ├── medium_image1.webp   (800x600, ~50KB)
│   │   ├── full_image1.webp     (1920x1440, ~200KB)
│   │   └── ...
│   └── {productId2}/
│       └── ...
└── users/
    └── avatars/
        └── {userId}.webp
```

### Avantages

✅ **Performance**: URL au lieu de base64 (1KB au lieu de 500KB)
✅ **Cache navigateur**: Les images sont mises en cache automatiquement
✅ **Compression**: WebP = 80% plus petit que JPEG
✅ **Lazy loading**: Charger uniquement les images visibles
✅ **Responsive**: Générer plusieurs tailles (thumb, medium, full)
✅ **Gratuit**: Utilise le VPS existant

---

## Plan de Migration

### Phase 1: Quick Win - Ne PAS envoyer les images dans /api/products/search ⚡

**Impact immédiat**: -90% de données transférées

```typescript
// ❌ AVANT (route.ts)
img: {
  take: 1,
  select: { id: true, img: true }  // 500KB de base64 !
}

// ✅ APRÈS
img: {
  take: 1,
  select: { id: true }  // Juste l'ID, pas l'image
}
```

**Résultat**:

- JSON de 3MB → 300KB (-90%)
- Parsing 10x plus rapide
- **Gain: -2 secondes sur le chargement**

### Phase 2: Système de Stockage VPS (à implémenter plus tard)

Pour les nouvelles uploads, on utilisera le file system:

```typescript
// lib/services/upload.service.ts
import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp' // Déjà installé

export async function saveProductImage(productId: string, base64Image: string, index: number) {
  const uploadDir = path.join(process.cwd(), 'public/uploads/products', productId)
  await fs.mkdir(uploadDir, { recursive: true })

  // Décoder base64
  const buffer = Buffer.from(base64Image.split(',')[1], 'base64')

  // Générer 3 tailles avec sharp
  await Promise.all([
    // Thumbnail pour la liste
    sharp(buffer)
      .resize(200, 150, { fit: 'cover' })
      .webp({ quality: 80 })
      .toFile(path.join(uploadDir, `thumb_${index}.webp`)),

    // Medium pour la modal
    sharp(buffer)
      .resize(800, 600, { fit: 'inside' })
      .webp({ quality: 85 })
      .toFile(path.join(uploadDir, `medium_${index}.webp`)),

    // Full pour le détail
    sharp(buffer)
      .resize(1920, 1440, { fit: 'inside' })
      .webp({ quality: 90 })
      .toFile(path.join(uploadDir, `full_${index}.webp`)),
  ])

  return {
    thumb: `/uploads/products/${productId}/thumb_${index}.webp`,
    medium: `/uploads/products/${productId}/medium_${index}.webp`,
    full: `/uploads/products/${productId}/full_${index}.webp`,
  }
}
```

---

## Solution Temporaire Immédiate

En attendant la migration complète vers le file system, on peut faire un **Quick Win**:

### Option 1: Route API Dédiée pour les Thumbnails

```typescript
// app/api/products/[id]/thumbnail/route.ts
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    select: {
      img: {
        take: 1,
        select: { img: true },
      },
    },
  })

  if (!product?.img?.[0]?.img) {
    return new Response('Not found', { status: 404 })
  }

  // Convertir base64 → Buffer
  const base64Data = product.img[0].img.split(',')[1]
  const buffer = Buffer.from(base64Data, 'base64')

  // Optimiser avec sharp
  const optimized = await sharp(buffer)
    .resize(200, 150, { fit: 'cover' })
    .webp({ quality: 80 })
    .toBuffer()

  return new Response(optimized, {
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=31536000, immutable', // 1 an
    },
  })
}
```

Utilisation dans le composant:

```tsx
// components/ui/ProductCard.tsx
<img src={`/api/products/${product.id}/thumbnail`} alt={product.name} loading='lazy' />
```

**Avantages**:

- ✅ Pas de base64 dans la recherche
- ✅ Cache navigateur
- ✅ Lazy loading natif
- ✅ Images optimisées à la volée

**Inconvénient**:

- ⚠️ 1 requête par image (mais mise en cache)

### Option 2: Endpoint Batch pour Plusieurs Thumbnails

```typescript
// app/api/products/thumbnails/route.ts
export async function POST(request: Request) {
  const { productIds } = await request.json()

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      img: {
        take: 1,
        select: { img: true },
      },
    },
  })

  // Retourner un mapping id → thumbnail optimisé
  const thumbnails = await Promise.all(
    products.map(async p => {
      if (!p.img[0]?.img) return { id: p.id, data: null }

      const buffer = Buffer.from(p.img[0].img.split(',')[1], 'base64')
      const optimized = await sharp(buffer)
        .resize(200, 150, { fit: 'cover' })
        .webp({ quality: 80 })
        .toBuffer()

      return {
        id: p.id,
        data: `data:image/webp;base64,${optimized.toString('base64')}`,
      }
    })
  )

  return Response.json(thumbnails)
}
```

---

## Recommandation Immédiate

**Pour résoudre ton problème de performance MAINTENANT**:

1. ✅ **Retirer les images de `/api/products/search`** (5 min)

   - Ne renvoyer que `{ id, name, basePrice, ... }` sans `img`

2. ✅ **Créer la route `/api/products/[id]/thumbnail`** (15 min)

   - Optimisation avec sharp
   - Cache HTTP agressif

3. ✅ **Lazy loading dans ProductCard** (5 min)
   - `<img loading="lazy" />` natif

**Résultat**:

- **5s → 1s** de temps de chargement (-80%)
- Scalable pour 1000 produits
- Pas de coût supplémentaire

---

## Migration Complète (Plus tard)

Quand le client sera prêt:

1. Script de migration base64 → file system
2. Générer thumb/medium/full pour tous les produits existants
3. Mettre à jour le schéma Prisma
4. Configurer Nginx pour servir `/uploads` directement (sans passer par Next.js)

**Performance finale**:

- **0.3s** de temps de chargement
- CDN-ready si besoin futur
- Images servies directement par Nginx (ultra rapide)

---

Veux-tu que j'implémente la **solution immédiate** (Options 1 ou 2) ?
