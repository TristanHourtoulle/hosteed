#!/usr/bin/env node

/**
 * Script pour tester la connexion SMTP sans envoyer d'emails
 * Usage: node scripts/test-smtp-connection.js hello@hosteed.com motdepasse
 */

const nodemailer = require('nodemailer');

async function testSMTPConnection(email, password) {
  console.log(`🧪 Test de connexion SMTP pour: ${email}`);
  
  const transport = nodemailer.createTransport({
    host: 'ssl0.ovh.net',
    port: 465,
    secure: true,
    auth: {
      user: email,
      pass: password,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  try {
    // Test de connexion uniquement (pas d'envoi)
    await transport.verify();
    console.log('✅ SUCCÈS - Connexion SMTP réussie !');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Mot de passe: ${password}`);
    console.log('\n🎉 Vous pouvez utiliser ces identifiants dans votre .env !');
    return true;
  } catch (error) {
    console.log('❌ ÉCHEC - Connexion SMTP impossible');
    console.log(`📧 Email testé: ${email}`);
    console.log(`🔑 Mot de passe testé: ${password}`);
    console.log(`🚫 Erreur: ${error.message}`);
    return false;
  } finally {
    transport.close();
  }
}

async function testMultiplePasswords(email, passwords) {
  console.log(`🔍 Test de ${passwords.length} mots de passe pour ${email}...\n`);
  
  for (let i = 0; i < passwords.length; i++) {
    const password = passwords[i];
    console.log(`[${i + 1}/${passwords.length}] Test: ${password.substring(0, 3)}${'*'.repeat(password.length - 3)}`);
    
    const success = await testSMTPConnection(email, password);
    
    if (success) {
      return password;
    }
    
    console.log(''); // Ligne vide pour lisibilité
    
    // Petite pause pour éviter de surcharger le serveur
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('💥 Aucun mot de passe testé ne fonctionne.');
  return null;
}

// Mots de passe courants à tester (vous pouvez les ajuster)
const commonPasswords = [
  'Hosteed2024!',
  'hosteed2024!', 
  'Hosteed123!',
  'hosteed123!',
  'Hello2024!',
  'hello2024!',
  'Hosteed@2024',
  'hosteed@2024',
  'Hello@2024',
  'hello@2024',
  'Hosteed2024',
  'hosteed2024',
  'Hello2024',
  'hello2024',
  // Pattern basé sur skillsnotation
  'ppffdP)7Ve2gBaM', // Au cas où le client réutilise
  'Hosteed)7Ve2gBaM',
  'hello)7Ve2gBaM',
];

async function main() {
  console.log('🏠 HOSTEED - Test Connexion SMTP\n');
  
  const email = process.argv[2];
  const singlePassword = process.argv[3];
  
  if (!email) {
    console.log('❌ Usage:');
    console.log('  Test un mot de passe: node scripts/test-smtp-connection.js hello@hosteed.com motdepasse');
    console.log('  Test plusieurs mots de passe: node scripts/test-smtp-connection.js hello@hosteed.com');
    process.exit(1);
  }

  if (singlePassword) {
    // Test d'un seul mot de passe
    await testSMTPConnection(email, singlePassword);
  } else {
    // Test de plusieurs mots de passe
    const foundPassword = await testMultiplePasswords(email, commonPasswords);
    
    if (foundPassword) {
      console.log('\n' + '='.repeat(50));
      console.log('🎯 MOT DE PASSE TROUVÉ !');
      console.log('='.repeat(50));
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 Mot de passe: ${foundPassword}`);
      console.log('\n📝 Ajoutez dans votre .env:');
      console.log(`EMAIL_LOGIN=${email}`);
      console.log(`EMAIL_PASSWORD=${foundPassword}`);
    } else {
      console.log('\n' + '='.repeat(50));
      console.log('😞 AUCUN MOT DE PASSE TROUVÉ');
      console.log('='.repeat(50));
      console.log('💡 Solutions alternatives:');
      console.log('1. Contactez le client pour le mot de passe');
      console.log('2. Vérifiez dans l\'espace OVH');
      console.log('3. Créez un nouveau compte email (ex: noreply@hosteed.com)');
    }
  }
}

// Lancement du script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testSMTPConnection, testMultiplePasswords };