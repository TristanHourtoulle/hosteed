'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Filter, SortAsc, SortDesc, Star, Calendar } from 'lucide-react'

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

interface ReviewsModalProps {
  isOpen: boolean
  onClose: () => void
  reviews: Reviews[]
  globalGrade: number
}

export default function ReviewsModal({ isOpen, onClose, reviews, globalGrade }: ReviewsModalProps) {
  const [sortBy, setSortBy] = useState<'date' | 'rating'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterRating, setFilterRating] = useState<number | 'all'>('all')

  if (!isOpen) return null

  // Tri et filtrage des avis
  let filteredReviews = [...reviews]

  if (filterRating !== 'all') {
    filteredReviews = filteredReviews.filter(review => review.grade === filterRating)
  }

  filteredReviews.sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.publishDate).getTime()
      const dateB = new Date(b.publishDate).getTime()
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    } else {
      return sortOrder === 'desc' ? b.grade - a.grade : a.grade - b.grade
    }
  })

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
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className='bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden'
          onClick={e => e.stopPropagation()}
        >
          {/* En-tête du modal */}
          <div className='bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-4'>
                <div className='w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg'>
                  <Star className='h-6 w-6 fill-white text-white' />
                </div>
                <div>
                  <h2 className='text-2xl font-bold text-gray-900'>
                    Tous les avis ({reviews.length})
                  </h2>
                  <p className='text-gray-600'>Note moyenne: {globalGrade.toFixed(1)}/5</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className='p-2 hover:bg-gray-100 rounded-full transition-colors'
              >
                <X className='h-6 w-6 text-gray-500' />
              </button>
            </div>
          </div>

          {/* Contrôles de tri et filtrage */}
          <div className='p-6 border-b border-gray-200 bg-gray-50'>
            <div className='flex flex-wrap gap-4 items-center'>
              {/* Filtrage par note */}
              <div className='flex items-center gap-2'>
                <Filter className='h-4 w-4 text-gray-500' />
                <span className='text-sm font-medium text-gray-700'>Filtrer:</span>
                <select
                  value={filterRating}
                  onChange={e =>
                    setFilterRating(e.target.value === 'all' ? 'all' : Number(e.target.value))
                  }
                  className='border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                >
                  <option value='all'>Toutes les notes</option>
                  <option value={5}>5 étoiles</option>
                  <option value={4}>4 étoiles</option>
                  <option value={3}>3 étoiles</option>
                  <option value={2}>2 étoiles</option>
                  <option value={1}>1 étoile</option>
                </select>
              </div>

              {/* Tri */}
              <div className='flex items-center gap-2'>
                <span className='text-sm font-medium text-gray-700'>Trier par:</span>
                <button
                  onClick={() => setSortBy(sortBy === 'date' ? 'rating' : 'date')}
                  className='flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-100 transition-colors'
                >
                  {sortBy === 'date' ? (
                    <Calendar className='h-4 w-4' />
                  ) : (
                    <Star className='h-4 w-4' />
                  )}
                  {sortBy === 'date' ? 'Date' : 'Note'}
                </button>
                <button
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                  className='p-1 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors'
                >
                  {sortOrder === 'desc' ? (
                    <SortDesc className='h-4 w-4' />
                  ) : (
                    <SortAsc className='h-4 w-4' />
                  )}
                </button>
              </div>

              {/* Compteur des résultats filtrés */}
              {filterRating !== 'all' && (
                <span className='text-sm text-gray-600'>
                  {filteredReviews.length} avis trouvé{filteredReviews.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Liste des avis */}
          <div className='flex-1 overflow-y-auto p-6 max-h-[60vh]'>
            <div className='space-y-6'>
              {filteredReviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className='bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-300'
                >
                  <div className='flex items-start gap-4'>
                    {/* Avatar */}
                    <div
                      className={`w-12 h-12 rounded-full ${getAvatarColor(review.id)} flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0`}
                    >
                      {getInitials(review.title)}
                    </div>

                    <div className='flex-1 space-y-3'>
                      {/* En-tête de l'avis */}
                      <div className='flex items-start justify-between'>
                        <div>
                          <h4 className='font-semibold text-gray-900 text-lg leading-tight'>
                            {review.title}
                          </h4>
                          <div className='flex items-center gap-2 mt-1'>
                            <div className='flex items-center gap-1'>
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= review.grade
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'fill-gray-200 text-gray-200'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className='text-sm text-gray-600 font-medium'>
                              {review.grade}.0
                            </span>
                          </div>
                        </div>
                        <div className='flex items-center gap-1 text-gray-500 flex-shrink-0'>
                          <Calendar className='h-4 w-4' />
                          <span className='text-sm'>
                            {new Date(review.publishDate).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Contenu de l'avis */}
                      <p className='text-gray-700 leading-relaxed'>{review.text}</p>

                      {/* Notes détaillées */}
                      <div className='grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-gray-100'>
                        {[
                          { label: 'Accueil', value: review.welcomeGrade, icon: '👋' },
                          { label: 'Personnel', value: review.staff, icon: '👥' },
                          { label: 'Confort', value: review.comfort, icon: '🛏️' },
                          { label: 'Équipement', value: review.equipment, icon: '🔧' },
                          { label: 'Nettoyage', value: review.cleaning, icon: '✨' },
                        ].map(item => (
                          <div key={item.label} className='text-center'>
                            <div className='text-lg mb-1'>{item.icon}</div>
                            <div className='text-sm font-semibold text-gray-900'>
                              {item.value}.0
                            </div>
                            <div className='text-xs text-gray-600'>{item.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredReviews.length === 0 && (
              <div className='text-center py-12'>
                <Star className='h-12 w-12 text-gray-300 mx-auto mb-4' />
                <h3 className='text-lg font-semibold text-gray-600 mb-2'>Aucun avis trouvé</h3>
                <p className='text-gray-500'>
                  Essayez de modifier vos critères de filtrage pour voir plus d&apos;avis.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
