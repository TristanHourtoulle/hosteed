This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Dans un autre terminal, lancer cette commande

```bash

stripe listen --forward-to localhost:3000/webhook

```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

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
