'use client'

import React, { useState, useMemo, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ProductValidation } from '@prisma/client'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  XCircle,
  Eye,
  MapPin,
  Home,
  Loader2,
  UserCircle2,
} from 'lucide-react'
import { toPlainTextPreview } from '@/lib/utils/contentFormat'
import { approveProduct, rejectProduct } from '../actions'

interface Product {
  id: string
  name: string
  description: string
  address: string
  basePrice: string
  validate: ProductValidation
  img?: { img: string }[]
  owner: {
    id: string
    name?: string | null
    lastname?: string | null
    email: string
    image?: string | null
  }
  isRecentlyModified?: boolean
  wasRecheckRequested?: boolean
}

interface ProductValidationCardProps {
  product: Product
  currentUserId: string
  onUpdate: () => void
}

type StatusAccent = {
  label: string
  badgeClass: string
  borderClass: string
}

function getStatusAccent(
  validate: ProductValidation,
  isRecentlyModified?: boolean
): StatusAccent {
  switch (validate) {
    case ProductValidation.NotVerified:
      if (isRecentlyModified) {
        return {
          label: 'Modifié · à revalider',
          badgeClass: 'bg-blue-100 text-blue-800 ring-1 ring-blue-200',
          borderClass: 'before:bg-blue-500',
        }
      }
      return {
        label: 'En attente',
        badgeClass: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200',
        borderClass: 'before:bg-amber-500',
      }
    case ProductValidation.RecheckRequest:
      return {
        label: 'Révision demandée',
        badgeClass: 'bg-orange-100 text-orange-800 ring-1 ring-orange-200',
        borderClass: 'before:bg-orange-500',
      }
    case ProductValidation.Approve:
      return {
        label: 'Validé',
        badgeClass: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200',
        borderClass: 'before:bg-emerald-500',
      }
    case ProductValidation.Refused:
      return {
        label: 'Refusé',
        badgeClass: 'bg-red-100 text-red-800 ring-1 ring-red-200',
        borderClass: 'before:bg-red-500',
      }
    default:
      return {
        label: 'Inconnu',
        badgeClass: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
        borderClass: 'before:bg-slate-400',
      }
  }
}

