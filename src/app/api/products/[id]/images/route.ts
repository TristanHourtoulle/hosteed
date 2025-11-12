import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import fs from 'fs/promises'
import path from 'path'

/**
 * Delete physical image files from disk
 */
async function deleteImageFiles(imageUrl: string) {
  try {
    // Extract the base path from URL (e.g., /uploads/products/xxx/yyy)
    const urlPath = imageUrl.replace(/^https?:\/\/[^/]+/, '') // Remove domain if present

    // Images are stored in public directory in standalone mode, or directly in uploads in dev
    const publicDir = path.join(process.cwd(), 'public')
    const uploadsDir = path.join(process.cwd(), 'uploads')

    // Try to delete from both locations (one will fail silently)
    const pathsToTry = [
      path.join(publicDir, urlPath),
      path.join(uploadsDir, urlPath.replace('/uploads/', '')),
    ]

    for (const filePath of pathsToTry) {
      try {
        // Check if file exists before deleting
        await fs.access(filePath)

        // Delete all 3 sizes (thumb, medium, full)
        const dir = path.dirname(filePath)
        const filename = path.basename(filePath)
        const baseFilename = filename.replace(/-(?:thumb|medium|full)\.webp$/, '')

        // Delete thumb, medium, and full versions
        const sizes = ['thumb', 'medium', 'full']
        for (const size of sizes) {
          const sizeFile = path.join(dir, `${baseFilename}-${size}.webp`)
          try {
            await fs.unlink(sizeFile)
            console.log(`🗑️  Deleted ${size}: ${sizeFile}`)
          } catch (_err) { // eslint-disable-line @typescript-eslint/no-unused-vars
            // File might not exist, continue
          }
        }
      } catch (_err) { // eslint-disable-line @typescript-eslint/no-unused-vars
        // File doesn't exist in this location, try next
        continue
      }
    }
  } catch (error) {
    console.error('Error deleting image files:', error)
    // Don't throw - we want to continue even if file deletion fails
  }
}

/**
 * PUT /api/products/[id]/images
 *
 * Replace all product images (deletes old ones, adds new ones)
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id: productId } = await params
    const { imageUrls } = await request.json()

    if (!imageUrls || !Array.isArray(imageUrls)) {
      return NextResponse.json({ error: 'imageUrls doit être un tableau' }, { status: 400 })
    }

    // Vérifier que l'utilisateur est propriétaire du produit
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        owner: true,
        img: true, // Récupérer les images existantes
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 })
    }

    const isOwner = product.owner.id === session.user.id
    if (!isOwner) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Étape 1: Identifier les images à supprimer
    const currentImageUrls = product.img.map(img => img.img)
    const imagesToDelete = product.img.filter(img => !imageUrls.includes(img.img))

    console.log(
      `📊 Images: ${currentImageUrls.length} actuelles, ${imageUrls.length} nouvelles, ${imagesToDelete.length} à supprimer`
    )

    // Étape 2: Supprimer physiquement les fichiers des images retirées
    if (imagesToDelete.length > 0) {
      console.log('🗑️  Suppression des images retirées...')
      await Promise.all(imagesToDelete.map(img => deleteImageFiles(img.img)))

      // Étape 3: Supprimer les entrées en DB
      await prisma.images.deleteMany({
        where: {
          id: {
            in: imagesToDelete.map(img => img.id),
          },
        },
      })
      console.log(`✅ Deleted ${imagesToDelete.length} images from DB`)
    }

    // Étape 4: Ajouter uniquement les NOUVELLES images (celles qui ne sont pas déjà en DB)
    const newImageUrls = imageUrls.filter(url => !currentImageUrls.includes(url))

    if (newImageUrls.length > 0) {
      console.log(`📤 Adding ${newImageUrls.length} new images...`)
      const createdImages = await Promise.all(
        newImageUrls.map(url =>
          prisma.images.create({
            data: {
              img: url,
              Product: {
                connect: { id: productId },
              },
            },
          })
        )
      )
      console.log(`✅ Added ${createdImages.length} new images to product ${productId}`)
    }

    return NextResponse.json({
      success: true,
      deleted: imagesToDelete.length,
      added: newImageUrls.length,
      total: imageUrls.length,
    })
  } catch (error) {
    console.error('❌ Error updating product images:', error)
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
