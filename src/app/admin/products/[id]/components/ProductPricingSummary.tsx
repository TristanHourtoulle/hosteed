'use client'

import { motion, Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { Wallet, Tag, Percent, Gift } from 'lucide-react'
import type { AdminProductWithRelations } from '../types'

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

interface ProductPricingSummaryProps {
  product: AdminProductWithRelations
  specialPricesCount: number
  commissionRates: { hostRate: number; clientRate: number } | null
}

/** Sidebar pricing overview: base price, commission, promotions, special prices. */
export function ProductPricingSummary({
  product,
  specialPricesCount,
  commissionRates,
}: ProductPricingSummaryProps) {
  const activePromotions = product.promotions.filter(p => p.isActive).length

  return (
    <motion.div initial='hidden' animate='visible' variants={fadeIn}>
      <Card className='border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl py-0 gap-0'>
        <div className='px-6 py-4 border-b border-gray-100'>
          <h2 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
            <Wallet className='h-5 w-5 text-blue-600' />
            Tarification
          </h2>
        </div>
        <CardContent className='p-6 space-y-4'>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-gray-500'>Prix de base</span>
            <div className='text-right'>
              <p className='text-lg font-bold text-gray-800'>{product.basePrice}€</p>
              <p className='text-xs text-gray-500'>{product.priceMGA} MGA</p>
            </div>
          </div>

          {commissionRates ? (
            <div className='space-y-1'>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-gray-500 flex items-center gap-1'>
                  <Percent className='h-3.5 w-3.5' />
                  Commission host
                </span>
                <p className='font-medium text-gray-800'>{commissionRates.hostRate}%</p>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-gray-500 flex items-center gap-1'>
                  <Percent className='h-3.5 w-3.5' />
                  Commission client
                </span>
                <p className='font-medium text-gray-800'>{commissionRates.clientRate}%</p>
              </div>
            </div>
          ) : (
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-500 flex items-center gap-1'>
                <Percent className='h-3.5 w-3.5' />
                Commission
              </span>
              <p className='font-medium text-gray-500 text-xs'>Chargement...</p>
            </div>
          )}

          <div className='border-t border-gray-100 pt-3 space-y-2'>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-500 flex items-center gap-1'>
                <Gift className='h-3.5 w-3.5' />
                Promotions actives
              </span>
              <p className='font-medium text-gray-800'>{activePromotions}</p>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-500 flex items-center gap-1'>
                <Tag className='h-3.5 w-3.5' />
                Prix spéciaux
              </span>
              <p className='font-medium text-gray-800'>{specialPricesCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
