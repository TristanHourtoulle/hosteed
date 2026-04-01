'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { isAdmin } from '@/hooks/useAdminAuth'
import { Input } from '@/components/ui/shadcnui/input'
import { Button } from '@/components/ui/shadcnui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Search, Trash2, Home, Loader2 } from 'lucide-react'
import { motion, Variants } from 'framer-motion'
import { toast } from 'sonner'
import { ProductCard } from './components/ProductCard'
import { ConfirmDeleteDialog } from './components/ConfirmDeleteDialog'
import { ConfirmBulkDeleteDialog } from './components/ConfirmBulkDeleteDialog'
import { useAdminProductsPaginated } from '@/hooks/useAdminPaginated'
import Pagination from '@/components/ui/Pagination'

const SEARCH_DEBOUNCE_MS = 300

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
}

export default function ProductsPage() {
  const {
    session,
    isLoading: isAuthLoading,
    isAuthenticated,
  } = useAuth({ required: true, redirectTo: '/auth' })
  const router = useRouter()

  const {
    products,
    pagination,
    loading,
    isFetching,
    error,
    searchTerm,
    handleSearch,
    goToPage,
    refetch,
  } = useAdminProductsPaginated()

  const [localSearch, setLocalSearch] = useState(searchTerm)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  useEffect(() => {
    if (isAuthenticated && (!session?.user?.roles || !isAdmin(session.user.roles))) {
      router.push('/')
    }
  }, [isAuthenticated, session, router])

  useEffect(() => {
    setLocalSearch(searchTerm)
  }, [searchTerm])

  useEffect(() => {
    setSelectedProducts([])
  }, [products])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const onSearchChange = useCallback(
    (value: string) => {
      setLocalSearch(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        handleSearch(value)
      }, SEARCH_DEBOUNCE_MS)
    },
    [handleSearch]
  )

  const toggleSelect = useCallback((id: string) => {
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    )
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(products.map(p => p.id))
    }
  }, [selectedProducts.length, products])

  const handleDeleteSingle = useCallback(async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/products/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (!response.ok) {
        toast.error(data.error || 'Erreur lors de la suppression')
        return
      }
      toast.success(data.message)
      setDeleteTarget(null)
      refetch()
    } catch {
      toast.error('Erreur réseau lors de la suppression')
    } finally {
      setIsDeleting(false)
    }
  }, [deleteTarget, refetch])

  const handleBulkDelete = useCallback(async () => {
    if (selectedProducts.length === 0) return
    setIsBulkDeleting(true)
    try {
      const response = await fetch('/api/admin/products/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedProducts }),
      })
      const data = await response.json()
      if (!response.ok) {
        toast.error(data.error || 'Erreur lors de la suppression')
        return
      }

      const messages: string[] = []
      if (data.deletedCount > 0) {
        messages.push(`${data.deletedCount} hébergement(s) supprimé(s)`)
      }
      if (data.blockedProducts?.length > 0) {
        messages.push(`${data.blockedProducts.length} ignoré(s) (réservations actives)`)
      }
      toast.success(messages.join('. '))

      setShowBulkDeleteDialog(false)
      setSelectedProducts([])
      refetch()
    } catch {
      toast.error('Erreur réseau lors de la suppression')
    } finally {
      setIsBulkDeleting(false)
    }
  }, [selectedProducts, refetch])

  if (isAuthLoading || loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='flex flex-col items-center gap-4'>
          <div className='w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin' />
          <p className='text-slate-600 text-lg'>Chargement...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'>
      <div className='container mx-auto p-6 space-y-8'>
        {/* Header */}
        <motion.div
          className='text-center space-y-4'
          variants={containerVariants}
          initial='hidden'
          animate='visible'
        >
          <motion.div
            variants={itemVariants}
            className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg mb-4'
          >
            <Home className='w-8 h-8 text-white' />
          </motion.div>
          <motion.h1
            variants={itemVariants}
            className='text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent'
          >
            Gestion des Hébergements
          </motion.h1>
          <motion.p variants={itemVariants} className='text-gray-600 text-lg max-w-2xl mx-auto'>
            Consultez, recherchez et gérez tous les hébergements de la plateforme
          </motion.p>
        </motion.div>

        {/* Search + Toolbar */}
        <motion.div
          variants={containerVariants}
          initial='hidden'
          animate='visible'
          className='bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-0 space-y-4'
        >
          <motion.div variants={itemVariants} className='relative max-w-md'>
            {isFetching ? (
              <Loader2 className='absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 h-4 w-4 animate-spin' />
            ) : (
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
            )}
            <Input
              placeholder='Rechercher par nom ou adresse...'
              value={localSearch}
              onChange={e => onSearchChange(e.target.value)}
              className='pl-10 py-3 border-0 bg-gray-50 focus:bg-white transition-colors rounded-xl'
            />
          </motion.div>

          {/* Selection bar */}
          {products.length > 0 && (
            <motion.div
              variants={itemVariants}
              className='flex items-center justify-between pt-2 border-t border-gray-100'
            >
              <div className='flex items-center gap-3'>
                <Checkbox
                  checked={selectedProducts.length === products.length && products.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <span className='text-sm text-gray-500'>
                  {selectedProducts.length > 0
                    ? `${selectedProducts.length} sur ${products.length} sélectionné(s)`
                    : `${pagination.totalItems} hébergement${pagination.totalItems > 1 ? 's' : ''}`}
                </span>
              </div>
              {selectedProducts.length > 0 && (
                <Button
                  variant='destructive'
                  size='sm'
                  onClick={() => setShowBulkDeleteDialog(true)}
                  className='rounded-xl'
                >
                  <Trash2 className='h-4 w-4 mr-1.5' />
                  Supprimer ({selectedProducts.length})
                </Button>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Error state */}
        {error && (
          <motion.div variants={itemVariants} className='text-center py-8'>
            <p className='text-red-600'>Erreur lors du chargement des hébergements</p>
          </motion.div>
        )}

        {/* Product grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, duration: 0.3 }}
            >
              <ProductCard
                product={product}
                selected={selectedProducts.includes(product.id)}
                onToggleSelect={toggleSelect}
                onDelete={setDeleteTarget}
              />
            </motion.div>
          ))}
        </div>

        {/* Empty state */}
        {products.length === 0 && !loading && !error && (
          <motion.div variants={itemVariants} className='text-center py-16'>
            <Home className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>Aucun hébergement trouvé</h3>
            <p className='text-gray-500'>
              {localSearch
                ? 'Essayez de modifier votre recherche.'
                : 'Aucun hébergement sur la plateforme.'}
            </p>
          </motion.div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className='flex flex-col items-center gap-3'>
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={goToPage}
              showPrevNext={true}
              showNumbers={true}
              maxVisiblePages={5}
            />
            <p className='text-sm text-gray-500'>
              Affichage de {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} à{' '}
              {Math.min(
                pagination.currentPage * pagination.itemsPerPage,
                pagination.totalItems
              )}{' '}
              sur {pagination.totalItems} hébergements
            </p>
          </div>
        )}
      </div>

      {/* Delete dialogs */}
      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteSingle}
        product={deleteTarget}
        isLoading={isDeleting}
      />
      <ConfirmBulkDeleteDialog
        open={showBulkDeleteDialog}
        onClose={() => setShowBulkDeleteDialog(false)}
        onConfirm={handleBulkDelete}
        count={selectedProducts.length}
        isLoading={isBulkDeleting}
      />
    </div>
  )
}
