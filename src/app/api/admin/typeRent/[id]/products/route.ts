import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session || session.user.roles !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params

    const products = await prisma.product.findMany({
      where: {
        typeId: id,
      },
      select: {
        id: true,
        name: true,
        address: true,
        basePrice: true,
        maxPeople: true,
        validate: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des produits' },
      { status: 500 }
    )
  }
}