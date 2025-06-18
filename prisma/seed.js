const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Début du seeding...')

    // Clear existing data
    await prisma.product.deleteMany({})
    await prisma.typeRent.deleteMany({})
    await prisma.equipment.deleteMany({})
    await prisma.services.deleteMany({})
    await prisma.meals.deleteMany({})
    await prisma.typeRoom.deleteMany({})
    await prisma.security.deleteMany({})
    await prisma.images.deleteMany({})
    console.log('Données existantes supprimées')

    // Création des utilisateurs
    const user1 = await prisma.user.upsert({
      where: { email: 'pierre@pierre.pierre' },
      update: {},
      create: {
        email: 'pierre@pierre.pierre',
        name: 'Pierre',
        lastname: 'Maurer',
        password: await bcrypt.hash('password', 10),
      },
    })

    const user2 = await prisma.user.upsert({
      where: { email: 'marie@test.com' },
      update: {},
      create: {
        email: 'marie@test.com',
        name: 'Marie',
        lastname: 'Dubois',
        password: await bcrypt.hash('password', 10),
      },
    })

    const user3 = await prisma.user.upsert({
      where: { email: 'jean@test.com' },
      update: {},
      create: {
        email: 'jean@test.com',
        name: 'Jean',
        lastname: 'Martin',
        password: await bcrypt.hash('password', 10),
      },
    })

    console.log('Users créés')

    // Création des types de location (seulement maison et appartement)
    const typeRents = []
    const appartement = await prisma.typeRent.create({
      data: {
        name: 'Appartement',
        description: "Location d'appartement entier",
      },
    })
    typeRents.push(appartement)

    const maison = await prisma.typeRent.create({
      data: {
        name: 'Maison',
        description: 'Location de maison entière',
      },
    })
    typeRents.push(maison)

    console.log('TypeRents créés')

    // Création des équipements
    const equipments = []
    const equipmentNames = [
      'Wi-Fi',
      'Climatisation',
      'Piscine',
      'Parking',
      'Balcon',
      'Cuisine équipée',
      'Machine à laver',
      'Télévision',
    ]

    for (const name of equipmentNames) {
      const equipment = await prisma.equipment.create({
        data: { name },
      })
      equipments.push(equipment)
    }
    console.log('Equipments créés')

    // Création des services
    const services = []
    const serviceNames = [
      'Ménage',
      'Conciergerie',
      'Navette aéroport',
      'Location vélo',
      'Service petit-déjeuner',
    ]

    for (const name of serviceNames) {
      const service = await prisma.services.create({
        data: { name },
      })
      services.push(service)
    }
    console.log('Services créés')

    // Création des repas
    const meals = []
    const mealNames = ['Petit-déjeuner', 'Déjeuner', 'Dîner', 'Brunch', 'Collation']

    for (const name of mealNames) {
      const meal = await prisma.meals.create({
        data: { name },
      })
      meals.push(meal)
    }
    console.log('Meals créés')

    // Création des types de chambre
    const typeRooms = []
    const roomData = [
      { name: 'Chambre simple', description: 'Chambre avec un lit simple' },
      { name: 'Chambre double', description: 'Chambre avec un lit double' },
      { name: 'Suite', description: 'Suite luxueuse avec salon' },
      { name: 'Chambre familiale', description: 'Chambre pour famille avec plusieurs lits' },
    ]

    for (const data of roomData) {
      const typeRoom = await prisma.typeRoom.create({
        data: data,
      })
      typeRooms.push(typeRoom)
    }
    console.log('TypeRooms créés')

    // Création des mesures de sécurité
    const securities = []
    const securityNames = [
      'Détecteur de fumée',
      'Extincteur',
      'Caméra de sécurité',
      'Coffre-fort',
      'Alarme',
    ]

    for (const name of securityNames) {
      const security = await prisma.security.create({
        data: { name },
      })
      securities.push(security)
    }
    console.log('Securities créés')

    // Création des produits - MADAGASCAR UNIQUEMENT
    const productsData = [
      {
        name: 'Villa moderne Antananarivo',
        description:
          "Magnifique villa moderne dans le quartier résidentiel d'Antananarivo avec vue sur la ville",
        address: 'Rue des Jacarandas, Antananarivo, Madagascar',
        basePrice: '75',
        room: 4,
        bathroom: 3,
        typeRentId: maison.id,
        userId: user1.id,
        latitude: -18.8792,
        longitude: 47.5079,
        maxPeople: 8,
        equipmentIds: [0, 1, 2, 3, 5, 6, 7], // Wi-Fi, Clim, Piscine, Parking, Cuisine, Machine, TV
        serviceIds: [0, 1, 2], // Ménage, Conciergerie, Navette
        mealIds: [0, 1], // Petit-déj, Déjeuner
        securityIds: [0, 1, 2], // Détecteur fumée, Extincteur, Caméra
        images: [
          'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&fit=crop',
        ],
      },
      {
        name: 'Appartement vue mer Toamasina',
        description:
          "Appartement confortable avec vue sur l'océan Indien, proche du port de Toamasina",
        address: 'Boulevard Joffre, Toamasina, Madagascar',
        basePrice: '45',
        room: 2,
        bathroom: 1,
        typeRentId: appartement.id,
        userId: user2.id,
        latitude: -18.1492,
        longitude: 49.4024,
        maxPeople: 4,
        equipmentIds: [0, 1, 4, 5, 7], // Wi-Fi, Clim, Balcon, Cuisine, TV
        serviceIds: [0, 4], // Ménage, Service petit-déj
        mealIds: [0, 2], // Petit-déj, Dîner
        securityIds: [0, 1], // Détecteur fumée, Extincteur
        images: [
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1616047006789-b7af710a08c3?w=800&h=600&fit=crop',
        ],
      },
      {
        name: 'Maison traditionnelle Antsirabe',
        description:
          "Charmante maison traditionnelle malgache avec jardin tropical, dans la ville thermale d'Antsirabe",
        address: "Avenue de l'Indépendance, Antsirabe, Madagascar",
        basePrice: '35',
        room: 3,
        bathroom: 2,
        typeRentId: maison.id,
        userId: user3.id,
        latitude: -19.8697,
        longitude: 47.0317,
        maxPeople: 6,
        equipmentIds: [0, 3, 5, 6], // Wi-Fi, Parking, Cuisine, Machine
        serviceIds: [0, 3], // Ménage, Location vélo
        mealIds: [0, 3], // Petit-déj, Brunch
        securityIds: [0, 1, 4], // Détecteur, Extincteur, Alarme
        images: [
          'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=800&h=600&fit=crop',
        ],
      },
      {
        name: 'Appartement centre-ville Fianarantsoa',
        description: 'Appartement moderne au cœur de Fianarantsoa, proche des sites historiques',
        address: 'Rue Rainandriamampandry, Fianarantsoa, Madagascar',
        basePrice: '30',
        room: 2,
        bathroom: 1,
        typeRentId: appartement.id,
        userId: user1.id,
        latitude: -21.4539,
        longitude: 47.0857,
        maxPeople: 4,
        equipmentIds: [0, 5, 7], // Wi-Fi, Cuisine, TV
        serviceIds: [0], // Ménage
        mealIds: [0], // Petit-déj
        securityIds: [0], // Détecteur fumée
        images: [
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
        ],
      },
      {
        name: 'Maison coloniale Ambovory',
        description:
          'Magnifique maison de style colonial avec véranda et jardin luxuriant à Ambovory',
        address: 'Route Nationale, Ambovory, Madagascar',
        basePrice: '55',
        room: 4,
        bathroom: 2,
        typeRentId: maison.id,
        userId: user2.id,
        latitude: -18.95,
        longitude: 47.52,
        maxPeople: 8,
        equipmentIds: [0, 3, 4, 5, 6], // Wi-Fi, Parking, Balcon, Cuisine, Machine
        serviceIds: [0, 1], // Ménage, Conciergerie
        mealIds: [0, 1, 2], // Petit-déj, Déjeuner, Dîner
        securityIds: [0, 1, 3], // Détecteur, Extincteur, Coffre
        images: [
          'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop',
        ],
      },
      {
        name: 'Appartement moderne Mahajanga',
        description: 'Appartement climatisé avec terrasse, proche des plages de Mahajanga',
        address: 'Boulevard Poincaré, Mahajanga, Madagascar',
        basePrice: '40',
        room: 2,
        bathroom: 1,
        typeRentId: appartement.id,
        userId: user3.id,
        latitude: -15.7167,
        longitude: 46.3167,
        maxPeople: 4,
        equipmentIds: [0, 1, 4, 5, 7], // Wi-Fi, Clim, Balcon, Cuisine, TV
        serviceIds: [0, 2], // Ménage, Navette
        mealIds: [0, 4], // Petit-déj, Collation
        securityIds: [0, 1], // Détecteur, Extincteur
        images: [
          'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800&h=600&fit=crop',
        ],
      },
      {
        name: 'Maison familiale Morondava',
        description: "Maison spacieuse près de l'Avenue des Baobabs, parfaite pour les familles",
        address: 'Avenue des Baobabs, Morondava, Madagascar',
        basePrice: '50',
        room: 3,
        bathroom: 2,
        typeRentId: maison.id,
        userId: user1.id,
        latitude: -20.2833,
        longitude: 44.2833,
        maxPeople: 6,
        equipmentIds: [0, 3, 5, 6, 7], // Wi-Fi, Parking, Cuisine, Machine, TV
        serviceIds: [0, 3], // Ménage, Location vélo
        mealIds: [0, 1], // Petit-déj, Déjeuner
        securityIds: [0, 1, 2], // Détecteur, Extincteur, Caméra
        images: [
          'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&h=600&fit=crop',
        ],
      },
      {
        name: 'Appartement cosy Antsohihy',
        description: "Petit appartement confortable dans le centre d'Antsohihy, idéal pour couples",
        address: 'Rue du Commerce, Antsohihy, Madagascar',
        basePrice: '25',
        room: 1,
        bathroom: 1,
        typeRentId: appartement.id,
        userId: user2.id,
        latitude: -14.8833,
        longitude: 47.9833,
        maxPeople: 2,
        equipmentIds: [0, 5, 7], // Wi-Fi, Cuisine, TV
        serviceIds: [0], // Ménage
        mealIds: [0], // Petit-déj
        securityIds: [0], // Détecteur fumée
        images: ['https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&h=600&fit=crop'],
      },
    ]

    for (let i = 0; i < productsData.length; i++) {
      const data = productsData[i]

      const product = await prisma.product.create({
        data: {
          name: data.name,
          description: data.description,
          address: data.address,
          basePrice: data.basePrice,
          room: BigInt(data.room),
          bathroom: BigInt(data.bathroom),
          arriving: 14,
          leaving: 12,
          autoAccept: true,
          equipement: BigInt(1),
          meal: BigInt(1),
          services: BigInt(1),
          security: BigInt(1),
          minRent: BigInt(1),
          maxRent: BigInt(30),
          advanceRent: BigInt(1),
          delayTime: BigInt(24),
          categories: BigInt(1),
          minPeople: BigInt(1),
          maxPeople: BigInt(data.maxPeople),
          validate: 'Approve',
          userManager: BigInt(1),
          phone: '+261123456789',
          latitude: data.latitude,
          longitude: data.longitude,
          type: {
            connect: { id: data.typeRentId },
          },
          equipments: {
            connect: data.equipmentIds.map(idx => ({ id: equipments[idx].id })),
          },
          servicesList: {
            connect: data.serviceIds.map(idx => ({ id: services[idx].id })),
          },
          mealsList: {
            connect: data.mealIds.map(idx => ({ id: meals[idx].id })),
          },
          securities: {
            connect: data.securityIds.map(idx => ({ id: securities[idx].id })),
          },
          typeRoom: {
            connect: [{ id: typeRooms[0].id }], // Connect to first type room
          },
          user: {
            connect: [{ id: data.userId }],
          },
        },
      })

      // Création d'images pour chaque produit
      if (data.images && data.images.length > 0) {
        for (const imageUrl of data.images) {
          await prisma.images.create({
            data: {
              img: imageUrl,
              Product: {
                connect: [{ id: product.id }],
              },
            },
          })
        }
      }

      console.log(`Product ${i + 1} créé: ${product.name}`)
    }

    console.log('Seeding terminé avec succès - 8 propriétés Madagascar créées')
  } catch (error) {
    console.error('Erreur lors du seeding:', error)
    throw error
  }
}

main()
  .catch(e => {
    console.error('Erreur fatale:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
