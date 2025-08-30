import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.roles || !['ADMIN', 'HOST_MANAGER'].includes(session.user.roles)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const services = await prisma.includedService.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    return NextResponse.json(services)
  } catch (error) {
    console.error('Erreur lors de la récupération des services inclus:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.roles || !['ADMIN', 'HOST_MANAGER'].includes(session.user.roles)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, icon } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Le nom du service est requis' },
        { status: 400 }
      )
    }

    const service = await prisma.includedService.create({
      data: {
        name,
        description: description || null,
        icon: icon || null,
      },
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création du service inclus:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}