function ProductValidationCard({ product, currentUserId, onUpdate }: ProductValidationCardProps) {
  const [loading, setLoading] = useState(false)

  const statusAccent = useMemo(
    () => getStatusAccent(product.validate, product.isRecentlyModified),
    [product.validate, product.isRecentlyModified]
  )

  const userDisplayName = useMemo(() => {
    const user = product.owner
    if (user?.name && user?.lastname) {
      return `${user.name} ${user.lastname}`
    }
    return user?.email || 'Utilisateur inconnu'
  }, [product.owner])

  const initials = useMemo(() => {
    const name = userDisplayName
    const parts = name.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return (parts[0]?.[0] || '?').toUpperCase()
  }, [userDisplayName])

  const showValidationActions = useMemo(() => {
    return (
      product.validate === ProductValidation.NotVerified ||
      product.validate === ProductValidation.RecheckRequest
    )
  }, [product.validate])

  const firstImageUrl = useMemo(() => {
    return product.img && product.img.length > 0 ? product.img[0].img : null
  }, [product.img])

  const descriptionPreview = useMemo(
    () => toPlainTextPreview(product.description),
    [product.description]
  )

  const handleValidationAction = useCallback(
    async (action: 'approve' | 'reject') => {
      setLoading(true)
      try {
        const result =
          action === 'approve'
            ? await approveProduct(product.id, currentUserId, 'Approuvé par admin')
            : await rejectProduct(
                product.id,
                currentUserId,
                "Produit rejeté par l'administrateur"
              )

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
    },
    [product.id, currentUserId, onUpdate]
  )

  const handleApprove = useCallback(
    () => handleValidationAction('approve'),
    [handleValidationAction]
  )
  const handleReject = useCallback(
    () => handleValidationAction('reject'),
    [handleValidationAction]
  )

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg before:absolute before:left-0 before:top-0 before:h-full before:w-1.5 ${statusAccent.borderClass}`}
    >
      {/* Image + status badge overlay */}
      <div className='relative h-56 w-full overflow-hidden bg-slate-100'>
        {firstImageUrl ? (
          <Image
            src={firstImageUrl}
            alt={product.name}
            fill
            className='object-cover transition-transform duration-500 group-hover:scale-[1.03]'
            sizes='(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw'
          />
        ) : (
          <div className='flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200'>
            <Home className='h-12 w-12 text-slate-400' />
          </div>
        )}

        <div className='absolute left-4 top-4'>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusAccent.badgeClass}`}
          >
            {statusAccent.label}
          </span>
        </div>

        <div className='absolute right-4 top-4'>
          <span className='inline-flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm'>
            {product.basePrice}€
            <span className='font-normal opacity-80'>/nuit</span>
          </span>
        </div>
      </div>

      {/* Body */}
      <div className='flex flex-1 flex-col gap-4 p-5'>
        {/* Host row */}
        <div className='flex items-center gap-3 border-b border-slate-100 pb-4'>
          {product.owner.image ? (
            <Image
              src={product.owner.image}
              alt={userDisplayName}
              width={36}
              height={36}
              className='h-9 w-9 rounded-full object-cover ring-2 ring-white'
            />
          ) : (
            <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-xs font-semibold text-white ring-2 ring-white'>
              {initials}
            </div>
          )}
          <div className='min-w-0 flex-1'>
            <p className='truncate text-sm font-medium text-slate-900'>{userDisplayName}</p>
            <p className='truncate text-xs text-slate-500'>
              <UserCircle2 className='inline h-3 w-3 align-text-bottom' /> {product.owner.email}
            </p>
          </div>
        </div>

        {/* Title + description */}
        <div className='space-y-2'>
          <h3 className='line-clamp-1 text-lg font-semibold text-slate-900'>{product.name}</h3>
          <p className='line-clamp-2 text-sm text-slate-600'>
            {descriptionPreview || 'Aucune description'}
          </p>
        </div>

        {/* Location */}
        <div className='flex items-start gap-2 text-sm text-slate-500'>
          <MapPin className='mt-0.5 h-4 w-4 shrink-0' />
          <span className='line-clamp-1'>{product.address}</span>
        </div>

        {/* Actions */}
        <div className='mt-auto flex flex-wrap items-center gap-2 pt-2'>
          <Button variant='outline' size='sm' asChild className='flex-1 min-w-[110px]'>
            <Link href={`/admin/validation/${product.id}`}>
              <Eye className='mr-1 h-4 w-4' />
              Détails
            </Link>
          </Button>

          {showValidationActions && (
            <div className='flex gap-2'>
              <Button
                size='sm'
                onClick={handleApprove}
                className='bg-emerald-600 text-white hover:bg-emerald-700'
                disabled={loading}
                aria-label='Approuver l’annonce'
                title='Approuver'
              >
                {loading ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <CheckCircle2 className='h-4 w-4' />
                )}
              </Button>
              <Button
                size='sm'
                variant='destructive'
                onClick={handleReject}
                disabled={loading}
                aria-label='Refuser l’annonce'
                title='Refuser'
              >
                {loading ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <XCircle className='h-4 w-4' />
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

const arePropsEqual = (
  prevProps: ProductValidationCardProps,
  nextProps: ProductValidationCardProps
) => {
  if (prevProps.currentUserId !== nextProps.currentUserId) return false
  if (prevProps.onUpdate !== nextProps.onUpdate) return false

  const p = prevProps.product
  const n = nextProps.product

  if (
    p.id !== n.id ||
    p.name !== n.name ||
    p.description !== n.description ||
    p.address !== n.address ||
    p.basePrice !== n.basePrice ||
    p.validate !== n.validate ||
    p.isRecentlyModified !== n.isRecentlyModified ||
    p.wasRecheckRequested !== n.wasRecheckRequested
  ) {
    return false
  }

  if (p.img?.length !== n.img?.length) return false
  if (p.img && n.img && p.img.length > 0) {
    if (p.img[0].img !== n.img[0].img) return false
  }

  const pu = p.owner
  const nu = n.owner
  if (
    pu?.id !== nu?.id ||
    pu?.name !== nu?.name ||
    pu?.lastname !== nu?.lastname ||
    pu?.email !== nu?.email ||
    pu?.image !== nu?.image
  ) {
    return false
  }

  return true
}

export default React.memo(ProductValidationCard, arePropsEqual)
