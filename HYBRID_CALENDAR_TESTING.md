# Guide de Test - Système Hybride de Calendrier

## Vue d'ensemble du système implémenté

Le système hybride de calendrier combine:

1. **Import centralisé** (niveau host): Import un calendrier une fois, mapper les événements aux logements
2. **Export par logement**: Chaque logement peut exporter son propre calendrier ICS

## Architecture

### Backend
- **Schéma Prisma modifié:**
  - `ExternalCalendar` maintenant lié au `User` (pas au `Product`)
  - Nouveau modèle `CalendarEventMapping` pour mapper événements → produits

- **Nouveau service:** `centralized-calendar.service.ts`
  - Gestion des calendriers externes centralisés
  - Synchronisation et parsing des flux iCal
  - Gestion des mappings événements → produits

- **Routes API créées:**
  - `GET/POST /api/calendars` - Liste et création
  - `GET/PUT/DELETE /api/calendars/[id]` - CRUD
  - `POST /api/calendars/[id]/sync` - Synchroniser
  - `GET/POST /api/calendars/[id]/mappings` - Gérer mappings
  - `POST /api/calendars/[id]/apply` - Appliquer mappings

### Frontend
- **Nouvelle page:** `/dashboard/host/calendars` - Gestion centralisée
- **Composants:**
  - `CentralizedCalendarManager` - Liste et gestion des calendriers
  - `EventMappingModal` - Interface de mapping événements → produits
- **Page améliorée:** `/dashboard/host/calendar` - Dropdown de sélection de produit

---

## Tests à effectuer

### Test 1: Gestion des Calendriers Externes Centralisés

#### 1.1 Créer un calendrier externe

1. **Démarrer l'app:**
   ```bash
   pnpm dev
   ```

2. **Accéder à la page:**
   - Connexion: `cathyrasanimaka@gmail.com` / ton mot de passe
   - Va sur `/dashboard/host/calendars` (ou clique sur "Calendriers externes" dans la navbar)

