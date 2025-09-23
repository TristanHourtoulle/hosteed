# 🚀 Roadmap Performance Hosteed

Ce document décrit les étapes restantes pour optimiser les performances de l'application Hosteed et atteindre des temps de chargement sous 1 seconde.

## ✅ **DÉJÀ RÉALISÉ**

- ✅ Admin validation : 100→20 produits, mode léger
- ✅ Services avec limites (50 max)
- ✅ Product service optimisé (10 images max)
- ✅ Index de base de données critiques
- ✅ Cache headers optimisés
- ✅ Filtrage côté serveur

**Résultat attendu** : Admin validation 10s → 2-3s (-75%)

---

## 🔥 **PHASE 2 : React Performance (Semaine 1)**

### **A. Composants React avec React.memo**

#### 🎯 **Priorité CRITIQUE**
```typescript
// src/components/host/ProductCard.tsx
const ProductCard = React.memo(({ product, onFavoriteToggle }: ProductCardProps) => {
  // Component logic
})

// src/components/admin/ProductItem.tsx
const ProductItem = React.memo(({ product, onUpdate }: ProductItemProps) => {
  // Component logic
})

// src/components/ui/SearchResultItem.tsx
const SearchResultItem = React.memo(({ result }: SearchResultItemProps) => {
  // Component logic
})
```

#### 📂 **Fichiers à optimiser**
- `src/components/host/SearchResults.tsx` (liste de produits)
- `src/components/admin/ValidationTabs.tsx` (liste admin)
- `src/components/ui/ProductGrid.tsx` (grille de produits)
- `src/components/host/FilterSidebar.tsx` (filtres)

### **B. Hooks optimisés avec useMemo/useCallback**

#### 🎯 **useProductSearchPaginated optimisations**
```typescript
// src/hooks/useProductSearchPaginated.ts
const searchParams_backend = useMemo(() => ({
  page: currentPage,
  limit: itemsPerPage,
  // ... autres params
}), [currentPage, itemsPerPage, searchTerm, selectedType]) // ✅ Dependencies optimisées

const handleSearch = useCallback((term: string) => {
  setSearchTerm(term)
  setCurrentPage(1)
}, []) // ✅ Stable function reference
```

#### 📂 **Hooks à optimiser**
- `src/hooks/useProductSearchPaginated.ts`
- `src/hooks/useProductSearch.ts` 
- `src/hooks/useFavorites.ts`
- `src/hooks/useReservations.ts`

### **C. State management optimisé**

#### 🎯 **Context providers avec sélecteurs**
```typescript
// src/contexts/SearchContext.tsx
const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState(initialState)
  
  const selectProducts = useCallback((state: SearchState) => state.products, [])
  const selectFilters = useCallback((state: SearchState) => state.filters, [])
  
  return (
    <SearchContext.Provider value={{ state, selectProducts, selectFilters }}>
      {children}
    </SearchContext.Provider>
  )
}
```

**Gain attendu** : -50% re-renders, pages 30% plus rapides

---

## 🎨 **PHASE 3 : Code Splitting & Bundle Size (Semaine 2)**

### **A. Lazy Loading des gros composants**

#### 🎯 **Components gigantesques (2000+ lignes)**
```typescript
// src/app/createProduct/page.tsx (2186 lignes)
const CreateProductPage = lazy(() => import('./CreateProductForm'))
const ProductSteps = lazy(() => import('./ProductSteps'))
const ImageUploader = lazy(() => import('./ImageUploader'))

export default function CreateProduct() {
  return (
    <Suspense fallback={<CreateProductSkeleton />}>
      <CreateProductPage />
    </Suspense>
  )
}
```

#### 📂 **Fichiers à splitter**
- `src/app/createProduct/page.tsx` (2186 lignes) → 5-6 composants
- `src/app/dashboard/host/edit/[id]/page.tsx` (2186 lignes)
- `src/app/admin/validation/[id]/components/ProductEditForm.tsx` (1860 lignes)

### **B. Dynamic imports pour les librairies lourdes**

#### 🎯 **Charts et éditeurs**
```typescript
// src/components/admin/StatsCharts.tsx
const ChartComponent = dynamic(() => import('recharts').then(mod => ({ default: mod.LineChart })), {
  loading: () => <ChartSkeleton />,
  ssr: false
})

// src/components/ui/RichTextEditor.tsx  
const Editor = dynamic(() => import('@tiptap/react'), {
  loading: () => <EditorSkeleton />,
  ssr: false
})
```

### **C. Images optimisées avec Next.js Image**

#### 🎯 **Remplacer les img par Image**
```typescript
// Avant
<img src={`data:image/jpeg;base64,${product.img[0]?.img}`} />

// Après (avec placeholder optimisé)
<Image
  src={`data:image/jpeg;base64,${product.img[0]?.img}`}
  alt={product.name}
  width={300}
  height={200}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
  loading="lazy"
/>
```

