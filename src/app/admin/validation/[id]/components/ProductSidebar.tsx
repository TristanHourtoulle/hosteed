'use client'

import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle, XCircle, AlertTriangle, User } from 'lucide-react'
import { ProductValidation } from '@prisma/client'

interface Product {
  id: string
  validate: ProductValidation
  user: {
    id: string
    name?: string | null
    lastname?: string | null
    email: string
    image?: string | null
    profilePicture?: string | null
    profilePictureBase64?: string | null
  }[]
}

interface ProductSidebarProps {
  product: Product
  reason: string
  setReason: (reason: string) => void
  actionLoading: boolean
  handleApprove: () => void
  handleReject: () => void
  handleRequestRecheck: () => void
}

export function ProductSidebar({
  product,
  reason,
  setReason,
  actionLoading,
  handleApprove,
  handleReject,
  handleRequestRecheck,
}: ProductSidebarProps) {
  const getHostName = () => {
    if (!product.user || product.user.length === 0) {
      return 'Hôte non défini'
    }

    const user = product.owner
    if (!user) return 'Hôte non défini'

    const firstName = user.name?.trim()
    const lastName = user.lastname?.trim()

    if (firstName && lastName) {
      return `${firstName} ${lastName}`
    } else if (firstName) {
      return firstName
    } else if (lastName) {
      return lastName
    } else if (user.email) {
      return user.email.split('@')[0]
    } else {
      return 'Nom non défini'
    }
  }

  return (
    <div className='space-y-6'>
      {/* Informations hôte */}
      <Card>
        <CardHeader>
          <CardTitle>Hôte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center space-x-3'>
            {product.user &&
            product.user.length > 0 &&
            (product.owner?.image ||
              product.owner?.profilePicture ||
              product.owner?.profilePictureBase64) ? (
              <Image
                src={
                  product.owner.image ||
                  product.owner.profilePicture ||
                  product.owner.profilePictureBase64 ||
                  ''
                }
                alt='Photo de profil'
                width={48}
                height={48}
                className='rounded-full object-cover'
                unoptimized
              />
            ) : (
              <div className='w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center'>
                <User className='h-6 w-6 text-gray-400' />
              </div>
            )}
            <div>
              <p className='font-medium'>{getHostName()}</p>
              <p className='text-sm text-gray-500'>
                {product.user && product.user.length > 0
                  ? product.owner.email
                  : 'Email non disponible'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions de validation */}
      <Card>
        <CardHeader>
          <CardTitle>Actions de validation</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <Label htmlFor='reason'>Commentaire/Raison (optionnel pour approbation)</Label>
            <Textarea
              id='reason'
              placeholder='Ajoutez un commentaire ou une raison...'
              value={reason}
              onChange={e => setReason(e.target.value)}
              className='mt-1'
              rows={3}
            />
          </div>

          <div className='space-y-2'>
            {product.validate !== ProductValidation.Approve && (
              <Button
                onClick={handleApprove}
                disabled={actionLoading}
                className='w-full bg-green-600 hover:bg-green-700'
              >
                {actionLoading ? (
                  <Loader2 className='h-4 w-4 animate-spin mr-2' />
                ) : (
                  <CheckCircle className='h-4 w-4 mr-2' />
                )}
                Approuver l&apos;annonce
              </Button>
            )}

            {product.validate !== ProductValidation.RecheckRequest && (
              <Button
                onClick={handleRequestRecheck}
                disabled={actionLoading || !reason.trim()}
                variant='outline'
                className='w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50'
              >
                {actionLoading ? (
                  <Loader2 className='h-4 w-4 animate-spin mr-2' />
                ) : (
                  <AlertTriangle className='h-4 w-4 mr-2' />
                )}
                Demander une révision
              </Button>
            )}

            {product.validate !== ProductValidation.Refused && (
              <Button
                onClick={handleReject}
                disabled={actionLoading || !reason.trim()}
                variant='destructive'
                className='w-full'
              >
                {actionLoading ? (
                  <Loader2 className='h-4 w-4 animate-spin mr-2' />
                ) : (
                  <XCircle className='h-4 w-4 mr-2' />
                )}
                Refuser l&apos;annonce
              </Button>
            )}
          </div>

          {!reason.trim() && (
            <p className='text-sm text-amber-600 bg-amber-50 p-2 rounded'>
              <strong>Info:</strong> Une raison est requise pour refuser ou demander une révision
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
