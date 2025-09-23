import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { findAllProductsPaginated } from '@/lib/services/product.service'

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

    // Call the existing service with admin-optimized parameters
    const result = await findAllProductsPaginated({
      page,
      limit,
      imageMode: 'lightweight', // Only 1 image for admin list view
      includeLightweight: true, // Include lightweight product data
    })

    // Filter by search term if provided (client-side filtering after pagination)
    let filteredProducts = result?.products || []
    if (search.trim()) {
      const searchTerm = search.toLowerCase()
      filteredProducts = filteredProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.address.toLowerCase().includes(searchTerm) ||
        (product.description && product.description.toLowerCase().includes(searchTerm))
      )
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      )
    }

    // Convert BigInt fields to numbers for JSON serialization
    const products = filteredProducts.map(product => ({
      ...product,
      room: 'room' in product && product.room ? Number(product.room) : null,
      bathroom: 'bathroom' in product && product.bathroom ? Number(product.bathroom) : null,
      personMax: 'personMax' in product && product.personMax ? Number(product.personMax) : null,
      priceUSD: 'priceUSD' in product && product.priceUSD ? Number(product.priceUSD) : null,
      priceMGA: 'priceMGA' in product && product.priceMGA ? Number(product.priceMGA) : null,
    }))

    // Update pagination to reflect filtered results
    const totalFilteredItems = search.trim() ? filteredProducts.length : result.pagination.total
    const response = {
      products,
      pagination: {
        currentPage: result.pagination.page,
        totalPages: search.trim() ? Math.ceil(totalFilteredItems / limit) : result.pagination.totalPages,
        itemsPerPage: result.pagination.limit,
        totalItems: totalFilteredItems,
        hasNext: search.trim() ? false : result.pagination.hasNext,
        hasPrev: search.trim() ? false : result.pagination.hasPrev,
      },
    }

    // Set cache headers for admin data (shorter cache)
    const headers = new Headers()
    headers.set('Cache-Control', 'public, max-age=30, s-maxage=30') // 30 seconds cache

    return NextResponse.json(response, { headers })
  } catch (error) {
    console.error('Error in admin products API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
