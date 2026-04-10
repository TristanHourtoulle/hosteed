'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ProductValidation } from '@prisma/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Bell,
  CheckCircle2,
  ClipboardList,
  Home,
  LayoutGrid,
  PenLine,
  XCircle,
} from 'lucide-react'
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

const TAB_STATUS_MAP: Record<
  string,
  { status?: ProductValidation; statuses?: ProductValidation[] }
> = {
  all: {},
  pending: {
    statuses: [ProductValidation.NotVerified, ProductValidation.RecheckRequest],
  },
  new: { status: ProductValidation.NotVerified },
  resubmitted: { status: ProductValidation.RecheckRequest },
  approved: { status: ProductValidation.Approve },
  rejected: { status: ProductValidation.Refused },
}

interface TabDefinition {
  key: string
  label: string
  icon: React.ReactNode
  count: number
  badgeClass: string
  activeClass: string
  emptyTitle: string
  emptySubtitle: string
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

function SkeletonCard() {
  return (
    <div className='relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm'>
      <div className='h-56 w-full animate-pulse bg-slate-200' />
      <div className='space-y-4 p-5'>
        <div className='flex items-center gap-3 border-b border-slate-100 pb-4'>
          <div className='h-9 w-9 animate-pulse rounded-full bg-slate-200' />
          <div className='flex-1 space-y-2'>
            <div className='h-3 w-24 animate-pulse rounded bg-slate-200' />
            <div className='h-3 w-32 animate-pulse rounded bg-slate-200' />
          </div>
        </div>
        <div className='space-y-2'>
          <div className='h-5 w-3/4 animate-pulse rounded bg-slate-200' />
          <div className='h-3 w-full animate-pulse rounded bg-slate-200' />
          <div className='h-3 w-5/6 animate-pulse rounded bg-slate-200' />
        </div>
        <div className='h-3 w-2/3 animate-pulse rounded bg-slate-200' />
        <div className='flex gap-2 pt-2'>
          <div className='h-9 flex-1 animate-pulse rounded-md bg-slate-200' />
          <div className='h-9 w-9 animate-pulse rounded-md bg-slate-200' />
          <div className='h-9 w-9 animate-pulse rounded-md bg-slate-200' />
        </div>
      </div>
    </div>
  )
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 py-16 px-6 text-center'>
      <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100'>
        <Home className='h-8 w-8 text-slate-400' />
      </div>
      <h3 className='mb-1 text-lg font-semibold text-slate-900'>{title}</h3>
      <p className='max-w-md text-sm text-slate-500'>{subtitle}</p>
    </div>
  )
}

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

  const fetchTab = useCallback(async (tab: string, page: number) => {
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
  }, [])

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
    fetchTab(activeTab, pages[activeTab])
  }, [onUpdate, fetchTab, activeTab, pages])

  const tabDefinitions: TabDefinition[] = useMemo(
    () => [
      {
        key: 'all',
        label: 'Toutes',
        icon: <LayoutGrid className='h-4 w-4' />,
        count: stats.total,
        badgeClass: 'bg-slate-100 text-slate-700',
        activeClass:
          'data-[state=active]:border-slate-900 data-[state=active]:text-slate-900',
        emptyTitle: 'Aucune annonce',
        emptySubtitle: 'Il n’y a pas encore d’annonces créées sur la plateforme.',
      },
      {
        key: 'pending',
        label: 'À traiter',
        icon: <ClipboardList className='h-4 w-4' />,
        count: stats.pending + stats.recheckRequest,
        badgeClass: 'bg-amber-100 text-amber-800',
        activeClass:
          'data-[state=active]:border-amber-500 data-[state=active]:text-amber-700',
        emptyTitle: 'Tout est à jour',
        emptySubtitle: 'Aucune annonce en attente d’action. Bon travail !',
      },
      {
        key: 'new',
        label: 'Nouvelles',
        icon: <Bell className='h-4 w-4' />,
        count: stats.pending,
        badgeClass: 'bg-yellow-100 text-yellow-800',
        activeClass:
          'data-[state=active]:border-yellow-500 data-[state=active]:text-yellow-700',
        emptyTitle: 'Aucune nouvelle annonce',
        emptySubtitle:
          'Les nouvelles annonces soumises par les hôtes apparaîtront ici.',
      },
      {
        key: 'resubmitted',
        label: 'Modifiées',
        icon: <PenLine className='h-4 w-4' />,
        count: stats.recheckRequest,
        badgeClass: 'bg-orange-100 text-orange-800',
        activeClass:
          'data-[state=active]:border-orange-500 data-[state=active]:text-orange-700',
        emptyTitle: 'Aucune révision en cours',
        emptySubtitle:
          'Les annonces renvoyées après une demande de révision apparaîtront ici.',
      },
      {
        key: 'approved',
        label: 'Validées',
        icon: <CheckCircle2 className='h-4 w-4' />,
        count: stats.approved,
        badgeClass: 'bg-emerald-100 text-emerald-800',
        activeClass:
          'data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-700',
        emptyTitle: 'Aucune annonce validée',
        emptySubtitle: 'Les annonces que vous validez apparaîtront ici.',
      },
      {
        key: 'rejected',
        label: 'Rejetées',
        icon: <XCircle className='h-4 w-4' />,
        count: stats.rejected,
        badgeClass: 'bg-red-100 text-red-800',
        activeClass:
          'data-[state=active]:border-red-500 data-[state=active]:text-red-700',
        emptyTitle: 'Aucune annonce refusée',
        emptySubtitle: 'Les annonces que vous refusez apparaîtront ici.',
      },
    ],
    [stats]
  )

  const renderTabContent = useCallback(
    (tab: TabDefinition) => {
      const { products, pagination, loading } = tabStates[tab.key]

      if (loading) {
        return (
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3'>
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )
      }

      if (products.length === 0) {
        return <EmptyState title={tab.emptyTitle} subtitle={tab.emptySubtitle} />
      }

      return (
        <div className='space-y-8'>
          {/* Re-key the grid on activeTab + page so framer-motion remounts the subtree
              when data changes and the stagger orchestration runs with the children
              already present. Same pattern as the host dashboard fix. */}
          <motion.div
            key={`grid-${tab.key}-${pagination?.page ?? 1}-${products.length}`}
            className='grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3'
            initial='hidden'
            animate='visible'
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.06 },
              },
            }}
          >
            {products.map(product => (
              <motion.div
                key={product.id}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { type: 'tween', duration: 0.4, ease: 'easeOut' },
                  },
                }}
              >
                <ProductValidationCard
                  product={product}
                  currentUserId={currentUserId}
                  onUpdate={handleUpdate}
                />
              </motion.div>
            ))}
          </motion.div>

          {pagination && pagination.totalPages > 1 && (
            <div className='flex flex-col items-center gap-2 pt-4'>
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                showPrevNext={true}
                showNumbers={true}
                maxVisiblePages={5}
              />
              <p className='text-xs text-slate-500'>
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
      <TabsList className='flex h-auto w-full flex-wrap gap-1 rounded-xl border border-slate-200/80 bg-white/60 p-1.5 backdrop-blur-sm'>
        {tabDefinitions.map(tab => (
          <TabsTrigger
            key={tab.key}
            value={tab.key}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-slate-600 transition data-[state=active]:bg-slate-50 data-[state=active]:shadow-sm ${tab.activeClass}`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            <span
              className={`inline-flex min-w-[1.5rem] items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums ${tab.badgeClass}`}
            >
              {tab.count}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>

      {tabDefinitions.map(tab =>
        tab.key === 'rejected' ? (
          <TabsContent key={tab.key} value={tab.key} className='mt-6'>
            <RejectedProductsTab
              products={tabStates['rejected'].products}
              loading={tabStates['rejected'].loading}
              pagination={tabStates['rejected'].pagination}
              currentUserId={currentUserId}
              onUpdate={handleUpdate}
              onPageChange={handlePageChange}
            />
          </TabsContent>
        ) : (
          <TabsContent key={tab.key} value={tab.key} className='mt-6'>
            {renderTabContent(tab)}
          </TabsContent>
        )
      )}
    </Tabs>
  )
}

export default ValidationTabs
