'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { Button } from '@/components/ui/shadcnui/button'
import { MapPin } from 'lucide-react'

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
      <Card className='bg-white/50 backdrop-blur-sm border-dashed'>
        <CardContent className='py-12 text-center text-gray-500'>
          <div className='flex flex-col items-center gap-3'>
            <div className='w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center'>
              ❤️
            </div>
            <p className='text-lg'>Vous n'avez pas encore de favoris</p>
            <Link href='/'>
              <Button variant='outline' className='mt-2'>
                Explorer les hébergements
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
      {favorites.map(favorite => (
        <Card key={favorite.id} className='group overflow-hidden hover:shadow-lg transition-all'>
          <div className='aspect-[4/3] relative overflow-hidden'>
            <Image
              src={favorite.product.img?.[0]?.img || '/placeholder.png'}
              alt={favorite.product.name}
              fill
              className='object-cover group-hover:scale-110 transition-transform duration-300'
            />
          </div>
          <CardContent className='p-6'>
            <h3 className='font-semibold text-lg mb-2'>{favorite.product.name}</h3>
            <p className='text-gray-600 flex items-center gap-2 mb-4'>
              <MapPin className='w-4 h-4' />
              {favorite.product.address}
            </p>
            <Link href={`/host/${favorite.product.id}`}>
              <Button className='w-full'>Voir l'annonce</Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
