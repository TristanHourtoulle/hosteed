'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { ProductValidation } from '@prisma/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Home, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import ProductValidationCard from './ProductValidationCard'
import { RejectedProductsTab } from './RejectedProductsTab'
import Pagination from '@/components/ui/Pagination'
import { getValidationProductsByStatus } from '../actions'

interface Product {
  id: string
  name: string
  description: string
  address: string
  basePrice: string
  validate: ProductValidation
  img?: { img: string }[]
  owner: {
    id: string
    name?: string | null
    lastname?: string | null
    email: string
    image?: string | null
  }
  isRecentlyModified?: boolean
  wasRecheckRequested?: boolean
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface ValidationStats {
  pending: number
  approved: number
  rejected: number
  recheckRequest: number
  total: number
}

interface ValidationTabsProps {
  stats: ValidationStats
  currentUserId: string
  onUpdate: () => void
}

const ITEMS_PER_PAGE = 20

const TAB_STATUS_MAP: Record<string, { status?: ProductValidation; statuses?: ProductValidation[] }> = {
  all: {},
  pending: { statuses: [ProductValidation.NotVerified, ProductValidation.RecheckRequest] },
  new: { status: ProductValidation.NotVerified },
  resubmitted: { status: ProductValidation.RecheckRequest },
  approved: { status: ProductValidation.Approve },
  rejected: { status: ProductValidation.Refused },
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

interface TabState {
  products: Product[]
  pagination: PaginationInfo | null
  loading: boolean
}

const initialTabState = (): TabState => ({
  products: [],
  pagination: null,
  loading: false,
})

function ValidationTabs({ stats, currentUserId, onUpdate }: ValidationTabsProps) {
  const [activeTab, setActiveTab] = useState('all')
  const [pages, setPages] = useState<Record<string, number>>({
    all: 1,
    pending: 1,
    new: 1,
    resubmitted: 1,
    approved: 1,
    rejected: 1,
  })
  const [tabStates, setTabStates] = useState<Record<string, TabState>>({
    all: initialTabState(),
    pending: initialTabState(),
    new: initialTabState(),
    resubmitted: initialTabState(),
    approved: initialTabState(),
    rejected: initialTabState(),
  })

  const fetchTab = useCallback(
    async (tab: string, page: number) => {
      setTabStates(prev => ({
        ...prev,
        [tab]: { ...prev[tab], loading: true },
      }))

      const { status, statuses } = TAB_STATUS_MAP[tab]

      const result = await getValidationProductsByStatus({
        status,
        statuses,
        page,
        limit: ITEMS_PER_PAGE,
      })

      if (result.success && result.data) {
        const products = result.data as Product[]

        setTabStates(prev => ({
          ...prev,
          [tab]: {
            products,
            pagination: result.pagination ?? null,
            loading: false,
          },
        }))
      } else {
        setTabStates(prev => ({
          ...prev,
          [tab]: { ...prev[tab], loading: false },
        }))
      }
    },
    []
  )

  useEffect(() => {
    fetchTab(activeTab, pages[activeTab])
  }, [activeTab, pages, fetchTab])

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab)
    setPages(prev => ({ ...prev, [tab]: 1 }))
  }, [])

  const handlePageChange = useCallback(
    (page: number) => {
      setPages(prev => ({ ...prev, [activeTab]: page }))
    },
    [activeTab]
  )

  const handleUpdate = useCallback(() => {
    onUpdate()
    // Re-fetch current tab after a mutation
    fetchTab(activeTab, pages[activeTab])
  }, [onUpdate, fetchTab, activeTab, pages])

  const renderTabContent = useCallback(
    (tab: string) => {
      const { products, pagination, loading } = tabStates[tab]

      if (loading) {
        return (
          <div className='flex items-center justify-center py-16'>
            <Loader2 className='h-8 w-8 text-blue-500 animate-spin' />
          </div>
        )
      }

      if (products.length === 0) {
        return (
          <Card>
            <CardContent className='flex flex-col items-center justify-center py-12'>
              <Home className='h-12 w-12 text-gray-400 mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>Aucune annonce trouvée</h3>
              <p className='text-gray-500 text-center'>
                Aucune annonce dans cet onglet pour le moment.
              </p>
            </CardContent>
          </Card>
        )
      }

      return (
        <div className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
            {products.map((product, index) => (
              <motion.div key={product.id} variants={itemVariants} transition={{ delay: index * 0.05 }}>
                <ProductValidationCard
                  product={product}
                  currentUserId={currentUserId}
                  onUpdate={handleUpdate}
                />
              </motion.div>
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className='flex flex-col items-center gap-2'>
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                showPrevNext={true}
                showNumbers={true}
                maxVisiblePages={5}
              />
              <p className='text-sm text-gray-500'>
                Affichage de {(pagination.page - 1) * pagination.limit + 1} à{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} sur{' '}
                {pagination.total} annonces
              </p>
            </div>
          )}
        </div>
      )
    },
    [tabStates, currentUserId, handleUpdate, handlePageChange]
  )

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className='w-full'>
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
        {renderTabContent('all')}
      </TabsContent>

      <TabsContent value='pending' className='mt-6'>
        {renderTabContent('pending')}
      </TabsContent>

      <TabsContent value='new' className='mt-6'>
        {renderTabContent('new')}
      </TabsContent>

      <TabsContent value='resubmitted' className='mt-6'>
        {renderTabContent('resubmitted')}
      </TabsContent>

      <TabsContent value='approved' className='mt-6'>
        {renderTabContent('approved')}
      </TabsContent>

      <TabsContent value='rejected' className='mt-6'>
        <RejectedProductsTab
          products={tabStates['rejected'].products}
          loading={tabStates['rejected'].loading}
          pagination={tabStates['rejected'].pagination}
          currentUserId={currentUserId}
          onUpdate={handleUpdate}
          onPageChange={handlePageChange}
        />
      </TabsContent>
    </Tabs>
  )
}

export default ValidationTabs
