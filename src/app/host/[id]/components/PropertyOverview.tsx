import { Users, Bed, Bath, Home } from 'lucide-react'

interface Product {
  id: string
  name: string
  room?: number
  bathroom?: number
  maxPeople?: number
  sizeRoom?: number
}

interface PropertyOverviewProps {
  product: Product
}

export default function PropertyOverview({ product }: PropertyOverviewProps) {
  return (
    <div className='border-b border-gray-200 pb-8'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4'>
        <div className='flex-1'>
          <h2 className='text-xl sm:text-2xl font-semibold text-gray-900 mb-1'>{product.name}</h2>
          <p className='text-gray-600 text-sm sm:text-base'>Hébergé par Hosteed</p>
        </div>
        <div className='w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg sm:text-xl flex-shrink-0'>
          H
        </div>
      </div>

      {/* Property Stats */}
      <div className='flex flex-wrap items-center gap-4 sm:gap-6 text-gray-600'>
        {product.maxPeople && (
          <div className='flex items-center gap-2 min-w-0'>
            <Users className='h-4 w-4 flex-shrink-0' />
            <span className='text-sm sm:text-base'>{product.maxPeople} voyageurs</span>
          </div>
        )}
        {product.room && (
          <div className='flex items-center gap-2 min-w-0'>
            <Bed className='h-4 w-4 flex-shrink-0' />
            <span className='text-sm sm:text-base'>
              {product.room} chambre{product.room > 1 ? 's' : ''}
            </span>
          </div>
        )}
        {product.bathroom && (
          <div className='flex items-center gap-2 min-w-0'>
            <Bath className='h-4 w-4 flex-shrink-0' />
            <span className='text-sm sm:text-base'>
              {product.bathroom} salle{product.bathroom > 1 ? 's' : ''} de bain
            </span>
          </div>
        )}
        {product.sizeRoom && (
          <div className='flex items-center gap-2 min-w-0'>
            <Home className='h-4 w-4 flex-shrink-0' />
            <span className='text-sm sm:text-base'>{product.sizeRoom}m²</span>
          </div>
        )}
      </div>
    </div>
  )
}
