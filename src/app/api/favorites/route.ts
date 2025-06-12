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

    const favorite = await addToFavorites(session.user.id, productId)
    if (!favorite) {
      return NextResponse.json({ error: "Erreur lors de l'ajout aux favoris" }, { status: 500 })
    }

    return NextResponse.json({ success: true, favorite })
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

    const favorite = await removeFromFavorites(session.user.id, productId)
    if (!favorite) {
      return NextResponse.json(
        { error: 'Erreur lors de la suppression des favoris' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
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
