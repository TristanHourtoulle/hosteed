import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id || session.user.roles !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const settings = await prisma.commissionSettings.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })

    if (!settings) {
      const defaultSettings = await prisma.commissionSettings.create({
        data: {
          hostCommissionRate: 0.0,
          hostCommissionFixed: 0.0,
          clientCommissionRate: 0.0,
          clientCommissionFixed: 0.0,
          isActive: true,
          createdBy: session.user.id
        }
      })
      return NextResponse.json(defaultSettings)
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres de commission:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id || session.user.roles !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      hostCommissionRate, 
      hostCommissionFixed, 
      clientCommissionRate, 
      clientCommissionFixed 
    } = body

    if (
      typeof hostCommissionRate !== 'number' ||
      typeof hostCommissionFixed !== 'number' ||
      typeof clientCommissionRate !== 'number' ||
      typeof clientCommissionFixed !== 'number' ||
      hostCommissionRate < 0 || hostCommissionRate > 1 ||
      clientCommissionRate < 0 || clientCommissionRate > 1 ||
      hostCommissionFixed < 0 ||
      clientCommissionFixed < 0
    ) {
      return NextResponse.json(
        { error: 'Valeurs de commission invalides' },
        { status: 400 }
      )
    }

    await prisma.commissionSettings.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    })

    const newSettings = await prisma.commissionSettings.create({
      data: {
        hostCommissionRate,
        hostCommissionFixed,
        clientCommissionRate,
        clientCommissionFixed,
        isActive: true,
        createdBy: session.user.id
      }
    })

    return NextResponse.json(newSettings)
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres de commission:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}