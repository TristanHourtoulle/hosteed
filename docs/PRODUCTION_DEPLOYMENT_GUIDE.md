# 🚀 Guide de Déploiement Production - Migration des Images

Ce guide décrit **étape par étape** toutes les commandes à exécuter sur le VPS de production pour migrer les images de base64 vers le système de fichiers WebP.

---

## 📋 Prérequis

### Sur Votre Machine Locale

- [ ] ✅ Tests end-to-end réussis (voir `docs/END_TO_END_TEST_RESULTS.md`)
- [ ] ✅ Code committé et pushé sur Git
- [ ] ✅ Accès SSH au VPS

### Sur le VPS

- [ ] Connexion SSH active
- [ ] Droits sudo si nécessaire
- [ ] Application Hosteed installée et fonctionnelle
- [ ] PM2 configuré

---

## 🔐 Étape 1: Connexion au VPS

```bash
# Depuis votre machine locale
ssh user@51.222.87.54

# Ou avec clé SSH
ssh -i ~/.ssh/your_key user@51.222.87.54

# Vérifier que vous êtes bien sur le VPS
hostname  # Devrait afficher le nom du VPS
```

---

## 📂 Étape 2: Navigation vers le Projet

```bash
# Aller dans le répertoire de l'application
cd /var/www/hosteed
# OU
cd ~/hosteed
# OU selon votre installation

# Vérifier que c'est le bon répertoire
ls -la
# Vous devriez voir: package.json, src/, prisma/, etc.

# Vérifier la branche Git
git branch
# Devrait afficher: * main (ou production)
```

---

## 🔄 Étape 3: Mettre à Jour le Code

```bash
# Récupérer les dernières modifications depuis Git
git fetch origin

# Voir ce qui va être mis à jour
git log HEAD..origin/main --oneline

# Mettre à jour (si vous êtes sur main)
git pull origin main

# Si vous avez des modifications locales non committées
git stash  # Sauvegarder temporairement
git pull origin main
git stash pop  # Restaurer vos modifications
```

---

## 📦 Étape 4: Installer les Dépendances

```bash
# Installer les nouvelles dépendances (si nécessaire)
pnpm install

# Vérifier que sharp est bien installé (crucial pour les images)
pnpm list sharp
# Devrait afficher: sharp 0.34.3 (ou version similaire)

# Générer le client Prisma
pnpm prisma generate
```

---

## 💾 Étape 5: Backup de la Base de Données (CRUCIAL)

```bash
# Créer un dossier pour les backups
mkdir -p ~/backups

# Backup complet de la base de données
# ATTENTION: Remplacez les valeurs entre crochets
pg_dump postgresql://USER:PASSWORD@HOST:5432/DATABASE > ~/backups/backup_pre_migration_$(date +%Y%m%d_%H%M%S).sql

# Exemple concret:
pg_dump postgresql://hosteeddatabase:jc8zC5gKJkkn4qL@51.222.87.54:5432/hosteeddb > ~/backups/backup_pre_migration_$(date +%Y%m%d_%H%M%S).sql

# Vérifier que le backup a été créé
ls -lh ~/backups/
# Devrait afficher un fichier .sql de plusieurs MB

# Compresser le backup pour économiser de l'espace
gzip ~/backups/backup_pre_migration_*.sql

# Le fichier devient: backup_pre_migration_20251010_120000.sql.gz
```

**⚠️ IMPORTANT**: Ne continuez PAS sans avoir vérifié que le backup existe et a une taille > 0 !

---

## 📊 Étape 6: Vérifier l'État Actuel

```bash
# Vérifier combien d'images base64 vous avez
pnpm prisma studio
# Ouvrir dans le navigateur, aller dans la table Images
# Compter les images qui commencent par "data:image"

# OU via SQL direct:
PGPASSWORD=YOUR_PASSWORD psql -h 51.222.87.54 -U hosteeddatabase -d hosteeddb -c "
SELECT
  COUNT(*) as total_images,
  COUNT(CASE WHEN img LIKE 'data:image%' THEN 1 END) as base64_images,
  COUNT(CASE WHEN img LIKE 'http%' THEN 1 END) as url_images,
  COUNT(CASE WHEN img LIKE '/uploads/%' THEN 1 END) as already_migrated
FROM \"Images\";
"

# Vérifier l'espace disque disponible
df -h
# Assurez-vous d'avoir au moins 5-10 GB de libre
```

---

## 🧪 Étape 7: Test en Dry-Run (SANS modification)

```bash
# Test avec 10 produits (simulation uniquement)
pnpm images:migrate:preview

# Lire attentivement la sortie
# Devrait afficher:
# - Nombre de produits trouvés
# - Liste des produits qui seraient migrés
# - "Run without --dry-run to actually migrate"

# Si tout semble OK, continuer
```

