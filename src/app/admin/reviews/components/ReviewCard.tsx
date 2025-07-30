'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardFooter } from '@/components/ui/shadcnui/card'
import { Button } from '@/components/ui/shadcnui/button'
import { Badge } from '@/components/ui/shadcnui/badge'
import { Star, ThumbsUp, ThumbsDown, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface ReviewCardProps {
  review: {
    id: string
    rating: number
    comment: string
    createdAt: Date
    status: 'pending' | 'approved' | 'rejected'
    user: {
      name: string
      email: string
    }
    product: {
      name: string
    }
  }
  onApprove: (id: string) => void
  onReject: (id: string) => void
}

export function ReviewCard({ review, onApprove, onReject }: ReviewCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardContent className='pt-6'>
          <div className='flex justify-between items-start mb-4'>
            <div>
              <div className='flex items-center gap-2 mb-1'>
                <h3 className='font-semibold'>{review.user.name}</h3>
                <Badge
                  variant={
                    review.status === 'approved'
                      ? 'default'
                      : review.status === 'rejected'
                        ? 'destructive'
                        : 'secondary'
                  }
                >
                  {review.status === 'pending'
                    ? 'En attente'
                    : review.status === 'approved'
                      ? 'Approuvé'
                      : 'Rejeté'}
                </Badge>
              </div>
              <p className='text-sm text-gray-500'>{review.user.email}</p>
            </div>
            <div className='flex items-center gap-1'>
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
          </div>

          <div className='space-y-3'>
            <p className='text-sm text-gray-600'>{review.comment}</p>

            <div className='flex items-center gap-4 text-sm text-gray-500'>
              <div className='flex items-center gap-1'>
                <Calendar className='h-4 w-4' />
                {format(new Date(review.createdAt), 'dd MMMM yyyy', { locale: fr })}
              </div>
              <div className='flex items-center gap-1'>
                Pour: <span className='font-medium'>{review.product.name}</span>
              </div>
            </div>
          </div>
        </CardContent>

        {review.status === 'pending' && (
          <CardFooter className='flex gap-2 pt-0'>
            <Button variant='outline' className='flex-1' onClick={() => onApprove(review.id)}>
              <ThumbsUp className='h-4 w-4 mr-2' />
              Approuver
            </Button>
            <Button variant='outline' className='flex-1' onClick={() => onReject(review.id)}>
              <ThumbsDown className='h-4 w-4 mr-2' />
              Rejeter
            </Button>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  )
}
