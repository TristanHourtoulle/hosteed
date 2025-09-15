const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

// Images de test (base64 réduites pour éviter trop de données)
const sampleImages = [
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQEBAQIBAQECAgICAgQDAgICAgUEBAMEBgUGBgYFBgYGBwkIBgcJBwYGCAsICQoKCgoKBggLDAsKDAkKCgr/2wBDAQICAgICAgUDAwUKBwYHCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgr/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwDX/9k=',
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQEBAQIBAQECAgICAgQDAgICAgUEBAMEBgUGBgYFBgYGBwkIBgcJBwYGCAsICQoKCgoKBggLDAsKDAkKCgr/2wBDAQICAgICAgUDAwUKBwYHCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgr/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwDX/9k=',
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQEBAQIBAQECAgICAgQDAgICAgUEBAMEBgUGBgYFBgYGBwkIBgcJBwYGCAsICQoKCgoKBggLDAsKDAkKCgr/2wBDAQICAgICAgUDAwUKBwYHCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgr/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwDX/9k=',
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQEBAQIBAQECAgICAgQDAgICAgUEBAMEBgUGBgYFBgYGBwkIBgcJBwYGCAsICQoKCgoKBggLDAsKDAkKCgr/2wBDAQICAgICAgUDAwUKBwYHCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgr/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwDX/9k=',
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQEBAQIBAQECAgICAgQDAgICAgUEBAMEBgUGBgYFBgYGBwkIBgcJBwYGCAsICQoKCgoKBggLDAsKDAkKCgr/2wBDAQICAgICAgUDAwUKBwYHCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgr/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwDX/9k='
];

const productNames = [
  'Villa luxueuse avec piscine privée',
  'Appartement moderne centre-ville',
  'Maison traditionnelle vue mer', 
  'Studio cosy quartier historique',
  'Penthouse avec terrasse panoramique',
  'Cottage rustique campagne',
  'Loft industriel rénové',
  'Bungalow tropical plage',
  'Châlet montagne authentique',
  'Suite familiale resort',
];

const descriptions = [
  'Magnifique propriété située dans un cadre exceptionnel, offrant tout le confort moderne pour un séjour inoubliable.',
  'Hébergement idéalement placé au cœur de la ville, parfait pour découvrir toutes les attractions locales.',
  'Charmante habitation alliant tradition et modernité, avec une vue imprenable sur les environs.',
  'Espace cozy et bien équipé, parfait pour un séjour romantique ou professionnel en toute tranquillité.',
  'Logement haut de gamme avec des prestations exceptionnelles et des vues à couper le souffle.',
];

const addresses = [
  'Nosy Be, Madagascar',
  'Antananarivo, Madagascar', 
  'Morondava, Madagascar',
  'Antsirabe, Madagascar',
  'Toamasina, Madagascar',
  'Fianarantsoa, Madagascar',
  'Mahajanga, Madagascar',
  'Sambava, Madagascar',
  'Toliara, Madagascar',
  'Ambositra, Madagascar',
];

const coordinates = [
  { lat: -13.3167, lng: 48.2833 }, // Nosy Be
  { lat: -18.8792, lng: 47.5079 }, // Antananarivo
  { lat: -20.2833, lng: 44.3167 }, // Morondava
  { lat: -19.8667, lng: 47.0333 }, // Antsirabe
  { lat: -18.1667, lng: 49.4000 }, // Toamasina
  { lat: -21.4500, lng: 47.0833 }, // Fianarantsoa
  { lat: -15.7167, lng: 46.3167 }, // Mahajanga
  { lat: -14.2667, lng: 50.1667 }, // Sambava
  { lat: -23.3500, lng: 43.6667 }, // Toliara
  { lat: -20.5333, lng: 47.2500 }, // Ambositra
];

async function createTestAdmin() {
  console.log('🔐 Création du compte admin de test...');
  
  const adminPassword = 'TestAdmin123!';
  const hashedPassword = await hash(adminPassword, 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'test.admin@hosteed.com' },
    update: {},
    create: {
      name: 'Test',
      lastname: 'Admin',
      email: 'test.admin@hosteed.com',
      password: hashedPassword,
      roles: 'ADMIN',
      isVerifiedTraveler: true,
      isAccountConfirmed: true,
      emailVerified: new Date(),
    },
  });

  console.log('✅ Compte admin créé:');
  console.log('📧 Email: test.admin@hosteed.com');
  console.log('🔑 Mot de passe: TestAdmin123!');
  console.log('👤 ID:', admin.id);
  
  return admin;
}

