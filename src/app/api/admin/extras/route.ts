import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ExtraPriceType } from '@prisma/client'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.roles || !['ADMIN', 'HOST_MANAGER'].includes(session.user.roles)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const extras = await prisma.productExtra.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    })

    return NextResponse.json(extras)
  } catch (error) {
    console.error('Erreur lors de la récupération des extras:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.roles || !['ADMIN', 'HOST_MANAGER'].includes(session.user.roles)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, priceEUR, priceMGA, type } = body

    if (!name || !priceEUR || !priceMGA || !type) {
      return NextResponse.json(
        {
          error:
            'Tous les champs obligatoires doivent être renseignés (name, priceEUR, priceMGA, type)',
        },
        { status: 400 }
      )
    }

    // Vérifier que le type est valide
    if (!Object.values(ExtraPriceType).includes(type)) {
      return NextResponse.json({ error: 'Type de tarification invalide' }, { status: 400 })
    }

    const extra = await prisma.productExtra.create({
      data: {
        name,
        description: description || null,
        priceEUR: parseFloat(priceEUR),
        priceMGA: parseFloat(priceMGA),
        type,
      },
    })

    return NextResponse.json(extra, { status: 201 })
  } catch (error) {
    console.error("Erreur lors de la création de l'extra:", error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
