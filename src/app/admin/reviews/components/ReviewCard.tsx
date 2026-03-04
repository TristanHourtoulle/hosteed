'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardFooter } from '@/components/ui/shadcnui/card'
import { Button } from '@/components/ui/shadcnui/button'
import { Badge } from '@/components/ui/shadcnui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/shadcnui/alert-dialog'
import { Star, Check, X, Calendar, Trash2, Building2, User } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface ReviewCardProps {
  review: {
    id: string
    title: string
    rating: number
    comment: string
    createdAt: Date
    status: 'pending' | 'approved' | 'rejected'
    welcomeGrade: number
    staff: number
    comfort: number
    equipment: number
    cleaning: number
    user: {
      name: string
      email: string
      image: string | null
      profilePicture: string | null
      profilePictureBase64: string | null
    }
    product: {
      name: string
    }
  }
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onDelete?: (id: string) => void
}

const statusConfig = {
  pending: { label: 'En attente', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  approved: { label: 'Approuvé', className: 'bg-green-100 text-green-800 border-green-200' },
  rejected: { label: 'Rejeté', className: 'bg-red-100 text-red-800 border-red-200' },
}

const avatarGradients = [
  'bg-gradient-to-br from-blue-400 to-indigo-500',
  'bg-gradient-to-br from-green-400 to-teal-500',
  'bg-gradient-to-br from-purple-400 to-pink-500',
  'bg-gradient-to-br from-orange-400 to-amber-500',
]

function getAvatarGradient(name: string): string {
  const index = name.charCodeAt(0) % avatarGradients.length
  return avatarGradients[index]
}

const subRatings = [
  { key: 'welcomeGrade' as const, label: 'Accueil' },
  { key: 'staff' as const, label: 'Personnel' },
  { key: 'comfort' as const, label: 'Confort' },
  { key: 'equipment' as const, label: 'Équipement' },
  { key: 'cleaning' as const, label: 'Nettoyage' },
]

export function ReviewCard({ review, onApprove, onReject, onDelete }: ReviewCardProps) {
  const status = statusConfig[review.status]
  const avatarSrc = review.user.profilePicture || review.user.profilePictureBase64 || review.user.image

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -3 }}
    >
      <Card className='border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden'>
        <CardContent className='p-6'>
          {/* Header: Avatar + User info + Badge + Stars */}
          <div className='flex items-start justify-between mb-4'>
            <div className='flex items-center gap-3'>
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={review.user.name || 'Avatar'}
                  width={40}
                  height={40}
                  className='w-10 h-10 rounded-full object-cover'
                />
              ) : (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getAvatarGradient(review.user.name)}`}>
                  <User className='h-5 w-5 text-white' />
                </div>
              )}
              <div>
                <div className='flex items-center gap-2'>
                  <h3 className='font-semibold text-gray-900'>{review.user.name}</h3>
                  <Badge variant='secondary' className={status.className}>
                    {status.label}
                  </Badge>
                </div>
                <p className='text-sm text-gray-500'>{review.user.email}</p>
              </div>
            </div>
            <div className='flex items-center gap-1'>
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                />
              ))}
              <span className='ml-1 text-sm font-semibold text-gray-700'>{review.rating}/5</span>
            </div>
          </div>

          {/* Product name */}
          <div className='flex items-center gap-2 mb-3'>
            <Building2 className='h-4 w-4 text-indigo-500' />
            <span className='text-sm font-medium text-indigo-700'>{review.product.name}</span>
          </div>

          {/* Review title + comment */}
          <div className='space-y-2 mb-4'>
            {review.title && (
              <h4 className='font-semibold text-gray-800'>{review.title}</h4>
            )}
            <p className='text-sm text-gray-600 leading-relaxed'>{review.comment}</p>
          </div>

          {/* Sub-ratings pills */}
          <div className='flex flex-wrap gap-2 mb-4'>
            {subRatings.map(({ key, label }) => (
              <span
                key={key}
                className='inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-gray-50 text-gray-600 border border-gray-100'
              >
                <Star className='h-3 w-3 fill-yellow-400 text-yellow-400' />
                {label} {review[key]}/5
              </span>
            ))}
          </div>

          {/* Date */}
          <div className='flex items-center gap-1.5 text-sm text-gray-400'>
            <Calendar className='h-3.5 w-3.5' />
            {format(new Date(review.createdAt), 'dd MMMM yyyy', { locale: fr })}
          </div>
        </CardContent>

        <CardFooter className='flex gap-2 px-6 pb-5 pt-0'>
          {review.status === 'pending' && (
            <>
              <Button
                className='flex-1 bg-green-600 hover:bg-green-700 text-white'
                onClick={() => onApprove(review.id)}
              >
                <Check className='h-4 w-4 mr-2' />
                Approuver
              </Button>
              <Button
                variant='outline'
                className='flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700'
                onClick={() => onReject(review.id)}
              >
                <X className='h-4 w-4 mr-2' />
                Rejeter
              </Button>
            </>
          )}
          {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='text-gray-400 hover:text-red-600 hover:bg-red-50'
                  title='Supprimer cet avis'
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer cet avis ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. L&apos;avis de {review.user.name} pour
                    &quot;{review.product.name}&quot; sera définitivement supprimé.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    className='bg-red-600 hover:bg-red-700'
                    onClick={() => onDelete(review.id)}
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  )
}
