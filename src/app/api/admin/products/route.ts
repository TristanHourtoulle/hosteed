import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.roles || !['ADMIN', 'HOST_MANAGER'].includes(session.user.roles)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        certified: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      products: products,
    })
  } catch (error) {
    console.error('Erreur lors du chargement des produits:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
