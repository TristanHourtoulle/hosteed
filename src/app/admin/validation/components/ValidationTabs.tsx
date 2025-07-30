'use client'

import { ProductValidation } from '@prisma/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Home } from 'lucide-react'
import { motion } from 'framer-motion'
import { ProductValidationCard } from './ProductValidationCard'

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

export function ValidationTabs({ products, stats, currentUserId, onUpdate }: ValidationTabsProps) {
  const getFilteredProducts = (activeTab: string) => {
    switch (activeTab) {
      case 'pending':
        return products.filter(
          p =>
            p.validate === ProductValidation.NotVerified ||
            p.validate === ProductValidation.RecheckRequest
        )
      case 'new':
        // Nouvelles soumissions (jamais validées, pas récemment modifiées)
        return products.filter(
          p => p.validate === ProductValidation.NotVerified && !p.isRecentlyModified
        )
      case 'resubmitted':
        // Annonces modifiées après demande de révision OU encore en demande de révision
        return products.filter(
          p =>
            p.validate === ProductValidation.RecheckRequest ||
            (p.validate === ProductValidation.NotVerified && p.isRecentlyModified)
        )
      case 'approved':
        return products.filter(p => p.validate === ProductValidation.Approve)
      case 'rejected':
        return products.filter(p => p.validate === ProductValidation.Refused)
      default:
        return products
    }
  }

  const renderEmptyState = (activeTab: string) => {
    const messages = {
      all: "Aucune annonce n'a été soumise pour le moment.",
      pending: 'Aucune annonce en attente de validation.',
      new: 'Aucune nouvelle annonce soumise.',
      resubmitted: 'Aucune annonce modifiée en attente.',
      approved: 'Aucune annonce validée pour le moment.',
      rejected: 'Aucune annonce rejetée pour le moment.',
    }

    return (
      <Card>
        <CardContent className='flex flex-col items-center justify-center py-12'>
          <Home className='h-12 w-12 text-gray-400 mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>Aucune annonce trouvée</h3>
          <p className='text-gray-500 text-center'>
            {messages[activeTab as keyof typeof messages]}
          </p>
        </CardContent>
      </Card>
    )
  }

  const renderProductGrid = (filteredProducts: Product[]) => (
    <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
      {filteredProducts.map((product, index) => (
        <motion.div key={product.id} variants={itemVariants} transition={{ delay: index * 0.1 }}>
          <ProductValidationCard
            product={product}
            currentUserId={currentUserId}
            onUpdate={onUpdate}
          />
        </motion.div>
      ))}
    </div>
  )

  return (
    <Tabs defaultValue='all' className='w-full'>
      <TabsList className='grid w-full grid-cols-5'>
        <TabsTrigger value='all'>Toutes ({stats.total})</TabsTrigger>
        <TabsTrigger value='pending'>
          À traiter ({stats.pending + stats.recheckRequest})
        </TabsTrigger>
        <TabsTrigger value='new'>Nouvelles ({stats.pending})</TabsTrigger>
        <TabsTrigger value='resubmitted' className='text-orange-600'>
          Modifiées ({stats.recheckRequest})
        </TabsTrigger>
        <TabsTrigger value='approved'>Validées ({stats.approved})</TabsTrigger>
      </TabsList>

      <TabsContent value='all' className='mt-6'>
        {products.length === 0 ? renderEmptyState('all') : renderProductGrid(products)}
      </TabsContent>

      <TabsContent value='pending' className='mt-6'>
        {(() => {
          const filteredProducts = getFilteredProducts('pending')
          return filteredProducts.length === 0
            ? renderEmptyState('pending')
            : renderProductGrid(filteredProducts)
        })()}
      </TabsContent>

      <TabsContent value='new' className='mt-6'>
        {(() => {
          const filteredProducts = getFilteredProducts('new')
          return filteredProducts.length === 0
            ? renderEmptyState('new')
            : renderProductGrid(filteredProducts)
        })()}
      </TabsContent>

      <TabsContent value='resubmitted' className='mt-6'>
        {(() => {
          const filteredProducts = getFilteredProducts('resubmitted')
          return filteredProducts.length === 0
            ? renderEmptyState('resubmitted')
            : renderProductGrid(filteredProducts)
        })()}
      </TabsContent>

      <TabsContent value='approved' className='mt-6'>
        {(() => {
          const filteredProducts = getFilteredProducts('approved')
          return filteredProducts.length === 0
            ? renderEmptyState('approved')
            : renderProductGrid(filteredProducts)
        })()}
      </TabsContent>
    </Tabs>
  )
}
