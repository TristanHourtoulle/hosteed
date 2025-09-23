'use client'

import React, { useMemo, useCallback } from 'react'
import { ProductValidation } from '@prisma/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Home } from 'lucide-react'
import { motion } from 'framer-motion'
import ProductValidationCard from './ProductValidationCard'
import { RejectedProductsTab } from './RejectedProductsTab'

interface Product {
  id: string
  name: string
  description: string
  address: string
  basePrice: string
  validate: ProductValidation
  img?: { img: string }[]
  user: {
    id: string
    name?: string | null
    lastname?: string | null
    email: string
    image?: string | null
  }[]
  // Nouvelles métadonnées pour le contexte de validation
  isRecentlyModified?: boolean
  wasRecheckRequested?: boolean
}

interface ValidationStats {
  pending: number
  approved: number
  rejected: number
  recheckRequest: number
  total: number
}

interface ValidationTabsProps {
  products: Product[]
  stats: ValidationStats
  currentUserId: string
  onUpdate: () => void
}

// Memoized motion variants to prevent recreation on every render
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'tween' as const,
      duration: 0.5,
      ease: 'easeOut' as const,
    },
  },
}

function ValidationTabs({ products, stats, currentUserId, onUpdate }: ValidationTabsProps) {
  // Memoize all filtered product arrays to prevent unnecessary recalculations
  const filteredProducts = useMemo(() => {
    return {
      all: products,
      pending: products.filter(
        p =>
          p.validate === ProductValidation.NotVerified ||
          p.validate === ProductValidation.RecheckRequest
      ),
      new: products.filter(
        p => p.validate === ProductValidation.NotVerified && !p.isRecentlyModified
      ),
      resubmitted: products.filter(
        p =>
          p.validate === ProductValidation.RecheckRequest ||
          (p.validate === ProductValidation.NotVerified && p.isRecentlyModified)
      ),
      approved: products.filter(p => p.validate === ProductValidation.Approve),
      rejected: products.filter(p => p.validate === ProductValidation.Refused),
    }
  }, [products])

  // Memoize messages object to prevent recreation
  const emptyStateMessages = useMemo(() => ({
    all: "Aucune annonce n'a été soumise pour le moment.",
    pending: 'Aucune annonce en attente de validation.',
    new: 'Aucune nouvelle annonce soumise.',
    resubmitted: 'Aucune annonce modifiée en attente.',
    approved: 'Aucune annonce validée pour le moment.',
    rejected: 'Aucune annonce rejetée pour le moment.',
  }), [])

  // Memoized empty state renderer
  const renderEmptyState = useCallback((activeTab: string) => {
    return (
      <Card>
        <CardContent className='flex flex-col items-center justify-center py-12'>
          <Home className='h-12 w-12 text-gray-400 mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>Aucune annonce trouvée</h3>
          <p className='text-gray-500 text-center'>
            {emptyStateMessages[activeTab as keyof typeof emptyStateMessages]}
          </p>
        </CardContent>
      </Card>
    )
  }, [emptyStateMessages])

  // Memoized product grid renderer with useCallback to prevent recreation
  const renderProductGrid = useCallback((productList: Product[]) => (
    <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
      {productList.map((product, index) => (
        <motion.div key={product.id} variants={itemVariants} transition={{ delay: index * 0.1 }}>
          <ProductValidationCard
            product={product}
            currentUserId={currentUserId}
            onUpdate={onUpdate}
          />
        </motion.div>
      ))}
    </div>
  ), [currentUserId, onUpdate])

  return (
    <Tabs defaultValue='all' className='w-full'>
      <TabsList className='grid w-full grid-cols-6'>
        <TabsTrigger value='all'>Toutes ({stats.total})</TabsTrigger>
        <TabsTrigger value='pending'>
          À traiter ({stats.pending + stats.recheckRequest})
        </TabsTrigger>
        <TabsTrigger value='new'>Nouvelles ({stats.pending})</TabsTrigger>
        <TabsTrigger value='resubmitted' className='text-orange-600'>
          Modifiées ({stats.recheckRequest})
        </TabsTrigger>
        <TabsTrigger value='approved'>Validées ({stats.approved})</TabsTrigger>
        <TabsTrigger value='rejected' className='text-red-600'>
          Rejetées ({stats.rejected})
        </TabsTrigger>
      </TabsList>

      <TabsContent value='all' className='mt-6'>
        {filteredProducts.all.length === 0 
          ? renderEmptyState('all') 
          : renderProductGrid(filteredProducts.all)
        }
      </TabsContent>

      <TabsContent value='pending' className='mt-6'>
        {filteredProducts.pending.length === 0
          ? renderEmptyState('pending')
          : renderProductGrid(filteredProducts.pending)
        }
      </TabsContent>

      <TabsContent value='new' className='mt-6'>
        {filteredProducts.new.length === 0
          ? renderEmptyState('new')
          : renderProductGrid(filteredProducts.new)
        }
      </TabsContent>

      <TabsContent value='resubmitted' className='mt-6'>
        {filteredProducts.resubmitted.length === 0
          ? renderEmptyState('resubmitted')
          : renderProductGrid(filteredProducts.resubmitted)
        }
      </TabsContent>

      <TabsContent value='approved' className='mt-6'>
        {filteredProducts.approved.length === 0
          ? renderEmptyState('approved')
          : renderProductGrid(filteredProducts.approved)
        }
      </TabsContent>

      <TabsContent value='rejected' className='mt-6'>
        <RejectedProductsTab
          products={products}
          currentUserId={currentUserId}
          onUpdate={onUpdate}
        />
      </TabsContent>
    </Tabs>
  )
}

// Custom comparison function for React.memo to prevent unnecessary re-renders
const arePropsEqual = (prevProps: ValidationTabsProps, nextProps: ValidationTabsProps) => {
  // Check if currentUserId changed
  if (prevProps.currentUserId !== nextProps.currentUserId) {
    return false
  }

  // Check if onUpdate function reference changed (callback)
  if (prevProps.onUpdate !== nextProps.onUpdate) {
    return false
  }

  // Check if stats changed (shallow comparison)
  const prevStats = prevProps.stats
  const nextStats = nextProps.stats
  if (
    prevStats.pending !== nextStats.pending ||
    prevStats.approved !== nextStats.approved ||
    prevStats.rejected !== nextStats.rejected ||
    prevStats.recheckRequest !== nextStats.recheckRequest ||
    prevStats.total !== nextStats.total
  ) {
    return false
  }

  // Check if products array changed (length and product IDs)
  if (prevProps.products.length !== nextProps.products.length) {
    return false
  }

  // Check if product IDs changed (shallow comparison for performance)
  for (let i = 0; i < prevProps.products.length; i++) {
    if (prevProps.products[i].id !== nextProps.products[i].id) {
      return false
    }
    // Also check critical fields that affect filtering
    if (
      prevProps.products[i].validate !== nextProps.products[i].validate ||
      prevProps.products[i].isRecentlyModified !== nextProps.products[i].isRecentlyModified
    ) {
      return false
    }
  }

  return true
}

export default React.memo(ValidationTabs, arePropsEqual)
