# 📧 Guide Complet : Configuration Emails OVH pour Hosteed

Ce guide détaille toutes les étapes pour configurer parfaitement les emails avec OVH et résoudre les problèmes de délivrabilité vers Madagascar et autres destinations internationales.

## 🎯 Objectif
Assurer une délivrabilité maximale des emails Hosteed vers tous les fournisseurs (Gmail, Outlook, etc.) dans le monde entier.

---

## 📋 Étape 1 : Configuration DNS (Priorité CRITIQUE)

### 1.1 Accéder à la Gestion DNS OVH
1. Se connecter à l'**espace client OVH**
2. Aller dans **"Web Cloud"** > **"Noms de domaine"**
3. Sélectionner **skillsnotation.fr**
4. Cliquer sur l'onglet **"Zone DNS"**

### 1.2 Configurer DKIM (OBLIGATOIRE)
```bash
# Dans l'espace client OVH :
# 1. Aller dans "Emails" > "Nom de domaine" > skillsnotation.fr
# 2. Onglet "Configuration" > "DKIM"
# 3. Cliquer sur "Activer DKIM"
# 4. Choisir le sélecteur : "ovh"
# 5. Copier la clé publique générée
```

**Enregistrement DNS DKIM à ajouter :**
```dns
Type: TXT
Nom: ovh._domainkey.skillsnotation.fr
Valeur: v=DKIM1; k=rsa; p=[CLÉ_PUBLIQUE_GÉNÉRÉE_PAR_OVH]
TTL: 3600
```

### 1.3 Améliorer SPF (OBLIGATOIRE)
**Enregistrement SPF actuel :**
```dns
Type: TXT
Nom: skillsnotation.fr
Valeur: v=spf1 include:mx.ovh.com -all
```

**Nouveau SPF recommandé :**
```dns
Type: TXT
Nom: skillsnotation.fr
Valeur: v=spf1 include:mx.ovh.com include:_spf.google.com ~all
TTL: 3600
```

### 1.4 Ajouter DMARC (RECOMMANDÉ)
```dns
Type: TXT
Nom: _dmarc.skillsnotation.fr
Valeur: v=DMARC1; p=quarantine; rua=mailto:dmarc@skillsnotation.fr; ruf=mailto:dmarc@skillsnotation.fr; fo=1; adkim=r; aspf=r
TTL: 3600
```

### 1.5 Vérifier MX (Déjà OK)
```dns
Type: MX
Priorité: 1    Nom: mx1.mail.ovh.net
Priorité: 5    Nom: mx2.mail.ovh.net  
Priorité: 100  Nom: mx3.mail.ovh.net
```

---

## ⚙️ Étape 2 : Configuration Variables d'Environnement

### 2.1 Récupérer la Clé DKIM Privée
```bash
# Dans l'espace client OVH, section DKIM :
# 1. Télécharger la clé privée DKIM
# 2. Convertir en format une ligne (remplacer \n par \\n)
```

### 2.2 Ajouter dans .env
```env
# Configuration Email OVH
EMAIL_LOGIN=contact@skillsnotation.fr
EMAIL_PASSWORD=ppffdP)7Ve2gBaM

# Clé DKIM (NOUVELLE)
DKIM_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKC...\n-----END RSA PRIVATE KEY-----

# URL de base
NEXTAUTH_URL=https://hosteed.fr
```

---

## 🔧 Étape 3 : Tests et Validation

### 3.1 Tester la Configuration DNS
```bash
# Test SPF
nslookup -type=TXT skillsnotation.fr

# Test DKIM
nslookup -type=TXT ovh._domainkey.skillsnotation.fr

# Test DMARC
nslookup -type=TXT _dmarc.skillsnotation.fr

# Test MX
nslookup -type=MX skillsnotation.fr
```

### 3.2 Vérifier la Connectivité SMTP
```bash
# Test connexion serveur OVH
nc -z ssl0.ovh.net 465
```

### 3.3 Test d'Envoi
```bash
# Lancer le serveur de développement
pnpm dev

# Tester l'envoi d'un email depuis l'application
# Vérifier les logs pour s'assurer qu'aucune erreur n'apparaît
```

---

## 🛠️ Étape 4 : Optimisations Avancées

### 4.1 Configuration Reverse DNS (Optionnel)
Si vous avez un serveur dédié :
```bash
# Demander à OVH de configurer le PTR record
# Pour pointer vers skillsnotation.fr
```

### 4.2 Monitoring et Logs
```javascript
// Ajouter dans email.service.ts pour debug
transport.on('log', console.log);
transport.on('error', console.error);
```

### 4.3 Liste de Désabonnement
```javascript
// Déjà ajouté dans le code modifié
headers: {
  'List-Unsubscribe': '<mailto:unsubscribe@skillsnotation.fr>',
  'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
}
```

---

## 📊 Étape 5 : Surveillance et Maintenance

### 5.1 Outils de Test Recommandés
- **Mail-tester.com** : Test complet de délivrabilité
- **MXToolbox** : Vérification DNS et blacklists
- **DMARC Analyzer** : Monitoring DMARC

### 5.2 Métriques à Surveiller
- Taux de bounces
- Taux d'ouverture
- Plaintes spam
- Réputation IP/domaine

### 5.3 Actions Préventives
```bash
# Vérifier périodiquement les blacklists
curl -s "https://multirbl.valli.org/lookup/skillsnotation.fr.html"

# Surveiller les rapports DMARC
# Les rapports arriveront à dmarc@skillsnotation.fr
```

---

## ⚠️ Problèmes Courants et Solutions

### Problème 1 : Emails en Spam
**Solution :** 
- Vérifier DKIM activé
- Contrôler contenu des emails (éviter mots déclencheurs)
- Augmenter progressivement le volume d'envoi

### Problème 2 : Rejet par Gmail
**Solution :**
- S'assurer que DMARC est configuré
- Vérifier que l'IP n'est pas blacklistée
- Utiliser un nom d'expéditeur cohérent

### Problème 3 : Problème Géographique (Madagascar)
**Solution :**
- Configurer tous les enregistrements DNS
- Demander à OVH une IP dédiée si possible
- Contacter les FAI malgaches pour déblocage

---

## 🎯 Checklist de Validation Finale

### ✅ Avant Production
- [ ] DKIM activé et testé
- [ ] SPF mis à jour
- [ ] DMARC configuré
- [ ] Variables d'environnement ajoutées
- [ ] Test d'envoi réussi vers Gmail
- [ ] Test d'envoi réussi vers Outlook
- [ ] Test spécifique vers Madagascar
- [ ] Monitoring mis en place

### ✅ Après Déploiement
- [ ] Surveillance des bounces
- [ ] Vérification mail-tester.com (score > 8/10)
- [ ] Contrôle blacklists
- [ ] Rapports DMARC analysés

---

## 📞 Support et Escalade

### Si les Problèmes Persistent
1. **Contacter le Support OVH** avec ce guide
2. **Demander une IP dédiée** pour l'envoi d'emails
3. **Analyser les logs** des serveurs destinataires
4. **Considérer un service SMTP spécialisé** temporairement

---

## ⏱️ Délais d'Application

- **DNS (SPF/DKIM/DMARC) :** 24-48h de propagation
- **Réputation IP :** 1-2 semaines d'amélioration
- **Délivrabilité optimale :** 2-4 semaines

---

*Ce guide garantit une configuration optimale des emails OVH pour Hosteed. Suivre chaque étape dans l'ordre pour une délivrabilité maximale.*