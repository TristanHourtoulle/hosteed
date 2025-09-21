'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { isAdmin } from '@/hooks/useAdminAuth'
import { Input } from '@/components/ui/shadcnui/input'
import { motion } from 'framer-motion'
import { Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/shadcnui/button'
import Link from 'next/link'
import { ProductCard } from './components/ProductCard'
import { useAdminProductsPaginated } from '@/hooks/useAdminPaginated'
import Pagination from '@/components/ui/Pagination'

export default function ProductsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  
  // Use optimized pagination hook
  const {
    products,
    pagination,
    loading,
    error,
    searchTerm,
    handleSearch,
    goToPage,
  } = useAdminProductsPaginated()

  // Security check - Only ADMIN and HOST_MANAGER can access products management
  useEffect(() => {
    if (!session?.user?.roles || !isAdmin(session.user.roles)) {
      router.push('/')
    }
  }, [session, router])

  if (loading) {
    return (
      <div className='p-8 max-w-7xl mx-auto'>
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8'>
          <div className='space-y-1.5'>
            <h1 className='text-2xl font-bold'>Gestion des Hébergements</h1>
            <p className='text-gray-500'>Gérez tous les hébergements de la plateforme</p>
          </div>
          <Button variant='outline' className='shrink-0' disabled>
            <Plus className='h-4 w-4 mr-2' />
            Ajouter
          </Button>
        </div>
        <div className='mb-6'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500' />
            <Input className='pl-9' placeholder='Rechercher par nom ou adresse...' disabled />
          </div>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className='animate-pulse'>
              <div className='bg-gray-200 rounded-lg aspect-[16/9] mb-4'></div>
              <div className='space-y-3'>
                <div className='h-6 bg-gray-200 rounded w-3/4'></div>
                <div className='h-4 bg-gray-200 rounded w-1/2'></div>
                <div className='h-4 bg-gray-200 rounded w-1/4'></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className='p-8 max-w-7xl mx-auto'>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8'>
          <div className='space-y-1.5'>
            <h1 className='text-2xl font-bold'>Gestion des Hébergements</h1>
            <p className='text-gray-500'>Gérez tous les hébergements de la plateforme</p>
          </div>
          <Button variant='outline' asChild className='shrink-0'>
            <Link href='/admin/products/new'>
              <Plus className='h-4 w-4 mr-2' />
              Ajouter
            </Link>
          </Button>
        </div>

        <div className='mb-6'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500' />
            <Input
              className='pl-9 py-5 rounded-full'
              placeholder='Rechercher par nom ou adresse...'
              value={searchTerm}
              onChange={e => handleSearch(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className='text-center py-12'>
            <p className='text-red-500'>Erreur lors du chargement des produits</p>
          </div>
        )}

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {products.length === 0 && !loading && (
          <div className='text-center py-12'>
            <p className='text-gray-500'>Aucun hébergement trouvé</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className='mt-8 flex justify-center'>
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={goToPage}
              showPrevNext={true}
              showNumbers={true}
              maxVisiblePages={5}
            />
          </div>
        )}

        {/* Results summary */}
        {products.length > 0 && (
          <div className='mt-4 text-center text-sm text-gray-500'>
            Affichage de {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} à{' '}
            {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} sur{' '}
            {pagination.totalItems} hébergements
          </div>
        )}
      </motion.div>
    </div>
  )
}
