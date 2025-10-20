import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// API non-optimisée pour comparaison (comme avant)
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '20')

    console.log(`🐌 API Non-optimisée - Fetching ${limit} products with ALL images`)

    // Version non-optimisée : récupère TOUTES les images
    const products = await prisma.product.findMany({
      take: limit,
      include: {
        img: true, // ⚠️ TOUTES les images ! (15 par produit = 300 total pour 20 produits)
        type: true,
        equipments: true,
        securities: true,
        servicesList: true,
        mealsList: true,
        options: true,
        reviews: {
          where: { approved: true },
          select: {
            grade: true,
            welcomeGrade: true,
            staff: true,
            comfort: true,
            equipment: true,
            cleaning: true,
          },
        },
      },
    })

    const endTime = Date.now()
    const queryTime = endTime - startTime

    console.log(`🐌 API Non-optimisée - Query completed in ${queryTime}ms`)

    const totalImages = products.reduce((sum, p) => sum + (p.img?.length || 0), 0)

    const responseData = {
      products: products.map(p => ({
        ...p,
        // Convert BigInt to Number for JSON serialization
        room: p.room ? Number(p.room) : null,
        bathroom: p.bathroom ? Number(p.bathroom) : null,
        categories: Number(p.categories),
        minPeople: p.minPeople ? Number(p.minPeople) : null,
        maxPeople: p.maxPeople ? Number(p.maxPeople) : null,
        userManager: Number(p.userManager),
      })),
      performance: {
        queryTime: `${queryTime}ms`,
        totalProducts: products.length,
        totalImages,
        averageImagesPerProduct: Math.round((totalImages / products.length) * 100) / 100,
        warning: '⚠️ Cette API charge TOUTES les images - non optimisée!',
      },
    }

    return NextResponse.json(responseData)
  } catch (error) {
    const endTime = Date.now()
    const queryTime = endTime - startTime

    console.error('❌ API Non-optimisée - Error:', error)
    console.log(`🐌 API Non-optimisée - Failed after ${queryTime}ms`)

    return NextResponse.json(
      {
        error: 'Internal server error',
        queryTime: `${queryTime}ms`,
      },
      { status: 500 }
    )
  }
}
