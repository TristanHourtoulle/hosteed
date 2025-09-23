'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { useHostProducts } from '@/hooks/useHostProducts'
import { ProductValidation } from '@prisma/client'
import { LazyImage } from '@/components/ui/LazyImage'
import Link from 'next/link'
import { getCityFromAddress } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { Button } from '@/components/ui/shadcnui/button'
import { motion } from 'framer-motion'
import { Home, Calendar, Edit, Eye, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import HostNavbar from './components/HostNavbar'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function HostDashboard() {
  const { status } = useSession()
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 20
  
  const {
    data: hostProductsData,
    isLoading: loading,
    error,
  } = useHostProducts(currentPage, productsPerPage)

  const products = hostProductsData?.products || []
  const totalPages = hostProductsData?.totalPages || 0
  const hasNextPage = hostProductsData?.hasNextPage || false
  const hasPreviousPage = hostProductsData?.hasPreviousPage || false

  const getStatusBadgeColor = (status: ProductValidation, isDraft?: boolean) => {
    if (isDraft) {
      return 'bg-indigo-100 text-indigo-800 border border-indigo-200'
    }
    switch (status) {
      case ProductValidation.Approve:
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200'
      case ProductValidation.Refused:
        return 'bg-red-100 text-red-800 border border-red-200'
      case ProductValidation.NotVerified:
        return 'bg-amber-100 text-amber-800 border border-amber-200'
      case ProductValidation.RecheckRequest:
        return 'bg-blue-100 text-blue-800 border border-blue-200'
      case ProductValidation.ModificationPending:
        return 'bg-purple-100 text-purple-800 border border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200'
    }
  }

  const getStatusText = (status: ProductValidation, isDraft?: boolean) => {
    if (isDraft) {
      return 'Brouillon de modification'
    }
    switch (status) {
      case ProductValidation.Approve:
        return 'Validé'
      case ProductValidation.Refused:
        return 'Refusé'
      case ProductValidation.NotVerified:
        return 'En attente'
      case ProductValidation.RecheckRequest:
        return 'Révision demandée'
      case ProductValidation.ModificationPending:
        return 'Modification en attente'
      default:
        return 'Inconnu'
    }
  }

  // Gestion de l'authentification
  if (status === 'loading') {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-50 to-blue-50'>
        <HostNavbar />
        <div className='max-w-7xl mx-auto p-6'>
          <div className='animate-pulse space-y-8'>
            <div className='h-8 bg-gray-200 rounded w-1/4'></div>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {[1, 2, 3].map(i => (
                <Card key={i} className='overflow-hidden pt-0'>
                  <div className='h-48 bg-gray-200'></div>
                  <CardContent className='p-6 space-y-4'>
                    <div className='h-4 bg-gray-200 rounded w-3/4'></div>
                    <div className='h-4 bg-gray-200 rounded w-1/2'></div>
                    <div className='h-4 bg-gray-200 rounded w-1/4'></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-50 to-blue-50'>
        <HostNavbar />
        <div className='max-w-7xl mx-auto p-6'>
          <Card className='border-amber-200 bg-amber-50'>
            <CardContent className='p-6'>
              <p className='text-amber-600'>Vous devez être connecté pour accéder à cette page.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-50 to-blue-50'>
        <HostNavbar />
        <div className='max-w-7xl mx-auto p-6'>
          <Card className='border-red-200 bg-red-50'>
            <CardContent className='p-6'>
              <p className='text-red-600'>
                {error instanceof Error ? error.message : 'Erreur lors du chargement des annonces'}
              </p>
              <Button 
                onClick={() => window.location.reload()} 
                className='mt-4'
                variant='outline'
              >
                Réessayer
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-blue-50'>
      <HostNavbar />
      <motion.div
        className='max-w-7xl mx-auto p-6'
        initial='hidden'
        animate='visible'
        variants={containerVariants}
      >
        <div className='flex justify-between items-center mb-8'>
          <motion.h1
            className='text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent'
            variants={itemVariants}
          >
            Mes annonces
          </motion.h1>
          <motion.div variants={itemVariants}>
            <Button
              asChild
              className='bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200'
            >
              <Link href='/createProduct'>
                <Plus className='w-5 h-5 mr-2' />
                Créer une nouvelle annonce
              </Link>
            </Button>
          </motion.div>
        </div>

        {products.length === 0 ? (
          <motion.div variants={itemVariants}>
            <Card className='border-dashed border-2 border-gray-300 bg-white/50 backdrop-blur-sm'>
              <CardContent className='p-12 text-center'>
                <Home className='w-12 h-12 mx-auto mb-4 text-gray-400' />
                <p className='text-gray-600 mb-4 text-lg'>
                  Vous n&apos;avez pas encore d&apos;annonces
                </p>
                <Button asChild variant='outline' className='hover:bg-blue-50'>
                  <Link href='/createProduct'>
                    <Plus className='w-5 h-5 mr-2' />
                    Créer votre première annonce
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            variants={containerVariants}
          >
            {products.map(product => (
              <motion.div key={product.id} variants={itemVariants}>
                <Card className='pt-0 pb-0 overflow-hidden group hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm'>
                  {product.img && product.img[0] && (
                    <div className='relative h-48 w-full overflow-hidden'>
                      <LazyImage
                        src={product.img[0].img}
                        alt={product.name}
                        fill
                        className='object-cover group-hover:scale-110 transition-transform duration-300'
                        quality={80}
                      />
                    </div>
                  )}
                  <CardContent className='p-6 space-y-4'>
                    <div className='flex justify-between items-start'>
                      <h2 className='text-xl font-semibold text-gray-800 line-clamp-1'>
                        {product.name}
                      </h2>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(product.validate, product.isDraft)}`}
                      >
                        {getStatusText(product.validate, product.isDraft)}
                      </span>
                    </div>
                    <div className='space-y-2'>
                      <p className='text-gray-600'>{getCityFromAddress(product.address)}</p>
                      <p className='text-2xl font-bold text-blue-600'>{product.basePrice}€</p>
                    </div>
                    <div className='flex justify-between items-center pt-4 border-t border-gray-100'>
                      <Button
                        asChild
                        variant='ghost'
                        className='hover:bg-blue-50 hover:text-blue-600 rounded-full px-4 py-2'
                      >
                        <Link href={`/host/${product.id}`}>
                          <Eye className='w-4 h-4 mr-2' />
                          Voir
                        </Link>
                      </Button>
                      <div className='flex gap-2'>
                        <Button
                          asChild
                          variant='ghost'
                          className='hover:bg-blue-50 hover:text-blue-600 rounded-full px-4 py-2'
                        >
                          <Link href={`/dashboard/host/calendar?property=${product.id}`}>
                            <Calendar className='w-4 h-4 mr-2' />
                            Calendrier
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant='ghost'
                          className='hover:bg-green-50 hover:text-green-600 rounded-full px-4 py-2'
                        >
                          <Link href={`/dashboard/host/property/${product.id}`}>
                            <Home className='w-4 h-4 mr-2' />
                            Tableau de bord
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant='ghost'
                          className='hover:bg-blue-50 hover:text-blue-600 rounded-full px-4 py-2'
                        >
                          <Link href={`/dashboard/host/edit/${product.id}`}>
                            <Edit className='w-4 h-4 mr-2' />
                            Modifier
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Contrôles de pagination */}
        {totalPages > 1 && (
          <motion.div
            className='flex justify-center items-center mt-8 space-x-2'
            variants={itemVariants}
            initial='hidden'
            animate='visible'
          >
            <Button
              variant='outline'
              size='sm'
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={!hasPreviousPage || loading}
              className='hover:bg-blue-50'
            >
              <ChevronLeft className='w-4 h-4 mr-1' />
              Précédent
            </Button>
            
            <div className='flex space-x-1'>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages, currentPage - 2 + i))
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setCurrentPage(pageNum)}
                    disabled={loading}
                    className={pageNum === currentPage ? 'bg-blue-600 text-white' : 'hover:bg-blue-50'}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            
            <Button
              variant='outline'
              size='sm'
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={!hasNextPage || loading}
              className='hover:bg-blue-50'
            >
              Suivant
              <ChevronRight className='w-4 h-4 ml-1' />
            </Button>
          </motion.div>
        )}

        {/* Indicateur de chargement pour les nouvelles pages */}
        {loading && products.length > 0 && (
          <motion.div
            className='flex justify-center items-center mt-4'
            variants={itemVariants}
          >
            <div className='animate-pulse text-gray-500 text-sm'>
              Chargement en cours...
            </div>
          </motion.div>
        )}

        {/* Informations sur la pagination */}
        {hostProductsData && products.length > 0 && (
          <motion.div
            className='text-center mt-6 text-gray-600 text-sm'
            variants={itemVariants}
          >
            Affichage de {Math.min(productsPerPage, products.length)} sur {hostProductsData.totalCount} annonce{hostProductsData.totalCount > 1 ? 's' : ''}
            {totalPages > 1 && ` (page ${currentPage} sur ${totalPages})`}
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
