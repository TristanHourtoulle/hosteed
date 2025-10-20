import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { findAllProductByHostIdPaginated } from '@/lib/services/product.service'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    // Limiter pour éviter les abus
    const safeLimit = Math.min(limit, 50)

    const result = await findAllProductByHostIdPaginated(session.user.id, {
      page,
      limit: safeLimit,
      imageMode: 'lightweight', // Une seule image par produit
    })

    if (!result) {
      return NextResponse.json({ products: [], totalPages: 0, currentPage: page }, { status: 200 })
    }

    // Fonction récursive pour convertir les BigInt en nombres et les Date en ISO strings
    const convertBigIntToNumber = (obj: unknown): unknown => {
      if (obj === null || obj === undefined) return obj
      if (typeof obj === 'bigint') return Number(obj)
      if (obj instanceof Date) return obj.toISOString()
      if (Array.isArray(obj)) return obj.map(convertBigIntToNumber)
      if (typeof obj === 'object') {
        return Object.fromEntries(
          Object.entries(obj).map(([key, value]) => [key, convertBigIntToNumber(value)])
        )
      }
      return obj
    }

    const serializedProducts = result.products.map(product => convertBigIntToNumber(product))

    const response = NextResponse.json({
      products: serializedProducts,
      totalPages: result.pagination.totalPages,
      currentPage: page,
      totalCount: result.pagination.total,
      hasNextPage: result.pagination.hasNext,
      hasPreviousPage: result.pagination.hasPrev,
    })

    // Ajouter des headers de cache pour optimiser les performances
    response.headers.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=600') // 5min cache, 10min stale

    return response
  } catch (error) {
    console.error("Erreur lors du chargement des produits de l'hôte:", error)
    return NextResponse.json(
      { error: 'Erreur serveur lors du chargement des produits' },
      { status: 500 }
    )
  }
}
