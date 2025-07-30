'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { Button } from '@/components/ui/shadcnui/button'
import { MapPin, Heart, Star, Eye } from 'lucide-react'
import { motion } from 'framer-motion'

interface Favorite {
  id: string
  product: {
    id: string
    name: string
    address: string
    img: Array<{ img: string }> | null
  }
}

interface FavoritesListProps {
  favorites: Favorite[]
}

export function FavoritesList({ favorites }: FavoritesListProps) {
  if (favorites.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='text-center py-16'
      >
        <div className='max-w-md mx-auto'>
          <div className='w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-pink-100 to-pink-200 flex items-center justify-center'>
            <Heart className='w-12 h-12 text-pink-500' />
          </div>
          <h3 className='text-2xl font-bold text-gray-900 mb-3'>Aucun favori pour le moment</h3>
          <p className='text-gray-600 mb-8 leading-relaxed'>
            Commencez à explorer nos hébergements et ajoutez vos préférés à votre liste de souhaits.
            Ils apparaîtront ici pour un accès rapide.
          </p>
          <Link href='/host'>
            <Button className='bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300'>
              Découvrir les hébergements
            </Button>
          </Link>
        </div>
      </motion.div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header with count */}
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-semibold text-gray-900'>
            {favorites.length} hébergement{favorites.length > 1 ? 's' : ''} sauvegardé
            {favorites.length > 1 ? 's' : ''}
          </h3>
          <p className='text-gray-600 text-sm'>Vos coups de cœur en un clin d&apos;œil</p>
        </div>
      </div>

      {/* Favorites Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {favorites.map((favorite, index) => (
          <motion.div
            key={favorite.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className='group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 shadow-sm bg-white'>
              <div className='relative aspect-[4/3] overflow-hidden'>
                <Image
                  src={favorite.product.img?.[0]?.img || '/placeholder.png'}
                  alt={favorite.product.name}
                  fill
                  className='object-cover group-hover:scale-110 transition-transform duration-500'
                />

                {/* Gradient overlay */}
                <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />

                {/* Heart icon */}
                <div className='absolute top-4 right-4'>
                  <div className='w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg'>
                    <Heart className='w-5 h-5 text-pink-500 fill-pink-500' />
                  </div>
                </div>

                {/* Quick view button */}
                <div className='absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                  <Link href={`/host/${favorite.product.id}`}>
                    <button className='w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors'>
                      <Eye className='w-5 h-5 text-gray-700' />
                    </button>
                  </Link>
                </div>
              </div>

              <CardContent className='p-6'>
                <div className='space-y-3'>
                  <div>
                    <h4 className='font-semibold text-lg text-gray-900 line-clamp-1'>
                      {favorite.product.name}
                    </h4>
                    <div className='flex items-center gap-2 text-gray-600 mt-1'>
                      <MapPin className='w-4 h-4 flex-shrink-0' />
                      <span className='text-sm line-clamp-1'>{favorite.product.address}</span>
                    </div>
                  </div>

                  {/* Rating and price placeholder */}
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-1'>
                      <Star className='w-4 h-4 text-yellow-400 fill-yellow-400' />
                      <span className='text-sm font-medium text-gray-900'>4.8</span>
                      <span className='text-sm text-gray-500'>(24 avis)</span>
                    </div>
                  </div>

                  <Link href={`/host/${favorite.product.id}`}>
                    <Button className='w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300'>
                      Voir les détails
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
