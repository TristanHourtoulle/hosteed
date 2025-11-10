import { NextResponse } from 'next/server'
import { getActualProduct } from '@/lib/services/promotedProduct.service'

// Helper function to convert BigInt to Number
function convertBigIntToNumber(obj: any): any {
  if (obj === null || obj === undefined) return obj
  if (typeof obj === 'bigint') return Number(obj)
  if (Array.isArray(obj)) return obj.map(convertBigIntToNumber)
  if (typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, convertBigIntToNumber(value)])
    )
  }
  return obj
}

export async function GET() {
  try {
    const promotedProducts = await getActualProduct()

    if (!promotedProducts) {
      return NextResponse.json([])
    }

    // Transform the data to match the expected format for ProductCard
    const products = promotedProducts.map((promoted) => {
      const product = convertBigIntToNumber(promoted.product)
      return {
        ...product,
        PromotedProduct: [
          {
            id: promoted.id,
            active: promoted.active,
            start: promoted.start,
            end: promoted.end,
          },
        ],
      }
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching sponsored products:', error)
    return NextResponse.json({ error: 'Failed to fetch sponsored products' }, { status: 500 })
  }
}
