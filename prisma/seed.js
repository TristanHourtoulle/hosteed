const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Début du seeding...')

  // Clear existing data
  await prisma.product.deleteMany()
  await prisma.typeRent.deleteMany()
  await prisma.equipment.deleteMany()
  await prisma.security.deleteMany()
  await prisma.services.deleteMany()
  await prisma.meals.deleteMany()

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
      cancellationPolicy: {
        create: {
          freeCancellationHours: 48,
          partialRefundPercent: 50,
          additionalTerms: 'En cas de force majeure, contactez-nous pour plus de flexibilité',
        },
      },
    },
  })

  console.log('Seeding terminé !')
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