**Gain attendu** : Bundle size 3.2MB → 1.5MB (-50%)

---

## ⚡ **PHASE 4 : API Performance Avancée (Semaine 3)**

### **A. Cache Redis pour requêtes populaires**

#### 🎯 **Cache middleware**
```typescript
// src/lib/cache/redis-cache.ts
import { Redis } from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300 // 5 minutes
): Promise<T> {
  const cached = await redis.get(key)
  if (cached) return JSON.parse(cached)
  
  const data = await fetcher()
  await redis.setex(key, ttl, JSON.stringify(data))
  return data
}

// Usage dans API routes
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cacheKey = `search:${searchParams.toString()}`
  
  const result = await withCache(cacheKey, async () => {
    return await prisma.product.findMany(/* ... */)
  }, 300) // 5 minutes cache
  
  return NextResponse.json(result)
}
```

#### 📂 **APIs à cacher**
- `/api/products/search` (5 min)
- `/api/admin/products` (2 min)
- `/api/admin/users` (10 min)
- Static data (typeRent, equipments, etc.) (1 heure)

### **B. Database query optimizations**

#### 🎯 **Pagination avec cursors**
```typescript
// src/lib/services/product.service.ts
export async function findProductsPaginated({
  cursor,
  take = 20,
  ...filters
}: PaginationOptions) {
  const products = await prisma.product.findMany({
    take: take + 1, // +1 pour savoir s'il y a une page suivante
    ...(cursor && { cursor: { id: cursor } }),
    where: buildWhereClause(filters),
    orderBy: { id: 'desc' }
  })
  
  const hasNext = products.length > take
  if (hasNext) products.pop()
  
  return {
    products,
    hasNext,
    nextCursor: hasNext ? products[products.length - 1].id : null
  }
}
```

#### 🎯 **Requêtes optimisées avec select précis**
```typescript
// Au lieu de include massif
const products = await prisma.product.findMany({
  select: {
    id: true,
    name: true,
    basePrice: true,
    address: true,
    validate: true,
    img: {
      take: 1,
      select: { id: true, img: true }
    },
    user: {
      select: { id: true, name: true, email: true }
    }
    // ❌ Pas de relations lourdes par défaut
  }
})
```

### **C. GraphQL-style field selection**

#### 🎯 **API avec sélecteur de champs**
```typescript
// /api/products/search?fields=id,name,price,img
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const fields = searchParams.get('fields')?.split(',') || ['id', 'name']
  
  const select = buildSelectFromFields(fields)
  const products = await prisma.product.findMany({ select })
  
  return NextResponse.json(products)
}
```

**Gain attendu** : APIs 2x plus rapides, cache hit 80%

---

## 🎭 **PHASE 5 : UX Optimizations (Semaine 4)**

### **A. Skeletons et Loading States**

#### 🎯 **Composants de chargement réalistes**
```typescript
// src/components/ui/ProductCardSkeleton.tsx
export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-300 h-48 w-full rounded-lg mb-4" />
      <div className="bg-gray-300 h-4 w-3/4 rounded mb-2" />
      <div className="bg-gray-300 h-4 w-1/2 rounded" />
    </div>
  )
}

// Usage
{loading ? (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {Array.from({ length: 9 }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
) : (
  <ProductGrid products={products} />
)}
```

### **B. Intersection Observer pour lazy loading**

#### 🎯 **Images et composants lazy**
```typescript
// src/hooks/useIntersectionObserver.ts
export function useIntersectionObserver(
  ref: RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    }, options)
    
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [ref, options])
  
  return isIntersecting
}

// Usage dans ProductCard
const ProductCard = ({ product }: { product: Product }) => {
  const ref = useRef<HTMLDivElement>(null)
  const isVisible = useIntersectionObserver(ref, { threshold: 0.1 })
  
  return (
    <div ref={ref}>
      {isVisible ? (
        <Image src={product.img[0]?.img} alt={product.name} />
      ) : (
        <div className="bg-gray-200 h-48 w-full" />
      )}
    </div>
  )
}
```

### **C. Virtual scrolling pour longues listes**

#### 🎯 **Listes virtualisées**
```typescript
// src/components/admin/VirtualizedProductList.tsx
import { FixedSizeList as List } from 'react-window'

const ProductList = ({ products }: { products: Product[] }) => {
  const Row = ({ index, style }: { index: number; style: CSSProperties }) => (
    <div style={style}>
      <ProductItem product={products[index]} />
    </div>
  )
  
  return (
    <List
      height={600}
      itemCount={products.length}
      itemSize={120}
      width="100%"
    >
      {Row}
    </List>
  )
}
```