---

## 🚀 Étape 8: Migration Progressive (RECOMMANDÉ)

### 8.1 Première Vague: 10 Produits

```bash
# Migrer 10 produits
pnpm images:migrate --limit 10 --force

# Le script va:
# 1. Demander confirmation (tapez: yes)
# 2. Demander double confirmation (tapez: yes)
# 3. Migrer 10 produits
# 4. Afficher un résumé

# Attendre la fin (environ 30 secondes)
```

**Vérifications immédiates**:

```bash
# 1. Vérifier que les fichiers ont été créés
ls -lh public/uploads/products/ | head -20

# 2. Compter les fichiers générés
find public/uploads/products/ -name "*.webp" | wc -l
# Devrait être = (nombre d'images) × 3

# 3. Vérifier la base de données
PGPASSWORD=YOUR_PASSWORD psql -h 51.222.87.54 -U hosteeddatabase -d hosteeddb -c "
SELECT COUNT(*) FROM \"Images\" WHERE img LIKE '/uploads/%';
"
# Devrait afficher le nombre d'images migrées

# 4. Tester sur le site
curl -I https://votre-domaine.com/uploads/products/[un-id]/img_0_thumb_*.webp
# Devrait retourner: HTTP/1.1 200 OK
```

### 8.2 Tester sur le Site

```bash
# Redémarrer l'application (si nécessaire)
pm2 restart hosteed

# Attendre quelques secondes
sleep 5

# Vérifier les logs
pm2 logs hosteed --lines 50

# Tester une page produit
curl -I https://votre-domaine.com/host
# HTTP/1.1 200 OK (pas d'erreur 500)

# Tester l'API thumbnail
curl -I https://votre-domaine.com/api/products/[id]/thumbnail
# HTTP/1.1 200 OK
```

**⚠️ Si tout fonctionne, continuer. Sinon, voir section "Rollback"**

### 8.3 Deuxième Vague: 50 Produits

```bash
# Migrer 50 produits supplémentaires
pnpm images:migrate --limit 50 --force

# Confirmer 2 fois (yes + yes)

# Attendre la fin (environ 2-3 minutes)

# Vérifier à nouveau
find public/uploads/products/ -name "*.webp" | wc -l
```

### 8.4 Troisième Vague: 100 Produits

```bash
# Migrer 100 produits supplémentaires
pnpm images:migrate --limit 100 --force

# Attendre la fin (environ 5-10 minutes)

# Vérifier l'espace disque
df -h
```

### 8.5 Migration Complète: Tous les Restants

```bash
# Migrer TOUS les produits restants
pnpm images:migrate --force

# ⚠️ ATTENTION: Cela peut prendre plusieurs heures si vous avez beaucoup d'images
# Il est recommandé d'utiliser screen ou tmux pour éviter les déconnexions

# Avec screen (recommandé):
screen -S migration
pnpm images:migrate --force
# Tapez Ctrl+A puis D pour détacher
# Pour réattacher: screen -r migration

# Avec tmux:
tmux new -s migration
pnpm images:migrate --force
# Tapez Ctrl+B puis D pour détacher
# Pour réattacher: tmux attach -t migration

# Attendre la fin complète (peut prendre 1-3 heures)
```

---

## ✅ Étape 9: Vérification Post-Migration

### 9.1 Vérifier les Fichiers

```bash
# Compter tous les fichiers WebP créés
find public/uploads/products/ -name "*.webp" | wc -l

# Voir la taille totale du dossier uploads
du -sh public/uploads/

# Lister quelques fichiers pour vérifier
ls -lh public/uploads/products/*/img_0_thumb_*.webp | head -10

# Vérifier qu'il n'y a pas de fichiers vides
find public/uploads/ -name "*.webp" -size 0
# Ne devrait rien retourner
```

### 9.2 Vérifier la Base de Données

```bash
# Statistiques complètes
PGPASSWORD=YOUR_PASSWORD psql -h 51.222.87.54 -U hosteeddatabase -d hosteeddb -c "
SELECT
  COUNT(*) as total_images,
  COUNT(CASE WHEN img LIKE 'data:image%' THEN 1 END) as base64_remaining,
  COUNT(CASE WHEN img LIKE '/uploads/%' THEN 1 END) as migrated,
  COUNT(CASE WHEN img LIKE 'http%' THEN 1 END) as urls
FROM \"Images\";
"

# Résultat attendu:
# total_images | base64_remaining | migrated | urls
# -------------|------------------|----------|-----
#      500     |        0         |   496    |  4

# Si base64_remaining > 0, voir quels produits n'ont pas été migrés:
PGPASSWORD=YOUR_PASSWORD psql -h 51.222.87.54 -U hosteeddatabase -d hosteeddb -c "
SELECT p.id, p.name, COUNT(i.id) as base64_images
FROM \"Product\" p
JOIN \"_ImagesToProduct\" ip ON p.id = ip.\"B\"
JOIN \"Images\" i ON i.id = ip.\"A\"
WHERE i.img LIKE 'data:image%'
GROUP BY p.id, p.name;
"
```

