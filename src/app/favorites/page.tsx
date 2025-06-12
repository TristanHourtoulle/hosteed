'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Heart, Star, MapPin, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { Button } from '@/components/ui/shadcnui/button'
import { toast } from 'sonner'
import Image from 'next/image'
import { getCityFromAddress } from '@/lib/utils'

interface FavoriteProduct {
  id: string
  productId: string
  createdAt: string
  product: {
    id: string
    name: string
    description: string
    address: string
    basePrice: string
    img: { img: string }[]
    reviews: { grade: number }[]
  }
}

export default function FavoritesPage() {
  const { data: session } = useSession()
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) {
      fetchFavorites()
    }
  }, [session?.user?.id])

  const fetchFavorites = async () => {
    try {
      const response = await fetch('/api/favorites')
      if (response.ok) {
        const data = await response.json()
        setFavorites(data.favorites)
      } else {
        toast.error('Erreur lors du chargement des favoris')
      }
    } catch (error) {
      console.error('Error fetching favorites:', error)
      toast.error('Erreur lors du chargement des favoris')
    } finally {
      setLoading(false)
    }
  }

  const removeFromFavorites = async (productId: string) => {
    try {
      const response = await fetch('/api/favorites', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      })

      if (response.ok) {
        setFavorites(prev => prev.filter(fav => fav.productId !== productId))
        toast.success('Retiré des favoris')
      } else {
        toast.error('Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error removing favorite:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  const getAverageRating = (reviews: { grade: number }[]) => {
    if (!reviews || reviews.length === 0) return 0
    const total = reviews.reduce((sum, review) => sum + review.grade, 0)
    return total / reviews.length
  }

  if (!session) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <Card className='w-full max-w-md'>
          <CardContent className='p-8 text-center'>
            <Heart className='w-16 h-16 text-gray-300 mx-auto mb-4' />
            <h2 className='text-2xl font-bold text-gray-900 mb-2'>Connectez-vous</h2>
            <p className='text-gray-600 mb-6'>Vous devez être connecté pour voir vos favoris</p>
            <Button asChild>
              <Link href='/auth'>Se connecter</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Chargement de vos favoris...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>Mes favoris</h1>
          <p className='text-gray-600'>
            {favorites.length} hébergement{favorites.length > 1 ? 's' : ''} sauvegardé
            {favorites.length > 1 ? 's' : ''}
          </p>
        </div>

        {favorites.length === 0 ? (
          <Card className='w-full max-w-2xl mx-auto'>
            <CardContent className='p-12 text-center'>
              <Heart className='w-20 h-20 text-gray-300 mx-auto mb-6' />
              <h2 className='text-2xl font-bold text-gray-900 mb-4'>Aucun favori pour le moment</h2>
              <p className='text-gray-600 mb-8'>
                Explorez nos hébergements et cliquez sur le cœur pour les sauvegarder ici
              </p>
              <Button asChild>
                <Link href='/host'>Découvrir les hébergements</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {favorites.map(favorite => {
              const product = favorite.product
              const averageRating = getAverageRating(product.reviews)
              const hasImages = product.img && product.img.length > 0
              console.log('createdAt', favorite.createdAt)

              return (
                <Card
                  key={favorite.id}
                  className='group hover:shadow-lg transition-shadow duration-200 pt-0'
                >
                  <CardContent className='p-0'>
                    <div className='relative'>
                      <Link href={`/host/${product.id}`}>
                        <div className='aspect-[4/3] relative overflow-hidden rounded-t-lg'>
                          {hasImages ? (
                            <Image
                              src={product.img[0].img}
                              alt={product.name}
                              fill
                              className='object-cover group-hover:scale-105 transition-transform duration-200'
                            />
                          ) : (
                            <div className='w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center'>
                              <div className='text-center'>
                                <Heart className='w-12 h-12 text-gray-400 mx-auto mb-2' />
                                <span className='text-gray-500 text-sm'>Image non disponible</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Remove from favorites button */}
                      <button
                        onClick={() => removeFromFavorites(product.id)}
                        className='absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white shadow-sm hover:shadow-md transition-all duration-200 group/remove'
                      >
                        <Trash2 className='w-4 h-4 text-gray-600 group-hover/remove:text-red-500 transition-colors' />
                      </button>

                      {/* Rating */}
                      {averageRating > 0 && (
                        <div className='absolute top-3 left-3 bg-black/75 backdrop-blur-sm rounded-lg px-2.5 py-1.5 flex items-center gap-1'>
                          <Star className='w-3.5 h-3.5 fill-white text-white' />
                          <span className='text-sm font-medium text-white'>
                            {averageRating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className='p-4'>
                      <Link href={`/host/${product.id}`}>
                        <h3 className='font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors'>
                          {product.name}
                        </h3>
                      </Link>

                      <div className='flex items-center text-gray-600 mb-3'>
                        <MapPin className='w-4 h-4 mr-1 flex-shrink-0' />
                        <span className='text-sm truncate'>
                          {getCityFromAddress(product.address)}
                        </span>
                      </div>

                      <div className='flex items-center justify-between'>
                        <div>
                          <span className='text-lg font-bold text-gray-900'>
                            {product.basePrice}€
                          </span>
                          <span className='text-gray-600 text-sm ml-1'>/ nuit</span>
                        </div>
                        <span className='text-xs text-gray-500'>
                          Ajouté le{' '}
                          {(() => {
                            if (!favorite.createdAt) return 'Date inconnue'
                            try {
                              const date = new Date(favorite.createdAt)
                              if (isNaN(date.getTime())) return 'Date inconnue'
                              return date.toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })
                            } catch {
                              return 'Date inconnue'
                            }
                          })()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
