'use client'

import { motion, Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { Badge } from '@/components/ui/shadcnui/badge'
import { Sparkles } from 'lucide-react'
import type { ProductExtraItem, ProductHighlightItem } from '../types'

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const EXTRA_TYPE_LABELS: Record<string, string> = {
  PER_DAY: 'par jour',
  PER_PERSON: 'par personne',
  PER_DAY_PERSON: 'par jour/pers.',
  PER_BOOKING: 'par réservation',
}

interface ProductExtrasCardProps {
  extras: ProductExtraItem[]
  highlights: ProductHighlightItem[]
}

/** Extras and highlights display. */
export function ProductExtrasCard({ extras, highlights }: ProductExtrasCardProps) {
  if (extras.length === 0 && highlights.length === 0) return null

  return (
    <motion.div initial='hidden' animate='visible' variants={fadeIn}>
      <Card className='border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl py-0 gap-0'>
        <div className='px-6 py-4 border-b border-gray-100'>
          <h2 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
            <Sparkles className='h-5 w-5 text-blue-600' />
            Extras et points forts
          </h2>
        </div>
        <CardContent className='p-6 space-y-5'>
          {/* Extras */}
          {extras.length > 0 && (
            <div>
              <p className='text-xs text-gray-500 uppercase tracking-wide mb-2'>
                Extras ({extras.length})
              </p>
              <div className='space-y-2'>
                {extras.map(extra => (
                  <div
                    key={extra.id}
                    className='flex items-center justify-between p-3 rounded-lg bg-gray-50 text-sm'
                  >
                    <div>
                      <span className='font-medium text-gray-800'>{extra.name}</span>
                      {extra.description && (
                        <p className='text-gray-500 text-xs mt-0.5'>{extra.description}</p>
                      )}
                    </div>
                    <div className='flex items-center gap-2 text-right'>
                      <div>
                        <p className='font-medium text-gray-800'>{extra.priceEUR}€</p>
                        <p className='text-gray-500 text-xs'>{extra.priceMGA} MGA</p>
                      </div>
                      <Badge variant='outline' className='text-xs'>
                        {EXTRA_TYPE_LABELS[extra.type] || extra.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Highlights */}
          {highlights.length > 0 && (
            <div>
              <p className='text-xs text-gray-500 uppercase tracking-wide mb-2'>
                Points forts ({highlights.length})
              </p>
              <div className='flex flex-wrap gap-2'>
                {highlights.map(highlight => (
                  <Badge key={highlight.id} variant='secondary' className='py-1.5'>
                    {highlight.name}
                    {highlight.description && (
                      <span className='text-gray-500 ml-1 font-normal'>
                        — {highlight.description}
                      </span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
