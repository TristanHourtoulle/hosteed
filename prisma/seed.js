const { PrismaClient } = require('@prisma/client');
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Début du seeding...');

    const user = await prisma.user.upsert({
      where: { email: "pierre@pierre.pierre" },
      update: {},
      create: {
        email: "pierre@pierre.pierre",
        name: "Pierre",
        lastname: "Maurer",
        password: await bcrypt.hash("password", 10),
      }
    })
    console.log("User créer:", user)
    // Création des types de location
    const typeRent = await prisma.typeRent.create({
      data: {
        name: 'Appartement',
        description: 'Location d\'appartement entier',
      },
    });
    console.log('TypeRent créé:', typeRent);

    // Création des équipements
    const equipment = await prisma.equipment.create({
      data: {
        name: 'Wi-Fi',
      },
    });
    console.log('Equipment créé:', equipment);

    // Création des services
    const service = await prisma.services.create({
      data: {
        name: 'Ménage',
      },
    });
    console.log('Service créé:', service);

    // Création des repas
    const meal = await prisma.meals.create({
      data: {
        name: 'Petit-déjeuner',
      },
    });
    console.log('Meal créé:', meal);

    // Création des types de chambre
    const typeRoom = await prisma.typeRoom.create({
      data: {
        name: 'Chambre double',
        description: 'Chambre avec un lit double',
      },
    });
    console.log('TypeRoom créé:', typeRoom);

    // Création des mesures de sécurité
    const security = await prisma.security.create({
      data: {
        name: 'Détecteur de fumée',
      },
    });
    console.log('Security créé:', security);

    // Création d'un produit
    const product = await prisma.product.create({
      data: {
        name: 'Appartement moderne',
        description: 'Bel appartement moderne en centre-ville',
        address: '123 Rue Principale, Paris',
        basePrice: '100',
        room: BigInt(2),
        bathroom: BigInt(1),
        arriving: 14,
        leaving: 12,
        autoAccept: true,
        equipement: BigInt(1),
        meal: BigInt(1),
        services: BigInt(1),
        security: BigInt(1),
        minRent: BigInt(1),
        maxRent: BigInt(7),
        advanceRent: BigInt(1),
        delayTime: BigInt(24),
        categories: BigInt(1),
        minPeople: BigInt(1),
        maxPeople: BigInt(4),
        validate: 'Approve',
        userManager: BigInt(1),
        type: {
          connect: {id: typeRent.id}
        },
        phone: '+33123456789',
        latitude: 48.8566,
        longitude: 2.3522,
        equipments: {
          connect: [{ id: equipment.id }],
        },
        servicesList: {
          connect: [{ id: service.id }],
        },
        mealsList: {
          connect: [{ id: meal.id }],
        },
        securities: {
          connect: [{ id: security.id }],
        },
        typeRoom: {
          connect: [{ id: typeRoom.id }],
        },
        user: {
          connect: {id: user.id},
        }
      },
    });
    console.log('Product créé:', product);

    // Création d'une image pour le produit
    const image = await prisma.images.create({
      data: {
        img: '',
        Product: {
          connect: [{ id: product.id }],
        },
      },
    });
    console.log('Image créée:', image);

    console.log('Seeding terminé avec succès');
  } catch (error) {
    console.error('Erreur lors du seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Erreur fatale:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
