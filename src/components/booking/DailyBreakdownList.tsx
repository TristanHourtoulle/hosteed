'use client'

import { useState, useMemo } from 'react'
import { CalendarDays, ChevronDown, ChevronUp } from 'lucide-react'
import { formatCurrencySafe } from '@/lib/utils/formatNumber'

export interface DailyBreakdownItem {
  date: Date | string
  basePrice: number
  finalPrice: number
  promotionApplied: boolean
  promotionDiscount?: number
  specialPriceApplied: boolean
  specialPriceValue?: number
  savings: number
}

interface DailyBreakdownListProps {
  dailyBreakdown: DailyBreakdownItem[]
  defaultExpanded?: boolean
}

function formatDayLabel(date: Date | string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

/**
 * Collapsible per-day pricing breakdown with special rate badges.
 * @param dailyBreakdown - Array of day-level pricing data
 * @param defaultExpanded - Whether the list starts expanded (default: false)
 */
export function DailyBreakdownList({
  dailyBreakdown,
  defaultExpanded = false,
}: DailyBreakdownListProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const formattedDays = useMemo(
    () =>
      dailyBreakdown.map(day => ({
        ...day,
        label: formatDayLabel(day.date),
        dateKey: typeof day.date === 'string' ? day.date : day.date.toISOString(),
      })),
    [dailyBreakdown]
  )

  return (
    <div className='space-y-2'>
      <button
        type='button'
        onClick={() => setIsExpanded(prev => !prev)}
        aria-expanded={isExpanded}
        className='flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors w-full'
      >
        <CalendarDays className='h-4 w-4' />
        <span className='font-medium'>Détail par nuit</span>
        {isExpanded ? (
          <ChevronUp className='h-4 w-4 ml-auto' />
        ) : (
          <ChevronDown className='h-4 w-4 ml-auto' />
        )}
      </button>

      {isExpanded && (
        <div className='space-y-1.5 max-h-48 overflow-y-auto'>
          {formattedDays.map(day => (
            <div
              key={day.dateKey}
              className='flex items-center justify-between py-1.5 px-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors text-xs sm:text-sm'
            >
              <span className='font-medium text-gray-800'>{day.label}</span>
              <div className='flex items-center gap-2'>
                {day.savings > 0 && (
                  <>
                    {day.promotionApplied && (
                      <span className='text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium'>
                        Promo{day.promotionDiscount ? ` -${day.promotionDiscount}%` : ''}
                      </span>
                    )}
                    {day.specialPriceApplied && (
                      <span className='text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium'>
                        Prix spécial
                      </span>
                    )}
                    <span className='text-xs text-gray-400 line-through'>
                      {formatCurrencySafe(day.basePrice)}
                    </span>
                  </>
                )}
                {day.savings < 0 && day.specialPriceApplied && (
                  <span className='text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium'>
                    Tarif spécial
                  </span>
                )}
                <span className='font-semibold text-gray-900'>
                  {formatCurrencySafe(day.finalPrice)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
