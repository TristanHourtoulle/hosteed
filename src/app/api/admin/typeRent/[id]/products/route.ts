import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.roles || !['ADMIN', 'HOST_MANAGER'].includes(session.user.roles)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
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

    // Convert BigInt fields to numbers for JSON serialization
    const serializedProducts = products.map(product => ({
      ...product,
      maxPeople: product.maxPeople ? Number(product.maxPeople) : null,
    }))

    return NextResponse.json(serializedProducts)
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des produits' },
      { status: 500 }
    )
  }
}