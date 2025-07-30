'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/shadcnui/badge'
import { Card, CardContent, CardFooter } from '@/components/ui/shadcnui/card'
import { Button } from '@/components/ui/shadcnui/button'
import { Bed, MapPin, Euro } from 'lucide-react'
import { Product } from '@prisma/client'

interface ProductCardProps {
  product: Product & {
    img?: { img: string }[]
  }
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
      className='h-full'
    >
      <Card className='overflow-hidden h-full flex flex-col py-0'>
        <div className='relative aspect-[16/9] overflow-hidden'>
          {product.img && product.img[0] && (
            <Image
              src={product.img[0].img}
              alt={product.name}
              fill
              className='object-cover transition-transform duration-300 hover:scale-110'
              sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
            />
          )}
          <Badge
            variant={product.validate === 'Approve' ? 'default' : 'secondary'}
            className='absolute top-2 right-2 z-10'
          >
            {product.validate}
          </Badge>
        </div>

        <CardContent className='flex-1 p-4 space-y-3'>
          <div>
            <h2 className='text-xl font-semibold line-clamp-1 mb-1'>{product.name}</h2>
            <p className='text-gray-600 text-sm line-clamp-2'>{product.description}</p>
          </div>

          <div className='flex flex-wrap gap-3 text-sm text-gray-600'>
            <div className='flex items-center gap-1'>
              <MapPin className='h-4 w-4' />
              <span>{product.address}</span>
            </div>
            <div className='flex items-center gap-1'>
              <Bed className='h-4 w-4' />
              <span>{product.room} chambres</span>
            </div>
            <div className='flex items-center gap-1'>
              <Euro className='h-4 w-4' />
              <span>{product.basePrice}€ / nuit</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className='p-4 pt-0'>
          <Button asChild className='w-full' variant='outline'>
            <Link href={`/admin/products/${product.id}`}>Voir détails</Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
