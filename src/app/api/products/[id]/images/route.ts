import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

/**
 * PUT /api/products/[id]/images
 *
 * Met à jour les images d'un produit avec des URLs (après upload WebP)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      include: { user: true },
    })

    if (!product) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 })
    }

    const isOwner = product.user.some((u) => u.id === session.user.id)
    if (!isOwner) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Créer les nouvelles images
    await prisma.images.createMany({
      data: imageUrls.map((url) => ({
        img: url,
        productId: productId,
      })),
    })

    console.log(`✅ Added ${imageUrls.length} images to product ${productId}`)

    return NextResponse.json({
      success: true,
      count: imageUrls.length,
    })
  } catch (error) {
    console.error('❌ Error updating product images:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
