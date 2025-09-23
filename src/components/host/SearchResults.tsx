import React, { useMemo } from 'react'
import ProductCard from '@/components/ui/ProductCard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/shadcnui'
import { motion } from 'framer-motion'
import Pagination, { PaginationInfo } from '@/components/ui/Pagination'

interface Product {
  id: string
  name: string
  description: string
  address: string
  longitude: number
  latitude: number
  img?: { img: string }[]
  basePrice: string
  equipments?: { id: string; name: string }[]
  servicesList?: { id: string; name: string }[]
  mealsList?: { id: string; name: string }[]
  securities?: { id: string; name: string }[]
  arriving: number
  leaving: number
  typeRentId?: string
  certified?: boolean
  validate?: string
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface SearchResultsProps {
  products: Product[]
  hasActiveFilters: boolean
  onResetFilters: () => void
  pagination?: PaginationData
  onPageChange?: (page: number) => void
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

// Memoized motion props to prevent recreation on every render
const noResultsMotion = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

const buttonMotion = {
  initial: { scale: 0 },
  animate: { scale: 1 },
  transition: { delay: 0.2 }
}

function SearchResults({
  products,
  hasActiveFilters,
  onResetFilters,
  pagination,
  onPageChange,
}: SearchResultsProps) {
  // Memoize motion props for empty state
  const noResultsProps = useMemo(() => noResultsMotion, [])
  const buttonProps = useMemo(() => buttonMotion, [])
  
  // Debug logging
  console.log('SearchResults - products received:', products)
  console.log('SearchResults - products length:', products.length)
  console.log('SearchResults - first product img:', products[0]?.img)
  
  if (products.length === 0) {
    return (
      <motion.div {...noResultsProps}>
        <Card>
          <CardContent className='py-12 text-center'>
            <p className='text-gray-500'>Aucun hébergement trouvé avec ces critères</p>
            {hasActiveFilters && (
              <motion.div {...buttonProps}>
                <Button variant='outline' className='mt-4' onClick={onResetFilters}>
                  Réinitialiser les filtres
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pagination Info */}
      {pagination && (
        <div className="flex justify-between items-center">
          <PaginationInfo
            currentPage={pagination.page}
            itemsPerPage={pagination.limit}
            totalItems={pagination.total}
          />
          <div className="text-sm text-gray-500">
            {pagination.totalPages} page{pagination.totalPages > 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Products Grid */}
      <motion.div
        variants={container}
        initial='hidden'
        animate='show'
        className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6'
      >
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} />
        ))}
      </motion.div>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && onPageChange && (
        <div className="flex justify-center pt-6">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={onPageChange}
            className="bg-white p-4 rounded-lg shadow-sm border"
          />
        </div>
      )}
    </div>
  )
}

// Memoize the component to prevent unnecessary re-renders
// Custom comparison to handle deep comparison of products array and pagination object
const areEqual = (prevProps: SearchResultsProps, nextProps: SearchResultsProps) => {
  // Check basic props
  if (
    prevProps.hasActiveFilters !== nextProps.hasActiveFilters ||
    prevProps.onResetFilters !== nextProps.onResetFilters ||
    prevProps.onPageChange !== nextProps.onPageChange
  ) {
    return false
  }

  // Check products array
  if (prevProps.products.length !== nextProps.products.length) {
    return false
  }

  // Check if products have changed (shallow comparison of ids should be sufficient)
  for (let i = 0; i < prevProps.products.length; i++) {
    if (prevProps.products[i].id !== nextProps.products[i].id) {
      return false
    }
  }

  // Check pagination object
  const prevPag = prevProps.pagination
  const nextPag = nextProps.pagination
  
  if (prevPag !== nextPag) {
    if (!prevPag || !nextPag) return false
    
    if (
      prevPag.page !== nextPag.page ||
      prevPag.limit !== nextPag.limit ||
      prevPag.total !== nextPag.total ||
      prevPag.totalPages !== nextPag.totalPages ||
      prevPag.hasNext !== nextPag.hasNext ||
      prevPag.hasPrev !== nextPag.hasPrev
    ) {
      return false
    }
  }

  return true
}

export default React.memo(SearchResults, areEqual)
