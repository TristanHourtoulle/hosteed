# Guide d'Optimisation des Performances - Hosteed

## Vue d'ensemble des optimisations implémentées

### 1. Système de Cache Global avec React Query (TanStack Query)

#### Installation et Configuration
```bash
pnpm add @tanstack/react-query @tanstack/react-query-devtools
```

#### Fichiers créés :
- `/src/lib/cache/query-client.ts` - Configuration du client React Query avec tags de cache
- `/src/components/providers/query-provider.tsx` - Provider React Query
- `/src/lib/cache/server-cache.ts` - Cache côté serveur avec Next.js
- `/src/lib/cache/prefetch.ts` - Utilitaires de prefetching
- `/src/lib/cache/preload.ts` - Préchargement des données statiques

### 2. Optimisations des Appels API

#### Problèmes identifiés et résolus :

##### ❌ Problème N+1 dans les réservations
**Avant :** La page des réservations faisait un appel API pour chaque produit
```typescript
// MAUVAIS - N+1 queries
const rentsWithProducts = await Promise.all(
  userRents.map(async rent => {
    const product = await findProductById(rent.productId)
    return { ...rent, product }
  })
)
```

**Après :** Une seule requête avec JOIN
```typescript
// BON - Single query with includes
const rents = await prisma.rent.findMany({
  where: { userId },
  include: {
    product: {
      include: { img: true, user: true }
    },
    options: true,
    Review: true
  }
})
```

##### ❌ Appels API redondants pour les données statiques
**Avant :** Chaque composant chargeait les équipements, services, etc.
**Après :** Cache de 24h pour les données statiques avec React Query

##### ❌ Multiples requêtes dans getUserData
**Avant :** 4 requêtes séparées pour les statistiques utilisateur
**Après :** Une seule requête optimisée avec aggregations

### 3. Hooks Optimisés Créés

#### Données Statiques
- `useStaticData.ts` - Hook pour les données qui changent rarement (équipements, services, etc.)
- Cache de 24 heures, invalidation manuelle si nécessaire

#### Recherche de Produits
- `useProductSearchOptimized.ts` - Version optimisée avec React Query
- Utilise `useMemo` pour le filtrage côté client
- Cache les résultats de recherche

#### Favoris
- `useFavoritesOptimized.ts` - Gestion optimisée des favoris
- Optimistic updates pour une UI réactive
- Endpoint bulk pour vérifier plusieurs favoris

#### Réservations
- `useReservations.ts` - Hook pour les réservations avec cache
- Inclut les statistiques utilisateur

### 4. Services Optimisés

#### `/src/lib/services/rents-optimized.service.ts`
- `findAllRentsByUserIdWithProducts()` - Récupère tout en une requête
- `getUserRentStatistics()` - Statistiques agrégées en parallèle
- `getBulkRentsWithProducts()` - Récupération en masse

### 5. Cache Côté Serveur

#### Utilisation de `unstable_cache` de Next.js
```typescript
export const cachedFindAllProducts = unstable_cache(
  async () => findAllProducts(),
  ['all-products'],
  {
    revalidate: 60 * 5, // 5 minutes
    tags: ['products'],
  }
)
```

### 6. Stratégies de Cache par Type de Données

| Type de Données | Durée du Cache | Stratégie d'Invalidation |
|----------------|----------------|--------------------------|
| Données statiques (équipements, etc.) | 24 heures | Invalidation manuelle |
| Produits | 5 minutes | Invalidation sur modification |
| Favoris | 5 minutes | Invalidation sur toggle |
| Réservations | 2 minutes | Invalidation sur changement |
| Statistiques utilisateur | 10 minutes | Invalidation sur action |
| Validation admin | 1 minute | Temps réel critique |

### 7. Optimisations du Chargement des Pages

#### Server-Side Rendering avec Prefetching
```typescript
// Page serveur avec prefetch
export default async function OptimizedSearchPage() {
  const dehydratedState = await prefetchSearchPage()
  
  return (
    <HydrationBoundary state={dehydratedState}>
      <SearchPageClient />
    </HydrationBoundary>
  )
}
```

#### Suspense pour le Streaming
- Utilisation de Suspense pour afficher le contenu progressivement
- Skeletons de chargement pour une meilleure UX

### 8. Endpoints API Optimisés

#### `/api/favorites/bulk` - Vérification en masse des favoris
- Réduit les appels de N à 1 pour une liste de produits

### 9. Invalidation de Cache Intelligente

#### Tags de Cache Structurés
```typescript
export const CACHE_TAGS = {
  user: (id: string) => ['user', id],
  products: ['products'],
  product: (id: string) => ['product', id],
  favorites: (userId: string) => ['favorites', userId],
  // etc...
}
```

#### Invalidation Ciblée
```typescript
// Invalider seulement les données affectées
await invalidateCacheTags([
  CACHE_TAGS.favorites(userId),
  CACHE_TAGS.product(productId)
])
```

