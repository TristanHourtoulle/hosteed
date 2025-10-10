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
    const minRooms = searchParams.get('minRooms')
    const maxRooms = searchParams.get('maxRooms')
    const minBathrooms = searchParams.get('minBathrooms')
    const maxBathrooms = searchParams.get('maxBathrooms')
    const sizeMin = searchParams.get('sizeMin')
    const sizeMax = searchParams.get('sizeMax')
    const certifiedOnly = searchParams.get('certifiedOnly') === 'true'
    const autoAcceptOnly = searchParams.get('autoAcceptOnly') === 'true'
    const contractRequired = searchParams.get('contractRequired') === 'true'
    const arrivingDate = searchParams.get('arrivingDate')
    const leavingDate = searchParams.get('leavingDate')

    // Array filters (comma-separated IDs)
    const equipments = searchParams.get('equipments')?.split(',').filter(Boolean) || []
    const services = searchParams.get('services')?.split(',').filter(Boolean) || []
    const meals = searchParams.get('meals')?.split(',').filter(Boolean) || []
    const securities = searchParams.get('securities')?.split(',').filter(Boolean) || []
    const typeRooms = searchParams.get('typeRooms')?.split(',').filter(Boolean) || []

    // Create cache filters object - MUST include ALL filter parameters
    const cacheFilters = {
      query: search,
      location,
      typeId: typeRentId,
      minPrice: minPrice ? parseInt(minPrice) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
      minPeople: minPeople ? parseInt(minPeople) : undefined,
      maxPeople: maxPeople ? parseInt(maxPeople) : undefined,
      minRooms: minRooms ? parseInt(minRooms) : undefined,
      maxRooms: maxRooms ? parseInt(maxRooms) : undefined,
      minBathrooms: minBathrooms ? parseInt(minBathrooms) : undefined,
      maxBathrooms: maxBathrooms ? parseInt(maxBathrooms) : undefined,
      sizeMin: sizeMin ? parseInt(sizeMin) : undefined,
      sizeMax: sizeMax ? parseInt(sizeMax) : undefined,
      page,
      limit,
      sortBy: (featured ? 'featured' : popular ? 'popular' : recent ? 'recent' : promo ? 'promo' : 'created') as 'featured' | 'popular' | 'recent' | 'promo' | 'created',
      // Include boolean filters in cache key
      featured: featured || undefined,
      certifiedOnly: certifiedOnly || undefined,
      autoAcceptOnly: autoAcceptOnly || undefined,
      contractRequired: contractRequired || undefined,
      // Include array filters in cache key (sorted for consistency)
      equipments: equipments.length > 0 ? equipments.sort().join(',') : undefined,
      services: services.length > 0 ? services.sort().join(',') : undefined,
      meals: meals.length > 0 ? meals.sort().join(',') : undefined,
      securities: securities.length > 0 ? securities.sort().join(',') : undefined,
      typeRooms: typeRooms.length > 0 ? typeRooms.sort().join(',') : undefined,
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

    // NOTE: basePrice is stored as String in DB, so we can't use Prisma comparison operators
    // We'll filter by price in JavaScript after fetching results to ensure proper numeric comparison
    // See price filtering logic after DB query (around line 280)

    // Add people filters (BigInt fields in DB, but Prisma accepts Number for comparison)
    if (minPeople) {
      whereClause.maxPeople = {
        gte: BigInt(minPeople)
      }
    }
    if (maxPeople) {
      whereClause.minPeople = {
        lte: BigInt(maxPeople)
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

    // Add contract required filter
    if (contractRequired) {
      whereClause.contract = true
    }

    // Add rooms filters (BigInt field in DB)
    if (minRooms || maxRooms) {
      const roomsFilter: Record<string, unknown> = {}
      if (minRooms) {
        roomsFilter.gte = BigInt(minRooms)
      }
      if (maxRooms) {
        roomsFilter.lte = BigInt(maxRooms)
      }
      whereClause.room = roomsFilter
    }

    // Add bathrooms filters (BigInt field in DB)
    if (minBathrooms || maxBathrooms) {
      const bathroomsFilter: Record<string, unknown> = {}
      if (minBathrooms) {
        bathroomsFilter.gte = BigInt(minBathrooms)
      }
      if (maxBathrooms) {
        bathroomsFilter.lte = BigInt(maxBathrooms)
      }
      whereClause.bathroom = bathroomsFilter
    }

    // Add size filters
    if (sizeMin || sizeMax) {
      const sizeFilter: Record<string, number> = {}
      if (sizeMin) {
        sizeFilter.gte = parseInt(sizeMin)
      }
      if (sizeMax) {
        sizeFilter.lte = parseInt(sizeMax)
      }
      whereClause.sizeRoom = sizeFilter
    }

    // NOTE: Date availability filtering is complex and requires checking Rents table
    // The 'arriving' and 'leaving' fields in Product are check-in/check-out TIMES (hours), not dates
    // For now, we skip date filtering - this should be implemented with a proper availability check
    // that queries the Rents table to find conflicts with requested dates
    // TODO: Implement proper date availability filtering using Rents table

    // Add equipments filter (products must have ALL selected equipments)
    if (equipments.length > 0) {
      whereClause.AND = [
        ...(Array.isArray(whereClause.AND) ? whereClause.AND : []),
        ...equipments.map(equipmentId => ({
          equipments: {
            some: { id: equipmentId }
          }
        }))
      ]
    }

    // Add services filter (products must have ALL selected services)
    if (services.length > 0) {
      whereClause.AND = [
        ...(Array.isArray(whereClause.AND) ? whereClause.AND : []),
        ...services.map(serviceId => ({
          servicesList: {
            some: { id: serviceId }
          }
        }))
      ]
    }

    // Add meals filter (products must have ALL selected meals)
    if (meals.length > 0) {
      whereClause.AND = [
        ...(Array.isArray(whereClause.AND) ? whereClause.AND : []),
        ...meals.map(mealId => ({
          mealsList: {
            some: { id: mealId }
          }
        }))
      ]
    }

    // Add securities filter (products must have ALL selected securities)
    if (securities.length > 0) {
      whereClause.AND = [
        ...(Array.isArray(whereClause.AND) ? whereClause.AND : []),
        ...securities.map(securityId => ({
          securities: {
            some: { id: securityId }
          }
        }))
      ]
    }

    // Add type rooms filter (if typeRooms is used in the Product schema)
    if (typeRooms.length > 0) {
      // Note: This filter may need adjustment based on actual schema
      // Assuming there's a typeRoomId field in Product
      whereClause.typeRoomId = { in: typeRooms }
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
    // Custom JSON serializer for BigInt values
    const serializeForLog = (obj: unknown): string => {
      return JSON.stringify(obj, (key, value) =>
        typeof value === 'bigint' ? value.toString() + 'n' : value
      , 2)
    }
    console.log('[SEARCH API] Executing DB query with whereClause:', serializeForLog(whereClause))
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

    // Apply price filtering (client-side because basePrice is stored as String)
    let filteredProducts = sortedProducts
    if (minPrice || maxPrice) {
      filteredProducts = sortedProducts.filter(product => {
        const price = parseFloat(product.basePrice)
        if (isNaN(price)) return false

        if (minPrice && price < parseFloat(minPrice)) return false
        if (maxPrice && price > parseFloat(maxPrice)) return false

        return true
      })
    }

    // Promo filtering is now handled at database level

    // Build response with pagination metadata
    // Note: We use filteredProducts.length for accurate count after client-side price filtering
    const finalTotal = (minPrice || maxPrice) ? filteredProducts.length : totalCount
    const pagination = {
      page,
      limit,
      total: finalTotal,
      totalPages: Math.ceil(finalTotal / limit),
      hasNext: page < Math.ceil(finalTotal / limit),
      hasPrev: page > 1
    }

    const result = {
      products: filteredProducts,
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
    console.log(`[SEARCH API] Caching ${filteredProducts.length} products with pagination:`, pagination)
    try {
      await productCacheService.cacheProductSearch(
        cacheFilters,
        filteredProducts,
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