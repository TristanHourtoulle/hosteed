'use client'

import { useEffect, useState } from 'react'
import ProductCard from '@/components/ui/ProductCard'
import { Tag, TrendingDown } from 'lucide-react'

interface Image {
  img: string
}

interface PromotedProduct {
  id: string
  active: boolean
  start: Date
  end: Date
}

interface Review {
  grade: number
  welcomeGrade: number
  staff: number
  comfort: number
  equipment: number
  cleaning: number
}

interface ProductPromotion {
  id: string
  discountPercentage: number
  startDate: Date
  endDate: Date
  isActive: boolean
}

interface Product {
  id: string
  name: string
  description: string
  address: string
  slug?: string | null
  img?: Image[] | null
  basePrice: string
  originalBasePrice?: string
  specialPriceApplied?: boolean
  certified?: boolean
  reviews?: Review[]
  PromotedProduct?: PromotedProduct[]
  promotions?: ProductPromotion[]
}

export default function SpecialOffersSection() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPromotionalProducts = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/products/on-promotion?limit=4')
        if (!response.ok) throw new Error('Failed to fetch promotional products')
        const data = await response.json()

        // Transform the API response to match ProductCard format
        const transformedProducts =
          data.promotions?.map(
            (promo: {
              id: string
              discountPercentage: number
              startDate: Date
              endDate: Date
              product: Product
            }) => ({
          ...promo.product,
          promotions: [
            {
              id: promo.id,
              discountPercentage: promo.discountPercentage,
              startDate: promo.startDate,
              endDate: promo.endDate,
              isActive: true,
            },
          ],
            })
          ) || []

        setProducts(transformedProducts)
      } catch (error) {
        console.error('Error fetching promotional products:', error)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchPromotionalProducts()
  }, [])

  if (loading) {
    return (
      <section className='py-12 bg-gradient-to-b from-white to-green-50/30'>
        <div className='container mx-auto px-4'>
          <div className='text-center mb-8'>
            <div className='flex items-center justify-center gap-2 mb-2'>
              <Tag className='w-6 h-6 text-green-600' />
              <h2 className='text-2xl md:text-3xl font-bold text-gray-900'>
                Offres Spéciales
              </h2>
              <TrendingDown className='w-6 h-6 text-green-600' />
            </div>
            <p className='text-gray-600 text-sm'>
              Profitez de remises exceptionnelles pour une durée limitée
            </p>
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className='h-96 bg-gray-200 animate-pulse rounded-lg'
              />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <section className='py-12 bg-gradient-to-b from-white to-green-50/30'>
      <div className='container mx-auto px-4'>
        {/* Section Header */}
        <div className='text-center mb-8'>
          <div className='flex items-center justify-center gap-2 mb-2'>
            <Tag className='w-6 h-6 text-green-600' />
            <h2 className='text-2xl md:text-3xl font-bold text-gray-900'>
              Offres Spéciales
            </h2>
            <TrendingDown className='w-6 h-6 text-green-600' />
          </div>
          <p className='text-gray-600 text-sm md:text-base'>
            Profitez de remises exceptionnelles pour une durée limitée
          </p>
        </div>

        {/* Products Grid - 1 row of up to 4 products */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