## ✅ Invalidation Automatique du Cache

### Le cache s'invalide automatiquement !

**Côté serveur :** Toutes les fonctions de mutation dans les services (create, update, delete) invalident automatiquement le cache Next.js approprié.

**Côté client :** Utilisez les hooks avec invalidation automatique.

## Comment Utiliser les Optimisations

### 1. Pour les Nouvelles Pages

Utilisez toujours les hooks optimisés :
```typescript
import { useProductSearchOptimized } from '@/hooks/useProductSearchOptimized'
import { useFavoritesOptimized } from '@/hooks/useFavoritesOptimized'
```

### 2. Pour les Données Statiques avec Mutations

```typescript
import { useEquipments, useCreateEquipment } from '@/hooks/useEquipments'

function EquipmentManager() {
  const { data: equipments, isLoading } = useEquipments()
  const { mutate: createEquipment } = useCreateEquipment()
  
  const handleCreate = () => {
    createEquipment({ name: 'Nouveau', icon: 'icon.svg' })
    // ✅ Le cache s'invalide automatiquement !
    // ✅ La liste se met à jour instantanément !
  }
  
  return (
    <div>
      {equipments?.map(equipment => (
        <div key={equipment.id}>{equipment.name}</div>
      ))}
      <button onClick={handleCreate}>Créer</button>
    </div>
  )
}
```

### 3. Pour les Pages avec SSR

```typescript
// Dans app/[page]/page.tsx
import { prefetchPageData } from '@/lib/cache/prefetch'

export default async function Page() {
  const dehydratedState = await prefetchPageData([
    () => queryClient.prefetchQuery(...)
  ])
  
  return (
    <HydrationBoundary state={dehydratedState}>
      <ClientComponent />
    </HydrationBoundary>
  )
}
```

### 4. Pour les Mutations Personnalisées

```typescript
import { useMutationWithCache } from '@/hooks/useMutationWithCache'

// Exemple : créer un produit avec invalidation automatique
function useCreateProduct() {
  return useMutationWithCache(
    (productData) => createProduct(productData),
    {
      invalidate: { 
        products: true,        // Invalide tous les produits
        staticData: true       // Invalide toutes les données statiques
      },
      successMessage: 'Produit créé avec succès !',
      errorMessage: 'Erreur lors de la création'
    }
  )
}
```

### 5. Invalidation Manuelle (si nécessaire)

```typescript
import { invalidateClientCache } from '@/lib/cache/client-invalidation'

// Invalider manuellement si besoin
await invalidateClientCache.products(productId)
await invalidateClientCache.staticData('equipments')
await invalidateClientCache.favorites(userId)
```

## Migration Progressive

### Phase 1 : Pages Critiques (Complété ✅)
- [x] Page de recherche
- [x] Page des réservations
- [x] Système de favoris
- [x] Données utilisateur

### Phase 2 : À Faire
- [ ] Remplacer `useProductSearch` par `useProductSearchOptimized` partout
- [ ] Remplacer `useFavorites` par `useFavoritesOptimized` partout
- [ ] Migrer la page des réservations vers la version optimisée
- [ ] Implémenter SSR avec prefetch sur toutes les pages publiques

### Phase 3 : Optimisations Avancées
- [ ] Implémenter la pagination côté serveur
- [ ] Ajouter un CDN pour les images
- [ ] Implémenter le lazy loading des images
- [ ] Optimiser les bundles JavaScript

## Mesure des Performances

### Métriques à Surveiller
1. **Time to First Byte (TTFB)** - Devrait être < 200ms
2. **First Contentful Paint (FCP)** - Devrait être < 1.8s
3. **Largest Contentful Paint (LCP)** - Devrait être < 2.5s
4. **Cumulative Layout Shift (CLS)** - Devrait être < 0.1

### Outils de Monitoring
- React Query Devtools (déjà installé en dev)
- Chrome DevTools Performance tab
- Lighthouse
- Next.js Analytics

## Commandes Utiles

```bash
# Vider tout le cache React Query
queryClient.clear()

# Invalider des queries spécifiques
queryClient.invalidateQueries({ queryKey: ['products'] })

# Prefetch des données
queryClient.prefetchQuery({ queryKey, queryFn })

# Voir l'état du cache
// Ouvrir React Query Devtools dans le navigateur (icône en bas)
```

## Points d'Attention

1. **Ne pas sur-cacher** - Les données critiques doivent rester fraîches
2. **Gérer les erreurs** - Toujours avoir un fallback en cas d'échec du cache
3. **Optimistic Updates** - Utiliser avec parcimonie, seulement pour les actions simples
4. **Taille du Cache** - Surveiller la mémoire utilisée par React Query

## Support et Documentation

- [React Query Docs](https://tanstack.com/query/latest)
- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)
- [Prisma Performance](https://www.prisma.io/docs/guides/performance-and-optimization)