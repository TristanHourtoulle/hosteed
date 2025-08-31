# Guide d'optimisation pour déploiement VPS - Next.js + Prisma + PostgreSQL

Ce guide détaille les étapes pour optimiser les performances d'une application Next.js déployée sur VPS.

## Problème identifié

- **Local** : 1-2 secondes de chargement, cache instantané
- **VPS** : Plus de 30 secondes de chargement
- **Cause probable** : Configuration non optimisée pour la production

## 1. Configuration Next.js de production

### Vérification du build
```bash
# ❌ Ne jamais utiliser en production
pnpm dev

# ✅ Utiliser en production
pnpm build
pnpm start
```

### Configuration next.config.ts
Le fichier est déjà optimisé avec :
- `output: 'standalone'` pour les builds autonomes
- Configuration des images distantes
- Limite de 10MB pour les server actions

## 2. Configuration PM2 optimisée

### Créer ecosystem.config.js
```javascript
module.exports = {
  apps: [{
    name: 'hosteed',
    script: 'pnpm',
    args: 'start',
    instances: 'max', // Utilise tous les CPU disponibles
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
}
```

### Commandes PM2
```bash
# Démarrer avec la config
pm2 start ecosystem.config.js

# Monitoring
pm2 monit
pm2 logs hosteed
pm2 status
```

## 3. Optimisation PostgreSQL

### Configuration postgresql.conf
```bash
sudo nano /etc/postgresql/*/main/postgresql.conf
```

```ini
# Ajustez selon votre RAM VPS
shared_buffers = 256MB              # 25% de la RAM
effective_cache_size = 1GB          # 75% de la RAM
work_mem = 4MB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
max_connections = 100

# Optimisations supplémentaires
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

### Variables d'environnement DB
```env
# Optimiser la pool de connexions
DATABASE_URL="postgresql://user:password@localhost:5432/hosteed?connection_limit=20&pool_timeout=20&schema_disable_advisory_lock=true"
```

### Index manquants à ajouter dans schema.prisma
```prisma
model Product {
  // Ajouter ces index pour les requêtes fréquentes
  @@index([status])
  @@index([userId])
  @@index([createdAt])
  @@index([typeRentId])
}

model Rent {
  @@index([status])
  @@index([userId])
  @@index([productId])
  @@index([startDate, endDate])
}

model User {
  @@index([email])
  @@index([role])
}
```

Après modification :
```bash
pnpm prisma db push
```

## 4. Système de cache (déjà implémenté)

Le projet utilise déjà `unstable_cache` de Next.js :
- Cache produits : 5 minutes
- Cache données statiques : 24 heures  
- Cache utilisateur : 10 minutes

### Configuration cache avancée
Ajouter Redis pour un cache distribué :
```bash
# Installation Redis sur VPS
sudo apt install redis-server
```

## 5. Configuration Nginx (Reverse Proxy)

### Installation
```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/hosteed
```

### Configuration
```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    
    # Compression Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # Cache des assets statiques
    location /_next/static {
        alias /var/www/hosteed/.next/static;
        expires 365d;
        access_log off;
        add_header Cache-Control "public, immutable";
    }
    
    location /images {
        alias /var/www/hosteed/public/images;
        expires 30d;
        access_log off;
    }
    
    # Proxy vers l'application Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
}
```

### Activation
```bash
sudo ln -s /etc/nginx/sites-available/hosteed /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 6. Script de déploiement automatisé

### Créer deploy.sh
```bash
#!/bin/bash
# deploy.sh - Script de déploiement automatisé

set -e  # Arrêt en cas d'erreur

# Variables
APP_NAME="hosteed"
APP_DIR="/var/www/hosteed"
BRANCH="main"

echo "🚀 Début du déploiement..."

# Navigation vers le répertoire
cd $APP_DIR

# Sauvegarde PM2
echo "💾 Sauvegarde de la configuration PM2..."
pm2 save

# Arrêt de l'application
echo "⏹️ Arrêt de l'application..."
pm2 stop $APP_NAME || true

# Mise à jour du code
echo "📥 Récupération du code..."
git fetch origin
git reset --hard origin/$BRANCH

# Installation des dépendances
echo "📦 Installation des dépendances..."
pnpm install --frozen-lockfile --production=false

# Build de production
echo "🔨 Build de production..."
pnpm build

# Migrations base de données
echo "🗄️ Mise à jour de la base de données..."
pnpm prisma migrate deploy
pnpm prisma generate

# Redémarrage avec PM2
echo "🔄 Redémarrage de l'application..."
pm2 start ecosystem.config.js || pm2 restart $APP_NAME

# Vérification de l'état
echo "✅ Vérification de l'état..."
pm2 status
pm2 save

echo "🎉 Déploiement terminé avec succès !"
echo "📊 Monitoring disponible avec : pm2 monit"
echo "📋 Logs disponibles avec : pm2 logs $APP_NAME"
```

