# Git Auto-Commit Process

## Description

Script automatisé pour grouper et commiter les modifications par type de changement selon les conventions de commit.

## Utilisation

```bash
# Depuis la racine du projet
./scripts/git-auto-commit.sh
```

## Fonctionnement

### 1. Vérification du Build

```bash
pnpm build
```

- Si le build échoue → arrêt du processus
- Si le build réussit → continue

### 2. Analyse des Changements

```bash
git status --porcelain
```

- Liste tous les fichiers modifiés/non suivis
- Les groupe par type de changement

### 3. Catégorisation Automatique

#### `feat:` - Nouvelles fonctionnalités

- Nouveaux composants (`src/components/ui/*`)
- Nouvelles pages (`src/app/*/page.tsx`)
- Nouveaux hooks (`src/hooks/*`)
- Fichiers ajoutés avec statut `A`

#### `fix:` - Corrections de bugs

- Fichiers contenant "fix", "bug", "error" dans le nom/chemin

#### `refactor:` - Améliorations de code

- Modifications des APIs (`src/app/api/*`)
- Services (`src/lib/services/*`)
- Composants existants modifiés

#### `style:` - Changements visuels

- Fichiers CSS (`*.css`, `*.scss`, `globals.css`)

#### `docs:` - Documentation

- Fichiers Markdown (`*.md`)
- Dossier `docs/*`
- README

#### `test:` - Tests

- Fichiers de test (`*test*`, `*spec*`, `__tests__/*`)

#### `chore:` - Maintenance

- Configuration (`package.json`, `*.config.*`)
- Dépendances (`pnpm-lock.yaml`)
- Variables d'environnement (`.env*`)
- Fichiers temporaires supprimés
- Doublons supprimés

### 4. Création des Commits

Pour chaque type détecté :

```bash
git add <liste_des_fichiers>
git commit -m "type: description claire"
```

### 5. Règles Importantes

- ✅ **Vérifie le build avant de commiter**
- ✅ **Groupe les changements par type logique**
- ✅ **Utilise les conventions de commit**
- ✅ **Messages de commit clairs sans références AI**
- ❌ **Ne fait JAMAIS de push automatique**

## Exemples de Messages

```bash
feat: add Phase 5 UX optimizations with performance improvements
fix: resolve authentication redirect issue
refactor: optimize API routes and improve error handling
style: update button components and color scheme
docs: add Redis caching documentation
test: add unit tests for product service
chore: update dependencies and clean temporary files
```

## Après Utilisation

Le script ne fait **JAMAIS** de push automatique. Pour synchroniser :

```bash
# Vérifier les commits
git log --oneline -5

# Pousser manuellement quand prêt
git push origin main
```

## Personnalisation

Pour modifier les règles de catégorisation, éditer le script dans :

```
scripts/git-auto-commit.sh
```

Les patterns de détection se trouvent dans la section `case "$FILE" in`.
