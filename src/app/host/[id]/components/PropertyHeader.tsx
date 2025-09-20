'use client'

import { Star, Heart, MapPin, Award } from 'lucide-react'
import { getCityFromAddress } from '@/lib/utils'
import { useFavorites } from '@/hooks/useFavorites'
import { ShareButton } from './ShareButton'

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

interface PropertyHeaderProps {
  name: string
  reviews?: Reviews[]
  globalGrade: number
  address?: string
  productId: string
  isCertificated?: boolean
  certified?: boolean
}

export default function PropertyHeader({
  name,
  reviews,
  globalGrade,
  address,
  productId,
  isCertificated,
  certified,
}: PropertyHeaderProps) {
  const { isFavorite, isLoading, toggleFavorite } = useFavorites(productId)
  return (
    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6'>
      <div className='flex-1'>
        <div className='flex items-center gap-3 mb-2'>
          <h1 className='text-2xl sm:text-3xl font-semibold text-gray-900'>{name}</h1>
          {(isCertificated || certified) && (
            <div className='bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1'>
              <Award className='w-4 h-4' />
              Certifié
            </div>
          )}
        </div>
        <div className='flex items-center gap-4 text-sm'>
          {reviews && reviews.length > 0 && (
            <div className='flex items-center gap-1'>
              <Star className='h-4 w-4 fill-current text-yellow-400' />
              <span className='font-medium'>{globalGrade.toFixed(1)}</span>
              <span className='text-gray-500'>({reviews.length} avis)</span>
            </div>
          )}
          <div className='flex items-center gap-1 text-gray-600'>
            <MapPin className='h-4 w-4' />
            <span className='underline'>{getCityFromAddress(address)}</span>
          </div>
        </div>
      </div>
      <div className='flex items-center gap-3 mt-4 sm:mt-0'>
        <ShareButton />
        <button
          onClick={toggleFavorite}
          disabled={isLoading}
          className='flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
        >
          <Heart
            className={`h-4 w-4 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : ''}`}
          />
          {isFavorite ? 'Sauvegardé' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  )
}
