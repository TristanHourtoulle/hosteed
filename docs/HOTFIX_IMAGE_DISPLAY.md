# 🔥 HOTFIX - Résolution Affichage des Images

## 🐛 Problème

Les images ne s'affichaient pas sur la page `/host` (affichait "Image non disponible, propriété sans photo"), mais fonctionnaient sur `/host/[id]`.

**Erreur** : HTTP 400 sur `/api/products/[id]/thumbnail`

## 🔍 Cause

1. L'API search ne retournait que l'`id` de l'image, **pas** le champ `img` qui contient l'URL
2. Le ProductCard utilisait l'API thumbnail qui fait une redirection
3. Next.js Image optimizer ne supporte **pas** les redirections → 400 Bad Request

## ✅ Solution

**Commit** : `4a9ff1b` - fix: resolve image display issue in product listings

### Changements

1. **API Search** (`src/app/api/products/search/route.ts`)
   - Ajout du champ `img: true` dans le select
   - Les URLs `/uploads/` sont légères (83 bytes vs 500KB base64)

2. **ProductCard** (`src/components/ui/ProductCard.tsx`)
   - Utilise directement l'URL si l'image est migrée (`/uploads/...`)
   - Fallback vers l'API thumbnail uniquement pour images non migrées

## 🚀 Déploiement sur le VPS

```bash
# 1. SSH sur le VPS
ssh user@51.222.87.54

# 2. Aller dans le projet
cd /var/www/hosteed

# 3. Pull les derniers changements
git pull origin main

# 4. Vérifier les commits récents
git log --oneline -5
# Devrait afficher:
# 4a9ff1b fix: resolve image display issue in product listings
# 6bf58d0 chore: add image migration and test scripts to package.json
# de80ff4 docs: add complete image management system documentation
# 7b1b492 perf: optimize product search and image loading
# e106f53 feat: add WebP image management system with migration tools

# 5. Rebuild
pnpm build

# 6. Redémarrer PM2
pm2 restart hosteed

# 7. Vérifier les logs
pm2 logs hosteed --lines 50
```

## ✅ Vérification

```bash
# Test manuel dans le navigateur
# 1. Ouvrir: http://51.222.87.54:3101/host
# 2. Les images doivent s'afficher
# 3. Ouvrir DevTools → Network
# 4. Filtrer par "webp"
# 5. Vérifier:
#    - Status: 200 OK
#    - Content-Type: image/webp
#    - Taille: ~13 KB

# Test API
curl http://51.222.87.54:3101/api/products/search?limit=1 | jq '.products[0].img'
# Devrait retourner:
# [
#   {
#     "id": "...",
#     "img": "/uploads/products/..."  ← URL présente
#   }
# ]
```

## 📊 Impact

- ✅ Images affichées correctement sur `/host`
- ✅ Performance maintenue (~13KB par thumbnail)
- ✅ Backward compatible (images non migrées continuent de fonctionner)

## 🕐 Timeline

- **Détection** : 2025-10-10 après migration production
- **Fix** : 2025-10-10 (même jour)
- **Commit** : 4a9ff1b
- **Déploiement** : Immédiat

---

**Status** : ✅ Résolu
**Temps de résolution** : <1 heure
**Breaking** : Non
