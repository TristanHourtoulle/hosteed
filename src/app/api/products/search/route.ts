import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { ProductValidation } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50)
    const search = searchParams.get('search') || searchParams.get('q') || ''
    const typeRentId = searchParams.get('typeRentId') || searchParams.get('type') || ''
    const location = searchParams.get('location') || ''
    
    // Filtering options
    const featured = searchParams.get('featured') === 'true'
    const popular = searchParams.get('popular') === 'true'
    const recent = searchParams.get('recent') === 'true'
    const promo = searchParams.get('promo') === 'true'
    
    // Advanced filters
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const minPeople = searchParams.get('minPeople')
    const maxPeople = searchParams.get('maxPeople')
    const certifiedOnly = searchParams.get('certifiedOnly') === 'true'
    const autoAcceptOnly = searchParams.get('autoAcceptOnly') === 'true'

    // Build database where clause for server-side filtering
    const whereClause: Record<string, unknown> = {
      validate: {
        in: [ProductValidation.Approve, ProductValidation.ModificationPending]
      },
      isDraft: false,
    }

    // Add search filter
    if (search || location) {
      const searchTerm = search || location
      whereClause.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { address: { contains: searchTerm, mode: 'insensitive' } }
      ]
    }

    // Add type filter
    if (typeRentId) {
      whereClause.typeId = typeRentId
    }

    // Add price filters (string-based comparison for basePrice)
    if (minPrice || maxPrice) {
      const priceFilter: Record<string, string> = {}
      if (minPrice) {
        priceFilter.gte = minPrice
      }
      if (maxPrice) {
        priceFilter.lte = maxPrice
      }
      whereClause.basePrice = priceFilter
    }

    // Add people filters
    if (minPeople) {
      whereClause.maxPeople = {
        gte: parseInt(minPeople)
      }
    }
    if (maxPeople) {
      whereClause.minPeople = {
        lte: parseInt(maxPeople)
      }
    }

    // Add certification filter
    if (certifiedOnly) {
      whereClause.certified = true
    }

    // Add auto-accept filter
    if (autoAcceptOnly) {
      whereClause.autoAccept = true
    }

    // Add promo filter at database level (products under 100 EUR)
    if (promo) {
      // Simplified string-based promo filter for better performance
      whereClause.AND = [
        ...(Array.isArray(whereClause.AND) ? whereClause.AND : []),
        {
          OR: [
            { basePrice: { startsWith: '0' } },  // 0-9
            { basePrice: { startsWith: '1' } },  // 10-19
            { basePrice: { startsWith: '2' } },  // 20-29
            { basePrice: { startsWith: '3' } },  // 30-39
            { basePrice: { startsWith: '4' } },  // 40-49
            { basePrice: { startsWith: '5' } },  // 50-59
            { basePrice: { startsWith: '6' } },  // 60-69
            { basePrice: { startsWith: '7' } },  // 70-79
            { basePrice: { startsWith: '8' } },  // 80-89
            { basePrice: { startsWith: '9' } },  // 90-99
          ]
        }
      ]
    }

    // Calculate offset
    const skip = (page - 1) * limit

    // Ultra-lightweight includes for maximum search performance
    const ultraLightIncludes = {
      img: {
        take: 1, // CRITICAL: Only 1 image for search performance
        select: { 
          id: true,
          img: true 
        }
      },
      type: {
        select: { name: true, id: true }
      },
      // Only include these for popular sorting
      ...(popular ? {
        equipments: {
          select: { id: true }
        },
        servicesList: {
          select: { id: true }
        }
      } : {}),
      // Only include promoted info if featured
      ...(featured ? {
        PromotedProduct: {
          where: {
            active: true,
            start: { lte: new Date() },
            end: { gte: new Date() },
          },
          select: { id: true, active: true }
        }
      } : {}),
    }

    // Build optimized order by clause
    let orderBy: any = { id: 'desc' }
    if (featured) {
      orderBy = [{ certified: 'desc' }, { id: 'desc' }]
    } else if (recent) {
      orderBy = { id: 'desc' }
    } else if (popular) {
      // For popularity, we'll still need client-side sorting due to Prisma limitations
      // but we'll pre-order by id to have consistent results
      orderBy = { id: 'desc' }
    }

    // Execute optimized query
    const [rawProducts, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        include: ultraLightIncludes,
        skip,
        take: limit,
        orderBy
      }),
      prisma.product.count({
        where: whereClause
      })
    ])

    // Convert BigInt fields to strings for JSON serialization
    const products = rawProducts.map(product => ({
      ...product,
      room: product.room ? Number(product.room) : null,
      bathroom: product.bathroom ? Number(product.bathroom) : null,
      minPeople: product.minPeople ? Number(product.minPeople) : null,
      maxPeople: product.maxPeople ? Number(product.maxPeople) : null,
      categories: product.categories ? Number(product.categories) : null,
      userManager: product.userManager ? Number(product.userManager) : null,
    }))

    // Apply remaining client-side sorting only for popularity (promo is now handled at DB level)
    let sortedProducts = products
    
    if (popular) {
      sortedProducts = products.sort((a, b) => {
        const aScore = (a.equipments?.length || 0) + (a.servicesList?.length || 0)
        const bScore = (b.equipments?.length || 0) + (b.servicesList?.length || 0)
        return bScore - aScore
      })
    }

    // Promo filtering is now handled at database level

    // Build response with pagination metadata
    const result = {
      products: sortedProducts,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      },
      filters: {
        search,
        typeRentId,
        location,
        featured,
        popular,
        recent,
        promo,
        appliedFilters: {
          minPrice,
          maxPrice,
          minPeople,
          maxPeople,
          certifiedOnly,
          autoAcceptOnly
        }
      }
    }

    // Add optimized cache headers for faster subsequent requests
    const response = NextResponse.json(result)
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=30, stale-while-revalidate=60'
    )
    response.headers.set('X-Response-Time', Date.now().toString())

    return response
  } catch (error) {
    console.error('Error in /api/products/search:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}