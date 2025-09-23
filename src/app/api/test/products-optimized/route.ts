import { NextRequest, NextResponse } from 'next/server'
import { findAllProductsForPublic } from '@/lib/services/product.service'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const includeSpecialPrices = url.searchParams.get('includeSpecialPrices') === 'true'
    
    console.log(`🚀 API Test - Fetching products (page: ${page}, limit: ${limit}, specialPrices: ${includeSpecialPrices})`)
    
    const result = await findAllProductsForPublic({
      page,
      limit,
      includeSpecialPrices
    })
    
    const endTime = Date.now()
    const queryTime = endTime - startTime
    
    console.log(`⚡ API Test - Query completed in ${queryTime}ms`)
    
    if (!result) {
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }
    
    // Count images per product for analysis
    const imageStats = result.products.map(p => ({
      id: p.id,
      name: p.name,
      imageCount: p.img?.length || 0
    }))
    
    const totalImages = imageStats.reduce((sum, p) => sum + p.imageCount, 0)
    
    const responseData = {
      products: result.products.map(p => ({
        ...p,
        // Convert BigInt to Number for JSON serialization
        room: p.room ? Number(p.room) : null,
        bathroom: p.bathroom ? Number(p.bathroom) : null,
        categories: Number(p.categories),
        minPeople: p.minPeople ? Number(p.minPeople) : null,
        maxPeople: p.maxPeople ? Number(p.maxPeople) : null,
        userManager: Number(p.userManager),
      })),
      pagination: result.pagination,
      performance: {
        queryTime: `${queryTime}ms`,
        totalProducts: result.products.length,
        totalImages,
        averageImagesPerProduct: Math.round(totalImages / result.products.length * 100) / 100,
        imageStats: imageStats.slice(0, 5) // First 5 for debugging
      }
    }
    
    return NextResponse.json(responseData)
    
  } catch (error) {
    const endTime = Date.now()
    const queryTime = endTime - startTime
    
    console.error('❌ API Test - Error:', error)
    console.log(`⚡ API Test - Failed after ${queryTime}ms`)
    
    return NextResponse.json({ 
      error: 'Internal server error', 
      queryTime: `${queryTime}ms` 
    }, { status: 500 })
  }
}