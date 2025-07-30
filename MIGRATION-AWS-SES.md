# 🚀 Plan de Migration - AWS SES pour Hosteed

## 📊 Situation actuelle

- ✅ **Gmail** : Fonctionne parfaitement
- ❌ **Outlook/Hotmail** : Bloqué par Microsoft
- ❌ **Emails étudiants** : Bloqué par filtres institutionnels
- **Cause** : Réputation serveur OVH avec Microsoft Exchange

## 🎯 Solution recommandée : AWS SES

### Avantages AWS SES :

- ✅ **Excellente délivrabilité** (99%+ vers Outlook)
- ✅ **Réputation établie** avec tous les providers
- ✅ **Prix avantageux** (€0.10 pour 1000 emails)
- ✅ **Monitoring avancé** (bounces, complaints, etc.)
- ✅ **Configuration SPF/DKIM automatique**

## 📋 Plan de migration étape par étape

### Phase 1 : Configuration AWS SES (30 min)

1. Créer compte AWS SES
2. Vérifier le domaine `skillsnotation.fr`
3. Configurer les enregistrements DNS
4. Sortir du mode sandbox

### Phase 2 : Adaptation du code (1h)

1. Installer AWS SDK : `npm install @aws-sdk/client-ses`
2. Créer service email AWS SES
3. Adapter les templates existants
4. Tester la migration

### Phase 3 : Déploiement (30 min)

1. Variables d'environnement AWS
2. Test en production
3. Migration complète

## 💰 Coût estimé

- **AWS SES** : €0.10 / 1000 emails
- **Hosteed actuel** : ~100 emails/jour = €3/mois
- **Économie** : Négligeable vs gain de délivrabilité

## 🔧 Implémentation technique

### 1. Service AWS SES

```typescript
// lib/services/aws-ses.service.ts
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'eu-west-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function sendEmailSES(params: {
  to: string
  subject: string
  html: string
  from?: string
}) {
  const command = new SendEmailCommand({
    Source: params.from || process.env.AWS_SES_FROM_EMAIL,
    Destination: {
      ToAddresses: [params.to],
    },
    Message: {
      Subject: {
        Data: params.subject,
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: params.html,
          Charset: 'UTF-8',
        },
      },
    },
  })

  return await sesClient.send(command)
}
```

### 2. Variables d'environnement

```env
# AWS SES Configuration
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_SES_FROM_EMAIL=contact@skillsnotation.fr
```

### 3. Migration progressive

```typescript
// Option pour basculer entre OVH et AWS SES
const USE_AWS_SES = process.env.USE_AWS_SES === 'true'

export async function sendEmail(params) {
  if (USE_AWS_SES) {
    return await sendEmailSES(params)
  } else {
    return await sendEmailOVH(params) // Actuel
  }
}
```

## 🧪 Tests de validation

1. **Test Gmail** : `node test-aws-ses.js email@gmail.com`
2. **Test Outlook** : `node test-aws-ses.js email@outlook.com`
3. **Test Epitech** : `node test-aws-ses.js email@epitech.eu`

## ⚡ Alternatives rapides (si AWS SES pas possible)

### Option A : SendGrid

- Configuration similaire à AWS SES
- €14.95/mois pour 40k emails
- Excellente délivrabilité

### Option B : Microsoft Graph API

- Natif pour Outlook/Exchange
- Parfait pour emails étudiants
- Plus complexe à implémenter

### Option C : Amélioration OVH

1. Configurer SPF sur skillsnotation.fr
2. Activer DKIM chez OVH
3. Ajouter DMARC
4. Demander délisting auprès de Microsoft

## 🎯 Recommandation finale

**AWS SES** est la solution optimale pour Hosteed :

- Résout le problème Outlook/Epitech
- Coût négligeable
- Implémentation rapide
- Monitoring professionnel

Souhaitez-vous que je prépare la migration AWS SES ?
