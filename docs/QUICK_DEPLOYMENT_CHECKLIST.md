# ⚡ Checklist Rapide - Déploiement Production

Guide ultra-condensé pour la migration des images en production.

---

## 🔧 Préparation (5 minutes)

```bash
# 1. SSH sur le VPS
ssh user@51.222.87.54

# 2. Aller dans le projet
cd /var/www/hosteed

# 3. Mettre à jour
git pull origin main
pnpm install
pnpm prisma generate

# 4. Vérifier l'espace disque
df -h
# Besoin: 5-10 GB libre
```

---

## 💾 Backup (10 minutes) - **OBLIGATOIRE**

```bash
# Créer le dossier backup
mkdir -p ~/backups

# Backup complet de la DB
pg_dump postgresql://hosteeddatabase:jc8zC5gKJkkn4qL@51.222.87.54:5432/hosteeddb > ~/backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Vérifier (doit être > 0)
ls -lh ~/backups/
```

**⛔ NE PAS CONTINUER sans backup vérifié !**

---

## 🧪 Test (2 minutes)

```bash
# Test sans modification
pnpm images:migrate:preview

# Vérifier la sortie:
# - Nombre de produits
# - Liste des produits à migrer
```

---

## 🚀 Migration Progressive (30 min - 2h)

### Phase 1: Test avec 10 produits

```bash
pnpm images:migrate --limit 10 --force
# Taper: yes
# Taper: yes

# Vérifier que ça marche
pm2 restart hosteed
curl -I https://votre-domaine.com/host
# HTTP/1.1 200 OK ✅
```

### Phase 2: 50 produits

```bash
pnpm images:migrate --limit 50 --force
# yes + yes
```

### Phase 3: Tous les restants

```bash
# Utiliser screen pour éviter les déconnexions
screen -S migration

pnpm images:migrate --force
# yes + yes

# Détacher: Ctrl+A puis D
# Réattacher plus tard: screen -r migration
```

---

## ✅ Vérifications Post-Migration (5 minutes)

```bash
# 1. Compter les fichiers créés
find public/uploads/products/ -name "*.webp" | wc -l

# 2. Vérifier la DB
PGPASSWORD=jc8zC5gKJkkn4qL psql -h 51.222.87.54 -U hosteeddatabase -d hosteeddb -c "
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN img LIKE '/uploads/%' THEN 1 END) as migrated,
  COUNT(CASE WHEN img LIKE 'data:image%' THEN 1 END) as remaining
FROM \"Images\";
"
# remaining devrait être 0

# 3. Redémarrer l'app
pm2 restart hosteed

# 4. Tester le site
curl -I https://votre-domaine.com/host
curl -I https://votre-domaine.com/api/products/search?limit=6

# 5. Vérifier les logs
pm2 logs hosteed --lines 50
```

---

## 🌐 Test Manuel dans le Navigateur

1. Ouvrir `https://votre-domaine.com/host`
2. Les images doivent s'afficher ✅
3. DevTools → Network → Filtrer "webp"
4. Vérifier:
   - Content-Type: image/webp ✅
   - Taille: 10-15 KB pour thumbnails ✅
   - Cache-Control: public, max-age ✅
   - Rechargement instantané (cache) ✅

---

## 🔄 Rollback (Si Problème)

```bash
# Arrêter l'app
pm2 stop hosteed

# Restaurer le backup
psql postgresql://hosteeddatabase:jc8zC5gKJkkn4qL@51.222.87.54:5432/hosteeddb < ~/backups/backup_*.sql

# Redémarrer
pm2 restart hosteed
```

---

## 📊 Gains Attendus

| Métrique | Avant | Après | Gain |
|----------|-------|-------|------|
| Temps chargement /host | 5s | <1s | **-80%** |
| Taille JSON search (6 produits) | 3 MB | 10 KB | **-99%** |
| Taille thumbnail | 500 KB | 13 KB | **-97%** |
| Charge DB | Élevée | Minimale | **-95%** |
| Cache navigateur | ❌ | ✅ 1 an | ♾️ |

---

## 🆘 Commandes de Debug

```bash
# Logs en temps réel
pm2 logs hosteed

# Erreurs uniquement
pm2 logs hosteed --err

# Permissions fichiers
ls -la public/uploads/
chmod -R 755 public/uploads/

# Espace disque
df -h
du -sh public/uploads/

# Stats DB
PGPASSWORD=jc8zC5gKJkkn4qL psql -h 51.222.87.54 -U hosteeddatabase -d hosteeddb -c "SELECT COUNT(*) FROM \"Images\" WHERE img LIKE '/uploads/%';"
```

---

## ⏱️ Timeline Estimée

| Étape | Durée |
|-------|-------|
| Préparation + Backup | 15 min |
| Test dry-run | 2 min |
| Migration 10 produits | 5 min |
| Vérifications | 5 min |
| Migration 50 produits | 10 min |
| Migration complète | 1-2h |
| Vérifications finales | 10 min |
| **TOTAL** | **2-3h** |

---

## 📋 Checklist Minimaliste

**Avant**:
- [ ] Backup DB créé
- [ ] Espace disque OK (5-10 GB)
- [ ] Code mis à jour

**Pendant**:
- [ ] Migration par lots (10 → 50 → tous)
- [ ] Vérification après chaque lot
- [ ] Site testé

**Après**:
- [ ] remaining = 0 en DB
- [ ] Site fonctionne
- [ ] Images s'affichent
- [ ] Pas d'erreurs dans logs

---

**Temps total**: 2-3 heures
**Risque**: Faible (rollback possible)
**Impact**: Majeur (+80% performance)

🚀 **C'est parti !**
