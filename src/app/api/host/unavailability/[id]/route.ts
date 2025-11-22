import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  updateUnavailableRent,
  deleteUnavailableRent,
} from '@/lib/services/unavailableRent.service'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const resolvedParams = await params
    const unavailability = await prisma.unAvailableProduct.findUnique({
      where: { id: resolvedParams.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            owner: { select: { id: true } },
          },
        },
      },
    })

    if (!unavailability) {
      return NextResponse.json({ error: 'Indisponibilité non trouvée' }, { status: 404 })
    }

    // Vérifier que l'utilisateur est propriétaire
    const isOwner = unavailability.product.owner?.id === session.user.id
    if (!isOwner) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    return NextResponse.json(unavailability)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const resolvedParams = await params
    const body = await request.json()

    // Vérifier propriété
    const existing = await prisma.unAvailableProduct.findUnique({
      where: { id: resolvedParams.id },
      include: {
        product: {
          select: { owner: { select: { id: true } } },
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Indisponibilité non trouvée' }, { status: 404 })
    }

    const isOwner = existing.product.owner?.id === session.user.id
    if (!isOwner) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const updated = await updateUnavailableRent(resolvedParams.id, {
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      title: body.title,
      description: body.description,
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const resolvedParams = await params

    // Vérifier propriété
    const existing = await prisma.unAvailableProduct.findUnique({
      where: { id: resolvedParams.id },
      include: {
        product: {
          select: { owner: { select: { id: true } } },
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Indisponibilité non trouvée' }, { status: 404 })
    }

    const isOwner = existing.product.owner?.id === session.user.id
    if (!isOwner) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    await deleteUnavailableRent(resolvedParams.id)

    return NextResponse.json({ message: 'Indisponibilité supprimée' })
  } catch (_error) { // eslint-disable-line @typescript-eslint/no-unused-vars
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
