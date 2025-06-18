import { Star, Heart, Share, MapPin } from 'lucide-react'
import { getCityFromAddress } from '@/lib/utils'
import { useFavorites } from '@/hooks/useFavorites'

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
}

export default function PropertyHeader({
  name,
  reviews,
  globalGrade,
  address,
  productId,
}: PropertyHeaderProps) {
  const { isFavorite, isLoading, toggleFavorite } = useFavorites(productId)
  return (
    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6'>
      <div className='flex-1'>
        <h1 className='text-2xl sm:text-3xl font-semibold text-gray-900 mb-2'>{name}</h1>
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
        <button className='flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors'>
          <Share className='h-4 w-4' />
          Partager
        </button>
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
