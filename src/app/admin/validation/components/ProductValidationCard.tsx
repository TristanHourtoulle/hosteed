'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ProductValidation } from '@prisma/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Eye, MapPin, Home, User, Loader2 } from 'lucide-react'
import { approveProduct, rejectProduct } from '../actions'

interface Product {
  id: string
  name: string
  description: string
  address: string
  basePrice: string
  validate: ProductValidation
  img?: { img: string }[]
  user: {
    id: string
    name?: string | null
    lastname?: string | null
    email: string
    image?: string | null
  }[]
  // Nouvelles métadonnées pour le contexte de validation
  isRecentlyModified?: boolean
  wasRecheckRequested?: boolean
}

interface ProductValidationCardProps {
  product: Product
  currentUserId: string
  onUpdate: () => void
}

export function ProductValidationCard({
  product,
  currentUserId,
  onUpdate,
}: ProductValidationCardProps) {
  const [loading, setLoading] = useState(false)

  const getValidationBadge = (validation: ProductValidation, isRecentlyModified?: boolean) => {
    switch (validation) {
      case ProductValidation.NotVerified:
        if (isRecentlyModified) {
          return (
            <Badge variant='secondary' className='bg-blue-100 text-blue-800 border-blue-300'>
              Modifié - À revalider
            </Badge>
          )
        }
        return (
          <Badge variant='secondary' className='bg-yellow-100 text-yellow-800'>
            En attente
          </Badge>
        )
      case ProductValidation.RecheckRequest:
        return (
          <Badge variant='secondary' className='bg-orange-100 text-orange-800'>
            Révision demandée
          </Badge>
        )
      case ProductValidation.Approve:
        return (
          <Badge variant='default' className='bg-green-100 text-green-800'>
            Validé
          </Badge>
        )
      case ProductValidation.Refused:
        return (
          <Badge variant='destructive' className='bg-red-100 text-red-800'>
            Refusé
          </Badge>
        )
      default:
        return <Badge variant='outline'>Inconnu</Badge>
    }
  }

  const handleValidationAction = async (action: 'approve' | 'reject') => {
    setLoading(true)
    try {
      let result
      if (action === 'approve') {
        result = await approveProduct(product.id, currentUserId, 'Approuvé par admin')
      } else {
        result = await rejectProduct(
          product.id,
          currentUserId,
          "Produit rejeté par l'administrateur"
        )
      }

      if (result.success) {
        onUpdate()
      } else {
        console.error(result.error)
      }
    } catch (error) {
      console.error(
        `Erreur lors de la ${action === 'approve' ? 'validation' : 'rejection'}:`,
        error
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className='overflow-hidden hover:shadow-lg transition-all duration-300'>
      {/* Product Image */}
      <div className='relative h-48 w-full'>
        {product.img && product.img.length > 0 ? (
          <Image src={product.img[0].img} alt={product.name} fill className='object-cover' />
        ) : (
          <div className='w-full h-full bg-gray-200 flex items-center justify-center'>
            <Home className='h-12 w-12 text-gray-400' />
          </div>
        )}
        <div className='absolute top-4 right-4'>
          {getValidationBadge(product.validate, product.isRecentlyModified)}
        </div>
      </div>

      <CardContent className='p-4'>
        <div className='space-y-3'>
          {/* Product Title */}
          <div>
            <h3 className='font-semibold text-lg text-gray-900 line-clamp-1'>{product.name}</h3>
            <p className='text-gray-600 text-sm line-clamp-2 mt-1'>{product.description}</p>
          </div>

          {/* Location and Price */}
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-1 text-gray-600'>
              <MapPin className='h-4 w-4' />
              <span className='text-sm line-clamp-1'>{product.address}</span>
            </div>
            <div className='text-lg font-bold text-primary'>{product.basePrice}€</div>
          </div>

          {/* Host Info */}
          <div className='flex items-center gap-2 text-sm text-gray-600'>
            <User className='h-4 w-4' />
            <span>
              {product.user[0]?.name && product.user[0]?.lastname
                ? `${product.user[0].name} ${product.user[0].lastname}`
                : product.user[0]?.email || 'Utilisateur inconnu'}
            </span>
          </div>

          {/* Actions */}
          <div className='flex gap-2 pt-2'>
            <Button variant='outline' size='sm' asChild className='flex-1'>
              <Link href={`/admin/validation/${product.id}`}>
                <Eye className='h-4 w-4 mr-1' />
                Détails
              </Link>
            </Button>

            {(product.validate === ProductValidation.NotVerified ||
              product.validate === ProductValidation.RecheckRequest) && (
              <>
                <Button
                  size='sm'
                  onClick={() => handleValidationAction('approve')}
                  className='bg-green-600 hover:bg-green-700'
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <CheckCircle className='h-4 w-4' />
                  )}
                </Button>
                <Button
                  variant='destructive'
                  size='sm'
                  onClick={() => handleValidationAction('reject')}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <XCircle className='h-4 w-4' />
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
