#!/usr/bin/env ts-node

/**
 * Script de test pour vérifier la configuration email Hosteed
 * Usage: npx ts-node scripts/test-emails.ts your-email@example.com
 */

import {
  sendContactEmail,
  sendBookingEmail,
  sendHostEmail,
  sendAdminEmail,
  sendNotificationEmail,
  sendWelcomeEmail,
  EmailType,
} from '../src/lib/services/hosteudEmail.service'

async function testAllEmailTypes(testEmail: string) {
  console.log("🧪 Début des tests d'envoi d'emails Hosteed...\n")

  const results: Array<{ type: string; success: boolean; error?: string }> = []

  // Test 1: Email de contact
  try {
    console.log('📧 Test Contact Email...')
    await sendContactEmail(
      testEmail,
      'Test Contact - Configuration',
      'Ceci est un email de test depuis contact@hosteed.fr pour vérifier la configuration.'
    )
    results.push({ type: 'Contact', success: true })
    console.log('✅ Contact email envoyé\n')
  } catch (error) {
    results.push({ type: 'Contact', success: false, error: String(error) })
    console.log('❌ Échec contact email:', error, '\n')
  }

  // Test 2: Email de réservation
  try {
    console.log('📧 Test Booking Email...')
    await sendBookingEmail(
      testEmail,
      'Test Réservation - Configuration',
      'Ceci est un email de test depuis booking@hosteed.fr pour vérifier la configuration des réservations.'
    )
    results.push({ type: 'Booking', success: true })
    console.log('✅ Booking email envoyé\n')
  } catch (error) {
    results.push({ type: 'Booking', success: false, error: String(error) })
    console.log('❌ Échec booking email:', error, '\n')
  }

  // Test 3: Email hôte
  try {
    console.log('📧 Test Host Email...')
    await sendHostEmail(
      testEmail,
      'Test Hôte - Configuration',
      'Ceci est un email de test depuis host@hosteed.fr pour vérifier la configuration des communications hôtes.'
    )
    results.push({ type: 'Host', success: true })
    console.log('✅ Host email envoyé\n')
  } catch (error) {
    results.push({ type: 'Host', success: false, error: String(error) })
    console.log('❌ Échec host email:', error, '\n')
  }

  // Test 4: Email admin
  try {
    console.log('📧 Test Admin Email...')
    await sendAdminEmail(
      testEmail,
      'Test Admin - Configuration',
      'Ceci est un email de test depuis admin@hosteed.fr pour vérifier la configuration admin.'
    )
    results.push({ type: 'Admin', success: true })
    console.log('✅ Admin email envoyé\n')
  } catch (error) {
    results.push({ type: 'Admin', success: false, error: String(error) })
    console.log('❌ Échec admin email:', error, '\n')
  }

  // Test 5: Email notification (noreply)
  try {
    console.log('📧 Test Notification Email...')
    await sendNotificationEmail(
      testEmail,
      'Test Notification - Configuration',
      'Ceci est un email de test depuis noreply@hosteed.fr pour vérifier la configuration des notifications.'
    )
    results.push({ type: 'Notification', success: true })
    console.log('✅ Notification email envoyé\n')
  } catch (error) {
    results.push({ type: 'Notification', success: false, error: String(error) })
    console.log('❌ Échec notification email:', error, '\n')
  }

  // Test 6: Email avec template
  try {
    console.log('📧 Test Template Email (Welcome)...')
    await sendWelcomeEmail(testEmail, {
      userName: 'Test User',
      verificationLink: 'https://hosteed.fr/verify/test-token',
      userId: 'test-user-id',
    })
    results.push({ type: 'Welcome Template', success: true })
    console.log('✅ Template welcome email envoyé\n')
  } catch (error) {
    results.push({ type: 'Welcome Template', success: false, error: String(error) })
    console.log('❌ Échec template email:', error, '\n')
  }

  // Résumé des résultats
  console.log('='.repeat(50))
  console.log('📊 RÉSUMÉ DES TESTS EMAIL')
  console.log('='.repeat(50))

  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  console.log(`✅ Succès: ${successful}/${results.length}`)
  console.log(`❌ Échecs: ${failed}/${results.length}\n`)

  if (failed > 0) {
    console.log('🔍 DÉTAILS DES ÉCHECS:')
    results
      .filter(r => !r.success)
      .forEach(result => {
        console.log(`• ${result.type}: ${result.error}`)
      })
    console.log('')
  }

  // Recommandations
  if (successful === results.length) {
    console.log('🎉 TOUS LES TESTS RÉUSSIS!')
    console.log('✨ Configuration email parfaite - prêt pour la production!')
  } else if (successful > 0) {
    console.log('⚠️  TESTS PARTIELLEMENT RÉUSSIS')
    console.log('🔧 Vérifiez la configuration pour les types qui ont échoué')
  } else {
    console.log('🚨 TOUS LES TESTS ONT ÉCHOUÉ')
    console.log('❗ Vérifiez votre configuration email de base (.env)')
  }

  console.log('')
  console.log('📋 Actions suggérées:')
  console.log('1. Vérifiez vos emails reçus dans le dossier spam aussi')
  console.log('2. Testez sur mail-tester.com pour vérifier la délivrabilité')
  console.log('3. Vérifiez les DNS avec nslookup si des échecs persistent')

  return {
    total: results.length,
    successful,
    failed,
    results,
  }
}

