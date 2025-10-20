#!/usr/bin/env node

/**
 * Script de seed pour le système de retrait
 *
 * Crée des données de test :
 * - Réservations payées pour simuler un solde
 * - Comptes de paiement
 * - Quelques demandes de retrait en différents statuts
 *
 * Usage: node scripts/seed-withdrawal-data.js
 */

const {
  PrismaClient,
  PaymentStatus,
  PaymentMethod,
  WithdrawalType,
  WithdrawalStatus,
} = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seed des données de retrait...\n')

  // 1. Récupérer un hôte existant (ou créer un hôte de test)
  let host = await prisma.user.findFirst({
    where: {
      roles: {
        in: ['HOST', 'HOST_VERIFIED', 'HOST_MANAGER'],
      },
    },
  })

  if (!host) {
    console.log("❌ Aucun hôte trouvé. Créez d'abord un utilisateur avec le rôle HOST.")
    return
  }

  console.log(`✅ Hôte trouvé: ${host.name} (${host.email})`)
  console.log(`   ID: ${host.id}\n`)

  // 2. Récupérer un produit (n'importe lequel pour le test)
  const product = await prisma.product.findFirst()

  if (!product) {
    console.log('❌ Aucun produit validé trouvé.')
    console.log("💡 Créez d'abord un produit validé dans l'application.")
    return
  }

  console.log(`✅ Produit trouvé: ${product.name}`)
  console.log(`   ID: ${product.id}`)
  console.log(`   Note: Les réservations seront créées pour ce produit\n`)

  // 3. Créer des réservations payées pour simuler un solde
  console.log('📝 Création de réservations payées...')

  const reservations = []
  const baseDate = new Date('2025-01-15')

  for (let i = 0; i < 5; i++) {
    const arrivingDate = new Date(baseDate)
    arrivingDate.setDate(baseDate.getDate() + i * 10)

    const leavingDate = new Date(arrivingDate)
    leavingDate.setDate(arrivingDate.getDate() + 3)

    const price = 150 + i * 50 // 150€, 200€, 250€, etc.

    try {
      const rent = await prisma.rent.create({
        data: {
          productId: product.id,
          userId: host.id,
          arrivingDate,
          leavingDate,
          peopleNumber: BigInt(2),
          prices: price.toString(),
          payment: PaymentStatus.CLIENT_PAID,
          status: 'CONFIRMED',
          confirmed: true,
          arriving: 14,
          leaving: 11,
        },
      })

      reservations.push(rent)
      console.log(`   ✅ Réservation ${i + 1}: ${price}€ (${arrivingDate.toLocaleDateString()})`)
    } catch (error) {
      console.log(`   ⚠️  Réservation ${i + 1} ignorée (peut-être déjà existante)`)
    }
  }

  const totalEarned = reservations.reduce((sum, r) => sum + parseFloat(r.prices), 0)
  console.log(`\n💰 Total gagné simulé: ${totalEarned}€\n`)

  // 4. Créer des comptes de paiement de test
  console.log('📝 Création de comptes de paiement...')

  const paymentAccounts = []

  // Compte SEPA (par défaut)
  try {
    const sepaAccount = await prisma.paymentAccount.create({
      data: {
        userId: host.id,
        method: PaymentMethod.SEPA_VIREMENT,
        accountHolderName: host.name || 'Jean Dupont',
        iban: 'FR7630001007941234567890185',
        isDefault: true,
        isValidated: true, // Pré-validé pour les tests
        validatedAt: new Date(),
      },
    })
    paymentAccounts.push(sepaAccount)
    console.log(`   ✅ Compte SEPA créé (validé)`)
  } catch (error) {
    console.log(`   ⚠️  Compte SEPA déjà existant`)
  }

  // Compte Mobile Money
  try {
    const mobileAccount = await prisma.paymentAccount.create({
      data: {
        userId: host.id,
        method: PaymentMethod.MOBILE_MONEY,
        accountHolderName: host.name || 'Jean Dupont',
        mobileNumber: '+261 32 12 345 67',
        isDefault: false,
        isValidated: false, // Non validé pour tester le workflow
      },
    })
    paymentAccounts.push(mobileAccount)
    console.log(`   ✅ Compte Mobile Money créé (non validé)`)
  } catch (error) {
    console.log(`   ⚠️  Compte Mobile Money déjà existant`)
  }

  // Compte PayPal
  try {
    const paypalAccount = await prisma.paymentAccount.create({
      data: {
        userId: host.id,
        method: PaymentMethod.PAYPAL,
        accountHolderName: host.name || 'Jean Dupont',
        paypalEmail: host.email,
        paypalUsername: 'jean.dupont',
        paypalPhone: '+33612345678',
        isDefault: false,
        isValidated: true, // Pré-validé
        validatedAt: new Date(),
      },
    })
    paymentAccounts.push(paypalAccount)
    console.log(`   ✅ Compte PayPal créé (validé)`)
  } catch (error) {
    console.log(`   ⚠️  Compte PayPal déjà existant`)
  }

  console.log('')

  // 5. Créer des demandes de retrait de test avec différents statuts
  console.log('📝 Création de demandes de retrait...')

  const validatedAccount = paymentAccounts.find(a => a.isValidated)

  if (validatedAccount) {
    // Demande PENDING
    try {
      await prisma.withdrawalRequest.create({
        data: {
          userId: host.id,
          amount: 100,
          availableBalance: totalEarned,
          withdrawalType: WithdrawalType.PARTIAL_50,
          paymentAccountId: validatedAccount.id,
          paymentMethod: validatedAccount.method,
          paymentDetails: {
            accountHolderName: validatedAccount.accountHolderName,
            iban: validatedAccount.iban,
            method: validatedAccount.method,
          },
          status: WithdrawalStatus.PENDING,
          notes: 'Demande de test - En attente',
        },
      })
      console.log(`   ✅ Demande PENDING créée (100€)`)
    } catch (error) {
      console.log(`   ⚠️  Demande PENDING déjà existante`)
    }

    // Demande APPROVED
    try {
      await prisma.withdrawalRequest.create({
        data: {
          userId: host.id,
          amount: 200,
          availableBalance: totalEarned,
          withdrawalType: WithdrawalType.FULL_100,
          paymentAccountId: validatedAccount.id,
          paymentMethod: validatedAccount.method,
          paymentDetails: {
            accountHolderName: validatedAccount.accountHolderName,
            iban: validatedAccount.iban,
            method: validatedAccount.method,
          },
          status: WithdrawalStatus.APPROVED,
          notes: 'Demande de test - Approuvée',
          adminNotes: 'Approuvé pour test',
          processedAt: new Date(),
        },
      })
      console.log(`   ✅ Demande APPROVED créée (200€)`)
    } catch (error) {
      console.log(`   ⚠️  Demande APPROVED déjà existante`)
    }

    // Demande PAID
    try {
      await prisma.withdrawalRequest.create({
        data: {
          userId: host.id,
          amount: 150,
          availableBalance: totalEarned,
          withdrawalType: WithdrawalType.PARTIAL_50,
          paymentAccountId: validatedAccount.id,
          paymentMethod: validatedAccount.method,
          paymentDetails: {
            accountHolderName: validatedAccount.accountHolderName,
            iban: validatedAccount.iban,
            method: validatedAccount.method,
          },
          status: WithdrawalStatus.PAID,
          notes: 'Demande de test - Payée',
          processedAt: new Date(Date.now() - 86400000), // Il y a 1 jour
          paidAt: new Date(),
        },
      })
      console.log(`   ✅ Demande PAID créée (150€)`)
    } catch (error) {
      console.log(`   ⚠️  Demande PAID déjà existante`)
    }
  }

  const nonValidatedAccount = paymentAccounts.find(a => !a.isValidated)

  if (nonValidatedAccount) {
    // Demande ACCOUNT_VALIDATION
    try {
      await prisma.withdrawalRequest.create({
        data: {
          userId: host.id,
          amount: 75,
          availableBalance: totalEarned,
          withdrawalType: WithdrawalType.PARTIAL_50,
          paymentAccountId: nonValidatedAccount.id,
          paymentMethod: nonValidatedAccount.method,
          paymentDetails: {
            accountHolderName: nonValidatedAccount.accountHolderName,
            mobileNumber: nonValidatedAccount.mobileNumber,
            method: nonValidatedAccount.method,
          },
          status: WithdrawalStatus.ACCOUNT_VALIDATION,
          notes: 'Demande de test - En attente de validation du compte',
        },
      })
      console.log(`   ✅ Demande ACCOUNT_VALIDATION créée (75€)`)
    } catch (error) {
      console.log(`   ⚠️  Demande ACCOUNT_VALIDATION déjà existante`)
    }
  }

  console.log('\n✨ Seed terminé avec succès!\n')
  console.log('📊 Résumé:')
  console.log(`   - Hôte: ${host.name} (${host.email})`)
  console.log(`   - Réservations payées: ${reservations.length}`)
  console.log(`   - Montant total gagné: ${totalEarned}€`)
  console.log(`   - Comptes de paiement: ${paymentAccounts.length}`)
  console.log(`   - Demandes de retrait: 4 (différents statuts)`)
  console.log('\n🔗 Pour tester:')
  console.log(`   1. Connectez-vous en tant que ${host.email}`)
  console.log(`   2. Allez sur: http://localhost:3000/dashboard/host/withdrawals`)
  console.log(`   3. Vous verrez votre solde et vos demandes de retrait\n`)
}

main()
  .catch(e => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
