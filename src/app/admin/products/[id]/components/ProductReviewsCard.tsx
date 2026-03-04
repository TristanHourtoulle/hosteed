'use client'

import { motion, Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { Badge } from '@/components/ui/shadcnui/badge'
import { Star } from 'lucide-react'
import type { AdminProductReview } from '../types'

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

interface ProductReviewsCardProps {
  reviews: AdminProductReview[]
}

/** Compute the average of a numeric array, rounded to one decimal. */
function average(values: number[]): string {
  if (values.length === 0) return '—'
  return (values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(1)
}

/** Average ratings summary and individual reviews (all, including unapproved). */
export function ProductReviewsCard({ reviews }: ProductReviewsCardProps) {
  const RATING_CATEGORIES: Array<{ key: keyof AdminProductReview; label: string }> = [
    { key: 'grade', label: 'Note globale' },
    { key: 'welcomeGrade', label: 'Accueil' },
    { key: 'staff', label: 'Personnel' },
    { key: 'comfort', label: 'Confort' },
    { key: 'equipment', label: 'Équipement' },
    { key: 'cleaning', label: 'Propreté' },
  ]

  return (
    <motion.div initial='hidden' animate='visible' variants={fadeIn}>
      <Card className='border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl py-0 gap-0'>
        <div className='px-6 py-4 border-b border-gray-100'>
          <h2 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
            <Star className='h-5 w-5 text-blue-600' />
            Avis ({reviews.length})
          </h2>
        </div>
        <CardContent className='p-6 space-y-5'>
          {reviews.length === 0 ? (
            <p className='text-gray-500 text-sm'>Aucun avis pour le moment.</p>
          ) : (
            <>
              {/* Average ratings */}
              <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
                {RATING_CATEGORIES.map(({ key, label }) => (
                  <div key={key} className='p-3 rounded-lg bg-gray-50 text-center'>
                    <p className='text-2xl font-bold text-gray-800'>
                      {average(reviews.map(r => r[key] as number))}
                    </p>
                    <p className='text-xs text-gray-500'>{label}</p>
                  </div>
                ))}
              </div>

              {/* Individual reviews */}
              <div className='space-y-3'>
                {reviews.map(review => (
                  <div key={review.id} className='p-4 rounded-lg bg-gray-50 space-y-2'>
                    <div className='flex items-center justify-between'>
                      <h4 className='text-sm font-semibold text-gray-800'>{review.title}</h4>
                      <Badge
                        className={
                          review.approved
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {review.approved ? 'Approuvé' : 'En attente'}
                      </Badge>
                    </div>
                    <p className='text-xs text-gray-500'>
                      {new Date(review.publishDate).toLocaleDateString('fr-FR')}
                    </p>
                    <div className='flex flex-wrap gap-3 text-xs text-gray-600'>
                      {RATING_CATEGORIES.map(({ key, label }) => (
                        <span key={key}>
                          {label}: <strong>{review[key] as number}/5</strong>
                        </span>
                      ))}
                    </div>
                    <p className='text-sm text-gray-700'>{review.text}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
