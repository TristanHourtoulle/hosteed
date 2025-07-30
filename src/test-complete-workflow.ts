// Script de test pour simuler le workflow complet de validation
import prisma from './lib/prisma'
import { ProductValidation } from '@prisma/client'

async function testCompleteValidationWorkflow() {
  try {
    console.log('🧪 Test du workflow complet de validation...\n')

    // 1. Trouver un produit à tester
    const testProduct = await prisma.product.findFirst({
      where: {
        validate: {
          in: [ProductValidation.NotVerified, ProductValidation.RecheckRequest],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!testProduct) {
      console.log('❌ Aucun produit disponible pour le test')
      return
    }

    console.log(`✅ Produit trouvé: "${testProduct.name}"`)
    console.log(`   Statut actuel: ${testProduct.validate}`)
    console.log(`   Propriétaire: ${testProduct.user[0]?.name || testProduct.user[0]?.email}`)
    console.log('')

    // 2. Simuler une demande de révision (admin demande des modifications)
    console.log('📝 Simulation: Admin demande une révision...')

    await prisma.$transaction(async tx => {
      // Mettre à jour le produit
      await tx.product.update({
        where: { id: testProduct!.id },
        data: { validate: ProductValidation.RecheckRequest },
      })

      // Créer l'historique
      await tx.validationHistory.create({
        data: {
          productId: testProduct!.id,
          previousStatus: testProduct!.validate,
          newStatus: ProductValidation.RecheckRequest,
          adminId: testProduct!.user[0]?.id, // Simule un admin
          reason: 'Test: Photos à améliorer, description trop courte',
        },
      })
    })

    console.log('   ✅ Statut mis à jour vers "RecheckRequest"')
    console.log('')

    // 3. Simuler des modifications par l'hôte
    console.log('🔧 Simulation: Hôte fait des modifications...')

    await prisma.$transaction(async tx => {
      // Mettre à jour le produit (statut passe à NotVerified)
      await tx.product.update({
        where: { id: testProduct!.id },
        data: {
          validate: ProductValidation.NotVerified,
          description: testProduct!.description + " [MODIFIÉ PAR L'HÔTE]",
        },
      })

      // Créer l'historique
      await tx.validationHistory.create({
        data: {
          productId: testProduct!.id,
          previousStatus: ProductValidation.RecheckRequest,
          newStatus: ProductValidation.NotVerified,
          hostId: testProduct!.user[0]?.id,
          reason: "Modifications apportées par l'hôte suite à une demande de révision",
        },
      })
    })

    console.log('   ✅ Statut mis à jour vers "NotVerified" (Modifié - À revalider)')
    console.log('')

    // 4. Afficher l'historique complet
    console.log('📚 Historique des validations:')
    const history = await prisma.validationHistory.findMany({
      where: { productId: testProduct.id },
      include: {
        admin: {
          select: { name: true, email: true },
        },
        host: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    history.forEach((entry, index) => {
      const actor = entry.admin
        ? `Admin: ${entry.admin.name || entry.admin.email}`
        : entry.host
          ? `Hôte: ${entry.host.name || entry.host.email}`
          : 'Système'

      console.log(`   ${index + 1}. ${entry.previousStatus} → ${entry.newStatus}`)
      console.log(`      Par: ${actor}`)
      console.log(`      Raison: ${entry.reason}`)
      console.log(`      Date: ${new Date(entry.createdAt).toLocaleString('fr-FR')}`)
      console.log('')
    })

    // 5. Vérifier le statut enrichi (pour l'affichage)
    const enrichedProduct = await prisma.product.findUnique({
      where: { id: testProduct.id },
      include: {
        validationHistory: {
          orderBy: { createdAt: 'desc' },
          take: 2,
          include: {
            host: { select: { id: true } },
            admin: { select: { id: true } },
          },
        },
      },
    })

    if (enrichedProduct && enrichedProduct.validationHistory.length >= 2) {
      const [latest, previous] = enrichedProduct.validationHistory
      const isRecentlyModified =
        previous.newStatus === ProductValidation.RecheckRequest &&
        latest.newStatus === ProductValidation.NotVerified &&
        latest.hostId !== null

      console.log("🎯 Statut d'affichage pour l'admin:")
      if (isRecentlyModified) {
        console.log('   📋 Badge: "Modifié - À revalider" (bleu)')
        console.log('   📂 Onglet: "Modifiées" dans l\'admin')
      } else {
        console.log('   📋 Badge: "En attente" (jaune)')
        console.log('   📂 Onglet: "Nouvelles" dans l\'admin')
      }
    }

    console.log('\n✅ Test terminé avec succès!')
    console.log(
      "💡 Maintenant l'admin peut voir clairement que des modifications ont été apportées!"
    )
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCompleteValidationWorkflow()
