'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/shadcnui/badge'
import { Card, CardContent, CardFooter } from '@/components/ui/shadcnui/card'
import { Button } from '@/components/ui/shadcnui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Bed, MapPin, Euro, Trash2 } from 'lucide-react'
import { Product } from '@prisma/client'
import {
  getValidationStatusLabel,
  getValidationStatusVariant,
} from '@/lib/utils/productValidation'
import { getLocationDisplay } from '@/lib/utils'

interface ProductCardProps {
  product: Product & {
    img?: { img: string }[]
  }
  selected?: boolean
  onToggleSelect?: (id: string) => void
  onDelete?: (product: { id: string; name: string }) => void
}

/**
 * Admin product card with optional selection checkbox and delete button.
 */
export function ProductCard({ product, selected, onToggleSelect, onDelete }: ProductCardProps) {
  const locationDisplay = getLocationDisplay({
    address: product.address,
    neighborhood: product.neighborhood,
    city: product.city,
    region: product.region,
    country: product.country,
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
      className='h-full'
    >
      <Card className='overflow-hidden h-full flex flex-col py-0 relative'>
        {onToggleSelect && (
          <div className='absolute top-4 left-4 z-10'>
            <Checkbox
              checked={selected}
              onCheckedChange={() => onToggleSelect(product.id)}
              className='bg-white border-2'
            />
          </div>
        )}

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
            variant={getValidationStatusVariant(product.validate)}
            className='absolute top-2 right-2 z-10'
          >
            {getValidationStatusLabel(product.validate)}
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
              <span>{locationDisplay}</span>
            </div>
            <div className='flex items-center gap-1'>
              <Bed className='h-4 w-4' />
              <span>{product.room ? Number(product.room) : 0} chambres</span>
            </div>
            <div className='flex items-center gap-1'>
              <Euro className='h-4 w-4' />
              <span>{product.basePrice}€ / nuit</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className='p-4 pt-0 gap-2'>
          <Button asChild className='flex-1' variant='outline'>
            <Link href={`/admin/products/${product.id}`}>Voir détails</Link>
          </Button>
          {onDelete && (
            <Button
              variant='destructive'
              size='icon'
              onClick={() => onDelete({ id: product.id, name: product.name })}
              title='Supprimer cet hébergement'
            >
              <Trash2 className='h-4 w-4' />
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  )
}