**Gain attendu** : UX plus fluide, perceived performance +40%

---

## 📊 **PHASE 6 : Monitoring & Analytics (Semaine 5)**

### **A. Performance monitoring**

#### 🎯 **Web Vitals tracking**
```typescript
// src/lib/analytics/performance.ts
export function trackWebVitals(metric: Metric) {
  switch (metric.name) {
    case 'FCP':
    case 'LCP':
    case 'CLS':
    case 'FID':
    case 'TTFB':
      // Send to analytics service
      analytics.track('web_vital', {
        name: metric.name,
        value: metric.value,
        page: window.location.pathname
      })
      break
  }
}

// src/app/layout.tsx
export default function RootLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    reportWebVitals(trackWebVitals)
  }, [])
  
  return <html>{children}</html>
}
```

### **B. API response time monitoring**

#### 🎯 **Middleware de timing**
```typescript
// src/middleware/performance.ts
export function withPerformanceTracking(handler: Function) {
  return async (req: Request) => {
    const start = Date.now()
    const response = await handler(req)
    const duration = Date.now() - start
    
    // Log slow queries
    if (duration > 1000) {
      console.warn(`Slow API: ${req.url} took ${duration}ms`)
    }
    
    response.headers.set('X-Response-Time', `${duration}ms`)
    return response
  }
}
```

### **C. Database query analysis**

#### 🎯 **Prisma query logging**
```typescript
// src/lib/prisma.ts
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'info', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
    { level: 'error', emit: 'stdout' },
  ],
})

prisma.$on('query', (e) => {
  if (e.duration > 1000) {
    console.warn(`Slow query: ${e.query} took ${e.duration}ms`)
  }
})
```

---

## 🎯 **OBJECTIFS DE PERFORMANCE**

### **Métriques cibles**

| **Page** | **Actuel** | **Objectif** | **Gain** |
|----------|------------|--------------|----------|
| **Home** | 3s | **< 1s** | 70% |
| **Search** | 2.5s | **< 0.8s** | 68% |
| **Admin** | 10s | **< 2s** | 80% |
| **Product** | 4s | **< 1.5s** | 62% |

### **Core Web Vitals**

- **LCP (Largest Contentful Paint)** : < 2.5s
- **FID (First Input Delay)** : < 100ms  
- **CLS (Cumulative Layout Shift)** : < 0.1
- **TTFB (Time to First Byte)** : < 600ms

---

## 📋 **PLANNING DE MISE EN ŒUVRE**

### **Semaine 1 - React Performance**
- [ ] Ajouter React.memo aux composants de liste (2j)
- [ ] Optimiser les hooks avec useMemo/useCallback (2j)
- [ ] Implémenter le state management optimisé (1j)

### **Semaine 2 - Bundle Optimization**  
- [ ] Code splitting des gros composants (3j)
- [ ] Dynamic imports des librairies (1j)
- [ ] Optimisation des images avec Next.js Image (1j)

### **Semaine 3 - API Performance**
- [ ] Setup Redis cache (1j)
- [ ] Optimiser les requêtes DB avec select précis (2j)
- [ ] Implémenter la pagination par cursors (1j)
- [ ] API field selection (1j)

### **Semaine 4 - UX Optimizations**
- [ ] Créer les skeletons (1j)
- [ ] Intersection Observer lazy loading (2j)
- [ ] Virtual scrolling pour listes longues (2j)

### **Semaine 5 - Monitoring**
- [ ] Web Vitals tracking (1j)
- [ ] API performance monitoring (1j)
- [ ] Database query analysis (1j)
- [ ] Performance dashboard (2j)

---

## 🚀 **QUICK WINS (Peut être fait aujourd'hui)**

### **1. React.memo sur ProductCard (30 min)**
```bash
# src/components/host/ProductCard.tsx
export default React.memo(ProductCard)
```

### **2. Image lazy loading (1h)**
```bash
# Remplacer <img> par <Image loading="lazy">
```

### **3. API cache headers (15 min)**
```bash
# Ajouter Cache-Control à toutes les APIs statiques
```

### **4. Bundle analysis (30 min)**
```bash
npm install --save-dev @next/bundle-analyzer
# Analyser la taille des bundles
```

---

## 📈 **IMPACT BUSINESS ATTENDU**

- **Taux de conversion** : +15-20% (pages plus rapides)
- **SEO Score** : +25 points (Core Web Vitals)
- **Satisfaction utilisateur** : +30% (UX plus fluide)
- **Coûts serveur** : -40% (cache efficace)
- **Mobile performance** : +50% (bundle plus léger)

---

**💡 Conseil** : Commencez par les Quick Wins, puis suivez les phases dans l'ordre. Mesurez l'impact après chaque phase !