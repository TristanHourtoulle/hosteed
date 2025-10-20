const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createTestData() {
  console.log('Creation de donnees de test avec les references de prod...')

  try {
    // 1. Creer des utilisateurs test
    console.log('1. Creation des utilisateurs test...')

    const users = await prisma.user.createMany({
      data: [
        {
          name: 'Tristan Hourtoulle',
          email: 'tristan@hosteed.com',
          roles: 'ADMIN',
          lastName: 'Hourtoulle',
          password: '$2b$10$example.hash',
          emailVerified: new Date(),
        },
        {
          name: 'Marie Rasoanaivo',
          email: 'marie@hosteed.com',
          roles: 'HOST',
          lastName: 'Rasoanaivo',
          password: '$2b$10$example.hash',
          emailVerified: new Date(),
        },
        {
          name: 'Jean Rakoto',
          email: 'jean@hosteed.com',
          roles: 'USER',
          lastName: 'Rakoto',
          password: '$2b$10$example.hash',
          emailVerified: new Date(),
        },
      ],
      skipDuplicates: true,
    })

    // 2. Recuperer les donnees de reference importees
    console.log('2. Recuperation des donnees de reference...')

    const typeRents = await prisma.typeRent.findMany()
    const equipments = await prisma.equipment.findMany()
    const securities = await prisma.security.findMany()
    const services = await prisma.services.findMany()
    const meals = await prisma.meals.findMany()
    const images = await prisma.images.findMany()

    console.log(`- ${typeRents.length} types de location`)
    console.log(`- ${equipments.length} equipements`)
    console.log(`- ${securities.length} securites`)
    console.log(`- ${services.length} services`)
    console.log(`- ${meals.length} repas`)
    console.log(`- ${images.length} images`)

    // 3. Creer quelques produits test avec les vraies donnees
    console.log('3. Creation de produits test...')

    const hostUser = await prisma.user.findFirst({
      where: { email: 'marie@hosteed.com' },
    })

    const villaType = typeRents.find(t => t.name.includes('Villa')) || typeRents[0]
    const hotelType = typeRents.find(t => t.name.includes('Hôtel')) || typeRents[1]

    // Produit 1: Villa luxe
    const product1 = await prisma.product.create({
      data: {
        name: 'Villa de luxe à Nosy Be',
        description:
          "Magnifique villa avec vue imprenable sur l'océan Indien, située dans un cadre exceptionnel à Nosy Be.",
        address: 'Ambatoloaka, Nosy Be, Madagascar',
        basePrice: '350',
        priceMGA: '1400000',
        room: 4,
        bathroom: 3,
        arriving: 15,
        leaving: 11,
        autoAccept: true,
        minPeople: 1,
        maxPeople: 8,
        validate: 'Approve',
        userManager: 1,
        typeId: villaType.id,
        phone: '+261 34 12 34 567',
        phoneCountry: 'MG',
        latitude: -13.3697,
        longitude: 48.2622,
        certified: true,
        contract: false,
        sizeRoom: 150.5,
        isDraft: false,
        user: {
          connect: { id: hostUser.id },
        },
      },
    })

    // Produit 2: Hotel ecolodge
    const product2 = await prisma.product.create({
      data: {
        name: 'Ecolodge Andasibe',
        description:
          "Séjour authentique au coeur de la forêt primaire d'Andasibe, proche du parc national.",
        address: 'Andasibe-Mantadia, Alaotra-Mangoro, Madagascar',
        basePrice: '120',
        priceMGA: '480000',
        room: 2,
        bathroom: 1,
        arriving: 14,
        leaving: 10,
        autoAccept: false,
        minPeople: 1,
        maxPeople: 4,
        validate: 'Approve',
        userManager: 1,
        typeId: hotelType.id,
        phone: '+261 34 56 78 901',
        phoneCountry: 'MG',
        latitude: -18.939,
        longitude: 48.426,
        certified: false,
        contract: true,
        sizeRoom: 45.0,
        isDraft: false,
        user: {
          connect: { id: hostUser.id },
        },
      },
    })

    // 4. Associer equipements, services, etc.
    console.log('4. Association des equipements et services...')

    // Connecter quelques equipements au produit 1
    if (equipments.length > 0) {
      await prisma.product.update({
        where: { id: product1.id },
        data: {
          equipments: {
            connect: equipments.slice(0, 5).map(e => ({ id: e.id })),
          },
        },
      })
    }

    // Connecter quelques securites au produit 1
    if (securities.length > 0) {
      await prisma.product.update({
        where: { id: product1.id },
        data: {
          securities: {
            connect: securities.slice(0, 3).map(s => ({ id: s.id })),
          },
        },
      })
    }

    // 5. Associer quelques images
    console.log('5. Association des images...')

    if (images.length > 0) {
      await prisma.product.update({
        where: { id: product1.id },
        data: {
          img: {
            connect: images.slice(0, 8).map(img => ({ id: img.id })),
          },
        },
      })

      await prisma.product.update({
        where: { id: product2.id },
        data: {
          img: {
            connect: images.slice(8, 13).map(img => ({ id: img.id })),
          },
        },
      })
    }

    console.log('6. Verification des donnees creees...')

    const finalUserCount = await prisma.user.count()
    const finalProductCount = await prisma.product.count()
    const finalImageCount = await prisma.images.count()

    console.log(`✅ ${finalUserCount} utilisateurs`)
    console.log(`✅ ${finalProductCount} produits`)
    console.log(`✅ ${finalImageCount} images`)
    console.log(`✅ ${typeRents.length} types de location`)
    console.log(`✅ ${equipments.length} equipements`)

    console.log('Creation de donnees test terminee avec succes !')
  } catch (error) {
    console.error('Erreur lors de la creation des donnees test:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createTestData()
