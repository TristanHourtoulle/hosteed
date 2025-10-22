import { NextRequest, NextResponse } from 'next/server'
import { saveImages } from '@/lib/services/image.service'

/**
 * POST /api/images/upload
 *
 * Upload une ou plusieurs images
 * Convertit automatiquement en WebP et génère 3 tailles
 *
 * Body:
 * {
 *   images: string[], // Base64 images
 *   entityType: 'products' | 'users' | 'posts' | 'type-rent' | 'homepage',
 *   entityId: string
 * }
 *
 * Response:
 * {
 *   success: true,
 *   images: [
 *     { thumb: '/uploads/...', medium: '/uploads/...', full: '/uploads/...' }
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { images, entityType, entityId } = body

    // Validation
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 })
    }

    if (
      !entityType ||
      !['products', 'users', 'posts', 'type-rent', 'homepage'].includes(entityType)
    ) {
      return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 })
    }

    if (!entityId || typeof entityId !== 'string') {
      return NextResponse.json({ error: 'Invalid entity ID' }, { status: 400 })
    }

    // Limiter à 20 images max pour éviter les abus
    if (images.length > 20) {
      return NextResponse.json({ error: 'Too many images (max 20)' }, { status: 400 })
    }

    console.log(`📤 Uploading ${images.length} images for ${entityType}/${entityId}`)

    // Sauvegarder toutes les images en parallèle
    const uploadedImages = await saveImages(images, { entityType, entityId })

    console.log(`✅ Successfully uploaded ${uploadedImages.length} images`)

    return NextResponse.json({
      success: true,
      images: uploadedImages,
      count: uploadedImages.length,
    })
  } catch (error) {
    console.error('❌ Error uploading images:', error)
    return NextResponse.json(
      {
        error: 'Failed to upload images',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
