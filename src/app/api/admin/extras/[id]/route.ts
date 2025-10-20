import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ExtraPriceType } from '@prisma/client'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()

    if (!session?.user?.roles || !['ADMIN', 'HOST_MANAGER'].includes(session.user.roles)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const resolvedParams = await params
    const extra = await prisma.productExtra.findUnique({
      where: { id: resolvedParams.id },
      include: {
        products: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!extra) {
      return NextResponse.json({ error: 'Extra non trouvé' }, { status: 404 })
    }

    return NextResponse.json(extra)
  } catch (error) {
    console.error("Erreur lors de la récupération de l'extra:", error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()

    if (!session?.user?.roles || !['ADMIN', 'HOST_MANAGER'].includes(session.user.roles)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const resolvedParams = await params
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

    const extra = await prisma.productExtra.update({
      where: { id: resolvedParams.id },
      data: {
        name,
        description: description || null,
        priceEUR: parseFloat(priceEUR),
        priceMGA: parseFloat(priceMGA),
        type,
      },
    })

    return NextResponse.json(extra)
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'extra:", error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.roles || !['ADMIN', 'HOST_MANAGER'].includes(session.user.roles)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const resolvedParams = await params

    // Vérifier si l'extra est utilisé par des produits ou des réservations
    const extraWithUsage = await prisma.productExtra.findUnique({
      where: { id: resolvedParams.id },
      include: {
        _count: {
          select: {
            products: true,
            rentExtras: true,
          },
        },
      },
    })

    if (!extraWithUsage) {
      return NextResponse.json({ error: 'Extra non trouvé' }, { status: 404 })
    }

    if (extraWithUsage._count.products > 0 || extraWithUsage._count.rentExtras > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer un extra utilisé par des produits ou des réservations' },
        { status: 400 }
      )
    }

    await prisma.productExtra.delete({
      where: { id: resolvedParams.id },
    })

    return NextResponse.json({ message: 'Extra supprimé avec succès' })
  } catch (error) {
    console.error("Erreur lors de la suppression de l'extra:", error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
