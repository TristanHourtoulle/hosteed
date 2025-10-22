'use client'

import { ProductPromotion } from '@prisma/client'
import { Calendar, Trash2, Edit, Clock } from 'lucide-react'
import { Button } from '@/components/ui/shadcnui/button'
import PromotionBadge from './PromotionBadge'
import { getDaysUntilEnd, getUrgencyMessage } from '@/lib/utils/promotion'
import { formatCurrency } from '@/lib/utils/formatNumber'

interface Product {
  id: string
  name: string
  basePrice: string
}

interface PromotionCardProps {
  promotion: ProductPromotion & { product?: Product }
  onEdit?: () => void
  onCancel?: () => void
  showActions?: boolean
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function PromotionCard({
  promotion,
  onEdit,
  onCancel,
  showActions = true,
}: PromotionCardProps) {
  const daysUntilEnd = getDaysUntilEnd(promotion.endDate)
  const urgencyMessage = getUrgencyMessage(promotion.endDate)
  const isExpiringSoon = daysUntilEnd > 0 && daysUntilEnd <= 7
  const isExpired = daysUntilEnd < 0
  const basePrice = promotion.product ? parseFloat(promotion.product.basePrice) : 0
  const discountedPrice = basePrice * (1 - promotion.discountPercentage / 100)

  return (
    <div
      className={`
      bg-white rounded-lg border-2 shadow-sm p-4 sm:p-6
      ${!promotion.isActive || isExpired ? 'opacity-60 border-gray-300' : 'border-orange-300'}
      transition-all hover:shadow-md
    `}
    >
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4'>
        {/* Left section */}
        <div className='flex-1 space-y-3'>
          {/* Badge and product name */}
          <div className='flex flex-wrap items-center gap-2'>
            <PromotionBadge discountPercentage={promotion.discountPercentage} />
            {!promotion.isActive && (
              <span className='px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full'>
                Désactivée
              </span>
            )}
            {isExpired && promotion.isActive && (
              <span className='px-2 py-1 bg-red-200 text-red-700 text-xs rounded-full'>
                Expirée
              </span>
            )}
            {isExpiringSoon && promotion.isActive && (
              <span className='px-2 py-1 bg-orange-100 text-orange-700 text-xs sm:text-sm rounded-full flex items-center gap-1'>
                <Clock className='w-3 h-3' />
                {urgencyMessage}
              </span>
            )}
          </div>

          {/* Product info */}
          {promotion.product && (
            <div className='space-y-1'>
              <h3 className='font-semibold text-base sm:text-lg text-gray-900'>
                {promotion.product.name}
              </h3>
              <div className='flex flex-wrap items-baseline gap-2'>
                <span className='text-sm text-gray-500 line-through'>{formatCurrency(basePrice, 'EUR')}</span>
                <span className='text-lg sm:text-xl font-bold text-green-600'>
                  {formatCurrency(discountedPrice, 'EUR')}
                </span>
                <span className='text-xs sm:text-sm text-green-600'>/ nuit</span>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className='flex items-center gap-2 text-xs sm:text-sm text-gray-600'>
            <Calendar className='w-4 h-4' />
            <span>
              {formatDate(promotion.startDate)} → {formatDate(promotion.endDate)}
            </span>
          </div>
        </div>

        {/* Right section - Actions */}
        {showActions && (
          <div className='flex sm:flex-col gap-2'>
            {onEdit && promotion.isActive && !isExpired && (
              <Button onClick={onEdit} variant='outline' size='sm' className='flex-1 sm:flex-none'>
                <Edit className='w-4 h-4 sm:mr-2' />
                <span className='hidden sm:inline'>Modifier</span>
              </Button>
            )}
            {onCancel && promotion.isActive && (
              <Button
                onClick={onCancel}
                variant='outline'
                size='sm'
                className='flex-1 sm:flex-none text-red-600 hover:text-red-700 hover:bg-red-50'
              >
                <Trash2 className='w-4 h-4 sm:mr-2' />
                <span className='hidden sm:inline'>Annuler</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
