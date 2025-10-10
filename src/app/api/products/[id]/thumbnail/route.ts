import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import sharp from 'sharp'

/**
 * GET /api/products/[id]/thumbnail
 *
 * Retourne une image thumbnail optimisée pour un produit
 * - Optimisation avec sharp (WebP, compression)
 * - Cache agressif (1 an)
 * - Lazy loading compatible
 *
 * Performance:
 * - Base64 dans JSON: ~500KB par image
 * - Cette route: ~10-20KB par image (-95%)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const productId = params.id

    // Récupérer la première image du produit
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        img: {
          take: 1,
          select: { img: true }
        }
      }
    })

    if (!product?.img?.[0]?.img) {
      // Retourner une image placeholder si pas d'image
      return new NextResponse('Product image not found', { status: 404 })
    }

    const imageData = product.img[0].img

    // Si l'image a déjà été migrée vers le file system (commence par /uploads/)
    // Rediriger vers le fichier statique
    if (imageData.startsWith('/uploads/')) {
      return NextResponse.redirect(new URL(imageData, request.url))
    }

    // Sinon, c'est encore du base64, on continue le traitement sharp
    let buffer: Buffer

    // Gérer les deux formats possibles de base64
    if (imageData.includes(',')) {
      // Format: data:image/jpeg;base64,/9j/4AAQ...
      buffer = Buffer.from(imageData.split(',')[1], 'base64')
    } else {
      // Format: /9j/4AAQ... (sans préfixe)
      buffer = Buffer.from(imageData, 'base64')
    }

    // Optimiser l'image avec sharp
    // - Resize à 300x200 (thumbnail pour la liste)
    // - Conversion WebP (80% plus léger que JPEG)
    // - Qualité 80 (bon compromis qualité/taille)
    const optimizedImage = await sharp(buffer)
      .resize(300, 200, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 80 })
      .toBuffer()

    // Retourner l'image avec cache agressif
    return new NextResponse(optimizedImage, {
      headers: {
        'Content-Type': 'image/webp',
        // Cache pendant 1 an (les images ne changent pas souvent)
        'Cache-Control': 'public, max-age=31536000, immutable',
        // Permettre lazy loading
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    const params = await context.params
    console.error(`Error generating thumbnail for product ${params.id}:`, error)
    return new NextResponse('Error generating thumbnail', { status: 500 })
  }
}
