'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProductValidation } from '@prisma/client'

interface Product {
  id: string
  name: string
  validate: ProductValidation
}

interface ProductHeaderProps {
  product: Product
}

export function ProductHeader({ product }: ProductHeaderProps) {
  const getStatusBadge = (status: ProductValidation) => {
    switch (status) {
      case ProductValidation.NotVerified:
        return (
          <Badge variant='secondary' className='bg-yellow-100 text-yellow-800'>
            En attente
          </Badge>
        )
      case ProductValidation.Approve:
        return (
          <Badge variant='secondary' className='bg-green-100 text-green-800'>
            Approuvé
          </Badge>
        )
      case ProductValidation.Refused:
        return (
          <Badge variant='secondary' className='bg-red-100 text-red-800'>
            Refusé
          </Badge>
        )
      case ProductValidation.RecheckRequest:
        return (
          <Badge variant='secondary' className='bg-blue-100 text-blue-800'>
            Révision demandée
          </Badge>
        )
      default:
        return <Badge variant='secondary'>Inconnu</Badge>
    }
  }

  return (
    <div className='flex items-center justify-between'>
      <div>
        <Button variant='outline' asChild className='mb-4'>
          <Link href='/admin/validation'>
            <ArrowLeft className='h-4 w-4 mr-2' />
            Retour à la liste
          </Link>
        </Button>
        <h1 className='text-3xl font-bold text-gray-900'>{product.name}</h1>
        <div className='flex items-center gap-4 mt-2'>
          {getStatusBadge(product.validate)}
          <span className='text-sm text-gray-500'>ID: {product.id}</span>
        </div>
      </div>
      <Button variant='outline' asChild>
        <Link href={`/host/${product.id}?preview=true`} target='_blank'>
          Prévisualiser
        </Link>
      </Button>
    </div>
  )
}