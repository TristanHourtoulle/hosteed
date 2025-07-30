# Hosteed - Plateforme de Location

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 🚀 Installation et Configuration

### Prérequis

- [Node.js](https://nodejs.org/) (version 18+)
- [pnpm](https://pnpm.io/)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- **Base de données** : Docker OU PostgreSQL local

### 1. Installation des dépendances

```bash
git clone <repository-url>
cd hosteed
pnpm install
```

### 2. Configuration de la base de données

#### Option A: Avec Docker (Recommandé)

```bash
# Démarrer Docker Desktop puis :
docker-compose up -d db
```

#### Option B: Avec PostgreSQL local (Homebrew - macOS)

```bash
# Installer PostgreSQL
brew install postgresql@15

# Démarrer PostgreSQL
brew services start postgresql@15

# Ajouter PostgreSQL au PATH
echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Créer la base de données
createdb hosteed
```

### 3. Variables d'environnement

Le fichier `.env` contient déjà les variables nécessaires. Vérifiez la `DATABASE_URL` :

**Pour Docker :**

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hosteed"
```

**Pour PostgreSQL local :**

```env
DATABASE_URL="postgresql://[votre_username]@localhost:5432/hosteed"
```

### 4. Configuration Prisma

```bash
# Générer le client Prisma
pnpm prisma generate

# Synchroniser la base avec le schema
pnpm prisma db push

# Appliquer les migrations
pnpm prisma migrate deploy

# Seeder la base avec des données d'exemple
pnpm run seed
```

### 5. Démarrage de l'application

#### Terminal 1 - Application Next.js

```bash
pnpm dev
```

#### Terminal 2 - Webhook Stripe

```bash
stripe listen --forward-to localhost:3000/webhook
```

### 6. Accès à l'application

- **Application** : [http://localhost:3000](http://localhost:3000)
- **Admin** : [http://localhost:3000/admin](http://localhost:3000/admin)
- **Recherche** : [http://localhost:3000/search](http://localhost:3000/search)

### 7. Données de test

Après le seeding, vous aurez accès à :

**Utilisateurs :**

- `pierre@pierre.pierre` / `password`
- `marie@test.com` / `password`
- `jean@test.com` / `password`

**Contenu :**

- 8 propriétés à Madagascar
- Équipements, services, et options diverses

## 🛠️ Commandes utiles

```bash
# Build production
pnpm build

# Tests
pnpm test

# Linting
pnpm lint

# Reset de la base de données
pnpm prisma db push --force-reset
pnpm run seed

# Voir la base de données
pnpm prisma studio
```

## 🐳 Commandes Docker

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter les services
docker-compose down

# Reset complet
docker-compose down -v
docker-compose up -d
```

## Documentation des Services

### Services de Produits (`product.service.ts`)

#### Endpoints Disponibles

1. **Recherche de Produits**

   - `findProductById(id: string)`: Recherche un produit par son ID
   - `findAllProducts()`: Récupère tous les produits validés
   - `findAllProductByHostId(id: string)`: Récupère tous les produits d'un hôte spécifique
   - `findProductByValidation(validationStatus: ProductValidation)`: Recherche les produits par statut de validation

2. **Gestion des Produits**
   - `createProduct(params)`: Crée un nouveau produit
   - `validateProduct(id: string)`: Valide un produit
   - `rejectProduct(id: string)`: Rejette un produit
   - `resubmitProductWithChange(id: string, params)`: Soumet à nouveau un produit avec des modifications

### Services de Location (`rents.service.ts`)

#### Endpoints Disponibles

1. **Recherche de Locations**

   - `getRentById(id: string)`: Recherche une location par son ID
   - `findAllRentByProduct(id: string)`: Récupère toutes les locations pour un produit spécifique
   - `findAllRentByUserId(id: string)`: Récupère toutes les locations d'un utilisateur
   - `findRentByHostUserId(id: string)`: Récupère toutes les locations gérées par un hôte

2. **Gestion des Locations**
   - `CheckRentIsAvailable(productId: string, arrivalDate: Date, leavingDate: Date)`: Vérifie la disponibilité d'un produit pour des dates données
   - `createRent(params)`: Crée une nouvelle location avec les paramètres suivants:
     - `productId`: ID du produit
     - `userId`: ID de l'utilisateur
     - `arrivingDate`: Date d'arrivée
     - `leavingDate`: Date de départ
     - `peopleNumber`: Nombre de personnes
     - `options`: Options sélectionnées
     - `stripeId`: ID de la transaction Stripe
     - `prices`: Prix total
   - `cancelRent(id: string)`: Annule une location

### Services d'Email (`email.service.ts`)

#### Endpoints Disponibles

1. **Envoi d'Emails**
   - `SendMail(email: string, name: string, message: string, isHtml: boolean = false)`: Envoie un email avec les paramètres suivants:
     - `email`: Adresse email du destinataire
     - `name`: Nom du destinataire
     - `message`: Contenu du message
     - `isHtml`: Indique si le message est en HTML (optionnel, par défaut: false)

### Services d'Utilisateurs (`user.service.ts`)

#### Endpoints Disponibles

1. **Recherche d'Utilisateurs**

   - `findUserByEmail(email: string)`: Recherche un utilisateur par son email
   - `findAllUserByRoles(roles: UserRole)`: Récupère tous les utilisateurs ayant un rôle spécifique

2. **Gestion des Utilisateurs**
   - `createUser(data)`: Crée un nouvel utilisateur avec les paramètres suivants:
     - `email`: Email de l'utilisateur
     - `password`: Mot de passe (sera hashé)
     - `name`: Nom (optionnel)
     - `lastname`: Prénom (optionnel)
   - `updateUser(id: string, data)`: Met à jour un utilisateur existant
   - `verifyPassword(password: string, hashedPassword: string)`: Vérifie si un mot de passe correspond au hash

### Services de Reviews (`reviews.service.ts`)

#### Endpoints Disponibles

1. **Gestion des Avis**
   - `findAllReviews()`: Récupère tous les avis
   - `createReview(params)`: Crée un nouvel avis avec les paramètres suivants:
     - `productId`: ID du produit
     - `rentId`: ID de la location
     - `userId`: ID de l'utilisateur
     - `grade`: Note (nombre)
     - `title`: Titre de l'avis
     - `text`: Contenu de l'avis
     - `visitingDate`: Date de visite
     - `publishDate`: Date de publication

### Services de Configuration

- `typeRent.service.ts`: Types de location
- `options.service.ts`: Options disponibles
- `services.service.ts`: Services proposés
- `equipments.service.ts`: Équipements disponibles
- `meals.service.ts`: Services de restauration
- `security.services.ts`: Services de sécurité

### Intégration Stripe (`stripe.ts`)

#### Endpoints Disponibles

1. **Gestion des Paiements**

   - `createPaymentIntent(params)`: Crée une intention de paiement avec les paramètres suivants:
     - `amount`: Montant en euros
     - `currency`: Devise (optionnel, par défaut: 'eur')
     - `metadata`: Métadonnées supplémentaires (optionnel)
   - `retrievePaymentIntent(paymentIntentId: string)`: Récupère les détails d'une intention de paiement
   - `RefundPaymentIntent(paymentIntentId: string)`: Effectue un remboursement

2. **Gestion des Sessions de Paiement**
   - `createCheckoutSession(params)`: Crée une session de paiement avec les paramètres suivants:
     - `amount`: Montant en euros
     - `currency`: Devise (optionnel, par défaut: 'eur')
     - `productName`: Nom du produit
     - `successUrl`: URL de redirection en cas de succès
     - `cancelUrl`: URL de redirection en cas d'annulation
     - `metadata`: Métadonnées supplémentaires (optionnel)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
