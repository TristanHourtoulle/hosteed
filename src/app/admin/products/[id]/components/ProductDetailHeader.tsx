'use client'

import { motion, Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { Badge } from '@/components/ui/shadcnui/badge'
import { Home, Bed, Bath, Euro } from 'lucide-react'
import {
  getValidationStatusLabel,
  getValidationStatusClassName,
} from '@/lib/utils/productValidation'
import type { AdminProductWithRelations } from '../types'

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

interface ProductDetailHeaderProps {
  product: AdminProductWithRelations
  commissionRates: { hostRate: number; clientRate: number } | null
}

/** Header card with product name, validation status, and key metrics. */
export function ProductDetailHeader({ product, commissionRates }: ProductDetailHeaderProps) {
  return (
    <motion.div initial='hidden' animate='visible' variants={fadeIn}>
      <Card className='border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden'>
        <CardContent className='p-6 space-y-4'>
          <div className='flex flex-wrap items-start justify-between gap-4'>
            <div className='space-y-1'>
              <div className='flex items-center gap-3'>
                <h1 className='text-2xl font-bold text-gray-900'>{product.name}</h1>
                <Badge variant='outline' className={getValidationStatusClassName(product.validate)}>
                  {getValidationStatusLabel(product.validate)}
                </Badge>
              </div>
              <p className='text-sm text-gray-500'>{product.address}</p>
            </div>
            <div className='text-right'>
              <p className='text-sm text-gray-500'>Prix de base</p>
              <p className='text-3xl font-bold text-gray-900'>{product.basePrice}€</p>
              {product.priceMGA && (
                <p className='text-sm text-gray-500'>{product.priceMGA} MGA</p>
              )}
            </div>
          </div>

          <div className='flex flex-wrap gap-6 text-sm text-gray-600'>
            {product.type && (
              <div className='flex items-center gap-1.5'>
                <Home className='h-4 w-4 text-gray-400' />
                <span>{product.type.name}</span>
              </div>
            )}
            <div className='flex items-center gap-1.5'>
              <Bed className='h-4 w-4 text-gray-400' />
              <span>{product.room ? Number(product.room) : 0} chambre(s)</span>
            </div>
            <div className='flex items-center gap-1.5'>
              <Bath className='h-4 w-4 text-gray-400' />
              <span>{product.bathroom ? Number(product.bathroom) : 0} salle(s) de bain</span>
            </div>
            {commissionRates && (
              <div className='flex items-center gap-1.5'>
                <Euro className='h-4 w-4 text-gray-400' />
                <span>Commission host: {commissionRates.hostRate}%</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
