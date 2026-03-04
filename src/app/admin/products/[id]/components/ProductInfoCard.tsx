'use client'

import { motion, Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { Badge } from '@/components/ui/shadcnui/badge'
import { Info, Globe, Phone } from 'lucide-react'
import MarkdownRenderer from '@/components/ui/MarkdownRenderer'
import type { AdminProductWithRelations } from '../types'

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

interface ProductInfoCardProps {
  product: AdminProductWithRelations
}

/** Product information card: name, description, address, SEO fields. */
export function ProductInfoCard({ product }: ProductInfoCardProps) {
  return (
    <motion.div initial='hidden' animate='visible' variants={fadeIn}>
      <Card className='border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl py-0 gap-0'>
        <div className='px-6 py-4 border-b border-gray-100'>
          <h2 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
            <Info className='h-5 w-5 text-blue-600' />
            Informations principales
          </h2>
        </div>
        <CardContent className='p-6 space-y-5'>
          <div>
            <p className='text-xs text-gray-500 uppercase tracking-wide mb-1'>Description</p>
            <div className='text-gray-700 prose prose-slate max-w-none prose-sm'>
              <MarkdownRenderer content={product.description} />
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <p className='text-xs text-gray-500 uppercase tracking-wide mb-1'>Adresse complète</p>
              <p className='text-gray-800'>{product.address}</p>
              {product.completeAddress && product.completeAddress !== product.address && (
                <p className='text-gray-600 text-sm mt-1'>{product.completeAddress}</p>
              )}
              {product.phone && (
                <div className='flex items-center gap-1.5 mt-2 text-sm text-gray-600'>
                  <Phone className='h-3.5 w-3.5' />
                  <span>
                    {product.phoneCountry ? `+${product.phoneCountry} ` : ''}
                    {product.phone}
                  </span>
                </div>
              )}
            </div>
            <div>
              <p className='text-xs text-gray-500 uppercase tracking-wide mb-1'>Localisation</p>
              <div className='text-gray-800 text-sm space-y-0.5'>
                {product.neighborhood && <p>Quartier: {product.neighborhood}</p>}
                {product.city && <p>Ville: {product.city}</p>}
                {product.region && <p>Région: {product.region}</p>}
                <p>Pays: {product.country}</p>
              </div>
            </div>
          </div>

          {/* SEO Fields */}
          {(product.metaTitle || product.metaDescription || product.keywords || product.slug) && (
            <div className='border-t border-gray-100 pt-4'>
              <p className='text-xs text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5'>
                <Globe className='h-3.5 w-3.5' />
                SEO
              </p>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3 text-sm'>
                {product.metaTitle && (
                  <div>
                    <p className='text-gray-500 text-xs'>Meta Title</p>
                    <p className='text-gray-800'>{product.metaTitle}</p>
                  </div>
                )}
                {product.slug && (
                  <div>
                    <p className='text-gray-500 text-xs'>Slug</p>
                    <Badge variant='secondary' className='font-mono text-xs'>
                      {product.slug}
                    </Badge>
                  </div>
                )}
                {product.metaDescription && (
                  <div className='md:col-span-2'>
                    <p className='text-gray-500 text-xs'>Meta Description</p>
                    <p className='text-gray-800'>{product.metaDescription}</p>
                  </div>
                )}
                {product.keywords && (
                  <div className='md:col-span-2'>
                    <p className='text-gray-500 text-xs'>Keywords</p>
                    <p className='text-gray-800'>{product.keywords}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
