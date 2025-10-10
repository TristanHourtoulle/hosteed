#!/usr/bin/env node

/**
 * Sync Database Image URLs with Filesystem
 *
 * This script updates the database to match the actual WebP files on disk.
 * It handles cases where WebP migration was run multiple times, creating
 * different hashes for the same images.
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function syncDatabaseWithFilesystem() {
  console.log('🔄 Starting database-filesystem sync...\n')

  try {
    // Get all images from database
    const images = await prisma.images.findMany({
      where: {
        img: {
          startsWith: '/uploads/products/'
        }
      },
      include: {
        products: true
      }
    })

    console.log(`📊 Found ${images.length} images in database\n`)

    let updatedCount = 0
    let notFoundCount = 0
    let alreadyCorrectCount = 0

    for (const image of images) {
      const dbUrl = image.img

      // Parse the URL to extract product ID and image details
      const match = dbUrl.match(/\/uploads\/products\/([^/]+)\/img_(\d+)_(thumb|medium|full)_(\d+)_([a-f0-9]+)\.webp/)

      if (!match) {
        console.log(`⚠️  Skipping invalid URL format: ${dbUrl}`)
        continue
      }

      const [, productId, imageIndex, size, timestamp] = match

      // Build the directory path
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products', productId)

      if (!fs.existsSync(uploadsDir)) {
        console.log(`❌ Directory not found: ${uploadsDir}`)
        notFoundCount++
        continue
      }

      // Find all files for this image index and timestamp
      const files = fs.readdirSync(uploadsDir)
      const pattern = new RegExp(`^img_${imageIndex}_(thumb|medium|full)_${timestamp}_([a-f0-9]+)\\.webp$`)

      const matchingFiles = files.filter(f => pattern.test(f))

      if (matchingFiles.length === 0) {
        console.log(`❌ No matching files found for: ${dbUrl}`)
        console.log(`   Looking in: ${uploadsDir}`)
        console.log(`   Pattern: img_${imageIndex}_${size}_${timestamp}_*.webp`)
        notFoundCount++
        continue
      }

      // Find the file with the correct size (thumb, medium, or full)
      const correctFile = matchingFiles.find(f => f.includes(`_${size}_`))

      if (!correctFile) {
        console.log(`⚠️  No ${size} file found for image ${imageIndex}`)
        continue
      }

      const correctUrl = `/uploads/products/${productId}/${correctFile}`

      if (correctUrl === dbUrl) {
        alreadyCorrectCount++
        continue
      }

      // Update the database
      await prisma.images.update({
        where: { id: image.id },
        data: { img: correctUrl }
      })

      console.log(`✅ Updated: ${path.basename(dbUrl)} → ${path.basename(correctUrl)}`)
      updatedCount++
    }

    console.log('\n📊 Summary:')
    console.log(`   ✅ Updated: ${updatedCount}`)
    console.log(`   ✔️  Already correct: ${alreadyCorrectCount}`)
    console.log(`   ❌ Not found: ${notFoundCount}`)
    console.log(`   📁 Total processed: ${images.length}`)

  } catch (error) {
    console.error('❌ Error during sync:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
syncDatabaseWithFilesystem()
  .then(() => {
    console.log('\n✅ Database sync completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Database sync failed:', error)
    process.exit(1)
  })
