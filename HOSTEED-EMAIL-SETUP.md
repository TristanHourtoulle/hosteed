# 📧 Guide Configuration Emails Client OVH pour Hosteed

## 🎯 Objectif
Configurer des emails professionnels **@hosteed.fr** pour remplacer **@skillsnotation.fr** et offrir une expérience client optimale.

---

## 📋 Étape 1 : Acquisition et Configuration du Domaine

### 1.1 Vérifier le Domaine Hosteed.fr
Dans votre espace client OVH > Web Cloud > Noms de domaine, vérifiez si vous possédez **hosteed.fr**.

**Si vous n'avez pas encore hosteed.fr :**
1. **Acheter le domaine hosteed.fr** via OVH (environ 10€/an)
2. **Transférer le domaine** si il est chez un autre registraire

### 1.2 Configurer la Zone DNS pour Hosteed.fr
```dns
# Enregistrements MX pour hosteed.fr
Type: MX
Priorité: 1    Valeur: mx1.mail.ovh.net.
Priorité: 5    Valeur: mx2.mail.ovh.net.
Priorité: 100  Valeur: mx3.mail.ovh.net.
TTL: 3600
```

---

## 📧 Étape 2 : Créer les Comptes Email OVH

### 2.1 Accéder à la Gestion Email OVH
1. Se connecter à l'**espace client OVH**
2. Aller dans **"Web Cloud"** > **"Emails"**
3. Sélectionner ou ajouter **hosteed.fr**
4. Commander une **solution email** (MX Plan ou Email Pro)

### 2.2 Créer les Comptes Email Recommandés
```bash
# Comptes principaux (OBLIGATOIRES)
contact@hosteed.fr          # Email principal (support client)
noreply@hosteed.fr         # Emails automatiques (notifications)
booking@hosteed.fr         # Réservations
host@hosteed.fr           # Communication hôtes

# Comptes optionnels
admin@hosteed.fr          # Administration
support@hosteed.fr        # Support technique
marketing@hosteed.fr      # Newsletters/promotions
security@hosteed.fr       # Notifications de sécurité
dmarc@hosteed.fr         # Rapports DMARC
```

### 2.3 Configuration de Mots de Passe Forts
Générer des mots de passe sécurisés pour chaque compte (minimum 12 caractères avec majuscules, minuscules, chiffres et symboles).

---

## ⚙️ Étape 3 : Configuration DNS Avancée

### 3.1 Enregistrements SPF pour hosteed.fr
```dns
Type: TXT
Nom: hosteed.fr
Valeur: v=spf1 include:mx.ovh.com ~all
TTL: 3600
```

### 3.2 Configuration DKIM pour hosteed.fr
**Dans l'espace client OVH :**
1. Aller dans Emails > hosteed.fr > Configuration > DKIM
2. Activer DKIM avec sélecteur "ovh"
3. Copier la clé publique générée

```dns
Type: TXT
Nom: ovh._domainkey.hosteed.fr
Valeur: v=DKIM1; k=rsa; p=[CLÉ_PUBLIQUE_GÉNÉRÉE_PAR_OVH_POUR_HOSTEED]
TTL: 3600
```

### 3.3 Configuration DMARC pour hosteed.fr
```dns
Type: TXT
Nom: _dmarc.hosteed.fr
Valeur: v=DMARC1; p=quarantine; rua=mailto:dmarc@hosteed.fr; ruf=mailto:dmarc@hosteed.fr; fo=1; adkim=r; aspf=r
TTL: 3600
```

---

## 🔧 Étape 4 : Mise à Jour du Code

### 4.1 Nouvelles Variables d'Environnement (.env)
```env
# ===== NOUVELLE CONFIGURATION EMAIL HOSTEED =====
# Email principal pour l'envoi (remplace skillsnotation)
EMAIL_LOGIN=noreply@hosteed.fr
EMAIL_PASSWORD=[MOT_DE_PASSE_COMPTE_NOREPLY]

# Clé DKIM privée pour hosteed.fr (à récupérer dans OVH)
DKIM_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\n[CLÉ_PRIVÉE_DKIM_HOSTEED]\n-----END RSA PRIVATE KEY-----

# ===== CONFIGURATION EMAIL SPÉCIALISÉE =====
# Email de contact affiché aux clients
HOSTEED_CONTACT_EMAIL=contact@hosteed.fr

# Email pour les réservations
HOSTEED_BOOKING_EMAIL=booking@hosteed.fr

# Email pour les hôtes
HOSTEED_HOST_EMAIL=host@hosteed.fr

# Email pour les notifications admin
HOSTEED_ADMIN_EMAIL=admin@hosteed.fr

# URL de base de production
NEXTAUTH_URL=https://hosteed.fr
NEXT_PUBLIC_BASE_URL=https://hosteed.fr
```

