# Système de Retrait - Documentation d'Implémentation

## 📋 Vue d'ensemble

Système complet de gestion des retraits pour les hôtes, permettant aux admins et HOST_MANAGER d'effectuer des demandes de retrait pour le compte des hôtes.

## ✅ Ce qui a été complété

### 1. Base de données (✅ Terminé)

**Modèles Prisma créés:**
- `PaymentAccount` - Comptes de paiement enregistrés
- `WithdrawalRequest` - Demandes de retrait
- `WithdrawalType` - Enum (PARTIAL_50, FULL_100)
- `WithdrawalStatus` - Enum (PENDING, ACCOUNT_VALIDATION, APPROVED, PAID, REJECTED, CANCELLED)
- `PaymentMethod` - Étendu avec PRIPEO, MOBILE_MONEY, MONEYGRAM

**Migrations:**
```bash
✅ pnpm prisma db push
✅ pnpm prisma generate
```

### 2. Service métier (✅ Terminé)

**Fichier:** `/src/lib/services/withdrawal.service.ts`

**Fonctions implémentées:**
- `calculateHostBalance()` - Calcul du solde disponible
- `createPaymentAccount()` - Création compte de paiement
- `getPaymentAccounts()` - Liste des comptes
- `setDefaultPaymentAccount()` - Définir compte par défaut
- `validatePaymentAccount()` - Validation admin
- `deletePaymentAccount()` - Suppression compte
- `createWithdrawalRequest()` - Créer demande de retrait
- `getWithdrawalRequests()` - Liste des demandes (host)
- `getAllWithdrawalRequests()` - Liste des demandes (admin)
- `approveWithdrawalRequest()` - Approuver demande
- `rejectWithdrawalRequest()` - Rejeter demande
- `markWithdrawalAsPaid()` - Marquer comme payé
- `cancelWithdrawalRequest()` - Annuler demande
- `getWithdrawalStats()` - Statistiques

### 3. Tests (✅ Terminé)

**Fichier:** `/src/lib/services/__tests__/withdrawal.service.test.ts`

**Tests couverts:**
- Calcul de solde
- CRUD comptes de paiement
- Validation des données
- Workflow de retrait
- Gestion des erreurs

### 4. API Routes (🔄 Partiellement complété)

**Complété:**
- `GET /api/withdrawals/balance` - Récupérer le solde

**À créer:**
- `/api/withdrawals/payment-accounts`
  - GET - Liste des comptes
  - POST - Créer un compte
  - PUT /:id - Mettre à jour
  - DELETE /:id - Supprimer

- `/api/withdrawals/requests`
  - GET - Liste des demandes
  - POST - Créer une demande

- `/api/admin/withdrawals`
  - GET - Liste toutes les demandes (admin)
  - PUT /:id/approve - Approuver
  - PUT /:id/reject - Rejeter
  - PUT /:id/mark-paid - Marquer payé
  - PUT /:id/validate-account - Valider compte

## 🚧 Ce qui reste à faire

### 1. API Routes (Routes manquantes)

#### A. Routes Host - Payment Accounts
```typescript
// /src/app/api/withdrawals/payment-accounts/route.ts
GET    - Liste des comptes de paiement du host connecté
POST   - Créer un nouveau compte de paiement

// /src/app/api/withdrawals/payment-accounts/[id]/route.ts
PUT    - Mettre à jour un compte
DELETE - Supprimer un compte
PUT /set-default - Définir comme compte par défaut
```

#### B. Routes Host - Withdrawal Requests
```typescript
// /src/app/api/withdrawals/requests/route.ts
GET  - Liste des demandes du host
POST - Créer une nouvelle demande

// /src/app/api/withdrawals/requests/[id]/route.ts
GET    - Détails d'une demande
PUT    - Annuler une demande (CANCELLED)
```

#### C. Routes Admin
```typescript
// /src/app/api/admin/withdrawals/route.ts
GET - Liste de toutes les demandes (filtres par statut)

// /src/app/api/admin/withdrawals/[id]/approve/route.ts
PUT - Approuver une demande

// /src/app/api/admin/withdrawals/[id]/reject/route.ts
PUT - Rejeter une demande

// /src/app/api/admin/withdrawals/[id]/mark-paid/route.ts
PUT - Marquer comme payé

// /src/app/api/admin/withdrawals/payment-accounts/[id]/validate/route.ts
PUT - Valider un compte de paiement
```