### 9.3 Tester le Site en Production

**Pages à vérifier**:

```bash
# Page d'accueil
curl -I https://votre-domaine.com/
# HTTP/1.1 200 OK

# Page de recherche
curl -I https://votre-domaine.com/host
# HTTP/1.1 200 OK

# Page produit (remplacer [id] par un vrai ID)
curl -I https://votre-domaine.com/host/[id]
# HTTP/1.1 200 OK

# API search
curl https://votre-domaine.com/api/products/search?limit=6 | jq '.products | length'
# Devrait retourner: 6

# API thumbnail
curl -I https://votre-domaine.com/api/products/[id]/thumbnail
# HTTP/1.1 200 OK
# Content-Type: image/webp
```

**Test manuel dans le navigateur**:

1. Ouvrir `https://votre-domaine.com/host`
2. Vérifier que les images s'affichent
3. Ouvrir DevTools → Network
4. Recharger la page
5. Vérifier:
   - ✅ Images en WebP (Content-Type: image/webp)
   - ✅ Taille ~10-15 KB pour les thumbnails
   - ✅ Cache-Control actif
   - ✅ Rechargement instantané (cache fonctionne)

### 9.4 Vérifier les Logs

```bash
# Logs de l'application
pm2 logs hosteed --lines 100

# Chercher des erreurs
pm2 logs hosteed --err

# Si vous voyez des erreurs 404 sur les images, vérifier les permissions
ls -la public/uploads/
# Devrait être: drwxr-xr-x (755)

# Corriger si nécessaire
chmod -R 755 public/uploads/
```

---

## 📈 Étape 10: Monitoring Post-Migration

### Premier Jour

```bash
# Toutes les heures, vérifier:

# 1. Espace disque
df -h

# 2. Logs d'erreur
pm2 logs hosteed --err --lines 50

# 3. Nombre de requêtes 404
# (si vous avez nginx/apache, vérifier les logs)
tail -f /var/log/nginx/access.log | grep 404 | grep uploads
```

### Première Semaine

```bash
# Une fois par jour:

# Vérifier la taille du dossier uploads
du -sh public/uploads/

# Vérifier qu'il n'y a pas de fichiers corrompus
find public/uploads/ -name "*.webp" -size 0

# Statistiques de cache
# (si Redis activé)
pnpm cache:metrics
```

---

## 🔄 Étape 11: Rollback (En Cas de Problème)

### Si les Images ne s'Affichent Pas

```bash
# 1. Vérifier les permissions
chmod -R 755 public/uploads/

# 2. Redémarrer l'application
pm2 restart hosteed

# 3. Vérifier les logs
pm2 logs hosteed --lines 100

# 4. Tester une image directement
curl -I https://votre-domaine.com/uploads/products/[id]/img_0_thumb_*.webp
```

### Si le Site Est Cassé (Dernier Recours)

```bash
# ⚠️ ATTENTION: Ceci va restaurer la base de données à l'état d'avant la migration

# 1. Arrêter l'application
pm2 stop hosteed

# 2. Restaurer le backup
gunzip ~/backups/backup_pre_migration_*.sql.gz
psql postgresql://USER:PASSWORD@HOST:5432/DATABASE < ~/backups/backup_pre_migration_*.sql

# Exemple:
psql postgresql://hosteeddatabase:jc8zC5gKJkkn4qL@51.222.87.54:5432/hosteeddb < ~/backups/backup_pre_migration_20251010_120000.sql

# 3. Supprimer les fichiers migrés (optionnel)
rm -rf public/uploads/products/

# 4. Redémarrer l'application
pm2 restart hosteed

# 5. Vérifier que le site fonctionne
curl -I https://votre-domaine.com/
```

---

## 🧹 Étape 12: Nettoyage (Après Validation)

**⚠️ Uniquement après 1-2 semaines de fonctionnement stable !**

### Supprimer les Anciennes Données Base64 (Optionnel)

Les anciennes données base64 restent dans la DB mais ne sont plus utilisées. Vous pouvez les garder comme backup ou les supprimer pour réduire la taille de la DB.

