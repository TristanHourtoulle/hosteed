'use client'

import { useEffect, useState } from 'react'
import ProductCard from '@/components/ui/ProductCard'
import { Sparkles } from 'lucide-react'

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

export default function SponsoredSection() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSponsoredProducts = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/products/sponsored')
        if (!response.ok) throw new Error('Failed to fetch sponsored products')
        const data = await response.json()

        // Limit to 8 products (2 lines of 4)
        setProducts(data.slice(0, 8))
      } catch (error) {
        console.error('Error fetching sponsored products:', error)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchSponsoredProducts()
  }, [])

  if (loading) {
    return (
      <section className='py-12 bg-gradient-to-b from-amber-50/50 to-white'>
        <div className='container mx-auto px-4'>
          <div className='flex items-center justify-center gap-2 mb-8'>
            <Sparkles className='w-6 h-6 text-amber-600 animate-pulse' />
            <h2 className='text-2xl md:text-3xl font-bold text-gray-900'>
              Annonces Sponsorisées
            </h2>
            <Sparkles className='w-6 h-6 text-amber-600 animate-pulse' />
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
            {[...Array(8)].map((_, i) => (
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
    <section className='py-12 bg-gradient-to-b from-amber-50/50 to-white'>
      <div className='container mx-auto px-4'>
        {/* Section Header */}
        <div className='flex items-center justify-center gap-2 mb-8'>
          <Sparkles className='w-6 h-6 text-amber-600' />
          <h2 className='text-2xl md:text-3xl font-bold text-gray-900'>
            Annonces Sponsorisées
          </h2>
          <Sparkles className='w-6 h-6 text-amber-600' />
        </div>

        {/* Products Grid - 2 rows of 4 products */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
