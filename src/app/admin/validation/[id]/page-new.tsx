'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { ProductValidation } from '@prisma/client'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Loader2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MapPin,
  User,
  Calendar,
  Euro,
  Home,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { approveProduct, rejectProduct, requestRecheck } from '../actions'

interface Product {
  id: string
  name: string
  description: string
  address: string
  basePrice: string
  validate: ProductValidation
  createdAt: Date
  img?: { img: string }[]
  user: {
    id: string
    email: string
    name: string | null
    lastname: string | null
    image: string | null
  }[]
}

interface ValidationDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function ValidationDetailPage({ params }: ValidationDetailPageProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [productId, setProductId] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.user?.roles || session.user.roles !== 'ADMIN') {
      router.push('/')
    }
  }, [session, router])

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setProductId(resolvedParams.id)
    }
    getParams()
  }, [params])

  const fetchProduct = useCallback(async () => {
    if (!productId) return

    try {
      setLoading(true)
      // Pour l'instant, on simule la récupération du produit
      // TODO: Implémenter getProductById dans le service
      setTimeout(() => {
        setProduct({
          id: productId,
          name: 'Appartement moderne au centre-ville',
          description:
            'Magnifique appartement entièrement rénové avec vue sur la ville. Situé dans un quartier calme et proche de toutes commodités.',
          address: '123 Rue Example, 75001 Paris',
          basePrice: '120',
          validate: ProductValidation.NotVerified,
          createdAt: new Date(),
          img: [],
          user: [
            {
              id: 'user1',
              email: 'host@example.com',
              name: 'Jean',
              lastname: 'Dupont',
              image: null,
            },
          ],
        })
        setLoading(false)
      }, 1000)
    } catch (err) {
      setError("Erreur lors du chargement de l'annonce")
      console.error(err)
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    if (productId) {
      fetchProduct()
    }
  }, [productId, fetchProduct])

  const handleApprove = async () => {
    if (!product || !session?.user?.id) return

    setActionLoading(true)
    try {
      const result = await approveProduct(product.id, session.user.id, reason || undefined)
      if (result.success) {
        router.push('/admin/validation?success=approved')
      } else {
        setError(result.error || "Erreur lors de l'approbation")
      }
    } catch (err) {
      console.error("Erreur lors de l'approbation:", err)
      setError("Erreur lors de l'approbation de l'annonce")
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!product || !session?.user?.id || !reason.trim()) {
      setError('Une raison est requise pour refuser une annonce')
      return
    }

    setActionLoading(true)
    try {
      const result = await rejectProduct(product.id, session.user.id, reason)
      if (result.success) {
        router.push('/admin/validation?success=rejected')
      } else {
        setError(result.error || 'Erreur lors du refus')
      }
    } catch (err) {
      console.error('Erreur lors du refus:', err)
      setError("Erreur lors du refus de l'annonce")
    } finally {
      setActionLoading(false)
    }
  }

  const handleRequestRecheck = async () => {
    if (!product || !session?.user?.id || !reason.trim()) {
      setError('Une raison est requise pour demander une révision')
      return
    }

    setActionLoading(true)
    try {
      const result = await requestRecheck(product.id, session.user.id, reason)
      if (result.success) {
        router.push('/admin/validation?success=recheck')
      } else {
        setError(result.error || 'Erreur lors de la demande de révision')
      }
    } catch (err) {
      console.error('Erreur lors de la demande de révision:', err)
      setError('Erreur lors de la demande de révision')
    } finally {
      setActionLoading(false)
    }
  }

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

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    )
  }

  if (error) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <Alert className='max-w-md mx-auto'>
          <XCircle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!product) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <Alert className='max-w-md mx-auto'>
          <XCircle className='h-4 w-4' />
          <AlertDescription>Annonce non trouvée</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='space-y-8'
      >
        {/* Header */}
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

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Contenu principal */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle>Photos de l&apos;annonce</CardTitle>
              </CardHeader>
              <CardContent>
                {product.img && product.img.length > 0 ? (
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {product.img.slice(0, 4).map((image, index) => (
                      <div key={index} className='relative h-48 rounded-lg overflow-hidden'>
                        <Image
                          src={image.img}
                          alt={`Photo ${index + 1}`}
                          fill
                          className='object-cover'
                        />
                      </div>
                    ))}
                    {product.img.length > 4 && (
                      <div className='relative h-48 rounded-lg bg-gray-100 flex items-center justify-center'>
                        <span className='text-gray-500'>
                          +{product.img.length - 4} autres photos
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className='h-48 bg-gray-100 rounded-lg flex items-center justify-center'>
                    <div className='text-center'>
                      <Home className='h-12 w-12 text-gray-400 mx-auto mb-2' />
                      <p className='text-gray-500'>Aucune photo disponible</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-gray-700 whitespace-pre-wrap'>{product.description}</p>
              </CardContent>
            </Card>

            {/* Informations détaillées */}
            <Card>
              <CardHeader>
                <CardTitle>Informations sur le logement</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center'>
                  <MapPin className='h-4 w-4 text-gray-400 mr-2' />
                  <span>{product.address}</span>
                </div>
                <div className='flex items-center'>
                  <Euro className='h-4 w-4 text-gray-400 mr-2' />
                  <span>{product.basePrice}€ par nuit</span>
                </div>
                <div className='flex items-center'>
                  <Calendar className='h-4 w-4 text-gray-400 mr-2' />
                  <span>Créé le {new Date(product.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Informations hôte */}
            <Card>
              <CardHeader>
                <CardTitle>Hôte</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-center space-x-3'>
                  {product.user[0]?.image ? (
                    <Image
                      src={product.user[0].image}
                      alt='Photo de profil'
                      width={48}
                      height={48}
                      className='rounded-full'
                    />
                  ) : (
                    <div className='w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center'>
                      <User className='h-6 w-6 text-gray-400' />
                    </div>
                  )}
                  <div>
                    <p className='font-medium'>
                      {product.user[0]?.name && product.user[0]?.lastname
                        ? `${product.user[0].name} ${product.user[0].lastname}`
                        : product.user[0]?.name || product.user[0]?.lastname || 'Nom non défini'}
                    </p>
                    <p className='text-sm text-gray-500'>{product.user[0]?.email}</p>
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
                    <strong>Info:</strong> Une raison est requise pour refuser ou demander une
                    révision
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
