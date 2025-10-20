'use client'

import { useState } from 'react'
import { Star, Calendar, ChevronDown, ChevronUp, Grid3X3 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ReviewStatistics from './ReviewStatistics'
import ReviewsModal from './ReviewsModal'

interface Reviews {
  id: string
  title: string
  text: string
  grade: number
  welcomeGrade: number
  staff: number
  comfort: number
  equipment: number
  cleaning: number
  visitDate: Date
  publishDate: Date
  approved: boolean
}

interface PropertyReviewsProps {
  reviews: Reviews[]
  globalGrade: number
}

// Composant pour afficher les étoiles avec animation
function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const starSize = size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-5 w-5' : 'h-6 w-6'

  return (
    <div className='flex items-center gap-1'>
      {[1, 2, 3, 4, 5].map(star => (
        <motion.div
          key={star}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: star * 0.1, duration: 0.3 }}
        >
          <Star
            className={`${starSize} ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'
            } transition-colors duration-200`}
          />
        </motion.div>
      ))}
    </div>
  )
}

// Composant pour un avis individuel
function ReviewCard({ review, index }: { review: Reviews; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const shouldTruncate = review.text.length > 200

  // Génération d'un avatar coloré basé sur l'ID
  const getAvatarColor = (id: string) => {
    const colors = [
      'bg-gradient-to-br from-blue-400 to-blue-600',
      'bg-gradient-to-br from-green-400 to-green-600',
      'bg-gradient-to-br from-purple-400 to-purple-600',
      'bg-gradient-to-br from-orange-400 to-orange-600',
      'bg-gradient-to-br from-pink-400 to-pink-600',
      'bg-gradient-to-br from-indigo-400 to-indigo-600',
      'bg-gradient-to-br from-red-400 to-red-600',
      'bg-gradient-to-br from-teal-400 to-teal-600',
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
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className='bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-200'
    >
      <div className='flex items-start gap-4'>
        {/* Avatar amélioré */}
        <div
          className={`w-12 h-12 rounded-full ${getAvatarColor(review.id)} flex items-center justify-center text-white font-bold text-sm shadow-md`}
        >
          {getInitials(review.title)}
        </div>

        <div className='flex-1 space-y-3'>
          {/* En-tête de l'avis */}
          <div className='flex items-start justify-between'>
            <div>
              <h4 className='font-semibold text-gray-900 text-lg leading-tight'>{review.title}</h4>
              <div className='flex items-center gap-2 mt-1'>
                <StarRating rating={review.grade} />
                <span className='text-sm text-gray-600 font-medium'>{review.grade}.0</span>
              </div>
            </div>
            <div className='flex items-center gap-1 text-gray-500'>
              <Calendar className='h-4 w-4' />
              <span className='text-sm'>
                {new Date(review.publishDate).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'short',
                })}
              </span>
            </div>
          </div>

          {/* Contenu de l'avis */}
          <div className='space-y-3'>
            <p className='text-gray-700 leading-relaxed'>
              {shouldTruncate && !isExpanded ? `${review.text.slice(0, 200)}...` : review.text}
            </p>

            {shouldTruncate && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className='text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 transition-colors'
              >
                {isExpanded ? (
                  <>
                    Voir moins <ChevronUp className='h-4 w-4' />
                  </>
                ) : (
                  <>
                    Lire plus <ChevronDown className='h-4 w-4' />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function PropertyReviews({ reviews, globalGrade }: PropertyReviewsProps) {
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)

  if (!reviews || reviews.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='border-b border-gray-200 pb-12'
      >
        <div className='text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200'>
          <div className='w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4'>
            <Star className='h-8 w-8 text-gray-400' />
          </div>
          <h3 className='text-xl font-semibold text-gray-700 mb-2'>Aucun avis pour le moment</h3>
          <p className='text-gray-500 max-w-md mx-auto'>
            Soyez le premier à partager votre expérience et aidez d&apos;autres voyageurs à
            découvrir cet hébergement !
          </p>
        </div>
      </motion.div>
    )
  }

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className='border-b border-gray-200 pb-12'
    >
      {/* En-tête avec note globale */}
      <div className='mb-8'>
        <div className='flex items-center gap-4 mb-6'>
          <div className='flex items-center gap-2'>
            <div className='w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg'>
              <Star className='h-6 w-6 fill-white text-white' />
            </div>
            <div>
              <h3 className='text-2xl font-bold text-gray-900'>{globalGrade.toFixed(1)}</h3>
              <p className='text-gray-600 text-sm'>
                {reviews.length} avis{reviews.length > 1 ? '' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Statistiques avancées */}
        <ReviewStatistics reviews={reviews} globalGrade={globalGrade} />
      </div>

      {/* Filtres des avis */}
      <div className='mb-6'>
        <div className='flex gap-2 overflow-x-auto pb-2'>
          {[
            { id: 'all', label: 'Tous les avis', count: reviews.length },
            { id: '5', label: '5 étoiles', count: reviews.filter(r => r.grade === 5).length },
            { id: '4', label: '4 étoiles', count: reviews.filter(r => r.grade === 4).length },
            { id: '3', label: '3 étoiles', count: reviews.filter(r => r.grade === 3).length },
          ].map(
            filter =>
              filter.count > 0 && (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    selectedFilter === filter.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              )
          )}
        </div>
      </div>

      {/* Liste des avis */}
      <div className='space-y-6'>
        <AnimatePresence>
          {displayedReviews.map((review, index) => (
            <ReviewCard key={review.id} review={review} index={index} />
          ))}
        </AnimatePresence>
      </div>

      {/* Bouton voir plus/moins */}
      {reviews.length > 3 && (
        <div className='mt-8 flex gap-4 justify-center'>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAllReviews(!showAllReviews)}
            className='px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-full font-medium hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 flex items-center gap-2'
          >
            {showAllReviews ? (
              <>
                Voir moins d&apos;avis <ChevronUp className='h-4 w-4' />
              </>
            ) : (
              <>
                Voir plus d&apos;avis <ChevronDown className='h-4 w-4' />
              </>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowModal(true)}
            className='px-8 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 shadow-md'
          >
            <Grid3X3 className='h-4 w-4' />
            Tous les avis ({reviews.length})
          </motion.button>
        </div>
      )}

      {/* Modal des avis */}
      <ReviewsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        reviews={reviews}
        globalGrade={globalGrade}
      />
    </motion.div>
  )
}