### 2. Interface Host Dashboard

#### A. Page principale de retrait
**Fichier:** `/src/app/dashboard/host/withdrawals/page.tsx`

**Composants nécessaires:**
1. `BalanceCard` - Affichage du solde
   - Montant total disponible
   - Montant disponible à 50%
   - Montant disponible à 100%
   - Montant en attente

2. `PaymentAccountSelector` - Sélection/ajout compte
   - Liste déroulante des comptes
   - Bouton "Ajouter un nouveau compte"
   - Indicateur de validation

3. `WithdrawalRequestForm` - Formulaire de demande
   - Choix 50% ou 100%
   - Montant à retirer
   - Sélection du moyen de paiement
   - Notes optionnelles
   - Prévisualisation

4. `WithdrawalHistory` - Historique des demandes
   - Tableau avec statuts
   - Filtres
   - Actions (annuler si pending)

#### B. Modale d'ajout de compte de paiement
**Composant:** `AddPaymentAccountModal`

**Formulaires par méthode:**
1. **SEPA**
   - Nom du titulaire
   - IBAN
   - Checkbox "Enregistrer pour les prochaines fois"

2. **Pripeo**
   - Nom du titulaire
   - Numéro de carte
   - Email
   - Note: Frais de 1,50€
   - Checkbox "Enregistrer"

3. **Mobile Money**
   - Nom associé
   - Numéro (+261 XX XX XXX XX)
   - Checkbox "Enregistrer"

4. **PayPal**
   - Nom d'utilisateur
   - Email
   - Téléphone (avec code pays)
   - IBAN (optionnel)
   - Note: Frais possibles
   - Checkbox "Enregistrer"

5. **MoneyGram**
   - Nom complet
   - Numéro (+261 XX XX XXX XX)
   - Checkbox "Enregistrer"

### 3. Interface Admin

#### A. Page de gestion des retraits
**Fichier:** `/src/app/admin/withdrawals/page.tsx`

**Composants:**
1. `WithdrawalRequestsTable` - Tableau des demandes
   - Colonnes:
     - Hôte (nom, email)
     - Montant
     - Méthode de paiement
     - Statut
     - Date de demande
     - Actions
   - Filtres:
     - Par statut
     - Par méthode de paiement
     - Par date
     - Par hôte

2. `WithdrawalDetailsModal` - Détails d'une demande
   - Informations hôte
   - Montant détaillé
   - Méthode de paiement choisie
   - Détails du compte (IBAN, etc.)
   - Checkbox "Compte/numéro validé" ✅
   - Notes admin
   - Actions:
     - Valider le compte
     - Approuver
     - Rejeter
     - Marquer comme payé

3. `StatsCards` - Cartes de statistiques
   - Total en attente
   - Total traité ce mois
   - Nombre de demandes en attente
   - Taux d'approbation

### 4. Système de notifications par email

**Fichier:** `/src/lib/services/withdrawal-email.service.ts`

**Emails à implémenter:**
1. **Demande créée** (vers hôte)
   - Confirmation de réception
   - Montant demandé
   - Méthode de paiement
   - Délai de traitement estimé

2. **Compte à valider** (vers admin)
   - Nouvelle demande nécessitant validation
   - Lien direct vers l'admin

3. **Compte validé** (vers hôte)
   - Compte approuvé
   - Prochaines étapes

4. **Demande approuvée** (vers hôte)
   - Demande approuvée
   - Paiement effectif sous 1 jour ouvré

5. **Paiement effectué** (vers hôte)
   - Confirmation de paiement
   - Nouveau solde
   - Détails de la transaction

6. **Demande rejetée** (vers hôte)
   - Raison du refus
   - Actions recommandées

### 5. Fonctionnalités avancées

#### A. Pour les admins/HOST_MANAGER
Permettre de faire une demande de retrait pour un hôte:
- Sélectionner l'hôte
- Voir son solde
- Créer la demande pour lui
- Notification automatique à l'hôte

#### B. Gestion des frais
- Pripeo: +1,50€ automatique
- PayPal: Note sur les frais possibles
- Calcul automatique dans le formulaire

