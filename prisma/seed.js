const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Début du seeding...')

  // Clear existing data
  await prisma.post.deleteMany()
  await prisma.product.deleteMany()
  await prisma.typeRent.deleteMany()
  await prisma.equipment.deleteMany()
  await prisma.security.deleteMany()
  await prisma.services.deleteMany()
  await prisma.meals.deleteMany()

  // Créer des articles de blog
  const posts = [
    {
      title: 'Les 10 plus belles villas de Madagascar',
      content: `# Les plus belles villas de Madagascar 🏖️

![Villa de luxe à Madagascar](https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=3271&auto=format&fit=crop)

Madagascar, avec ses **paysages à couper le souffle** et ses *plages paradisiaques*, regorge de villas luxueuses offrant une expérience unique. Voici notre sélection des 10 plus belles villas de l'île.

## 1. Villa Vanille - Nosy Be ⭐
> Une expérience unique entre luxe et tradition

Située sur l'île paradisiaque de Nosy Be, cette villa offre une vue imprenable sur l'océan Indien. Avec sa piscine à débordement et son architecture contemporaine, elle allie luxe et tradition malgache.

### Caractéristiques :
- 5 chambres de luxe
- Piscine à débordement
- Personnel dédié
- Vue panoramique

## 2. Royal Palm Villa - Antananarivo 🌴
Au cœur de la capitale, cette villa urbaine propose un havre de paix avec :
1. Un jardin tropical de 2000m²
2. Un service 5 étoiles
3. Une architecture coloniale préservée

---

## 3. Baobab Lodge - Morondava 🌳
Face à la célèbre [allée des Baobabs](https://fr.wikipedia.org/wiki/All%C3%A9e_des_baobabs), cette villa traditionnelle offre :

\`\`\`
✓ Vue directe sur les baobabs
✓ Architecture traditionnelle
✓ Matériaux locaux
✓ Expérience authentique
\`\`\`

## 4. Blue Lagoon Villa - Sainte-Marie 🌊
| Caractéristique | Description |
|-----------------|-------------|
| Type | Villa sur pilotis |
| Vue | Lagon turquoise |
| Accès | Direct à la plage |
| Activités | Snorkeling, plongée |

## 5. Mountain View Estate - Antsirabe 🏔️
Perchée dans les hautes terres, cette villa coloniale rénovée offre une vue spectaculaire sur les montagnes environnantes.

### Services inclus :
* Chef privé
* Majordome
* Guide local
* Voiture avec chauffeur

---

### Comment réserver ?
1. Contactez-nous via le formulaire
2. Choisissez vos dates
3. Personnalisez votre séjour
4. Confirmez la réservation

> **Note :** Toutes nos villas sont inspectées régulièrement pour garantir le plus haut niveau de qualité.

![Piscine de luxe](https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?q=80&w=3271&auto=format&fit=crop)

*Photos non contractuelles - © Hosteed ${new Date().getFullYear()}*`,
      image:
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=3271&auto=format&fit=crop',
    },
    {
      title: 'Guide du voyageur responsable',
      content: `# 🌿 Voyager de manière responsable à Madagascar

![Paysage naturel de Madagascar](https://images.unsplash.com/photo-1623930154261-37f8b5e7cc46?q=80&w=3270&auto=format&fit=crop)

Le tourisme responsable est **essentiel** pour préserver la beauté naturelle et la culture unique de Madagascar. Voici notre guide complet pour un voyage éthique et durable.

## 🌍 Respecter l'environnement

### Gestion des déchets
- ♻️ Utilisez une gourde réutilisable
- 🚫 Évitez le plastique à usage unique
- ✅ Ramenez vos déchets non recyclables

### Conservation de l'eau
\`\`\`
💧 Conseils pratiques :
- Douches courtes
- Réutilisation des serviettes
- Signalement des fuites
\`\`\`

## 💚 Soutenir l'économie locale

> "Le meilleur moyen d'aider une communauté est de participer à son économie de manière responsable"

| Action | Impact |
|--------|---------|
| Acheter local | Soutien direct aux artisans |
| Guide local | Emploi et expertise |
| Restaurants locaux | Maintien des traditions |

### 🎨 Artisanat local recommandé
1. Vannerie traditionnelle
2. Sculptures en bois
3. Textiles en soie sauvage
4. Bijoux en pierres locales

## 👥 Préserver la culture

### Apprentissage de base
\`\`\`markdown
* Bonjour = Salama
* Merci = Misaotra
* S'il vous plaît = Azafady
\`\`\`

### Règles de respect
- [ ] Demander avant de photographier
- [x] S'habiller modestement
- [x] Respecter les fady (tabous)

---

## 🌟 Bonnes pratiques

### Transport
* 🚶‍♂️ Privilégier la marche
* 🚲 Utiliser des vélos
* 🚌 Transports en commun

### Hébergement
1. **Écolodges certifiés**
2. *Homestays* traditionnels
3. Hôtels écoresponsables

> **Astuce :** Recherchez les établissements avec des certifications environnementales

![Artisanat local](https://images.unsplash.com/photo-1542401886-65d6c61db217?q=80&w=3270&auto=format&fit=crop)

---

### Ressources utiles
- [Guide des parcs nationaux](https://www.parcs-madagascar.com)
- [Conservation International](https://www.conservation.org)
- [WWF Madagascar](https://www.wwf.mg)

*Dernière mise à jour : ${new Date().toLocaleDateString()}*`,
      image:
        'https://images.unsplash.com/photo-1623930154261-37f8b5e7cc46?q=80&w=3270&auto=format&fit=crop',
    },
    {
      title: 'Les meilleures périodes pour visiter Madagascar',
      content: `# 🗓️ Quand partir à Madagascar ?

![Paysage saisonnier de Madagascar](https://images.unsplash.com/photo-1504681869696-d977211a5f4c?q=80&w=3270&auto=format&fit=crop)

Madagascar possède un **climat tropical** avec des saisons distinctes. Ce guide vous aidera à choisir la *période idéale* pour votre voyage.

## 🌞 Haute saison (Avril à Octobre)

### Avantages
\`\`\`
✓ Climat sec et ensoleillé
✓ Températures agréables (20-25°C)
✓ Conditions optimales pour les activités
✓ Observation des baleines (Juillet-Septembre)
\`\`\`

### Inconvénients
- Prix plus élevés
- Sites touristiques plus fréquentés
- Réservations nécessaires à l'avance

## 🌧️ Saison des pluies (Novembre à Mars)

| Mois | Précipitations | Température | Remarques |
|------|---------------|-------------|-----------|
| Novembre | Modérées | 25-30°C | Début des pluies |
| Décembre | Fortes | 26-32°C | Risque cyclonique |
| Janvier | Très fortes | 25-31°C | Éviter la côte Est |
| Février | Fortes | 25-30°C | Routes difficiles |
| Mars | Modérées | 24-29°C | Fin des pluies |

### Avantages
1. Prix plus bas
2. Moins de touristes
3. Paysages verdoyants
4. Faune plus active

> **Note :** La saison des pluies n'empêche pas le voyage, mais nécessite plus de flexibilité dans l'organisation.

## 📍 Recommandations par région

### Nord 🌴
- **Meilleure période :** Mai à Octobre
- *Activités :* Plages, plongée, randonnée
- Temperature moyenne : 25°C

### Sud 🏜️
- **Meilleure période :** Avril à Novembre
- *Activités :* Safari, observation des lémuriens
- Temperature moyenne : 23°C

### Est 🌺
- **Meilleure période :** Juillet à Septembre
- *Activités :* Parcs nationaux, baleines
- Temperature moyenne : 24°C

### Ouest 🌅
- **Meilleure période :** Toute l'année
- *Activités :* Baobabs, plages
- Temperature moyenne : 27°C

---

## 🎯 Conseils de planification

### À prévoir
- [ ] Vérifier les prévisions météo
- [ ] Réserver en avance en haute saison
- [ ] Prévoir des vêtements adaptés
- [x] Être flexible avec son planning

### Kit essentiel selon la saison
* 🌞 **Haute saison**
  * Chapeau et crème solaire
  * Vêtements légers
  * Bonnes chaussures de marche

* 🌧️ **Saison des pluies**
  * Imperméable
  * Chaussures étanches
  * Anti-moustiques

![Coucher de soleil à Madagascar](https://images.unsplash.com/photo-1589197331516-4a6e2d7c2c7d?q=80&w=3270&auto=format&fit=crop)

*Informations mises à jour le ${new Date().toLocaleDateString()}*`,
      image:
        'https://images.unsplash.com/photo-1504681869696-d977211a5f4c?q=80&w=3270&auto=format&fit=crop',
    },
    {
      title: 'Cuisine malgache : saveurs et traditions',
      content: `# 🍚 Découvrez la gastronomie malgache

![Plats traditionnels malgaches](https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=3270&auto=format&fit=crop)

La cuisine malgache est un **mélange unique** d'influences africaines, asiatiques et européennes. Embarquez pour un *voyage culinaire* à travers les saveurs de l'île.

## 📝 Les bases de la cuisine malgache

### Le riz (Vary) 🌾
> "Le riz est au cœur de chaque repas malgache"

\`\`\`
Consommation moyenne par personne :
- 2-3 portions par jour
- 150kg par an
- Principal aliment de base
\`\`\`

## 🍲 Plats emblématiques

### 1. Romazava
![Romazava](https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=3270&auto=format&fit=crop)

Le **plat national** malgache :
* Viande de zébu
* Brèdes (feuilles vertes)
* Gingembre et ail
* Bouillon parfumé

### 2. Ravitoto
| Ingrédient | Rôle |
|------------|------|
| Manioc | Base |
| Porc | Protéine |
| Épices | Saveur |
| Coco | Onctuosité |

## 🌶️ Condiments et accompagnements

### Achards
1. Mangue verte
2. Citron
3. Piment
4. Gingembre

### Rougail
- Tomates fraîches
- Oignons
- Piments
- Citron vert

## 🍜 Les soupes

### Soupe chinoise
\`\`\`markdown
Ingrédients principaux :
* Nouilles
* Légumes
* Viande
* Bouillon
\`\`\`

## 🥗 Les salades

### Salades de légumes verts
- [x] Anandrano (cresson d'eau)
- [x] Anamalaho (brèdes mafane)
- [ ] Ravitoto (feuilles de manioc)

## 🍎 Fruits tropicaux

### Fruits de saison
1. **Litchis** *(Novembre-Janvier)*
2. **Mangues** *(Octobre-Décembre)*
3. **Fruit du dragon** *(Toute l'année)*

> **Conseil :** Privilégiez les fruits de saison pour plus de saveur !

## 🍽️ Où manger ?

### Types d'établissements
* 🏠 **Hotelys** - Restaurants traditionnels
* 🏪 **Gargottes** - Street food locale
* 🌟 **Restaurants gastronomiques** - Cuisine fusion

### Conseils pour bien manger
- [ ] Demander aux locaux leurs adresses préférées
- [x] Essayer les marchés du matin
- [x] Goûter les spécialités régionales

---

## 👩‍🍳 Recette du Romazava

### Ingrédients
\`\`\`
- 500g de viande de zébu
- 300g de brèdes mafana
- 200g de brèdes cresson
- Gingembre, ail, oignon
- Sel et poivre
\`\`\`

### Préparation
1. *Faire revenir* la viande
2. *Ajouter* les aromates
3. *Incorporer* les brèdes
4. *Mijoter* 1 heure

![Préparation traditionnelle](https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=3270&auto=format&fit=crop)

*Guide mis à jour le ${new Date().toLocaleDateString()}*`,
      image:
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=3270&auto=format&fit=crop',
    },
    {
      title: 'Activités incontournables à Madagascar',
      content: `# 🌴 Les must-do de votre séjour à Madagascar

![Paysage d'aventure à Madagascar](https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=3308&auto=format&fit=crop)

Découvrez les **expériences uniques** et *activités incontournables* qui feront de votre voyage à Madagascar un souvenir inoubliable.

## 🦁 Aventures naturelles

### Observation des lémuriens
> "Madagascar est le seul habitat naturel des lémuriens dans le monde"

\`\`\`markdown
Meilleurs spots :
* Parc national d'Andasibe
* Réserve de Berenty
* Parc national de Ranomafana
\`\`\`

### Les Tsingy de Bemaraha
![Tsingy](https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=3308&auto=format&fit=crop)

| Difficulté | Durée | Meilleure période |
|------------|-------|-------------------|
| Modérée à difficile | 1-3 jours | Avril-Novembre |

## 🏊‍♂️ Activités marines

### Plongée à Nosy Be
1. **Sites de plongée :**
   - Nosy Tanikely
   - Les 4 Frères
   - Nosy Sakatia

2. **Faune marine :**
   - Tortues
   - Requins baleines
   - Raies mantas

## 🎨 Expériences culturelles

### Marchés traditionnels
- [x] Marché d'Analakely
- [x] Zoma de Tana
- [ ] Marché artisanal de la Digue

### Cérémonies traditionnelles
\`\`\`
🎭 Famadihana
📅 Juillet-Septembre
🕊️ Retournement des morts
🌺 Célébration des ancêtres
\`\`\`

## 🏃‍♂️ Sports et aventures

### Randonnées
* **Pic Boby**
  * Altitude : 2,658m
  * Durée : 2-3 jours
  * Difficulté : ⭐⭐⭐

* **Montagne d'Ambre**
  * Altitude : 1,475m
  * Durée : 1 jour
  * Difficulté : ⭐⭐

### Sports nautiques
1. 🏄‍♂️ Surf à Fort-Dauphin
2. 🛶 Kayak dans les mangroves
3. 🐋 Observation des baleines
4. 🏊‍♂️ Snorkeling

## 📸 Spots photographiques

### L'allée des Baobabs
> Le meilleur moment : coucher du soleil

- 📍 Localisation : Morondava
- ⏰ Horaire idéal : 17h-18h30
- 📸 Type : Paysage

### Conseils photo
\`\`\`markdown
* Utiliser un trépied
* Venir tôt le matin
* Prévoir plusieurs jours
* Respecter les locaux
\`\`\`

## 🎯 Planning suggéré

### Itinéraire 2 semaines
1. **Jours 1-3 :** Antananarivo & environs
2. **Jours 4-6 :** Parc national d'Andasibe
3. **Jours 7-9 :** Nosy Be
4. **Jours 10-12 :** Morondava
5. **Jours 13-14 :** Retour & détente

## ⚠️ Conseils pratiques

### À ne pas oublier
- [ ] Guide local certifié
- [x] Équipement adapté
- [x] Appareil photo
- [x] Médicaments de base

### Équipement recommandé
* 🎒 Sac à dos étanche
* 👟 Chaussures de marche
* 🧢 Chapeau et crème solaire
* 🔦 Lampe frontale

---

![Coucher de soleil sur Madagascar](https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=3308&auto=format&fit=crop)

*Guide actualisé le ${new Date().toLocaleDateString()}*

> **Note :** Toutes les activités mentionnées sont sujettes aux conditions météorologiques et à la disponibilité des guides locaux.`,
      image:
        'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=3308&auto=format&fit=crop',
    },
  ]

  for (const post of posts) {
    await prisma.post.upsert({
      where: { title: post.title },
      update: post,
      create: post,
    })
  }

  // Create TypeRent
  const typeRent = await prisma.typeRent.create({
    data: {
      name: 'Villa',
      description: 'Location de villa entière',
    },
  })

  // Create Equipment
  const equipments = await Promise.all([
    prisma.equipment.create({ data: { name: 'WiFi' } }),
    prisma.equipment.create({ data: { name: 'Climatisation' } }),
    prisma.equipment.create({ data: { name: 'Piscine' } }),
  ])

  // Create Security
  const securities = await Promise.all([
    prisma.security.create({ data: { name: 'Détecteur de fumée' } }),
    prisma.security.create({ data: { name: 'Extincteur' } }),
  ])

  // Create Services
  const services = await Promise.all([
    prisma.services.create({ data: { name: 'Ménage' } }),
    prisma.services.create({ data: { name: 'Linge de maison' } }),
  ])

  // Create Meals
  const meals = await Promise.all([
    prisma.meals.create({ data: { name: 'Petit-déjeuner' } }),
    prisma.meals.create({ data: { name: 'Dîner' } }),
  ])

  // Create Product
  const product = await prisma.product.create({
    data: {
      name: 'Villa de luxe avec piscine',
      description: 'Magnifique villa avec vue sur la mer',
      address: 'Nosy Be, Madagascar',
      longitude: 48.2833,
      latitude: -13.3167,
      basePrice: '200',
      priceMGA: '800000',
      room: BigInt(3),
      bathroom: BigInt(2),
      arriving: 14,
      leaving: 11,
      autoAccept: true,
      phone: '+261 34 12 34 567',
      categories: BigInt(1),
      validate: 'Approve',
      userManager: BigInt(1),
      type: {
        connect: { id: typeRent.id },
      },
      equipments: {
        connect: equipments.map(eq => ({ id: eq.id })),
      },
      servicesList: {
        connect: services.map(s => ({ id: s.id })),
      },
      mealsList: {
        connect: meals.map(m => ({ id: m.id })),
      },
      securities: {
        connect: securities.map(s => ({ id: s.id })),
      },
      img: {
        create: [
          { img: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1200' },
          { img: 'https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?q=80&w=1200' },
          { img: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?q=80&w=1200' },
          { img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200' },
        ],
      },
      rules: {
        create: {
          smokingAllowed: false,
          petsAllowed: true,
          eventsAllowed: false,
          checkInTime: '15:00',
          checkOutTime: '11:00',
          selfCheckIn: true,
        },
      },
      nearbyPlaces: {
        create: [
          {
            name: 'Plage de Nosy Be',
            distance: 200,
            duration: 5,
            transport: 'à pied',
          },
          {
            name: 'Restaurant Le Papillon',
            distance: 500,
            duration: 10,
            transport: 'à pied',
          },
          {
            name: 'Marché local',
            distance: 1500,
            duration: 20,
            transport: 'en voiture',
          },
        ],
      },
      transportOptions: {
        create: [
          {
            name: 'Parking gratuit',
            description: 'Parking privé sécurisé disponible sur place',
          },
          {
            name: 'Location de scooter',
            description: 'Service de location disponible à la demande',
          },
          {
            name: 'Navette aéroport',
            description: 'Service de transfert sur réservation',
          },
        ],
      },
      propertyInfo: {
        create: {
          hasStairs: true,
          hasElevator: false,
          hasHandicapAccess: true,
          hasPetsOnProperty: false,
          additionalNotes: 'La villa est située sur un terrain privé de 1000m²',
        },
      },
    },
  })

  console.log('Seeding terminé !')
  console.log('Blog posts créés:', posts)
  console.log('Produit créé:', product)
}

main()
  .catch(e => {
    console.error('Erreur lors du seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
