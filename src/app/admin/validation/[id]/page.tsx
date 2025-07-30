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
  Euro,
  Home,
  Users,
  Bath,
  Bed,
  Car,
  Utensils,
  Shield,
  CheckSquare,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  getProductForValidation,
  approveProduct,
  rejectProduct,
  requestRecheck,
  getValidationHistory,
} from '../actions'
import { ValidationHistoryCard } from '../components/ValidationHistoryCard'

interface ValidationHistoryEntry {
  id: string
  previousStatus: ProductValidation
  newStatus: ProductValidation
  reason?: string | null
  createdAt: Date
  admin?: {
    id: string
    name?: string | null
    lastname?: string | null
    email: string
  } | null
  host?: {
    id: string
    name?: string | null
    lastname?: string | null
    email: string
  } | null
}

interface Product {
  id: string
  name: string
  description: string
  address: string
  basePrice: string
  priceMGA: string
  room: bigint | null
  bathroom: bigint | null
  arriving: number
  leaving: number
  autoAccept: boolean
  minRent: bigint | null
  maxRent: bigint | null
  advanceRent: bigint | null
  delayTime: bigint | null
  minPeople: bigint | null
  maxPeople: bigint | null
  commission: number
  validate: ProductValidation
  phone: string
  latitude: number
  longitude: number
  certified: boolean
  contract: boolean
  sizeRoom: number | null
  img?: { img: string }[]
  user: {
    id: string
    email: string
    name: string | null
    lastname: string | null
    image: string | null
  }[]
  type: {
    id: string
    name: string
    description: string
  }
  equipments: {
    id: string
    name: string
    icon: string
  }[]
  mealsList: {
    id: string
    name: string
  }[]
  servicesList: {
    id: string
    name: string
  }[]
  securities: {
    id: string
    name: string
  }[]
  typeRoom: {
    id: string
    name: string
    description: string
  }[]
  rules: {
    id: string
    smokingAllowed: boolean
    petsAllowed: boolean
    eventsAllowed: boolean
    checkInTime: string
    checkOutTime: string
    selfCheckIn: boolean
    selfCheckInType: string | null
  }[]
  nearbyPlaces: {
    id: string
    name: string
    distance: number
    duration: number
    transport: string
  }[]
  transportOptions: {
    id: string
    name: string
    description: string | null
  }[]
  propertyInfo: {
    id: string
    hasStairs: boolean
    hasElevator: boolean
    hasHandicapAccess: boolean
    hasPetsOnProperty: boolean
    additionalNotes: string | null
  } | null
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
  const [validationHistory, setValidationHistory] = useState<ValidationHistoryEntry[]>([])

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

  const fetchValidationHistory = useCallback(async () => {
    if (!productId) return

    try {
      const historyResult = await getValidationHistory(productId)

      if (historyResult.success && historyResult.data) {
        setValidationHistory(historyResult.data)
      }
    } catch (err) {
      console.error("Erreur lors du chargement de l'historique:", err)
    }
  }, [productId])

