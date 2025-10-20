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
    const service = await prisma.includedService.findUnique({
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

    if (!service) {
      return NextResponse.json({ error: 'Service inclus non trouvé' }, { status: 404 })
    }

    return NextResponse.json(service)
  } catch (error) {
    console.error('Erreur lors de la récupération du service inclus:', error)
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
      return NextResponse.json({ error: 'Le nom du service est requis' }, { status: 400 })
    }

    const service = await prisma.includedService.update({
      where: { id: resolvedParams.id },
      data: {
        name,
        description: description || null,
        icon: icon || null,
      },
    })

    return NextResponse.json(service)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du service inclus:', error)
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

    // Vérifier si le service est utilisé par des produits
    const serviceWithProducts = await prisma.includedService.findUnique({
      where: { id: resolvedParams.id },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    })

    if (!serviceWithProducts) {
      return NextResponse.json({ error: 'Service inclus non trouvé' }, { status: 404 })
    }

    if (serviceWithProducts._count.products > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer un service utilisé par des produits' },
        { status: 400 }
      )
    }

    await prisma.includedService.delete({
      where: { id: resolvedParams.id },
    })

    return NextResponse.json({ message: 'Service inclus supprimé avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression du service inclus:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
