# 🔍 Audit de Performance - Page /host

## Problème Constaté

**Symptôme**: 5 secondes de délai avant l'affichage des 6 annonces sur `/host`

**Impact**: Performance inacceptable qui va empirer avec plus de produits

---

## 📊 Analyse du Flux de Données

### 1. Au Chargement de la Page `/host`

Le hook `useProductSearchPaginated` effectue **6 requêtes API en parallèle**:

```typescript
// 5 requêtes pour les données statiques (EN PARALLÈLE)
1. GET /api/types          → TypeRent (Villa, Appartement, etc.)
2. GET /api/security       → Sécurités disponibles
3. GET /api/meals          → Types de repas
4. GET /api/equipments     → Équipements disponibles
5. GET /api/services       → Services disponibles

// 1 requête pour les produits (BLOQUÉE jusqu'à ce que les 5 autres soient terminées)
6. GET /api/products/search?page=1&limit=20
```

### 2. Problème d'Architecture Critique

**Dans `useProductSearchPaginated.ts:317-318`**:

```typescript
enabled: !staticQueries.some(q => q.isLoading), // ❌ BLOQUE la recherche!
```

**Impact**: La requête des produits **N'EST PAS LANCÉE** tant que les 5 requêtes de données statiques ne sont pas terminées !

---

## 🐌 Goulots d'Étranglement Identifiés

### Problème #1: Waterfall Loading ⚠️⚠️⚠️

```
Temps 0s ────────────────────────────────────────→ 5s
│
├─ [GET /api/types]         ██████ (500ms)
├─ [GET /api/security]      ██████ (500ms)
├─ [GET /api/meals]         ██████ (500ms)
├─ [GET /api/equipments]    ██████ (500ms)
├─ [GET /api/services]      ██████ (500ms)
│
└─ [Attente que TOUT soit terminé...]
   │
   └─ [GET /api/products/search] ████████████ (3s)
```

