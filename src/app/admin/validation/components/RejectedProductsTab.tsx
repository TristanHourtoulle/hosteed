'use client'

import { useState } from 'react'
import { ProductValidation } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { motion } from 'framer-motion'
import { Trash2, Loader2, AlertTriangle, Eye } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { deleteSingleRejectedProduct, deleteBulkRejectedProducts } from '../actions'
import Pagination from '@/components/ui/Pagination'

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
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface RejectedProductsTabProps {
  products: Product[]
  loading: boolean
  pagination: PaginationInfo | null
  currentUserId: string
  onUpdate: () => void
  onPageChange: (page: number) => void
}

export function RejectedProductsTab({
  products,
  loading,
  pagination,
  onUpdate,
  onPageChange,
}: RejectedProductsTabProps) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeletingBulk, setIsDeletingBulk] = useState(false)

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(products.map(p => p.id))
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedProducts.length === 0) return

    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer définitivement ${selectedProducts.length} annonce(s) rejetée(s) ?\n\nCette action est irréversible et les hôtes recevront un email de notification.`
    )

    if (!confirmed) return

    setIsDeletingBulk(true)
    try {
      const result = await deleteBulkRejectedProducts(selectedProducts)

      if (result.success) {
        onUpdate()
        setSelectedProducts([])
      } else {
        console.error(result.error)
        alert('Une erreur est survenue lors de la suppression.')
      }
    } catch (error) {
      console.error('Erreur lors de la suppression en masse:', error)
      alert('Une erreur est survenue lors de la suppression.')
    } finally {
      setIsDeletingBulk(false)
    }
  }

  const handleDeleteSingle = async (productId: string, productName: string) => {
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer définitivement l'annonce "${productName}" ?\n\nCette action est irréversible et l'hôte recevra un email de notification.`
    )

    if (!confirmed) return

    setIsDeleting(true)
    try {
      const result = await deleteSingleRejectedProduct(productId)

      if (result.success) {
        onUpdate()
      } else {
        console.error(result.error)
        alert('Une erreur est survenue lors de la suppression.')
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert('Une erreur est survenue lors de la suppression.')
    } finally {
      setIsDeleting(false)
    }
  }

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
          <AlertTriangle className='h-12 w-12 text-gray-400 mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>Aucune annonce rejetée</h3>
          <p className='text-gray-500 text-center'>Aucune annonce rejetée pour le moment.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Bulk actions */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            <span>Annonces rejetées ({pagination?.total ?? products.length})</span>
            <div className='flex items-center gap-4'>
              <div className='flex items-center gap-2'>
                <Checkbox
                  id='select-all'
                  checked={selectedProducts.length === products.length && products.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <label htmlFor='select-all' className='text-sm text-gray-700'>
                  Tout sélectionner
                </label>
              </div>
              {selectedProducts.length > 0 && (
                <Button
                  variant='destructive'
                  onClick={handleDeleteSelected}
                  disabled={isDeletingBulk}
                  className='bg-red-600 hover:bg-red-700'
                >
                  {isDeletingBulk ? (
                    <>
                      <Loader2 className='h-4 w-4 animate-spin mr-2' />
                      Suppression...
                    </>
                  ) : (
                    <>
                      <Trash2 className='h-4 w-4 mr-2' />
                      Supprimer ({selectedProducts.length})
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Rejected products grid */}
      <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className='relative overflow-hidden hover:shadow-lg transition-all duration-300'>
              <div className='absolute top-4 left-4 z-10'>
                <Checkbox
                  checked={selectedProducts.includes(product.id)}
                  onCheckedChange={() => toggleProductSelection(product.id)}
                  className='bg-white border-2'
                />
              </div>

              <div className='relative h-48 w-full'>
                {product.img && product.img.length > 0 ? (
                  <Image
                    src={product.img[0].img}
                    alt={product.name}
                    fill
                    className='object-cover'
                  />
                ) : (
                  <div className='w-full h-full bg-gray-200 flex items-center justify-center'>
                    <AlertTriangle className='h-12 w-12 text-gray-400' />
                  </div>
                )}
                <div className='absolute top-4 right-4'>
                  <span className='bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded'>
                    Rejetée
                  </span>
                </div>
              </div>

              <CardContent className='p-4'>
                <div className='space-y-3'>
                  <div>
                    <h3 className='font-semibold text-lg text-gray-900 line-clamp-1'>
                      {product.name}
                    </h3>
                    <p className='text-gray-600 text-sm line-clamp-2 mt-1'>{product.description}</p>
                  </div>

                  <div className='text-sm text-gray-600'>
                    <span>Hôte: </span>
                    <span className='font-medium'>
                      {product.owner?.name && product.owner?.lastname
                        ? `${product.owner.name} ${product.owner.lastname}`
                        : product.owner?.email || 'Utilisateur inconnu'}
                    </span>
                  </div>

                  <div className='flex gap-2 pt-2'>
                    <Button variant='outline' size='sm' asChild className='flex-1'>
                      <Link href={`/admin/validation/${product.id}`}>
                        <Eye className='h-4 w-4 mr-1' />
                        Détails
                      </Link>
                    </Button>

                    <Button
                      variant='destructive'
                      size='sm'
                      onClick={() => handleDeleteSingle(product.id, product.name)}
                      disabled={isDeleting}
                      className='bg-red-600 hover:bg-red-700'
                      title='Supprimer définitivement cette annonce'
                    >
                      {isDeleting ? (
                        <Loader2 className='h-4 w-4 animate-spin' />
                      ) : (
                        <Trash2 className='h-4 w-4' />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className='flex flex-col items-center gap-2'>
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={onPageChange}
            showPrevNext={true}
            showNumbers={true}
            maxVisiblePages={5}
          />
          <p className='text-sm text-gray-500'>
            Affichage de {(pagination.page - 1) * pagination.limit + 1} à{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total}{' '}
            annonces rejetées
          </p>
        </div>
      )}
    </div>
  )
}
