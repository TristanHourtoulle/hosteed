import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { ProductValidation } from '@prisma/client'
import { productCacheService } from '@/lib/cache/redis-cache.service'

export async function GET(request: NextRequest) {
  const startTime = Date.now()

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

    // Create cache filters object
    const cacheFilters = {
      query: search,
      location,
      typeId: typeRentId,
      minPrice: minPrice ? parseInt(minPrice) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
      page,
      limit,
      sortBy: (featured ? 'featured' : popular ? 'popular' : recent ? 'recent' : promo ? 'promo' : 'created') as 'featured' | 'popular' | 'recent' | 'promo' | 'created',
      guests: minPeople ? parseInt(minPeople) : undefined,
      // Include boolean filters in cache key
      featured: featured || undefined,
      certifiedOnly: certifiedOnly || undefined,
      autoAcceptOnly: autoAcceptOnly || undefined,
    }

    // Check cache first for performance boost
    console.log('[SEARCH API] Checking cache for filters:', JSON.stringify(cacheFilters, null, 2))
    const cachedResult = await productCacheService.getCachedProductSearch(cacheFilters)

    if (cachedResult) {
      console.log(`[SEARCH API] Cache HIT - Returning ${cachedResult.products?.length || 0} products`)

      // ✅ FIXED: Ensure we always use "products" key
      const response = NextResponse.json({
        products: cachedResult.products,
        pagination: cachedResult.pagination,
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
        },
        meta: {
          cached: true,
          responseTime: Date.now() - startTime,
          cacheHit: true
        }
      })

      // Add cache headers for cached responses
      response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
      response.headers.set('X-Cache', 'HIT')
      response.headers.set('X-Response-Time', (Date.now() - startTime).toString())

      return response
    }

    console.log('[SEARCH API] Cache MISS - Querying database')

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
      // ✅ CRITICAL PERFORMANCE FIX: Inclure seulement les URLs d'images migrées
      // Les URLs /uploads/ sont légères (83 bytes vs 500KB base64)
      // Les images base64 et Unsplash seront gérées par l'API thumbnail
      img: {
        take: 1,
        select: {
          id: true,
          img: true  // ✅ URL needed for migrated images (/uploads/...)
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
    let orderBy: { id: 'desc' } | Array<{ certified: 'desc' } | { id: 'desc' }> = { id: 'desc' }
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
    console.log('[SEARCH API] Executing DB query with whereClause:', JSON.stringify(whereClause, null, 2))
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

    console.log(`[SEARCH API] DB query returned ${rawProducts.length} products (total: ${totalCount})`)

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

    console.log(`[SEARCH API] Converted ${products.length} products for serialization`)

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
    const pagination = {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: page < Math.ceil(totalCount / limit),
      hasPrev: page > 1
    }

    const result = {
      products: sortedProducts,
      pagination,
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
      },
      meta: {
        cached: false,
        responseTime: Date.now() - startTime,
        cacheHit: false,
        dbQueryTime: Date.now() - startTime
      }
    }

    // Cache the search results for future requests (massive performance boost)
    console.log(`[SEARCH API] Caching ${sortedProducts.length} products with pagination:`, pagination)
    try {
      await productCacheService.cacheProductSearch(
        cacheFilters,
        sortedProducts,
        pagination
      )
      console.log('[SEARCH API] Successfully cached search results')
    } catch (cacheError) {
      console.error('[SEARCH API] Failed to cache search results:', cacheError)
      // Don't fail the request if caching fails
    }

    // Add optimized cache headers for faster subsequent requests
    const response = NextResponse.json(result)
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    )
    response.headers.set('X-Cache', 'MISS')
    response.headers.set('X-Response-Time', (Date.now() - startTime).toString())
    response.headers.set('X-DB-Query', 'true')

    return response
  } catch (error) {
    console.error('Error in /api/products/search:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}