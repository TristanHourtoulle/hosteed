import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ExtraPriceType } from '@prisma/client'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer les extras globaux (userId = null) et les extras personnels de l'utilisateur
    const extras = await prisma.productExtra.findMany({
      where: {
        OR: [
          { userId: null }, // Extras globaux
          { userId: session.user.id } // Extras personnels de l'utilisateur
        ]
      },
      orderBy: [
        { userId: 'asc' }, // Extras globaux en premier
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(extras)
  } catch (error) {
    console.error('Erreur lors de la récupération des extras:', error)
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
    const { name, description, priceEUR, priceMGA, type } = body

    if (!name || !priceEUR || !priceMGA || !type) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être renseignés (name, priceEUR, priceMGA, type)' },
        { status: 400 }
      )
    }

    // Vérifier que le type est valide
    if (!Object.values(ExtraPriceType).includes(type)) {
      return NextResponse.json(
        { error: 'Type de tarification invalide' },
        { status: 400 }
      )
    }

    // Validation des prix
    const priceEURFloat = parseFloat(priceEUR)
    const priceMGAFloat = parseFloat(priceMGA)
    
    if (isNaN(priceEURFloat) || priceEURFloat < 0) {
      return NextResponse.json(
        { error: 'Le prix en EUR doit être un nombre positif' },
        { status: 400 }
      )
    }
    
    if (isNaN(priceMGAFloat) || priceMGAFloat < 0) {
      return NextResponse.json(
        { error: 'Le prix en MGA doit être un nombre positif' },
        { status: 400 }
      )
    }

    // Créer un extra personnel pour cet utilisateur
    const extra = await prisma.productExtra.create({
      data: {
        name,
        description: description || null,
        priceEUR: priceEURFloat,
        priceMGA: priceMGAFloat,
        type,
        userId: session.user.id, // Extra personnel
      },
    })

    return NextResponse.json(extra, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création de l\'extra:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}