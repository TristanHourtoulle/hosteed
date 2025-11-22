'use client'

import { useEffect, useState } from 'react'
import { getActualProduct } from '@/lib/services/promotedProduct.service'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { Badge } from '@/components/ui/shadcnui/badge'
import { Button } from '@/components/ui/shadcnui/button'
import { Star, MapPin, Users, Heart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface PromotedProduct {
  id: string
  active: boolean
  start: Date
  end: Date
  productId: string
  product: {
    id: string
    name: string
    address: string
    basePrice: string
    maxPeople?: bigint | null
    img?: { img: string }[]
    type: { name: string }
    reviews?: { grade: number }[]
    owner: {
      id: string
      name: string | null
      email: string
    }
  }
}

export default function SponsoredPage() {
  const [promotedProducts, setPromotedProducts] = useState<PromotedProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPromotedProducts = async () => {
      try {
        const products = await getActualProduct()
        if (products) {
          setPromotedProducts(products)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des hébergements sponsorisés:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPromotedProducts()
  }, [])

  const getAverageRating = (reviews?: { grade: number }[]) => {
    if (!reviews || reviews.length === 0) return 0
    const total = reviews.reduce((sum, review) => sum + review.grade, 0)
    return total / reviews.length
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <div className='container mx-auto px-4 py-8'>
          <div className='flex items-center justify-center h-64'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Hero Section */}
      <div className='bg-gradient-to-r from-blue-600 to-purple-600 text-white'>
        <div className='container mx-auto px-4 py-16 text-center'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className='text-4xl md:text-6xl font-bold mb-4'>
              <Star className='inline w-8 h-8 md:w-12 md:h-12 text-yellow-400 mr-2' />
              Hébergements Sponsorisés
            </h1>
            <p className='text-xl md:text-2xl text-blue-100 mb-8'>
              Découvrez nos hébergements sélectionnés et mis en avant
            </p>
            <Badge className='bg-yellow-400 text-yellow-900 text-lg px-4 py-2'>
              {promotedProducts.length} hébergement{promotedProducts.length > 1 ? 's' : ''} en
              vedette
            </Badge>
          </motion.div>
        </div>
      </div>

      {/* Products Grid */}
      <div className='container mx-auto px-4 py-12'>
        {promotedProducts.length > 0 ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {promotedProducts.map((promotion, index) => (
              <motion.div
                key={promotion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className='overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group relative'>
                  {/* Badge Sponsorisé */}
                  <div className='absolute top-4 left-4 z-20'>
                    <Badge className='bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 font-semibold'>
                      <Star className='w-3 h-3 mr-1' />
                      Sponsorisé
                    </Badge>
                  </div>

                  {/* Image */}
                  <div className='relative h-64 overflow-hidden'>
                    {promotion.product.img?.[0] ? (
                      <Image
                        src={promotion.product.img[0].img}
                        alt={promotion.product.name}
                        fill
                        className='object-cover group-hover:scale-110 transition-transform duration-300'
                      />
                    ) : (
                      <div className='w-full h-full bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center'>
                        <span className='text-gray-500'>Pas d&apos;image</span>
                      </div>
                    )}

                    {/* Overlay avec bouton favori */}
                    <div className='absolute top-4 right-4'>
                      <Button variant='outline' size='sm' className='bg-white/90 hover:bg-white'>
                        <Heart className='w-4 h-4' />
                      </Button>
                    </div>
                  </div>

                  <CardContent className='p-6'>
                    {/* Header */}
                    <div className='mb-4'>
                      <h3 className='text-xl font-bold text-gray-900 mb-2 line-clamp-2'>
                        {promotion.product.name}
                      </h3>
                      <div className='flex items-center text-gray-600 mb-2'>
                        <MapPin className='w-4 h-4 mr-1 flex-shrink-0' />
                        <span className='text-sm truncate'>{promotion.product.address}</span>
                      </div>
                      <Badge variant='secondary' className='text-xs'>
                        {promotion.product.type.name}
                      </Badge>
                    </div>

                    {/* Ratings */}
                    {promotion.product.reviews && promotion.product.reviews.length > 0 && (
                      <div className='flex items-center mb-4'>
                        <div className='flex items-center'>
                          <Star className='w-4 h-4 fill-yellow-400 text-yellow-400 mr-1' />
                          <span className='text-sm font-medium'>
                            {getAverageRating(promotion.product.reviews).toFixed(1)}
                          </span>
                          <span className='text-sm text-gray-500 ml-1'>
                            ({promotion.product.reviews.length} avis)
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Amenities */}
                    <div className='flex items-center gap-4 mb-4 text-sm text-gray-600'>
                      {promotion.product.maxPeople && (
                        <div className='flex items-center'>
                          <Users className='w-4 h-4 mr-1' />
                          <span>{Number(promotion.product.maxPeople)} pers. max</span>
                        </div>
                      )}
                    </div>

                    {/* Price and CTA */}
                    <div className='flex items-center justify-between'>
                      <div>
                        <span className='text-2xl font-bold text-blue-600'>
                          {promotion.product.basePrice}€
                        </span>
                        <span className='text-gray-500 text-sm'>/nuit</span>
                      </div>
                      <Link href={`/host/${promotion.product.id}`}>
                        <Button className='bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'>
                          Voir détails
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className='text-center py-16'>
            <Star className='w-16 h-16 text-gray-400 mx-auto mb-4' />
            <h3 className='text-xl font-medium text-gray-900 mb-2'>
              Aucun hébergement sponsorisé pour le moment
            </h3>
            <p className='text-gray-600 mb-6'>
              Revenez bientôt pour découvrir nos sélections d&apos;hébergements mis en avant
            </p>
            <Link href='/host'>
              <Button>Voir tous les hébergements</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Call to Action */}
      {promotedProducts.length > 0 && (
        <div className='bg-blue-50 border-t'>
          <div className='container mx-auto px-4 py-12 text-center'>
            <h3 className='text-2xl font-bold text-gray-900 mb-4'>
              Explorez plus d&apos;hébergements
            </h3>
            <p className='text-gray-600 mb-6'>
              Découvrez notre sélection complète d&apos;hébergements de qualité
            </p>
            <Link href='/host'>
              <Button variant='outline' size='lg'>
                Tous les hébergements
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
