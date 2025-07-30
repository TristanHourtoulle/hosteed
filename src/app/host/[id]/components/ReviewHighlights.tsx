'use client'

import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'

interface Reviews {
  id: string
  title: string
  text: string
  grade: number
  publishDate: Date
}

interface ReviewHighlightsProps {
  reviews: Reviews[]
  globalGrade?: number // Rendre globalGrade optionnel
}

export default function ReviewHighlights({ reviews }: ReviewHighlightsProps) {
  if (!reviews || reviews.length === 0) return null

  // Sélectionner les meilleurs avis (note 5) ou les plus récents
  const topReviews = reviews
    .filter(review => review.grade >= 4)
    .sort((a, b) => {
      // Prioriser les notes de 5, puis par date récente
      if (a.grade !== b.grade) return b.grade - a.grade
      return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    })
    .slice(0, 3)

  if (topReviews.length === 0) return null

  const getAvatarColor = (id: string) => {
    const colors = [
      'from-blue-400 to-blue-600',
      'from-green-400 to-green-600',
      'from-purple-400 to-purple-600',
    ]
    return colors[parseInt(id.slice(-1), 16) % colors.length]
  }

  const getInitials = (title: string) => {
    return title
      .split(' ')
      .map(word => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className='bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-100 mb-8'
    >
      <div className='flex items-center gap-3 mb-6'>
        <div className='w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-md'>
          <Quote className='h-5 w-5 text-white' />
        </div>
        <div>
          <h4 className='text-lg font-semibold text-gray-900'>Avis récents</h4>
          <p className='text-sm text-gray-600'>Les expériences les plus appréciées</p>
        </div>
      </div>

      <div className='grid gap-4'>
        {topReviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className='bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm hover:shadow-md transition-all duration-300'
          >
            <div className='flex items-start gap-3'>
              <div
                className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(review.id)} flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0`}
              >
                {getInitials(review.title)}
              </div>
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2 mb-2'>
                  <h5 className='font-medium text-gray-900 text-sm truncate'>{review.title}</h5>
                  <div className='flex items-center gap-1 flex-shrink-0'>
                    <Star className='h-3 w-3 fill-yellow-400 text-yellow-400' />
                    <span className='text-xs font-medium text-gray-600'>{review.grade}</span>
                  </div>
                </div>
                <p className='text-gray-700 text-xs leading-relaxed line-clamp-2'>
                  {review.text.length > 120 ? `${review.text.slice(0, 120)}...` : review.text}
                </p>
                <p className='text-gray-500 text-xs mt-1'>
                  {new Date(review.publishDate).toLocaleDateString('fr-FR', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {reviews.length > 3 && (
        <div className='mt-4 text-center'>
          <p className='text-sm text-gray-600'>Et {reviews.length - 3} autres avis positifs...</p>
        </div>
      )}
    </motion.div>
  )
}