```bash
# AVANT DE FAIRE CECI:
# 1. Créer un nouveau backup
pg_dump postgresql://USER:PASSWORD@HOST:5432/DATABASE > ~/backups/backup_post_migration_$(date +%Y%m%d_%H%M%S).sql

# 2. Vérifier que tout fonctionne depuis au moins 2 semaines

# 3. Supprimer les données base64 (IRRÉVERSIBLE!)
PGPASSWORD=YOUR_PASSWORD psql -h 51.222.87.54 -U hosteeddatabase -d hosteeddb -c "
-- Ceci remplace les base64 par une référence vide
-- Les URLs /uploads/ restent intactes
UPDATE \"Images\"
SET img = ''
WHERE img LIKE 'data:image%';
"

# 4. Vérifier la réduction de taille DB
# Avant: ~500 MB
# Après: ~50 MB (-90%)

# 5. Vacuum la DB pour récupérer l'espace
PGPASSWORD=YOUR_PASSWORD psql -h 51.222.87.54 -U hosteeddatabase -d hosteeddb -c "VACUUM FULL ANALYZE \"Images\";"
```

### Configurer les Backups Automatiques

```bash
# Créer un script de backup quotidien
cat > ~/backup_uploads.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=~/backups/uploads
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d)

# Backup du dossier uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C /var/www/hosteed/public uploads/

# Garder seulement les 7 derniers jours
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +7 -delete
EOF

chmod +x ~/backup_uploads.sh

# Ajouter au crontab (exécution quotidienne à 2h du matin)
crontab -e
# Ajouter cette ligne:
0 2 * * * ~/backup_uploads.sh
```

---

## 📊 Résumé des Commandes Essentielles

### Commandes Clés sur le VPS

```bash
# 1. Aller dans le projet
cd /var/www/hosteed

# 2. Mettre à jour le code
git pull origin main

# 3. Installer les dépendances
pnpm install && pnpm prisma generate

# 4. Backup de la DB
pg_dump postgresql://USER:PASSWORD@HOST:5432/DATABASE > ~/backups/backup_$(date +%Y%m%d_%H%M%S).sql

# 5. Test dry-run
pnpm images:migrate:preview

# 6. Migration progressive
pnpm images:migrate --limit 10 --force   # Première vague
pnpm images:migrate --limit 50 --force   # Deuxième vague
pnpm images:migrate --force              # Complet

# 7. Vérifications
find public/uploads/products/ -name "*.webp" | wc -l
df -h
pm2 logs hosteed

# 8. Redémarrer si nécessaire
pm2 restart hosteed
```

### Commandes de Vérification

```bash
# Statistiques DB
PGPASSWORD=PASSWORD psql -h HOST -U USER -d DB -c "
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN img LIKE '/uploads/%' THEN 1 END) as migrated
FROM \"Images\";
"

# Tester une image
curl -I https://votre-domaine.com/uploads/products/[id]/img_0_thumb_*.webp

# Logs en temps réel
pm2 logs hosteed --lines 50

# Espace disque
df -h
du -sh public/uploads/
```

---

## 🎯 Checklist Complète

### Avant la Migration

- [ ] Code mis à jour sur le VPS (git pull)
- [ ] Dépendances installées (pnpm install)
- [ ] Backup DB créé et vérifié
- [ ] Espace disque suffisant (5-10 GB)
- [ ] Test dry-run réussi

### Pendant la Migration

- [ ] Migration par lots (10 → 50 → 100 → tous)
- [ ] Vérification après chaque lot
- [ ] Logs surveillés (pm2 logs)
- [ ] Site testé entre chaque lot

### Après la Migration

- [ ] Toutes les images migrées (base64_remaining = 0)
- [ ] Fichiers WebP créés et accessibles
- [ ] Site fonctionne correctement
- [ ] Performances améliorées (vérifier temps de chargement)
- [ ] Pas d'erreurs dans les logs
- [ ] Cache navigateur fonctionne

### Après 1-2 Semaines

- [ ] Aucun problème remonté
- [ ] Performances stables
- [ ] Optionnel: Nettoyer les base64 en DB
- [ ] Optionnel: Configurer backups automatiques
- [ ] Supprimer les anciens backups (garder le dernier)

---

## 🆘 Support et Dépannage

### En Cas de Problème

1. **Consulter les logs**:
   ```bash
   pm2 logs hosteed --lines 200
   ```

2. **Vérifier les permissions**:
   ```bash
   ls -la public/uploads/
   chmod -R 755 public/uploads/
   ```

3. **Redémarrer l'app**:
   ```bash
   pm2 restart hosteed
   ```

4. **Rollback** (voir Étape 11)

### Contacts

- **Documentation**: Voir `/docs` dans le projet
- **Logs complets**: `/var/log/pm2/hosteed-*.log`

---

**Dernière mise à jour**: 2025-10-10
**Version**: 1.0.0

🎉 **Bonne migration !**