3. **Créer un calendrier:**
   - Clique sur "Ajouter un calendrier"
   - Remplis:
     - Nom: "Test Google Calendar"
     - URL ICS: URL de ton calendrier Google (voir section "Obtenir une URL ICS de test" ci-dessous)
     - Couleur: Choisis une couleur (ex: rouge #FF0000)
     - Description: "Calendrier de test"
   - Clique sur "Ajouter"

**Résultat attendu:**
- Le calendrier apparaît dans la liste
- Le statut est "pending" (horloge grise)
- Toast de confirmation

#### 1.2 Synchroniser le calendrier

1. **Cliquer sur le bouton "Sync" (icône refresh)**

**Résultat attendu:**
- Modal "Mapper les événements" s'ouvre automatiquement
- Les événements du calendrier sont listés
- Le statut passe à "success" (checkmark vert)
- La date de dernière sync est affichée

#### 1.3 Mapper les événements aux produits

Dans le modal de mapping:

1. **Voir la liste des événements** avec leurs dates
2. **Pour chaque événement, sélectionner les logements à bloquer:**
   - Cliquer sur les checkbox des logements concernés
   - OU utiliser les boutons "Tous" / "Aucun"

3. **Cliquer sur "Sauvegarder et Appliquer"**

**Résultat attendu:**
- Toast: "Mappings appliqués! X blocs créés pour Y événements"
- Modal se ferme
- Le nombre d'événements mappés est affiché sur le calendrier

#### 1.4 Vérifier les blocs créés

1. **Va sur `/dashboard/host/calendar`**
2. **Sélectionne un logement dans le dropdown**
3. **Vérifie que les dates des événements externes sont bloquées**

**Vérification en base de données:**
```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d hosteed -c "
SELECT \"startDate\", \"endDate\", title, description
FROM \"UnAvailableProduct\"
WHERE description LIKE '%[SYNC:%'
ORDER BY \"createdAt\" DESC
LIMIT 10;
"
```

---

### Test 2: Sélection de Produit sur le Calendrier

1. **Va sur `/dashboard/host/calendar`**
2. **Utilise le dropdown "Logement:"**
   - Sélectionne "Tous les logements" → Voir toutes les réservations/blocs
   - Sélectionne un logement spécifique → Voir uniquement ses réservations/blocs

3. **Avec un logement sélectionné, les boutons d'export apparaissent:**
   - "Exporter le calendrier"
   - "Importer des calendriers" (ancien système, toujours fonctionnel)

**Résultat attendu:**
- L'URL change: `/dashboard/host/calendar?property=PRODUCT_ID`
- Le calendrier affiche uniquement les données du produit sélectionné
- Les boutons d'export/import sont visibles

---

### Test 3: Export de Calendrier (par logement)

1. **Sur `/dashboard/host/calendar`, sélectionne un logement**
2. **Clique sur "Exporter le calendrier"**
3. **Copie l'URL HTTP**
4. **Teste dans ton navigateur ou avec curl:**

```bash
curl "http://localhost:3000/api/calendar/[PRODUCT_ID]/feed.ics?token=[TOKEN]"
```

**Résultat attendu:**
- Fichier ICS contenant:
  - Les réservations du logement
  - Les blocs d'indisponibilité (y compris ceux créés par les calendriers externes)

---

### Test 4: Modifier un Calendrier Externe

1. **Sur `/dashboard/host/calendars`**
2. **Clique sur l'icône "Edit" (crayon) d'un calendrier**
3. **Modifie le nom, la couleur, ou la description**
4. **Clique sur "Mettre à jour"**

**Résultat attendu:**
- Toast de confirmation
- Changements visibles immédiatement

---

### Test 5: Resynchroniser et Modifier les Mappings

1. **Ajoute des événements dans ton calendrier externe (Google Calendar)**
2. **Sur `/dashboard/host/calendars`, clique sur "Sync"**
3. **Dans le modal, modifie les mappings:**
   - Déselectionne certains logements
   - Sélectionne de nouveaux logements
4. **Clique sur "Sauvegarder et Appliquer"**

**Résultat attendu:**
- Les anciens blocs sont supprimés
- De nouveaux blocs sont créés selon les nouveaux mappings

---

### Test 6: Supprimer un Calendrier Externe

1. **Clique sur l'icône "Delete" (poubelle)**
2. **Confirme la suppression**

**Résultat attendu:**
- Le calendrier disparaît
- Tous ses mappings sont supprimés
- Tous les blocs créés par ce calendrier sont supprimés

**Vérification:**
```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d hosteed -c "
SELECT COUNT(*)
FROM \"UnAvailableProduct\"
WHERE description LIKE '%[SYNC:CALENDAR_ID]%';
"
# Doit retourner 0
```

---

### Test 7: Gestion des Erreurs

#### 7.1 URL ICS invalide

1. **Créer un calendrier avec URL:** `https://example.com/invalid.ics`
2. **Cliquer sur "Sync"**

**Résultat attendu:**
- Toast d'erreur
- Le statut du calendrier passe à "error" (X rouge)
- Le message d'erreur est affiché

#### 7.2 URL ICS inaccessible

1. **Créer un calendrier avec une URL qui n'existe pas**
2. **Synchroniser**

**Résultat attendu:**
- Erreur de fetch affichée
- Statut "error"

---

## Obtenir une URL ICS de Test

### Option 1: Google Calendar (Recommandé)

1. **Va sur Google Calendar**
2. **Crée un nouveau calendrier "Test Hosteed"**
3. **Ajoute quelques événements:**
   - Événement 1: 25-27 octobre 2025
   - Événement 2: 1-3 novembre 2025
   - Événement 3: 15-18 novembre 2025

4. **Obtenir l'URL ICS:**
   - Paramètres → Paramètres de "Test Hosteed"
   - Faire défiler jusqu'à "Adresse secrète au format iCal"
   - Copier l'URL (elle ressemble à: `https://calendar.google.com/calendar/ical/...`)

### Option 2: Créer un fichier ICS local

Si tu veux tester localement sans Google Calendar, crée ce fichier:

**test-calendar.ics:**
```ics
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Test Calendar
X-WR-TIMEZONE:Europe/Paris
BEGIN:VEVENT
DTSTART:20251025T000000Z
DTEND:20251027T000000Z
DTSTAMP:20250122T120000Z
UID:test-event-1@hosteed.com
SUMMARY:Réservation Test 1
DESCRIPTION:Première réservation de test
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
BEGIN:VEVENT
DTSTART:20251101T000000Z
DTEND:20251103T000000Z
DTSTAMP:20250122T120000Z
UID:test-event-2@hosteed.com
SUMMARY:Réservation Test 2
DESCRIPTION:Deuxième réservation de test
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR
```

Puis serve-le localement:
```bash
# Dans un terminal séparé
cd /tmp
echo "[contenu du fichier ICS ci-dessus]" > test-calendar.ics
python3 -m http.server 8000
```

URL à utiliser: `http://localhost:8000/test-calendar.ics`

---

## Commandes Utiles pour le Débogage

### Voir tous les calendriers externes
```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d hosteed -c "
SELECT ec.id, ec.name, ec.\"lastSyncStatus\", ec.\"lastSyncAt\", u.email as user_email
FROM \"external_calendars\" ec
JOIN \"User\" u ON ec.\"userId\" = u.id
ORDER BY ec.\"createdAt\" DESC;
"
```

### Voir tous les mappings
```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d hosteed -c "
SELECT cem.id, cem.\"eventTitle\", cem.\"startDate\", cem.\"endDate\",
       array_length(cem.\"productIds\", 1) as products_count,
       ec.name as calendar_name
FROM \"calendar_event_mappings\" cem
JOIN \"external_calendars\" ec ON cem.\"externalCalendarId\" = ec.id
ORDER BY cem.\"startDate\" DESC
LIMIT 20;
"
```

### Voir les blocs créés par les calendriers externes
```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d hosteed -c "
SELECT up.\"startDate\", up.\"endDate\", up.title, up.description, p.name as product_name
FROM \"UnAvailableProduct\" up
JOIN \"Product\" p ON up.\"productId\" = p.id
WHERE up.description LIKE '%[SYNC:%'
ORDER BY up.\"startDate\" DESC
LIMIT 20;
"
```

### Nettoyer les données de test
```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d hosteed -c "
-- Supprimer tous les calendriers externes de test
DELETE FROM \"external_calendars\" WHERE name LIKE '%Test%';

-- Supprimer tous les blocs créés par sync
DELETE FROM \"UnAvailableProduct\" WHERE description LIKE '%[SYNC:%';
"
```

---

## Workflow Complet Recommandé

### Scénario: Host avec Airbnb et Booking.com

1. **Créer deux calendriers externes:**
   - "Calendrier Airbnb" (couleur: rouge)
   - "Calendrier Booking.com" (couleur: bleu)

2. **Synchroniser les deux calendriers**

3. **Dans le modal de mapping:**
   - Pour chaque événement, choisir les logements à bloquer
   - Un événement peut bloquer plusieurs logements
   - Plusieurs événements peuvent bloquer le même logement

4. **Sauvegarder et appliquer**

5. **Vérifier sur le calendrier principal:**
   - Va sur `/dashboard/host/calendar`
   - Sélectionne un logement dans le dropdown
   - Vérifie que les dates sont bien bloquées

6. **Exporter le calendrier Hosteed vers Airbnb/Booking:**
   - Sélectionne le logement
   - Clique sur "Exporter le calendrier"
   - Copie l'URL ICS
   - Colle-la dans Airbnb/Booking.com

---

## Problèmes Connus et Solutions

### Problème: "Module 'ical' not found"
**Solution:**
```bash
pnpm install ical
```

### Problème: Les mappings ne créent pas de blocs
**Vérification:**
1. Check que le calendrier a bien des événements
2. Check que des produits ont été sélectionnés dans les mappings
3. Check les logs de la console

### Problème: Le dropdown de produits est vide
**Vérification:**
1. L'utilisateur a-t-il des produits?
```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d hosteed -c "
SELECT COUNT(*) FROM \"Product\"
WHERE \"userManager\" = (SELECT id FROM \"User\" WHERE email = 'ton@email.com');
"
```

---

## Différences avec l'Ancien Système

| Aspect | Ancien Système | Nouveau Système (Hybride) |
|--------|----------------|---------------------------|
| **Import** | Par produit | Centralisé (niveau host) |
| **Mapping** | Automatique 1:1 | Manuel, flexible N:N |
| **Configuration** | Un calendrier par produit | Un calendrier pour tous |
| **Export** | Par produit | Par produit (inchangé) |
| **Flexibilité** | Faible | Élevée |

---

## Prochaines Étapes (Améliorations Futures)

- [ ] Synchronisation automatique toutes les 24h (cron job)
- [ ] Notifications email en cas d'erreur de sync
- [ ] Historique des synchronisations
- [ ] Bulk actions sur les mappings
- [ ] Import/Export de configurations de mappings
- [ ] Support CalDAV pour synchronisation bidirectionnelle

---

## Support

Si tu rencontres des problèmes:
1. Check les logs de la console navigateur (F12)
2. Check les logs du serveur Next.js
3. Vérifie la base de données avec les commandes ci-dessus
4. Assure-toi que `pnpm dev` tourne sans erreurs
