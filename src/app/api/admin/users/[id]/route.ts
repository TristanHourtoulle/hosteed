import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { deleteUser, getUserDeletionInfo } from '@/lib/services/user.service'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()

    if (!session?.user?.roles || !['ADMIN', 'HOST_MANAGER'].includes(session.user.roles)) {
      return NextResponse.json({ error: 'Acces non autorise' }, { status: 403 })
    }

    const { id } = await params
    const info = await getUserDeletionInfo(id)

    if (!info) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    }

    return NextResponse.json(info)
  } catch (error) {
    console.error('Error in GET /api/admin/users/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.roles || session.user.roles !== 'ADMIN') {
      return NextResponse.json({ error: 'Acces non autorise - Admin uniquement' }, { status: 403 })
    }

    const { id } = await params

    if (id === session.user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer votre propre compte' },
        { status: 400 }
      )
    }

    const result = await deleteUser(id)

    if (!result.success) {
      if (result.reason === 'NOT_FOUND') {
        return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
      }
      if (result.reason === 'ACTIVE_RESERVATIONS') {
        return NextResponse.json(
          {
            error: 'Impossible de supprimer cet utilisateur car il a des reservations actives',
            activeRentsAsGuest: result.activeRentsAsGuest,
            activeRentsAsHost: result.activeRentsAsHost,
          },
          { status: 409 }
        )
      }
    }

    return NextResponse.json({ message: 'Utilisateur supprime avec succes' })
  } catch (error) {
    console.error('Error in DELETE /api/admin/users/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.roles || !['ADMIN', 'HOST_MANAGER'].includes(session.user.roles)) {
      return NextResponse.json({ error: 'Acces non autorise' }, { status: 403 })
    }

    const { id } = await params

    const user = await prisma.user.update({
      where: { id },
      data: { emailVerified: new Date() },
      select: { id: true, email: true, emailVerified: true },
    })

    return NextResponse.json({ message: 'Email verifie avec succes', user })
  } catch (error) {
    console.error('Error in PATCH /api/admin/users/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
