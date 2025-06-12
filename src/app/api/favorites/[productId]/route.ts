import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isFavorite } from '@/lib/services/favorites.service'

export async function GET(req: Request, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { productId } = await params
    if (!productId) {
      return NextResponse.json({ error: 'ID du produit requis' }, { status: 400 })
    }

    const isProductFavorite = await isFavorite(session.user.id, productId)
    return NextResponse.json({ isFavorite: isProductFavorite })
  } catch (error) {
    console.error('Error in GET /api/favorites/[productId]:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
