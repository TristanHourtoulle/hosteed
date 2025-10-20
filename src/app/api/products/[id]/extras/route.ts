import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  try {
    const productId = params.id

    if (!productId) {
      return NextResponse.json({ error: 'ID du produit requis' }, { status: 400 })
    }

    // Vérifier que le produit existe
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    })

    if (!product) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 })
    }

    // Récupérer les extras associés au produit
    const productExtras = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        extras: {
          select: {
            id: true,
            name: true,
            description: true,
            priceEUR: true,
            priceMGA: true,
            type: true,
            userId: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: [
            { userId: 'asc' }, // Extras globaux en premier
            { name: 'asc' },
          ],
        },
      },
    })

    const extras = productExtras?.extras || []

    return NextResponse.json(extras)
  } catch (error) {
    console.error('Erreur lors de la récupération des extras du produit:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
