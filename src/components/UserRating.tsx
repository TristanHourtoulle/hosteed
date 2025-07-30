'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/shadcnui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcnui/card'
import { Textarea } from '@/components/ui/textarea'
import { Star, Send, CheckCircle, Clock } from 'lucide-react'
import { motion } from 'framer-motion'

interface UserRatingFormProps {
  rentId: string
  ratedUserId: string
  ratedUserName: string
  type: 'HOST_TO_GUEST' | 'GUEST_TO_HOST'
  isHost: boolean
  onRatingSubmitted?: () => void
}

export function UserRatingForm({
  rentId,
  ratedUserId,
  ratedUserName,
  type,
  isHost,
  onRatingSubmitted,
}: UserRatingFormProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      setError('Veuillez donner une note entre 1 et 5 étoiles')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/user-ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rentId,
          ratedUserId,
          rating,
          comment: comment.trim() || null,
          type,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi de la note")
      }

      setSubmitted(true)
      onRatingSubmitted?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className='text-center p-8'
      >
        <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
          <CheckCircle className='w-8 h-8 text-green-600' />
        </div>
        <h3 className='text-lg font-semibold text-gray-900 mb-2'>Note envoyée !</h3>
        <p className='text-gray-600'>
          Votre note a été soumise et sera validée par nos équipes avant publication.
        </p>
      </motion.div>
    )
  }

  const ratingTexts = {
    1: 'Très décevant',
    2: 'Décevant',
    3: 'Correct',
    4: 'Très bien',
    5: 'Excellent',
  }

  return (
    <Card className='w-full max-w-md'>
      <CardHeader>
        <CardTitle className='text-center'>
          Noter {isHost ? 'votre locataire' : 'votre hôte'}
        </CardTitle>
        <p className='text-center text-gray-600 text-sm'>
          Comment s&apos;est passé votre expérience avec <strong>{ratedUserName}</strong> ?
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Rating Stars */}
          <div className='space-y-3'>
            <label className='block text-sm font-medium text-gray-700'>Note globale</label>
            <div className='flex items-center justify-center gap-2'>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type='button'
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className='p-1 transition-transform hover:scale-110'
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {(hoveredRating || rating) > 0 && (
              <p className='text-center text-sm text-gray-600'>
                {ratingTexts[(hoveredRating || rating) as keyof typeof ratingTexts]}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className='space-y-2'>
            <label className='block text-sm font-medium text-gray-700'>
              Commentaire (optionnel)
            </label>
            <Textarea
              value={comment}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
              placeholder={`Partagez votre expérience avec ${ratedUserName}...`}
              rows={4}
              maxLength={500}
              className='resize-none'
            />
            <div className='text-right text-xs text-gray-500'>{comment.length}/500</div>
          </div>

          {error && (
            <div className='p-3 bg-red-50 border border-red-200 rounded-lg'>
              <p className='text-red-600 text-sm'>{error}</p>
            </div>
          )}

          <Button
            type='submit'
            disabled={isSubmitting || rating === 0}
            className='w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
          >
            {isSubmitting ? (
              <>
                <Clock className='w-4 h-4 mr-2 animate-spin' />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className='w-4 h-4 mr-2' />
                Envoyer la note
              </>
            )}
          </Button>

          <p className='text-xs text-gray-500 text-center'>
            Votre note sera vérifiée par nos équipes avant d&apos;être publiée
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

interface UserRatingDisplayProps {
  rating: {
    id: string
    rating: number
    comment: string | null
    type: 'HOST_TO_GUEST' | 'GUEST_TO_HOST'
    approved: boolean
    createdAt: string
    rater: {
      name: string | null
      lastname: string | null
    }
  }
}

export function UserRatingDisplay({ rating }: UserRatingDisplayProps) {
  const raterName = `${rating.rater.name || ''} ${rating.rater.lastname || ''}`.trim()

  return (
    <Card className='w-full'>
      <CardContent className='p-4'>
        <div className='flex items-start justify-between mb-3'>
          <div>
            <div className='flex items-center gap-2 mb-1'>
              <div className='flex'>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < rating.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className='font-medium'>{rating.rating}/5</span>
            </div>
            <p className='text-sm text-gray-600'>
              Par {raterName} • {new Date(rating.createdAt).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <div
            className={`px-2 py-1 rounded-full text-xs ${
              rating.approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {rating.approved ? 'Validé' : 'En attente'}
          </div>
        </div>

        {rating.comment && (
          <p className='text-gray-700 text-sm leading-relaxed'>&ldquo;{rating.comment}&rdquo;</p>
        )}
      </CardContent>
    </Card>
  )
}
