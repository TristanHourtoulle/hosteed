'use client'

import { motion } from 'framer-motion'
import { Star, TrendingUp, Award, Users } from 'lucide-react'

interface ReviewStats {
  reviews: Array<{
    grade: number
    publishDate: Date
  }>
  globalGrade: number
}

export default function ReviewStatistics({ reviews, globalGrade }: ReviewStats) {
  if (!reviews || reviews.length === 0) return null

  // Calcul des statistiques
  const ratingDistribution = {
    5: reviews.filter(r => r.grade === 5).length,
    4: reviews.filter(r => r.grade === 4).length,
    3: reviews.filter(r => r.grade === 3).length,
    2: reviews.filter(r => r.grade === 2).length,
    1: reviews.filter(r => r.grade === 1).length,
  }

  const totalReviews = reviews.length
  const excellentPercentage = Math.round((ratingDistribution[5] / totalReviews) * 100)

  // Tendance des avis (derniers 3 mois vs précédents)
  const now = new Date()
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
  const recentReviews = reviews.filter(r => new Date(r.publishDate) > threeMonthsAgo)
  const recentAverage =
    recentReviews.length > 0
      ? recentReviews.reduce((acc, r) => acc + r.grade, 0) / recentReviews.length
      : globalGrade

  const trend = recentAverage > globalGrade ? 'up' : recentAverage < globalGrade ? 'down' : 'stable'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className='bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 mb-6'
    >
      <h4 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
        <Award className='h-5 w-5 text-blue-600' />
        Statistiques des avis
      </h4>

      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        {/* Note moyenne */}
        <div className='text-center'>
          <div className='text-2xl font-bold text-blue-600'>{globalGrade.toFixed(1)}</div>
          <div className='text-sm text-gray-600'>Note moyenne</div>
          <div className='flex justify-center mt-1'>
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                className={`h-3 w-3 ${
                  star <= Math.round(globalGrade)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-gray-200 text-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Total avis */}
        <div className='text-center'>
          <div className='text-2xl font-bold text-green-600'>{totalReviews}</div>
          <div className='text-sm text-gray-600'>Total avis</div>
          <Users className='h-4 w-4 text-green-600 mx-auto mt-1' />
        </div>

        {/* Pourcentage excellent */}
        <div className='text-center'>
          <div className='text-2xl font-bold text-purple-600'>{excellentPercentage}%</div>
          <div className='text-sm text-gray-600'>Avis excellents</div>
          <div className='text-xs text-gray-500 mt-1'>(5 étoiles)</div>
        </div>

        {/* Tendance */}
        <div className='text-center'>
          <div className='flex items-center justify-center gap-1'>
            <span
              className={`text-2xl font-bold ${
                trend === 'up'
                  ? 'text-green-600'
                  : trend === 'down'
                    ? 'text-red-600'
                    : 'text-gray-600'
              }`}
            >
              {recentAverage.toFixed(1)}
            </span>
            <TrendingUp
              className={`h-4 w-4 ${
                trend === 'up'
                  ? 'text-green-600'
                  : trend === 'down'
                    ? 'text-red-600 rotate-180'
                    : 'text-gray-600'
              }`}
            />
          </div>
          <div className='text-sm text-gray-600'>Tendance récente</div>
          <div className='text-xs text-gray-500 mt-1'>(3 derniers mois)</div>
        </div>
      </div>

      {/* Distribution des notes */}
      <div className='mt-6'>
        <h5 className='text-sm font-medium text-gray-700 mb-3'>Distribution des notes</h5>
        <div className='space-y-2'>
          {[5, 4, 3, 2, 1].map(rating => {
            const count = ratingDistribution[rating as keyof typeof ratingDistribution]
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0

            return (
              <div key={rating} className='flex items-center gap-3'>
                <div className='flex items-center gap-1 w-12'>
                  <span className='text-sm font-medium'>{rating}</span>
                  <Star className='h-3 w-3 fill-yellow-400 text-yellow-400' />
                </div>
                <div className='flex-1 bg-gray-200 rounded-full h-2 overflow-hidden'>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, delay: (5 - rating) * 0.1 }}
                    className='h-2 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full'
                  />
                </div>
                <span className='text-sm text-gray-600 w-8 text-right'>{count}</span>
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