### 4.2 Service Email Amélioré pour Multi-Comptes
```typescript
// src/lib/services/hosteudEmail.service.ts
import nodemailer from 'nodemailer'
import Mail from 'nodemailer/lib/mailer'

export enum EmailType {
  CONTACT = 'contact',
  BOOKING = 'booking',
  HOST = 'host',
  ADMIN = 'admin',
  NOREPLY = 'noreply'
}

const getEmailAddress = (type: EmailType): string => {
  switch (type) {
    case EmailType.CONTACT:
      return process.env.HOSTEED_CONTACT_EMAIL || 'contact@hosteed.fr'
    case EmailType.BOOKING:
      return process.env.HOSTEED_BOOKING_EMAIL || 'booking@hosteed.fr'
    case EmailType.HOST:
      return process.env.HOSTEED_HOST_EMAIL || 'host@hosteed.fr'
    case EmailType.ADMIN:
      return process.env.HOSTEED_ADMIN_EMAIL || 'admin@hosteed.fr'
    case EmailType.NOREPLY:
    default:
      return process.env.EMAIL_LOGIN || 'noreply@hosteed.fr'
  }
}

export async function sendHosteedEmail(
  to: string,
  subject: string,
  content: string,
  type: EmailType = EmailType.NOREPLY,
  isHtml: boolean = false
) {
  const fromEmail = getEmailAddress(type)
  const fromName = getFromName(type)

  const transport = nodemailer.createTransport({
    host: 'ssl0.ovh.net',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_LOGIN,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
    dkim: {
      domainName: 'hosteed.fr',
      keySelector: 'ovh',
      privateKey: process.env.DKIM_PRIVATE_KEY || '',
    },
  } as nodemailer.TransportOptions)

  const mailOptions: Mail.Options = {
    from: `"${fromName}" <${fromEmail}>`,
    replyTo: type === EmailType.NOREPLY ? getEmailAddress(EmailType.CONTACT) : fromEmail,
    to,
    subject: `[Hosteed] ${subject}`,
    [isHtml ? 'html' : 'text']: content,
    headers: {
      'List-Unsubscribe': `<mailto:unsubscribe@hosteed.fr>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      'X-Mailer': 'Hosteed Platform',
    },
  }

  try {
    const info = await transport.sendMail(mailOptions)
    console.log('✅ Email envoyé depuis:', fromEmail, 'vers:', to)
    return info
  } catch (error) {
    console.error('❌ Erreur envoi email depuis:', fromEmail, error)
    throw error
  }
}

function getFromName(type: EmailType): string {
  switch (type) {
    case EmailType.CONTACT:
      return 'Hosteed - Contact'
    case EmailType.BOOKING:
      return 'Hosteed - Réservations'
    case EmailType.HOST:
      return 'Hosteed - Hôtes'
    case EmailType.ADMIN:
      return 'Hosteed - Administration'
    case EmailType.NOREPLY:
    default:
      return 'Hosteed'
  }
}

// Fonctions spécialisées pour chaque type d'email
export const sendContactEmail = (to: string, subject: string, content: string, isHtml = false) =>
  sendHosteedEmail(to, subject, content, EmailType.CONTACT, isHtml)

export const sendBookingEmail = (to: string, subject: string, content: string, isHtml = false) =>
  sendHosteedEmail(to, subject, content, EmailType.BOOKING, isHtml)

export const sendHostEmail = (to: string, subject: string, content: string, isHtml = false) =>
  sendHosteedEmail(to, subject, content, EmailType.HOST, isHtml)

export const sendNotificationEmail = (to: string, subject: string, content: string, isHtml = false) =>
  sendHosteedEmail(to, subject, content, EmailType.NOREPLY, isHtml)
```

### 4.3 Templates Email Personnalisés
```html
<!-- public/templates/emails/welcome-hosteed.html -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Bienvenue chez Hosteed</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">🏠 Hosteed</h1>
        <p style="color: white; margin: 10px 0 0 0;">Votre plateforme de location</p>
    </div>
    
    <div style="padding: 30px; background: #ffffff;">
        <h2 style="color: #333;">Bienvenue {{userName}} !</h2>
        <p>Merci de rejoindre Hosteed, votre nouvelle plateforme de location de confiance.</p>
        
        <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #667eea;">🎯 Prochaines étapes</h3>
            <ul style="color: #666; line-height: 1.6;">
                <li>Vérifiez votre email en cliquant sur le lien ci-dessous</li>
                <li>Complétez votre profil</li>
                <li>Explorez nos hébergements disponibles</li>
            </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{verificationLink}}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; padding: 15px 30px; text-decoration: none; 
                      border-radius: 5px; display: inline-block; font-weight: bold;">
                ✅ Vérifier mon email
            </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #666; font-size: 14px;">
            Des questions ? Contactez-nous à 
            <a href="mailto:contact@hosteed.fr" style="color: #667eea;">contact@hosteed.fr</a>
        </p>
    </div>
    
    <div style="background: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px;">
        <p>© 2024 Hosteed - Plateforme de location</p>
        <p>
            <a href="mailto:unsubscribe@hosteed.fr" style="color: #666;">Se désabonner</a> | 
            <a href="https://hosteed.fr/privacy" style="color: #666;">Politique de confidentialité</a>
        </p>
    </div>