async function createTestHost() {
  console.log('🏠 Création du compte hôte de test...');
  
  const hostPassword = 'TestHost123!';
  const hashedPassword = await hash(hostPassword, 12);
  
  const host = await prisma.user.upsert({
    where: { email: 'test.host@hosteed.com' },
    update: {},
    create: {
      name: 'Host',
      lastname: 'Manager',
      email: 'test.host@hosteed.com',
      password: hashedPassword,
      roles: 'HOST_MANAGER',
      isVerifiedTraveler: true,
      isAccountConfirmed: true,
      emailVerified: new Date(),
    },
  });

  console.log('✅ Compte hôte créé:');
  console.log('📧 Email: test.host@hosteed.com');
  console.log('🔑 Mot de passe: TestHost123!');
  console.log('👤 ID:', host.id);
  
  return host;
}

async function createTestProducts(hostUserId, typeId) {
  console.log('🏨 Création de 30 produits avec 15 photos chacun...');
  
  const products = [];
  
  for (let i = 1; i <= 30; i++) {
    console.log(`📸 Création du produit ${i}/30...`);
    
    const randomName = productNames[i % productNames.length];
    const randomDescription = descriptions[i % descriptions.length];
    const randomAddress = addresses[i % addresses.length];
    const randomCoords = coordinates[i % coordinates.length];
    
    // Créer d'abord les images
    const imagePromises = [];
    for (let j = 1; j <= 15; j++) {
      const imagePromise = prisma.images.create({
        data: {
          img: sampleImages[j % sampleImages.length] // Cycle through sample images
        }
      });
      imagePromises.push(imagePromise);
    }
    
    const images = await Promise.all(imagePromises);
    
    // Créer le produit
    const product = await prisma.product.create({
      data: {
        name: `${randomName} #${i}`,
        description: `${randomDescription} Cette propriété unique offre ${i * 10} mètres carrés d'espace de vie.`,
        address: randomAddress,
        basePrice: (50 + (i * 10)).toString(),
        priceMGA: ((50 + (i * 10)) * 4000).toString(),
        room: BigInt(Math.min(1 + Math.floor(i / 5), 6)),
        bathroom: BigInt(Math.min(1 + Math.floor(i / 8), 4)),
        arriving: 14,
        leaving: 11,
        autoAccept: i % 3 === 0,
        categories: BigInt(1),
        minPeople: BigInt(1),
        maxPeople: BigInt(Math.min(2 + Math.floor(i / 3), 8)),
        commission: Math.floor(Math.random() * 15) + 5,
        validate: i % 4 === 0 ? 'NotVerified' : 'Approve', // 25% en attente de validation
        userManager: BigInt(1), // Will be connected to user below
        typeId: typeId,
        phone: '+261 34 12 34 567',
        phoneCountry: 'MG',
        latitude: randomCoords.lat + (Math.random() - 0.5) * 0.1, // Slight variation
        longitude: randomCoords.lng + (Math.random() - 0.5) * 0.1,
        certified: i % 5 === 0,
        contract: i % 3 === 0,
        isDraft: false,
        // Connect images
        img: {
          connect: images.map(img => ({ id: img.id }))
        },
        // Connect to host user
        user: {
          connect: { id: hostUserId }
        }
      }
    });
    
    products.push(product);
    
    // Log progress every 5 products
    if (i % 5 === 0) {
      console.log(`✨ ${i} produits créés avec ${i * 15} photos au total`);
    }
  }
  
  console.log('✅ 30 produits créés avec 450 photos au total!');
  return products;
}

async function main() {
  console.log('🚀 Démarrage du script de test de performance...\n');
  
  try {
    // Get or create TypeRent
    let typeRent = await prisma.typeRent.findFirst({
      where: { name: 'Villa' }
    });
    
    if (!typeRent) {
      typeRent = await prisma.typeRent.create({
        data: {
          name: 'Villa',
          description: 'Villa luxueuse',
          isHotelType: false
        }
      });
    }
    
    // Create test accounts
    const admin = await createTestAdmin();
    const host = await createTestHost();
    
    console.log('');
    
    // Create test products with images
    const products = await createTestProducts(host.id, typeRent.id);
    
    console.log('\n🎉 Script de test de performance terminé!');
    console.log('\n📊 Résultats:');
    console.log(`👤 1 compte admin: test.admin@hosteed.com (TestAdmin123!)`);
    console.log(`🏠 1 compte hôte: test.host@hosteed.com (TestHost123!)`);
    console.log(`🏨 30 produits avec 15 photos chacun = 450 photos`);
    console.log(`🔍 ${products.filter(p => p.validate === 'NotVerified').length} produits en attente de validation`);
    console.log(`✅ ${products.filter(p => p.validate === 'Approve').length} produits approuvés`);
    
    console.log('\n🧪 Tests de performance recommandés:');
    console.log('1. Page d\'accueil avec toutes les annonces');
    console.log('2. Dashboard admin avec pagination');
    console.log('3. Page de validation admin');
    console.log('4. Dashboard hôte avec ses annonces');
    
    console.log('\n⚡ Optimisations en place:');
    console.log('- Pagination (20 items par défaut)');
    console.log('- Images limitées (5 max pour les listes, 1 pour admin léger)');
    console.log('- Index de base de données');
    console.log('- Requêtes optimisées (évite N+1)');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution du script:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();