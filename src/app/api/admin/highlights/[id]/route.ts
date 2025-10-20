import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()

    if (!session?.user?.roles || !['ADMIN', 'HOST_MANAGER'].includes(session.user.roles)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const resolvedParams = await params
    const highlight = await prisma.propertyHighlight.findUnique({
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

    if (!highlight) {
      return NextResponse.json({ error: 'Point fort non trouvé' }, { status: 404 })
    }

    return NextResponse.json(highlight)
  } catch (error) {
    console.error('Erreur lors de la récupération du point fort:', error)
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
    const { name, description, icon } = body

    if (!name) {
      return NextResponse.json({ error: 'Le nom du point fort est requis' }, { status: 400 })
    }

    const highlight = await prisma.propertyHighlight.update({
      where: { id: resolvedParams.id },
      data: {
        name,
        description: description || null,
        icon: icon || null,
      },
    })

    return NextResponse.json(highlight)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du point fort:', error)
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

    // Vérifier si le point fort est utilisé par des produits
    const highlightWithProducts = await prisma.propertyHighlight.findUnique({
      where: { id: resolvedParams.id },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    })

    if (!highlightWithProducts) {
      return NextResponse.json({ error: 'Point fort non trouvé' }, { status: 404 })
    }

    if (highlightWithProducts._count.products > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer un point fort utilisé par des produits' },
        { status: 400 }
      )
    }

    await prisma.propertyHighlight.delete({
      where: { id: resolvedParams.id },
    })

    return NextResponse.json({ message: 'Point fort supprimé avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression du point fort:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
