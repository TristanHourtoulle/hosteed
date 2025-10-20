import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.roles || !['ADMIN', 'HOST_MANAGER'].includes(session.user.roles)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50) // Max 50 per page
    const search = searchParams.get('search') || ''

    // Build optimized database query with server-side search
    const whereClause: Record<string, unknown> = {}

    // Add search filter at database level for better performance
    if (search.trim()) {
      whereClause.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
        { address: { contains: search.trim(), mode: 'insensitive' } },
      ]
    }

    const skip = (page - 1) * limit

    // Execute optimized direct query instead of using service layer
    const [rawProducts, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          description: true,
          address: true,
          basePrice: true,
          priceMGA: true,
          validate: true,
          certified: true,
          autoAccept: true,
          isDraft: true,
          // Only essential relations for admin list
          img: {
            take: 1,
            select: { id: true, img: true },
          },
          type: {
            select: { id: true, name: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: [{ id: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.product.count({ where: whereClause }),
    ])

    // Convert BigInt fields for JSON serialization
    const filteredProducts = rawProducts.map(product => ({
      ...product,
      room: null, // Not needed for admin list
      bathroom: null,
      personMax: null,
      priceUSD: null,
    }))

    if (!rawProducts) {
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    // Build optimized response with accurate pagination
    const response = {
      products: filteredProducts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        itemsPerPage: limit,
        totalItems: totalCount,
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
    }

    // Set optimized cache headers for admin data
    const headers = new Headers()
    headers.set('Cache-Control', 'public, max-age=15, s-maxage=15') // 15 seconds cache for fresh admin data
    headers.set('X-Response-Time', Date.now().toString())

    return NextResponse.json(response, { headers })
  } catch (error) {
    console.error('Error in admin products API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
