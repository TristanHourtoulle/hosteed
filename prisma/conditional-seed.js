const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function conditionalSeed() {
  try {
    // Vérifier si la base de données a déjà des données
    const typeRentCount = await prisma.typeRent.count()

    if (typeRentCount === 0) {
      console.log('Base de données vide détectée, exécution du seed...')
      // Exécuter le seed principal
      require('./seed.js')
    } else {
      console.log('Données existantes détectées, skip du seed.')
    }
  } catch (error) {
    console.error('Erreur lors de la vérification des données:', error)
  } finally {
    await prisma.$disconnect()
  }
}

conditionalSeed()
