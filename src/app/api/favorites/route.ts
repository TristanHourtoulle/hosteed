import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  addToFavorites,
  removeFromFavorites,
  getUserFavorites,
} from '@/lib/services/favorites.service'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { productId } = await req.json()
    if (!productId) {
      return NextResponse.json({ error: 'ID du produit requis' }, { status: 400 })
    }

    const result = await addToFavorites(session.user.id, productId)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in POST /api/favorites:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { productId } = await req.json()
    if (!productId) {
      return NextResponse.json({ error: 'ID du produit requis' }, { status: 400 })
    }

    const result = await removeFromFavorites(session.user.id, productId)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in DELETE /api/favorites:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const favorites = await getUserFavorites(session.user.id)
    return NextResponse.json({ favorites })
  } catch (error) {
    console.error('Error in GET /api/favorites:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
