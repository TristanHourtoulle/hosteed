// Script de test pour vérifier le système de validation et d'historique
import prisma from './lib/prisma'
import { ProductValidation } from '@prisma/client'

async function testValidationSystem() {
  try {
    console.log("🧪 Test du système de validation et d'historique...")

    // 1. Vérifier qu'il y a des produits en attente
    const pendingProducts = await prisma.product.findMany({
      where: {
        validate: ProductValidation.NotVerified,
      },
      take: 1,
    })

    if (pendingProducts.length === 0) {
      console.log('❌ Aucun produit en attente trouvé')
      return
    }

    const product = pendingProducts[0]
    console.log(`✅ Produit trouvé: ${product.name} (ID: ${product.id})`)

    // 2. Vérifier que les tables d'historique existent
    const historyCount = await prisma.validationHistory.count()
    const commentsCount = await prisma.validationComment.count()

    console.log(`📊 Historique existant: ${historyCount} entrées`)
    console.log(`💬 Commentaires existants: ${commentsCount} entrées`)

    // 3. Créer une entrée de test dans l'historique
    const testHistory = await prisma.validationHistory.create({
      data: {
        productId: product.id,
        previousStatus: ProductValidation.NotVerified,
        newStatus: ProductValidation.NotVerified,
        reason: "Test d'historique automatique",
        adminId: null, // Test sans admin
      },
    })

    console.log(`✅ Entrée d'historique créée: ${testHistory.id}`)

    // 4. Récupérer l'historique du produit
    const productHistory = await prisma.validationHistory.findMany({
      where: { productId: product.id },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            lastname: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    console.log(`📚 Historique du produit (${productHistory.length} entrées):`)
    productHistory.forEach((entry, index: number) => {
      console.log(`  ${index + 1}. ${entry.previousStatus} → ${entry.newStatus}`)
      console.log(`     Raison: ${entry.reason}`)
      console.log(`     Date: ${entry.createdAt}`)
      console.log(`     Admin: ${entry.admin?.name || 'Système'}`)
    })

    console.log('✅ Test terminé avec succès!')
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testValidationSystem()