#### C. Export et rapports
- Export CSV des demandes
- Rapport mensuel des retraits
- Statistiques par méthode de paiement

## 📝 Exemple de code pour les routes manquantes

### Route: Create Payment Account

```typescript
// /src/app/api/withdrawals/payment-accounts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createPaymentAccount, getPaymentAccounts } from '@/lib/services/withdrawal.service'
import { PaymentMethod } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const accounts = await getPaymentAccounts(session.user.id)
    return NextResponse.json(accounts)
  } catch (error) {
    console.error('Error getting payment accounts:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des comptes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const account = await createPaymentAccount(session.user.id, body)

    return NextResponse.json(account, { status: 201 })
  } catch (error: any) {
    console.error('Error creating payment account:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du compte' },
      { status: 400 }
    )
  }
}
```

### Route: Create Withdrawal Request

```typescript
// /src/app/api/withdrawals/requests/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createWithdrawalRequest, getWithdrawalRequests } from '@/lib/services/withdrawal.service'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const url = new URL(request.url)
    const status = url.searchParams.get('status')

    const requests = await getWithdrawalRequests(session.user.id, {
      status: status as any,
    })

    return NextResponse.json(requests)
  } catch (error) {
    console.error('Error getting withdrawal requests:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des demandes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const withdrawalRequest = await createWithdrawalRequest({
      ...body,
      userId: session.user.id,
    })

    // TODO: Envoyer email de confirmation
    // await sendWithdrawalRequestCreatedEmail(withdrawalRequest)

    return NextResponse.json(withdrawalRequest, { status: 201 })
  } catch (error: any) {
    console.error('Error creating withdrawal request:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création de la demande' },
      { status: 400 }
    )
  }
}
```

## 🧪 Lancer les tests

```bash
# Tous les tests
pnpm test

# Tests du service de retrait uniquement
pnpm test withdrawal.service.test

# Tests en mode watch
pnpm test:watch
```

## 🚀 Prochaines étapes recommandées

1. **Créer toutes les routes API manquantes** (voir section 1 ci-dessus)
2. **Implémenter l'interface host** (dashboard/host/withdrawals)
3. **Implémenter l'interface admin** (admin/withdrawals)
4. **Ajouter le système d'emails** (withdrawal-email.service.ts)
5. **Tester end-to-end le workflow complet**
6. **Ajouter des validations côté client** (Zod schemas)
7. **Implémenter l'historique des transactions**
8. **Ajouter des rapports et exports**

## 📚 Documentation des statuts

### Statuts de WithdrawalRequest
- `PENDING` - En attente de traitement admin
- `ACCOUNT_VALIDATION` - En attente de validation du compte de paiement
- `APPROVED` - Approuvée, en attente de paiement
- `PAID` - Payée et terminée
- `REJECTED` - Refusée par l'admin
- `CANCELLED` - Annulée par l'hôte

### Workflow typique
1. Hôte crée demande → `ACCOUNT_VALIDATION` ou `PENDING`
2. Admin valide compte → `PENDING`
3. Admin approuve → `APPROVED`
4. Admin marque payé → `PAID`
5. Hôte reçoit email → Solde mis à jour

## 🔒 Sécurité

- Toutes les routes nécessitent une authentification
- Validation des rôles (HOST, HOST_MANAGER, ADMIN)
- Validation des montants (ne peut pas dépasser le solde)
- Validation des comptes avant retrait
- Audit trail complet (processedBy, processedAt, etc.)

## 💡 Notes importantes

1. **Frais Pripeo**: Ajouter automatiquement 1,50€ au montant si méthode = PRIPEO
2. **Format Mobile Money**: Valider le format +261 XX XX XXX XX
3. **Jours ouvrés**: Le paiement est effectif sous 1 jour ouvré (hors week-end et jours fériés)
4. **Checkbox validation**: Admin doit cocher "Compte/numéro validé" avant d'approuver
5. **Double validation**: Compte ET demande doivent être validés

## 📞 Support

Pour toute question sur l'implémentation, référez-vous aux fichiers suivants:
- Service: `/src/lib/services/withdrawal.service.ts`
- Tests: `/src/lib/services/__tests__/withdrawal.service.test.ts`
- Schema: `/prisma/schema.prisma`
- Route exemple: `/src/app/api/withdrawals/balance/route.ts`
