import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { productIds } = await request.json()

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'Product IDs requis' },
        { status: 400 }
      )
    }

    // Get all favorites for this user that match the product IDs
    const favorites = await prisma.favorite.findMany({
      where: {
        userId: session.user.id,
        productId: {
          in: productIds
        }
      },
      select: {
        productId: true
      }
    })

    // Create a map of productId -> isFavorite
    const favoriteMap = productIds.reduce((acc, productId) => {
      acc[productId] = favorites.some(fav => fav.productId === productId)
      return acc
    }, {} as Record<string, boolean>)

    return NextResponse.json(favoriteMap)
  } catch (error) {
    console.error('Erreur lors de la vérification bulk des favoris:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}