// Vérification des variables d'environnement
function checkEnvironmentConfig() {
  console.log('🔍 Vérification de la configuration...\n')

  const requiredVars = ['EMAIL_LOGIN', 'EMAIL_PASSWORD', 'DKIM_PRIVATE_KEY']

  const optionalVars = [
    'HOSTEED_CONTACT_EMAIL',
    'HOSTEED_BOOKING_EMAIL',
    'HOSTEED_HOST_EMAIL',
    'HOSTEED_ADMIN_EMAIL',
  ]

  let configIssues = 0

  console.log('📋 Variables requises:')
  requiredVars.forEach(varName => {
    const value = process.env[varName]
    if (value) {
      console.log(`✅ ${varName}: Configuré (${value.substring(0, 20)}...)`)
    } else {
      console.log(`❌ ${varName}: MANQUANT`)
      configIssues++
    }
  })

  console.log('\n📋 Variables optionnelles (emails spécialisés):')
  optionalVars.forEach(varName => {
    const value = process.env[varName]
    if (value) {
      console.log(`✅ ${varName}: ${value}`)
    } else {
      console.log(`⚠️  ${varName}: Non configuré (utilise défaut)`)
    }
  })

  console.log('')

  if (configIssues > 0) {
    console.log(`🚨 ${configIssues} variable(s) manquante(s) - les tests pourraient échouer`)
    return false
  } else {
    console.log('✅ Configuration de base OK - lancement des tests...\n')
    return true
  }
}

// Script principal
async function main() {
  console.log('🏠 HOSTEED - Test Configuration Email\n')

  const testEmail = process.argv[2]

  if (!testEmail) {
    console.log('❌ Usage: npx ts-node scripts/test-emails.ts your-email@example.com')
    console.log('📧 Remplacez "your-email@example.com" par votre vraie adresse email')
    process.exit(1)
  }

  console.log(`🎯 Email de test: ${testEmail}\n`)

  // Vérification configuration
  const configOk = checkEnvironmentConfig()

  if (!configOk) {
    console.log(
      '⚠️  Configuration incomplète - continuez uniquement si vous voulez tester partiellement'
    )
    console.log('   Appuyez sur Ctrl+C pour arrêter ou attendez 5 secondes...')
    await new Promise(resolve => setTimeout(resolve, 5000))
  }

  // Lancement des tests
  try {
    await testAllEmailTypes(testEmail)
  } catch (error) {
    console.error('💥 Erreur fatale lors des tests:', error)
    process.exit(1)
  }
}

// Lancement si script appelé directement
if (require.main === module) {
  main().catch(console.error)
}

export { testAllEmailTypes, checkEnvironmentConfig }