</body>
</html>
```

### 4.4 Migration des Fonctions Existantes
```typescript
// src/lib/services/sendTemplatedMail.ts - VERSION MISE À JOUR
import { sendHosteedEmail, EmailType } from './hostedEmail.service'
import fs from 'fs/promises'
import path from 'path'

export async function sendTemplatedMail(
  to: string,
  subject: string,
  templateName: string,
  variables: Record<string, string | number>,
  emailType: EmailType = EmailType.NOREPLY
) {
  const templatePath = path.join(process.cwd(), 'public/templates/emails', templateName)
  let html = await fs.readFile(templatePath, 'utf-8')
  
  // Remplacer les variables
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\s*${key}\s*}}`, 'g')
    html = html.replace(regex, String(value))
  }
  
  // Utiliser le nouveau service email
  return sendHosteedEmail(to, subject, html, emailType, true)
}
```

---

## 🧪 Étape 5 : Tests et Validation

### 5.1 Tests de Configuration DNS
```bash
# Test MX Records
nslookup -type=MX hosteed.fr

# Test SPF
nslookup -type=TXT hosteed.fr

# Test DKIM
nslookup -type=TXT ovh._domainkey.hosteed.fr

# Test DMARC
nslookup -type=TXT _dmarc.hosteed.fr
```

### 5.2 Test d'Envoi Multi-Comptes
```typescript
// Test script pour vérifier tous les comptes
import { sendContactEmail, sendBookingEmail, sendHostEmail } from './lib/services/hostedEmail.service'

async function testAllEmails() {
  const testEmail = 'votre-test@gmail.com'
  
  try {
    await sendContactEmail(testEmail, 'Test Contact', 'Email de test depuis contact@hosteed.fr')
    await sendBookingEmail(testEmail, 'Test Réservation', 'Email de test depuis booking@hosteed.fr')
    await sendHostEmail(testEmail, 'Test Hôte', 'Email de test depuis host@hosteed.fr')
    
    console.log('✅ Tous les tests d'envoi réussis!')
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error)
  }
}
```

---

## 📊 Étape 6 : Monitoring et Maintenance

### 6.1 Outils de Surveillance
- **mail-tester.com** : Tester la délivrabilité
- **MXToolbox** : Vérifier DNS et blacklists
- **Google Postmaster Tools** : Pour Gmail
- **Microsoft SNDS** : Pour Outlook

### 6.2 Métriques à Surveiller
```typescript
// Ajouter dans vos services email
const emailMetrics = {
  sent: 0,
  delivered: 0,
  bounced: 0,
  complained: 0
}

// Logger les métriques
transport.on('log', (info) => {
  if (info.type === 'message') {
    emailMetrics.sent++
    console.log('Email Stats:', emailMetrics)
  }
})
```

---

## ⚠️ Problèmes Courants et Solutions

### Problème 1 : Comptes Email Non Créés
**Solution :** Vérifier que vous avez une solution email active sur hosteed.fr dans OVH

### Problème 2 : DNS Non Propagé
**Solution :** Attendre 24-48h pour la propagation DNS mondiale

### Problème 3 : DKIM Non Configuré
**Solution :** S'assurer que DKIM est activé pour hosteed.fr dans l'espace OVH

---

## 🎯 Checklist de Migration

### ✅ Avant Migration
- [ ] Domaine hosteed.fr configuré
- [ ] Comptes email créés dans OVH
- [ ] DNS (MX, SPF, DKIM, DMARC) configurés
- [ ] Variables d'environnement mises à jour
- [ ] Code service email déployé
- [ ] Templates email personnalisés

### ✅ Après Migration
- [ ] Tests d'envoi réussis depuis tous les comptes
- [ ] Score mail-tester.com > 8/10
- [ ] Vérification blacklists
- [ ] Monitoring mis en place
- [ ] Documentation équipe mise à jour

---

## 💰 Coûts Estimés

### OVH Email Solutions
- **MX Plan** : Gratuit avec domaine (5 comptes x 5GB)
- **Email Pro** : ~3€/mois/compte (50GB par compte)
- **Exchange** : ~8€/mois/compte (fonctionnalités avancées)

**Recommandation :** MX Plan pour commencer (gratuit et suffisant)

---

## 📞 Support

### En Cas de Problème
1. Vérifier tous les DNS avec les outils en ligne
2. Contacter le support OVH avec ce guide
3. Utiliser les logs de l'application pour débugger
4. Tester avec des emails temporaires différents

---

*Ce guide garantit une migration professionnelle vers les emails @hosteed.fr avec une délivrabilité optimale.*