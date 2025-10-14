'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/shadcnui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcnui/card'
import { Badge } from '@/components/ui/shadcnui/badge'
import { Star, CheckCircle, XCircle, Clock, User, Home } from 'lucide-react'
import { motion } from 'framer-motion'

interface PendingRating {
  id: string
  rating: number
  comment: string | null
  type: 'HOST_TO_GUEST' | 'GUEST_TO_HOST'
  createdAt: string
  rater: {
    name: string | null
    lastname: string | null
    email: string
  }
  rated: {
    name: string | null
    lastname: string | null
    email: string
  }
  rent: {
    product: {
      name: string
    }
  }
}

export default function AdminUserRatingsPage() {
  const [pendingRatings, setPendingRatings] = useState<PendingRating[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchPendingRatings = async () => {
    try {
      const response = await fetch('/api/admin/user-ratings', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement')
      }

      setPendingRatings(data.pendingRatings)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingRatings()
  }, [])

  const handleValidateRating = async (ratingId: string, approved: boolean) => {
    try {
      const response = await fetch(`/api/admin/user-ratings/${ratingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approved }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la validation')
      }

      // Supprimer la note de la liste après validation
      setPendingRatings(prev => prev.filter(rating => rating.id !== ratingId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la validation')
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <Clock className='w-12 h-12 text-blue-500 animate-spin mx-auto mb-4' />
          <p className='text-gray-600'>Chargement des notes en attente...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='container mx-auto px-4 py-8'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            Validation des notes utilisateurs
          </h1>
          <p className='text-gray-600'>
            Gérez les notes données entre hôtes et locataires en attente de validation
          </p>
        </div>

        {error && (
          <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
            <p className='text-red-600'>{error}</p>
          </div>
        )}

        {pendingRatings.length === 0 ? (
          <Card className='text-center py-12'>
            <CardContent>
              <CheckCircle className='w-16 h-16 text-green-500 mx-auto mb-4' />
              <h3 className='text-xl font-semibold text-gray-900 mb-2'>Aucune note en attente</h3>
              <p className='text-gray-600'>Toutes les notes ont été validées ! 🎉</p>
            </CardContent>
          </Card>
        ) : (
          <div className='grid gap-6'>
            {pendingRatings.map((rating, index) => (
              <motion.div
                key={rating.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className='overflow-hidden'>
                  <CardHeader className='bg-gradient-to-r from-blue-50 to-indigo-50'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <div
                          className={`p-2 rounded-full ${
                            rating.type === 'HOST_TO_GUEST'
                              ? 'bg-purple-100 text-purple-600'
                              : 'bg-blue-100 text-blue-600'
                          }`}
                        >
                          {rating.type === 'HOST_TO_GUEST' ? (
                            <Home className='w-5 h-5' />
                          ) : (
                            <User className='w-5 h-5' />
                          )}
                        </div>
                        <div>
                          <CardTitle className='text-lg'>
                            {rating.type === 'HOST_TO_GUEST'
                              ? 'Hôte → Locataire'
                              : 'Locataire → Hôte'}
                          </CardTitle>
                          <p className='text-sm text-gray-600'>
                            Logement: {rating.rent.product.name}
                          </p>
                        </div>
                      </div>
                      <Badge variant='outline' className='bg-yellow-100 text-yellow-700'>
                        <Clock className='w-3 h-3 mr-1' />
                        En attente
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className='p-6'>
                    <div className='grid md:grid-cols-2 gap-6'>
                      {/* Informations sur la note */}
                      <div className='space-y-4'>
                        <div>
                          <h4 className='font-medium text-gray-900 mb-2'>Détails de la note</h4>
                          <div className='flex items-center gap-2 mb-2'>
                            <div className='flex'>
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-5 h-5 ${
                                    i < rating.rating
                                      ? 'text-yellow-400 fill-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className='font-semibold text-lg'>{rating.rating}/5</span>
                          </div>
                          <p className='text-sm text-gray-600'>
                            Créé le{' '}
                            {new Date(rating.createdAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>

                        {rating.comment && (
                          <div>
                            <h4 className='font-medium text-gray-900 mb-2'>Commentaire</h4>
                            <div className='p-3 bg-gray-50 rounded-lg'>
                              <p className='text-gray-700 italic'>&ldquo;{rating.comment}&rdquo;</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Informations sur les utilisateurs */}
                      <div className='space-y-4'>
                        <div>
                          <h4 className='font-medium text-gray-900 mb-3'>Utilisateurs concernés</h4>
                          <div className='space-y-3'>
                            <div className='p-3 border rounded-lg'>
                              <div className='text-sm text-gray-600 mb-1'>Qui note:</div>
                              <div className='font-medium'>
                                {rating.rater.name} {rating.rater.lastname}
                              </div>
                              <div className='text-sm text-gray-500'>{rating.rater.email}</div>
                            </div>
                            <div className='p-3 border rounded-lg'>
                              <div className='text-sm text-gray-600 mb-1'>Qui est noté:</div>
                              <div className='font-medium'>
                                {rating.rated.name} {rating.rated.lastname}
                              </div>
                              <div className='text-sm text-gray-500'>{rating.rated.email}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className='mt-6 pt-6 border-t flex gap-3 justify-end'>
                      <Button
                        variant='outline'
                        onClick={() => handleValidateRating(rating.id, false)}
                        className='border-red-200 text-red-600 hover:bg-red-50'
                      >
                        <XCircle className='w-4 h-4 mr-2' />
                        Rejeter
                      </Button>
                      <Button
                        onClick={() => handleValidateRating(rating.id, true)}
                        className='bg-green-600 hover:bg-green-700 text-white'
                      >
                        <CheckCircle className='w-4 h-4 mr-2' />
                        Valider
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
