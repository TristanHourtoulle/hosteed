'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import CategoryCard from './CategoryCard'
import { Button } from '@/components/ui/button'

interface Category {
  id: string
  name: string
  description: string
  icon: string
  productCount: number
  coverImage?: string | null
}

export default function CategorySection() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/types')
      if (response.ok) {
        const data = await response.json()
        // Trier les catégories par nombre de logements (du plus grand au plus petit)
        const sortedData = data.sort((a: Category, b: Category) => b.productCount - a.productCount)
        setCategories(sortedData)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  // Check scroll position to show/hide arrows
  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    checkScrollButtons()
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', checkScrollButtons)
      window.addEventListener('resize', checkScrollButtons)
      return () => {
        container.removeEventListener('scroll', checkScrollButtons)
        window.removeEventListener('resize', checkScrollButtons)
      }
    }
  }, [categories])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400
      const newScrollLeft =
        scrollContainerRef.current.scrollLeft +
        (direction === 'right' ? scrollAmount : -scrollAmount)
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      })
    }
  }

  if (loading) {
    return (
      <section className='py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-12'>
            <div className='h-8 w-64 bg-gray-200 rounded mx-auto animate-pulse' />
          </div>
          <div className='flex gap-6 overflow-hidden'>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className='min-w-[300px] h-80 bg-gray-200 rounded-2xl animate-pulse' />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className='py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white'>
      <div className='max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className='text-center mb-12 md:mb-16'
        >
          <div className='inline-block mb-4'>
            <div className='h-1 w-12 bg-gradient-to-r from-[#015993] to-[#0379C7] rounded-full mx-auto' />
          </div>
          <h2 className='text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4'>
            Des solutions pour toutes vos envies
          </h2>
          <p className='text-gray-600 text-lg md:text-xl'>
            Des établissements vérifiés, visités et garantis
          </p>
        </motion.div>

        {/* Category Slider */}
        <div className='relative slider-container'>
          {/* Left Arrow */}
          {canScrollLeft && (
            <Button
              onClick={() => scroll('left')}
              variant='outline'
              size='icon'
              className='absolute left-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-white shadow-lg hover:shadow-xl transition-all opacity-0 slider-container:hover:opacity-100'
            >
              <ChevronLeft className='h-6 w-6' />
            </Button>
          )}

          {/* Right Arrow */}
          {canScrollRight && (
            <Button
              onClick={() => scroll('right')}
              variant='outline'
              size='icon'
              className='absolute right-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-white shadow-lg hover:shadow-xl transition-all opacity-0 slider-container:hover:opacity-100'
            >
              <ChevronRight className='h-6 w-6' />
            </Button>
          )}

          {/* Scrollable Container */}
          <div
            ref={scrollContainerRef}
            className='flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4'
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {categories.map((category, index) => (
              <div key={category.id} className='w-[380px] md:w-[420px] flex-shrink-0'>
                <CategoryCard
                  title={category.name}
                  description={
                    category.description || `Découvrez nos ${category.name.toLowerCase()}`
                  }
                  imageUrl={category.coverImage || undefined}
                  count={category.productCount || 0}
                  href={`/host?type=${encodeURIComponent(category.id)}`}
                  index={index}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator (mobile) */}
        <div className='flex justify-center gap-2 mt-6 md:hidden'>
          {categories.map((_, index) => (
            <div key={index} className='w-2 h-2 rounded-full bg-gray-300' />
          ))}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .slider-container:hover :global(.opacity-0) {
          opacity: 1 !important;
        }
      `}</style>
    </section>
  )
}
