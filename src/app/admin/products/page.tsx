'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/shadcnui/input'
import { motion } from 'framer-motion'
import { Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/shadcnui/button'
import Link from 'next/link'
import { ProductCard } from './components/ProductCard'
import { Product } from '@prisma/client'
import { findAllProducts } from '@/lib/services/product.service'

interface ExtendedProduct extends Product {
  img: { img: string }[]
}

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [products, setProducts] = useState<ExtendedProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await findAllProducts()
        if (data) {
          setProducts(data as ExtendedProduct[])
        }
      } catch (error) {
        console.error('Erreur lors du chargement des produits:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const filteredProducts = products.filter(
    product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.address.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className='text-center py-12'>
            <p className='text-gray-500'>Aucun hébergement trouvé</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