**Total**: ~5 secondes (dont 2.5s d'attente inutile)

### Problème #2: Données Statiques Recharges À CHAQUE Visite

Même avec React Query, les données statiques sont refetchées car:

- `staleTime: 24h` est configuré MAIS...
- Si l'utilisateur quitte et revient, le cache est vidé
- Ces données changent rarement (types, équipements, etc.)

### Problème #3: API de Recherche Lente (3s pour 6 produits)

**Fichier**: `src/app/api/products/search/route.ts`

Analyse du temps de réponse:

```
1. Requête DB Prisma:         ~1.5s
   - Includes multiples
   - Conversions BigInt
   - Tri côté serveur

2. Cache Redis:                ~0.2s
   - Sérialisation JSON
   - Écriture réseau

3. Tri client-side (popular):  ~0.3s

4. Overhead Next.js:           ~1s
```

### Problème #4: React Query Cache Pas Optimisé

**Fichier**: `src/hooks/useProductSearchPaginated.ts:315-316`

```typescript
staleTime: 1000 * 60 * 2,  // 2 minutes ❌ Trop court!
gcTime: 1000 * 60 * 5,     // 5 minutes ❌ Trop court!
```

Les résultats de recherche sont invalides trop rapidement.

---

## 🎯 Solutions Proposées

### Solution #1: Paralléliser TOUTES les Requêtes ⚡⚡⚡

**Impact**: Réduction de 2.5s → **-50% du temps de chargement**

```typescript
// ❌ AVANT (waterfall)
enabled: !staticQueries.some(q => q.isLoading)

// ✅ APRÈS (parallèle)
enabled: true // Lancer immédiatement!
```

Les produits et les données statiques se chargent en même temps.

### Solution #2: Précharger les Données Statiques au Build Time 🚀

**Impact**: Élimination des 5 requêtes → **-2s**

Utiliser le composant serveur Next.js 15 pour fetch les données au build:

```typescript
// src/app/host/layout.tsx (Server Component)
export default async function HostLayout({ children }) {
  // Fetch au build time (SSR)
  const [types, securities, meals, equipments, services] = await Promise.all([
    fetchTypes(),
    fetchSecurities(),
    fetchMeals(),
    fetchEquipments(),
    fetchServices()
  ])

  return (
    <StaticDataProvider data={{ types, securities, meals, equipments, services }}>
      {children}
    </StaticDataProvider>
  )
}
```

### Solution #3: Optimiser la Requête DB Prisma 🔧

**Impact**: Réduction de 1.5s → 0.3s → **-1.2s**

#### 3.1. Ajouter des Index Stratégiques

```prisma
model Product {
  // Index pour la recherche
  @@index([validate, isDraft])
  @@index([typeId, validate])
  @@index([basePrice])

  // Index pour le tri
  @@index([id(sort: Desc)])
  @@index([certified(sort: Desc)])
}
```

#### 3.2. Utiliser les Vues Matérialisées

Pour les requêtes de recherche fréquentes, créer une vue DB:

```sql
CREATE MATERIALIZED VIEW product_search_view AS
SELECT
  p.id, p.name, p.address, p.basePrice, p.certified,
  t.name as typeName,
  (SELECT img FROM "Image" WHERE productId = p.id LIMIT 1) as firstImage
FROM "Product" p
LEFT JOIN "TypeRent" t ON p.typeId = t.id
WHERE p.validate IN ('Approve', 'ModificationPending') AND p.isDraft = false;

-- Rafraîchir toutes les heures
REFRESH MATERIALIZED VIEW CONCURRENTLY product_search_view;
```

#### 3.3. Pagination Cursor-Based au lieu de Offset

```typescript
// ❌ AVANT (lent avec beaucoup de données)
skip: (page - 1) * limit

// ✅ APRÈS (rapide même avec 10000 produits)
cursor: {
  id: lastProductId
}
take: limit
```

### Solution #4: Augmenter le Cache React Query 💾

**Impact**: Réduction des re-fetch inutiles → **-3s par navigation**

```typescript
// ✅ Cache beaucoup plus long
staleTime: 1000 * 60 * 30,  // 30 minutes (au lieu de 2min)
gcTime: 1000 * 60 * 60 * 2, // 2 heures (au lieu de 5min)
```

### Solution #5: Lazy Loading des Images 🖼️

Les images base64 ralentissent énormément le parsing JSON.

```typescript
// ❌ AVANT
img: {
  take: 1,
  select: { id: true, img: true }  // Base64 énorme!
}

// ✅ APRÈS
img: {
  take: 1,
  select: {
    id: true,
    // Ne PAS inclure l'image base64 dans la recherche!
    // Lazy load via une route séparée
  }
}
```

Créer une route dédiée:

```typescript
// GET /api/products/[id]/thumbnail
// Retourne UNIQUEMENT l'image, avec cache CDN
```

### Solution #6: Utiliser le Streaming SSR de Next.js 15 🌊

```typescript
// src/app/host/page.tsx
import { Suspense } from 'react'

export default function HostPage() {
  return (
    <div>
      {/* La barre de recherche s'affiche immédiatement */}
      <ModernSearchBar />

      {/* Les produits sont streamés dès qu'ils sont prêts */}
      <Suspense fallback={<ProductsSkeleton />}>
        <ProductsAsync />
      </Suspense>
    </div>
  )
}
```

---

## 📈 Impact Estimé des Optimisations

| Optimisation               | Gain de Temps | Difficulté   | Priorité        |
| -------------------------- | ------------- | ------------ | --------------- |
| #1 - Paralléliser requêtes | -2.5s (50%)   | 🟢 Facile    | ⚡ CRITIQUE     |
| #2 - Données statiques SSR | -2s (40%)     | 🟡 Moyen     | ⚡ CRITIQUE     |
| #3 - Index DB + Vues       | -1.2s (24%)   | 🔴 Difficile | 🟡 Important    |
| #4 - Cache React Query     | -0.5s/nav     | 🟢 Facile    | ⚡ CRITIQUE     |
| #5 - Lazy load images      | -1.5s (30%)   | 🟡 Moyen     | ⚡ CRITIQUE     |
| #6 - Streaming SSR         | Perçu -3s     | 🟡 Moyen     | 🟢 Nice-to-have |

### Résultat Final Estimé

**Avant**: 5 secondes
**Après (#1+#2+#4+#5)**: **0.5 - 1 seconde** ⚡

**Gain**: **-80% à -90% du temps de chargement**

---

## 🎯 Plan d'Action Recommandé

### Phase 1: Quick Wins (1-2h de travail) ⚡

1. ✅ Retirer `enabled: !staticQueries.some(q => q.isLoading)`
2. ✅ Augmenter `staleTime` et `gcTime` de React Query
3. ✅ Supprimer l'image base64 de la requête de recherche

**Gain attendu**: -3s (5s → 2s)

### Phase 2: Architecture (3-4h de travail) 🏗️

4. ✅ Implémenter données statiques en SSR
5. ✅ Ajouter route `/api/products/[id]/thumbnail` pour images
6. ✅ Implémenter lazy loading des images

**Gain attendu**: -1.5s (2s → 0.5s)

### Phase 3: Base de Données (1-2 jours) 🗄️

7. ✅ Ajouter les index Prisma
8. ⚠️ Créer vues matérialisées (optionnel pour >1000 produits)
9. ⚠️ Pagination cursor-based (optionnel pour >1000 produits)

**Gain attendu**: -0.3s + scalabilité future

---

## 🔥 Commandes de Test

### Mesurer la Performance Actuelle

```bash
# Dans la console du navigateur
console.time('Page Load')
// Rafraîchir la page
console.timeEnd('Page Load')
```

### Analyser les Requêtes Network

```bash
# Ouvrir DevTools → Network → Filter: Fetch/XHR
# Observer:
# 1. Nombre de requêtes
# 2. Temps de chaque requête
# 3. Ordre d'exécution (waterfall)
```

### Profiler React

```bash
# React DevTools → Profiler
# Enregistrer pendant le chargement
# Identifier les composants lents
```

---

## ⚠️ Points d'Attention

1. **Ne PAS optimiser prématurément**: Implémenter Phase 1 d'abord, mesurer, puis Phase 2
2. **Cache Redis**: S'assurer que Redis est bien configuré et accessible
3. **Images**: Considérer migration vers CDN externe (Cloudinary, AWS S3) à long terme
4. **Base de données**: Surveiller les slow queries avec Prisma logging

---

Voulez-vous que j'implémente les optimisations de la **Phase 1** maintenant ?
