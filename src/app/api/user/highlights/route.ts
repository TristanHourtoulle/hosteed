import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer les points forts globaux (userId = null) et les points forts personnels de l'utilisateur
    const highlights = await prisma.propertyHighlight.findMany({
      where: {
        OR: [
          { userId: null }, // Points forts globaux
          { userId: session.user.id }, // Points forts personnels de l'utilisateur
        ],
      },
      orderBy: [
        { userId: 'asc' }, // Points forts globaux en premier
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json(highlights)
  } catch (error) {
    console.error('Erreur lors de la récupération des points forts:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, icon } = body

    if (!name) {
      return NextResponse.json({ error: 'Le nom du point fort est requis' }, { status: 400 })
    }

    // Créer un point fort personnel pour cet utilisateur
    const highlight = await prisma.propertyHighlight.create({
      data: {
        name,
        description: description || null,
        icon: icon || null,
        userId: session.user.id, // Point fort personnel
      },
    })

    return NextResponse.json(highlight, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création du point fort:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
