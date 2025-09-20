const { PrismaClient } = require('@prisma/client')
const https = require('https')

const prisma = new PrismaClient()

// Images Unsplash par type d'hébergement (15+ images par type)
const unsplashImages = {
  villa: [
    'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600298881974-6be191ceeda1?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1566908829077-8a58e4c63ad7?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600298881974-6be191ceeda1?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600573472598-2f1c8a59e1b2?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600573472582-be6ee0e8099e?w=800&h=600&fit=crop'
  ],
  appartement: [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1502672220863-e0a7b9e84d1e?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1560448204-61dc36dc98c8?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1560449752-1f6d9a7a7c23?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1560448075-bb485b067938?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1560449286-20c8a17fd4a5?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1560449286-68943db5fcd4?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1560449752-1f6d9a7a7c23?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1560449752-1f6d9a7a7c23?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1560448075-cbc16bb4af8e?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1560449286-20c8a17fd4a5?w=800&h=600&fit=crop'
  ],
  maison: [
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600573472582-be6ee0e8099e?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600607687644-aac4c57db4ca?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600573472598-2f1c8a59e1b2?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&h=600&fit=crop'
  ],
  studio: [
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1502672220863-e0a7b9e84d1e?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1615875221860-4b695b29ff4c?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1560449752-1f6d9a7a7c23?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1560448204-61dc36dc98c8?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1560449752-1f6d9a7a7c23?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1560448075-bb485b067938?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1560449286-20c8a17fd4a5?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1560449286-68943db5fcd4?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1560448075-cbc16bb4af8e?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1615875221860-4b695b29ff4c?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1560449752-1f6d9a7a7c23?w=800&h=600&fit=crop'
  ],
  chalet: [
    'https://images.unsplash.com/photo-1549517045-bc93de075e53?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1585543805890-6051f7829f98?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1533582645421-dd0bb6b17b0e?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1549517045-bc93de075e53?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1585543805890-6051f7829f98?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1533582645421-dd0bb6b17b0e?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1549517045-bc93de075e53?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1585543805890-6051f7829f98?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1533582645421-dd0bb6b17b0e?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&fit=crop'
  ]
}

// Fonction pour télécharger une image et la convertir en base64
function downloadImageAsBase64(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`))
        return
      }

      let data = []
      response.on('data', (chunk) => data.push(chunk))
      response.on('end', () => {
        const buffer = Buffer.concat(data)
        const base64 = `data:image/jpeg;base64,${buffer.toString('base64')}`
        resolve(base64)
      })
      response.on('error', reject)
    }).on('error', reject)
  })
}

// Fonction pour déterminer le type d'hébergement à partir du nom
function getAccommodationType(productName) {
  const name = productName.toLowerCase()
  if (name.includes('villa')) return 'villa'
  if (name.includes('appartement')) return 'appartement'
  if (name.includes('maison')) return 'maison'
  if (name.includes('studio')) return 'studio'
  if (name.includes('chalet')) return 'chalet'
  return 'villa' // par défaut
}

async function addUnsplashImages() {
  try {
    console.log('🔍 Recherche des produits de test...')
    
    // Récupérer tous les produits de test
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: 'Villa' } },
          { name: { contains: 'Appartement' } },
          { name: { contains: 'Maison' } },
          { name: { contains: 'Chalet' } },
          { name: { contains: 'Studio' } }
        ]
      },
      include: {
        img: true
      }
    })

    console.log(`📦 ${products.length} produits trouvés`)

    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      const accommodationType = getAccommodationType(product.name)
      const imageUrls = unsplashImages[accommodationType] || unsplashImages.villa

      console.log(`\n🏠 Traitement: ${product.name} (${accommodationType})`)
      
      try {
        // Supprimer les anciennes images
        await prisma.images.deleteMany({
          where: { 
            Product: {
              some: { id: product.id }
            }
          }
        })

        // Prendre 15 images pour chaque produit
        const selectedImages = [...imageUrls].sort(() => Math.random() - 0.5).slice(0, 15)
        
        console.log(`   📸 Téléchargement de ${selectedImages.length} images...`)
        
        // Télécharger et sauvegarder chaque image
        for (let j = 0; j < selectedImages.length; j++) {
          const imageUrl = selectedImages[j]
          
          try {
            console.log(`   ⬇️  Image ${j + 1}/${selectedImages.length}...`)
            const base64Image = await downloadImageAsBase64(imageUrl)
            
            const newImage = await prisma.images.create({
              data: {
                img: base64Image,
                Product: {
                  connect: { id: product.id }
                }
              }
            })
            
            // Pause entre les téléchargements pour éviter le rate limiting
            await new Promise(resolve => setTimeout(resolve, 500))
          } catch (imgError) {
            console.error(`   ❌ Erreur image ${j + 1}:`, imgError.message)
          }
        }
        
        console.log(`   ✅ ${product.name} - Images mises à jour`)
      } catch (productError) {
        console.error(`❌ Erreur pour ${product.name}:`, productError.message)
      }
    }

    console.log('\n🎉 Mise à jour des images terminée!')
    
    // Vérification finale
    const updatedProducts = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: 'Villa' } },
          { name: { contains: 'Appartement' } },
          { name: { contains: 'Maison' } },
          { name: { contains: 'Chalet' } },
          { name: { contains: 'Studio' } }
        ]
      },
      include: {
        img: true
      }
    })

    console.log('\n📊 Résumé:')
    updatedProducts.forEach(p => {
      console.log(`   - ${p.name}: ${p.img.length} images`)
    })

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Lancer le script
addUnsplashImages()