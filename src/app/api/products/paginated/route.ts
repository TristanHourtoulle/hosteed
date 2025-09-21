import { NextRequest, NextResponse } from 'next/server'
import { findAllProductsForPublic } from '@/lib/services/product.service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50) // Max 50 items per page
    const includeSpecialPrices = searchParams.get('includeSpecialPrices') === 'true'

    // Validate parameters
    if (page < 1) {
      return NextResponse.json(
        { error: 'Page must be greater than 0' },
        { status: 400 }
      )
    }

    if (limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 50' },
        { status: 400 }
      )
    }

    // Call the optimized service function
    const result = await findAllProductsForPublic({
      page,
      limit,
      includeSpecialPrices
    })

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      )
    }

    // Add cache headers for better performance
    const response = NextResponse.json(result)
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=120, stale-while-revalidate=300'
    )

    return response
  } catch (error) {
    console.error('Error in /api/products/paginated:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}