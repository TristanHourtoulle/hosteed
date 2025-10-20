import { NextRequest, NextResponse } from 'next/server'
import { getProductsWithActivePromotions } from '@/lib/services/promotion.service'

/**
 * GET /api/products/on-promotion
 * Récupérer les produits avec des promotions actives
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const filters = {
      typeId: searchParams.get('typeId') || undefined,
      minDiscount: searchParams.get('minDiscount')
        ? parseFloat(searchParams.get('minDiscount')!)
        : undefined,
      sortBy: (searchParams.get('sortBy') as 'discount' | 'endDate' | 'price') || 'discount',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    }

    const promotions = await getProductsWithActivePromotions(filters)

    // Formater les résultats
    const formatted = promotions.map(promo => ({
      id: promo.id,
      discountPercentage: promo.discountPercentage,
      startDate: promo.startDate,
      endDate: promo.endDate,
      product: {
        id: promo.product.id,
        name: promo.product.name,
        basePrice: promo.product.basePrice,
        discountedPrice: (
          parseFloat(promo.product.basePrice) *
          (1 - promo.discountPercentage / 100)
        ).toFixed(2),
        savings: (parseFloat(promo.product.basePrice) * (promo.discountPercentage / 100)).toFixed(
          2
        ),
        img: promo.product.img,
        reviews: promo.product.reviews,
        averageRating:
          promo.product.reviews.length > 0
            ? promo.product.reviews.reduce((sum, r) => sum + r.grade, 0) /
              promo.product.reviews.length
            : null,
        type: promo.product.type,
      },
    }))

    return NextResponse.json({
      promotions: formatted,
      total: formatted.length,
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des produits en promotion:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
