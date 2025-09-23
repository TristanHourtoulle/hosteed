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

    // Add price filters
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

    // Calculate offset
    const skip = (page - 1) * limit

    // Define lightweight includes for search results (only 1 image for performance)
    const lightweightIncludes = {
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
      equipments: {
        take: 5, // Limit equipment count for performance
        select: { id: true, name: true }
      },
      securities: {
        take: 3, // Limit security count for performance
        select: { id: true, name: true }
      },
      servicesList: {
        take: 5, // Limit services count for performance
        select: { id: true, name: true }
      },
      mealsList: {
        take: 3, // Limit meals count for performance
        select: { id: true, name: true }
      },
      PromotedProduct: {
        where: {
          active: true,
          start: { lte: new Date() },
          end: { gte: new Date() },
        },
        select: { id: true, active: true, start: true, end: true }
      },
    }

    // Execute optimized query
    const [rawProducts, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        include: lightweightIncludes,
        skip,
        take: limit,
        orderBy: featured 
          ? [{ certified: 'desc' }, { id: 'desc' }]
          : recent 
          ? { id: 'desc' }
          : popular
          ? [{ id: 'desc' }] // Could be enhanced with actual popularity metrics
          : { id: 'desc' }
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

    // Apply client-side sorting for special cases
    let sortedProducts = products
    
    if (popular) {
      sortedProducts = products.sort((a, b) => {
        const aScore = (a.equipments?.length || 0) + (a.servicesList?.length || 0)
        const bScore = (b.equipments?.length || 0) + (b.servicesList?.length || 0)
        return bScore - aScore
      })
    }

    if (promo) {
      sortedProducts = sortedProducts.filter(product => {
        const price = parseFloat(product.basePrice)
        return price < 100
      })
    }

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

    // Add cache headers optimized for search results
    const response = NextResponse.json(result)
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=180'
    )

    return response
  } catch (error) {
    console.error('Error in /api/products/search:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}