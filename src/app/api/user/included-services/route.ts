import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer les services globaux (userId = null) et les services personnels de l'utilisateur
    const services = await prisma.includedService.findMany({
      where: {
        OR: [
          { userId: null }, // Services globaux
          { userId: session.user.id } // Services personnels de l'utilisateur
        ]
      },
      orderBy: [
        { userId: 'asc' }, // Services globaux en premier
        { createdAt: 'desc' }
      ]
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
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, icon } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Le nom du service est requis' },
        { status: 400 }
      )
    }

    // Créer un service personnel pour cet utilisateur
    const service = await prisma.includedService.create({
      data: {
        name,
        description: description || null,
        icon: icon || null,
        userId: session.user.id, // Service personnel
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