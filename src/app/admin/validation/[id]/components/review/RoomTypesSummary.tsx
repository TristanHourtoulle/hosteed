'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BedDouble, Users, Euro, Maximize2, Cigarette } from 'lucide-react'
import { roomTypeLine } from './roomTypeView'
import type { RoomTypeWithRelations } from './roomTypeTypes'

interface RoomTypesSummaryProps {
  roomTypes: RoomTypeWithRelations[]
}

/**
 * Read-only summary of a hotel's room types shown in the admin validation
 * detail view. Consumes the pure `roomTypeLine` formatter for all display
 * strings so the presentation logic stays testable under node.
 */
export function RoomTypesSummary({ roomTypes }: RoomTypesSummaryProps) {
  if (roomTypes.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center'>
          <BedDouble className='h-4 w-4 mr-2' />
          Types de chambres ({roomTypes.length})
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {roomTypes.map(roomType => {
          const line = roomTypeLine(roomType)
          const activePromotions = (roomType.promotions ?? []).filter(p => p.isActive)
          return (
            <div key={line.id} className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
              <div className='flex items-center justify-between gap-2'>
                <span className='font-semibold text-sm text-gray-800'>{line.title}</span>
                <Badge variant='secondary'>{line.quantityLabel}</Badge>
              </div>
              <div className='mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600'>
                <span className='flex items-center gap-1'>
                  <Users className='h-4 w-4 text-gray-400' />
                  {line.capacityLabel}
                </span>
                <span className='flex items-center gap-1'>
                  <Euro className='h-4 w-4 text-gray-400' />
                  {line.priceLabel}
                </span>
                {line.surfaceLabel && (
                  <span className='flex items-center gap-1'>
                    <Maximize2 className='h-4 w-4 text-gray-400' />
                    {line.surfaceLabel}
                  </span>
                )}
                <span className='flex items-center gap-1'>
                  <Cigarette className='h-4 w-4 text-gray-400' />
                  {line.smokingLabel}
                </span>
              </div>
              <div className='mt-2 flex items-center gap-1 text-sm text-gray-600'>
                <BedDouble className='h-4 w-4 text-gray-400' />
                {line.bedsLabel}
              </div>
              {activePromotions.length > 0 && (
                <div className='mt-2 flex flex-wrap gap-2'>
                  {activePromotions.map(promo => (
                    <Badge
                      key={promo.id}
                      className='bg-orange-100 text-orange-700 hover:bg-orange-100'
                    >
                      -{promo.discountPercentage}%
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