  const fetchProduct = useCallback(async () => {
    if (!productId) return

    try {
      setLoading(true)
      setError(null)

      const result = await getProductForValidation(productId)

      if (result.success && result.data) {
        setProduct(result.data)
        // Charger l'historique en parallèle
        fetchValidationHistory()
      } else {
        setError(result.error || 'Erreur lors du chargement du produit')
      }
    } catch (err) {
      setError("Erreur lors du chargement de l'annonce")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [productId, fetchValidationHistory])

  useEffect(() => {
    if (productId) {
      fetchProduct()
    }
  }, [productId, fetchProduct])

  const handleApprove = async () => {
    if (!product || !session?.user?.id) return

    setActionLoading(true)
    try {
      const result = await approveProduct(
        product.id,
        session.user.id,
        reason || 'Approuvé par admin'
      )
      if (result.success) {
        // Rafraîchir les données
        await fetchProduct()
        setReason('')
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
        // Rafraîchir les données
        await fetchProduct()
        setReason('')
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
        // Rafraîchir les données
        await fetchProduct()
        setReason('')
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

            {/* Informations générales */}
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='flex items-center'>
                    <MapPin className='h-4 w-4 text-gray-400 mr-2' />
                    <span className='text-sm'>{product.address}</span>
                  </div>
                  <div className='flex items-center'>
                    <Euro className='h-4 w-4 text-gray-400 mr-2' />
                    <span className='text-sm'>{product.basePrice}€ / nuit</span>
                  </div>
                  <div className='flex items-center'>
                    <Home className='h-4 w-4 text-gray-400 mr-2' />
                    <span className='text-sm'>{product.type.name}</span>
                  </div>
                  <div className='flex items-center'>
                    <Users className='h-4 w-4 text-gray-400 mr-2' />
                    <span className='text-sm'>
                      {Number(product.minPeople || 0)} - {Number(product.maxPeople || 0)} personnes
                    </span>
                  </div>
                  {product.room && (
                    <div className='flex items-center'>
                      <Bed className='h-4 w-4 text-gray-400 mr-2' />
                      <span className='text-sm'>{Number(product.room)} chambre(s)</span>
                    </div>
                  )}
                  {product.bathroom && (
                    <div className='flex items-center'>
                      <Bath className='h-4 w-4 text-gray-400 mr-2' />
                      <span className='text-sm'>{Number(product.bathroom)} salle(s) de bain</span>
                    </div>
                  )}
                  {product.sizeRoom && (
                    <div className='flex items-center'>
                      <Home className='h-4 w-4 text-gray-400 mr-2' />
                      <span className='text-sm'>{product.sizeRoom} m²</span>
                    </div>
                  )}
                  <div className='flex items-center'>
                    <CheckSquare className='h-4 w-4 text-gray-400 mr-2' />
                    <span className='text-sm'>
                      Acceptation {product.autoAccept ? 'automatique' : 'manuelle'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Conditions de location */}
            <Card>
              <CardHeader>
                <CardTitle>Conditions de location</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='grid grid-cols-2 gap-4 text-sm'>
                  {product.minRent && (
                    <div>
                      <span className='font-medium'>Durée min :</span> {Number(product.minRent)}{' '}
                      jour(s)
                    </div>
                  )}
                  {product.maxRent && (
                    <div>
                      <span className='font-medium'>Durée max :</span> {Number(product.maxRent)}{' '}
                      jour(s)
                    </div>
                  )}
                  {product.advanceRent && (
                    <div>
                      <span className='font-medium'>Préavis :</span> {Number(product.advanceRent)}{' '}
                      jour(s)
                    </div>
                  )}
                  <div>
                    <span className='font-medium'>Commission :</span> {product.commission}%
                  </div>
                  <div>
                    <span className='font-medium'>Certifié :</span>{' '}
                    {product.certified ? 'Oui' : 'Non'}
                  </div>
                  <div>
                    <span className='font-medium'>Contrat :</span>{' '}
                    {product.contract ? 'Oui' : 'Non'}
                  </div>
                </div>
                <div className='pt-2 border-t'>
                  <span className='font-medium text-sm'>Téléphone de contact :</span>
                  <p className='text-sm text-gray-600'>{product.phone}</p>
                </div>
              </CardContent>
            </Card>

            {/* Équipements */}
            {product.equipments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Équipements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-2 gap-3'>
                    {product.equipments.map(equipment => (
                      <div key={equipment.id} className='flex items-center text-sm'>
                        <CheckCircle className='h-4 w-4 text-green-500 mr-2' />
                        <span>{equipment.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Services */}
            {product.servicesList.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-1 gap-2'>
                    {product.servicesList.map(service => (
                      <div key={service.id} className='flex items-center text-sm'>
                        <CheckCircle className='h-4 w-4 text-blue-500 mr-2' />
                        <span>{service.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Repas */}
            {product.mealsList.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Options de repas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-1 gap-2'>
                    {product.mealsList.map(meal => (
                      <div key={meal.id} className='flex items-center text-sm'>
                        <Utensils className='h-4 w-4 text-orange-500 mr-2' />
                        <span>{meal.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sécurité */}
            {product.securities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Mesures de sécurité</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-1 gap-2'>
                    {product.securities.map(security => (
                      <div key={security.id} className='flex items-center text-sm'>
                        <Shield className='h-4 w-4 text-red-500 mr-2' />
                        <span>{security.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Types de chambres */}
            {product.typeRoom.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Types de chambres</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {product.typeRoom.map(room => (
                      <div key={room.id} className='border-l-4 border-blue-500 pl-3'>
                        <h4 className='font-medium text-sm'>{room.name}</h4>
                        <p className='text-xs text-gray-600'>{room.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Règles de la maison */}
            {product.rules.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Règles de la maison</CardTitle>
                </CardHeader>
                <CardContent>
                  {product.rules.map(rule => (
                    <div key={rule.id} className='space-y-3'>
                      <div className='grid grid-cols-2 gap-4 text-sm'>
                        <div className='flex items-center'>
                          <span className='font-medium mr-2'>Fumeur :</span>
                          {rule.smokingAllowed ? (
                            <CheckCircle className='h-4 w-4 text-green-500' />
                          ) : (
                            <X className='h-4 w-4 text-red-500' />
                          )}
                        </div>
                        <div className='flex items-center'>
                          <span className='font-medium mr-2'>Animaux :</span>
                          {rule.petsAllowed ? (
                            <CheckCircle className='h-4 w-4 text-green-500' />
                          ) : (
                            <X className='h-4 w-4 text-red-500' />
                          )}
                        </div>
                        <div className='flex items-center'>
                          <span className='font-medium mr-2'>Événements :</span>
                          {rule.eventsAllowed ? (
                            <CheckCircle className='h-4 w-4 text-green-500' />
                          ) : (
                            <X className='h-4 w-4 text-red-500' />
                          )}
                        </div>
                        <div className='flex items-center'>
                          <span className='font-medium mr-2'>Check-in auto :</span>
                          {rule.selfCheckIn ? (
                            <CheckCircle className='h-4 w-4 text-green-500' />
                          ) : (
                            <X className='h-4 w-4 text-red-500' />
                          )}
                        </div>
                      </div>
                      <div className='grid grid-cols-2 gap-4 text-sm pt-2 border-t'>
                        <div>
                          <span className='font-medium'>Check-in :</span> {rule.checkInTime}
                        </div>
                        <div>
                          <span className='font-medium'>Check-out :</span> {rule.checkOutTime}
                        </div>
                        {rule.selfCheckInType && (
                          <div className='col-span-2'>
                            <span className='font-medium'>Type check-in auto :</span>{' '}
                            {rule.selfCheckInType}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Lieux à proximité */}
            {product.nearbyPlaces.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Lieux à proximité</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {product.nearbyPlaces.map(place => (
                      <div key={place.id} className='flex justify-between items-center text-sm'>
                        <div>
                          <span className='font-medium'>{place.name}</span>
                          <p className='text-xs text-gray-600'>{place.transport}</p>
                        </div>
                        <div className='text-right'>
                          <div>{place.distance}m</div>
                          <div className='text-xs text-gray-600'>{place.duration} min</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Options de transport */}
            {product.transportOptions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Options de transport</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-2'>
                    {product.transportOptions.map(transport => (
                      <div key={transport.id}>
                        <div className='flex items-center text-sm'>
                          <Car className='h-4 w-4 text-blue-500 mr-2' />
                          <span className='font-medium'>{transport.name}</span>
                        </div>
                        {transport.description && (
                          <p className='text-xs text-gray-600 ml-6'>{transport.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Informations sur la propriété */}
            {product.propertyInfo && (
              <Card>
                <CardHeader>
                  <CardTitle>Accessibilité et informations supplémentaires</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-2'>
                    <div className='grid grid-cols-2 gap-3 text-sm'>
                      <div className='flex items-center'>
                        <span className='font-medium mr-2'>Escaliers :</span>
                        {product.propertyInfo.hasStairs ? (
                          <CheckCircle className='h-4 w-4 text-yellow-500' />
                        ) : (
                          <X className='h-4 w-4 text-green-500' />
                        )}
                      </div>
                      <div className='flex items-center'>
                        <span className='font-medium mr-2'>Ascenseur :</span>
                        {product.propertyInfo.hasElevator ? (
                          <CheckCircle className='h-4 w-4 text-green-500' />
                        ) : (
                          <X className='h-4 w-4 text-red-500' />
                        )}
                      </div>
                      <div className='flex items-center'>
                        <span className='font-medium mr-2'>Accès handicapé :</span>
                        {product.propertyInfo.hasHandicapAccess ? (
                          <CheckCircle className='h-4 w-4 text-green-500' />
                        ) : (
                          <X className='h-4 w-4 text-red-500' />
                        )}
                      </div>
                      <div className='flex items-center'>
                        <span className='font-medium mr-2'>Animaux sur place :</span>
                        {product.propertyInfo.hasPetsOnProperty ? (
                          <CheckCircle className='h-4 w-4 text-yellow-500' />
                        ) : (
                          <X className='h-4 w-4 text-green-500' />
                        )}
                      </div>
                    </div>
                    {product.propertyInfo.additionalNotes && (
                      <div className='pt-3 border-t'>
                        <span className='font-medium text-sm'>Notes supplémentaires :</span>
                        <p className='text-sm text-gray-600 mt-1'>
                          {product.propertyInfo.additionalNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
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

        {/* Historique des validations */}
        <motion.div
          className='mt-8'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <ValidationHistoryCard history={validationHistory} />
        </motion.div>
      </motion.div>
    </div>
  )
}