### Rendre exécutable
```bash
chmod +x deploy.sh
```

## 7. Optimisations Next.js avancées

### Variables d'environnement production
```env
# .env.production
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Optimisations mémoire
NODE_OPTIONS="--max-old-space-size=1024"

# Base de données optimisée
DATABASE_URL="postgresql://user:password@localhost:5432/hosteed?connection_limit=20&pool_timeout=20"
```

### Configuration additionnelle next.config.ts
```typescript
const nextConfig: NextConfig = {
  output: 'standalone',
  
  // Optimisations de performance
  swcMinify: true,
  compress: true,
  
  // Headers de sécurité et performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          }
        ]
      }
    ]
  },
  
  // Optimisation images
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    remotePatterns: [
      // ... patterns existants
    ],
  },
  
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // Optimisations expérimentales
    optimizeCss: true,
    gzipSize: true,
  },
}
```

## 8. Monitoring et diagnostics

### Surveillance des performances
```bash
# Monitoring PM2
pm2 monit

# Logs en temps réel
pm2 logs hosteed --lines 100

# Métriques système
htop
iotop
nethogs

# État de la base de données
sudo -u postgres psql -d hosteed -c "SELECT * FROM pg_stat_activity;"
```

### Script de diagnostic
```bash
#!/bin/bash
# diagnostic.sh

echo "=== DIAGNOSTIC PERFORMANCE ==="
echo
echo "📊 État PM2:"
pm2 status

echo
echo "💾 Utilisation mémoire:"
free -h

echo
echo "💿 Utilisation disque:"
df -h

echo
echo "🔄 Processus CPU:"
top -bn1 | head -20

echo
echo "🌐 Connexions réseau:"
ss -tuln | grep :3000

echo
echo "🗄️ État PostgreSQL:"
sudo systemctl status postgresql

echo
echo "📈 Logs récents de l'application:"
pm2 logs hosteed --lines 10 --nostream
```

## 9. Checklist de déploiement

### ✅ Avant déploiement
- [ ] Build de production testé localement
- [ ] Variables d'environnement configurées
- [ ] Base de données migrée et indexée
- [ ] Configuration PM2 préparée
- [ ] Nginx configuré
- [ ] Script de déploiement testé

### ✅ Après déploiement
- [ ] Application accessible via navigateur
- [ ] Temps de réponse < 3 secondes
- [ ] PM2 monitoring actif
- [ ] Logs sans erreurs critiques
- [ ] SSL configuré (Let's Encrypt)
- [ ] Backup base de données programmé

## 10. Résolution des problèmes courants

### Temps de réponse lent
1. Vérifier si en mode production : `pm2 logs hosteed | grep NODE_ENV`
2. Examiner les requêtes DB lentes : `EXPLAIN ANALYZE` dans psql
3. Vérifier la RAM disponible : `free -h`

### Erreurs 502 Bad Gateway
1. Vérifier l'état PM2 : `pm2 status`
2. Contrôler les logs : `pm2 logs hosteed`
3. Tester la connexion : `curl localhost:3000`

### High Memory Usage
1. Ajuster `max_memory_restart` dans ecosystem.config.js
2. Optimiser les requêtes Prisma
3. Implémenter la pagination

## 11. Sécurisation

### Firewall
```bash
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### SSL avec Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com
```

### Backup automatisé
```bash
# Crontab pour backup quotidien
0 2 * * * pg_dump hosteed > /backup/hosteed_$(date +\%Y\%m\%d).sql
```

---

## Résumé des gains de performance attendus

- **Temps de chargement** : 30s → 1-3s
- **Cache statique** : Instantané après première visite
- **Disponibilité** : 99.9% avec PM2 cluster
- **Scalabilité** : Support multi-CPU automatique

La mise en œuvre de ces optimisations devrait considérablement améliorer les performances de votre application Next.js sur VPS.