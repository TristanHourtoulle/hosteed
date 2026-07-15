import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { saveImages } from '@/lib/services/image.service'

/**
 * Entity types allowed to receive uploads. Doubles as a path allow-list: the value
 * becomes a directory segment under public/uploads, so it must never be free-form.
 */
const ALLOWED_ENTITY_TYPES = ['products', 'users', 'posts', 'type-rent', 'homepage'] as const

/**
 * Safe shape for an entity id used as a directory segment.
 * Deliberately excludes '.', '/' and '\' so no value can escape public/uploads
 * via path.join normalisation (e.g. '../../tmp').
 */
const SAFE_ENTITY_ID = /^[a-zA-Z0-9_-]+$/

/**
 * POST /api/images/upload
 *
 * Upload une ou plusieurs images
 * Convertit automatiquement en WebP et génère 3 tailles
 *
 * Requires an authenticated session. Ownership of the target entity is NOT checked
 * here on purpose: callers legitimately upload before the entity exists (the create
 * wizard uploads, then creates the product). Ownership is enforced by the entity-write
 * routes that persist these URLs.
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
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { images, entityType, entityId } = body

    // Validation
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 })
    }

    if (!entityType || !ALLOWED_ENTITY_TYPES.includes(entityType)) {
      return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 })
    }

    // entityId is used as a directory segment: reject anything that could traverse.
    if (!entityId || typeof entityId !== 'string' || !SAFE_ENTITY_ID.test(entityId)) {
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
