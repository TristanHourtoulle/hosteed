import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  createUnavailableRent,
  findUnavailableByProductId,
  findUnavailableByHostId,
} from '@/lib/services/unavailableRent.service'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const productId = searchParams.get('productId')

    let unavailabilities
    if (productId) {
      // Vérifier que l'utilisateur est propriétaire du produit
      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          owner: { id: session.user.id },
        },
      })

      if (!product) {
        return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 })
      }

      unavailabilities = await findUnavailableByProductId(productId)
    } else {
      unavailabilities = await findUnavailableByHostId(session.user.id)
    }

    return NextResponse.json(unavailabilities)
  } catch (error) {
    console.error('Erreur lors de la récupération des indisponibilités:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { productId, startDate, endDate, title, description } = body

    // Validation
    if (!productId || !startDate || !endDate || !title) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }

    // Vérifier que l'utilisateur est propriétaire
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        owner: { id: session.user.id },
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 })
    }

    const unavailability = await createUnavailableRent(
      productId,
      new Date(startDate),
      new Date(endDate),
      title,
      description
    )

    return NextResponse.json(unavailability, { status: 201 })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
