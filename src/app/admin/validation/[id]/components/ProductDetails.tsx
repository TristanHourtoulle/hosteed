'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  MapPin,
  Euro,
  Home,
  Users,
  Bath,
  Bed,
  Utensils,
  Shield,
  CheckSquare,
  Building,
  User,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  Award,
} from 'lucide-react'
import ImageGallery from './ImageGallery'
import { ExtraPriceType } from '@prisma/client'

interface Product {
  id: string
  name: string
  description: string
  address: string
  basePrice: string
  priceMGA?: string
  availableRooms?: number
  guest: number
  bedroom: number
  bed: number
  bathroom: number
  arriving: number
  leaving: number
  img?: { img: string }[]
  user: {
    id: string
    name?: string | null
    lastname?: string | null
    email: string
    image?: string | null
    profilePicture?: string | null
    profilePictureBase64?: string | null
  }[]
  type?: { name: string; description: string }
  equipments?: { name: string; icon: string }[]
  mealsList?: { name: string }[]
  servicesList?: { name: string }[]
  securities?: { name: string }[]
  typeRoom?: { name: string; description: string }
  rules?: {
    smokingAllowed: boolean
    petsAllowed: boolean
    eventsAllowed: boolean
    checkInTime: string
    checkOutTime: string
    selfCheckIn: boolean
    selfCheckInType?: string
  }
  nearbyPlaces?: {
    name: string
    distance: string
    duration: string
    transport: string
  }[]
  transportOptions?: { name: string; description: string }[]
  propertyInfo?: {
    hasStairs: boolean
    hasElevator: boolean
    hasHandicapAccess: boolean
    hasPetsOnProperty: boolean
    additionalNotes?: string
  }
  includedServices?: { id: string; name: string; description: string | null; icon: string | null }[]
  extras?: { id: string; name: string; description: string | null; priceEUR: number; priceMGA: number; type: ExtraPriceType }[]
  highlights?: { id: string; name: string; description: string | null; icon: string | null }[]
  // Champs de certification
  isCertificated?: boolean
  certificationDate?: Date | null
  certificatedBy?: string | null
  certificatedRelation?: {
    id: string
    name?: string | null
    lastname?: string | null
    email: string
  } | null
}

interface ProductDetailsProps {
  product: Product
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [, setShowAllPhotos] = useState(false)
  const [showFullscreen, setShowFullscreen] = useState(false)

  const nextImage = () => {
    if (product.img && product.img.length > 0) {
      setCurrentImageIndex(prev => (prev + 1) % product.img!.length)
    }
  }

  const prevImage = () => {
    if (product.img && product.img.length > 0) {
      setCurrentImageIndex(prev => (prev - 1 + product.img!.length) % product.img!.length)
    }
  }

  return (
    <div className='lg:col-span-2 space-y-6'>
      {/* Images */}
      {product.img && product.img.length > 0 && (
        <ImageGallery
          images={product.img}
          productName={product.name}
          currentImageIndex={currentImageIndex}
          nextImage={nextImage}
          prevImage={prevImage}
          setShowAllPhotos={setShowAllPhotos}
          setShowFullscreen={setShowFullscreen}
          setCurrentImageIndex={setCurrentImageIndex}
        />
      )}

      {/* Modale Fullscreen */}
      {showFullscreen && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-lg transition-all animate-fadein'
          tabIndex={-1}
          onKeyDown={e => {
            if (e.key === 'Escape') setShowFullscreen(false)
            if (e.key === 'ArrowLeft') prevImage()
            if (e.key === 'ArrowRight') nextImage()
          }}
        >
          <div className='relative bg-white p-0 rounded-2xl shadow-2xl flex items-center justify-center max-w-4xl w-full max-h-[80vh] animate-popin'>
            {/* Close button */}
            <button
              onClick={() => setShowFullscreen(false)}
              className='absolute top-4 right-4 bg-white hover:bg-gray-100 rounded-full p-2 shadow-lg z-10'
              aria-label='Fermer'
            >
              <X className='h-6 w-6 text-gray-700' />
            </button>
            {/* Prev button */}
            <button
              onClick={e => {
                e.stopPropagation()
                prevImage()
              }}
              className='absolute left-2 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-100 rounded-full p-2 shadow-lg z-10'
              aria-label='Précédent'
            >
              <ChevronLeft className='h-6 w-6 text-gray-700' />
            </button>
            {/* Next button */}
            <button
              onClick={e => {
                e.stopPropagation()
                nextImage()
              }}
              className='absolute right-2 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-100 rounded-full p-2 shadow-lg z-10'
              aria-label='Suivant'
            >
              <ChevronRight className='h-6 w-6 text-gray-700' />
            </button>
            {/* Image */}
            <div className='relative max-h-[80vh] w-auto aspect-auto'>
              <Image
                src={product.img?.[currentImageIndex]?.img || '/placeholder.jpg'}
                alt={product.name}
                width={800}
                height={600}
                className='max-h-[80vh] w-auto object-contain rounded-2xl transition-all'
                draggable={false}
                unoptimized
              />
            </div>
          </div>
        </div>
      )}

      {/* Informations sur l'hôte */}
      {product.user && product.user.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center'>
              <User className='h-4 w-4 mr-2' />
              Informations sur l&apos;hôte
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            {product.user.map((host) => (
              <div key={host.id} className='flex items-start space-x-3'>
                {(host.image || host.profilePicture || host.profilePictureBase64) && (
                  <Image
                    src={host.image || host.profilePicture || host.profilePictureBase64 || ''}
                    alt={`Photo de ${host.name || host.email}`}
                    width={48}
                    height={48}
                    className='rounded-full object-cover'
                    unoptimized
                  />
                )}
                <div className='flex-1'>
                  <div className='flex items-center space-x-2'>
                    <span className='font-medium text-sm'>
                      {host.name || host.lastname ? 
                        `${host.name || ''} ${host.lastname || ''}`.trim() : 
                        'Nom non renseigné'
                      }
                    </span>
                  </div>
                  <p className='text-sm text-gray-600'>{host.email}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Informations principales */}
      <Card>
        <CardHeader>
          <CardTitle>Informations principales</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-start space-x-2'>
            <MapPin className='h-4 w-4 text-gray-400 mt-1 flex-shrink-0' />
            <span className='text-sm'>{product.address}</span>
          </div>

          <div className='flex items-center space-x-6'>
            <div className='flex items-center space-x-2'>
              <Euro className='h-4 w-4 text-gray-400' />
              <div className='flex flex-col space-y-1'>
                <span className='text-sm font-medium'>{product.basePrice}€ / nuit</span>
                {product.priceMGA && (
                  <span className='text-sm text-gray-600'>{product.priceMGA} Ariary / nuit</span>
                )}
              </div>
            </div>

            {product.availableRooms && (
              <div className='flex items-center'>
                <Building className='h-4 w-4 text-gray-400 mr-2' />
                <span className='text-sm'>{Number(product.availableRooms)} chambre(s) disponible(s) (Hôtel)</span>
              </div>
            )}
          </div>

          <div className='flex items-center space-x-6'>
            <div className='flex items-center space-x-2'>
              <Home className='h-4 w-4 text-gray-400' />
              <span className='text-sm'>{product.type?.name}</span>
            </div>
          </div>

          <div className='flex items-center space-x-6'>
            <div className='flex items-center space-x-2'>
              <Calendar className='h-4 w-4 text-gray-400' />
              <span className='text-sm'>Heure d&apos;arrivée: {product.arriving}h</span>
            </div>
            <div className='flex items-center space-x-2'>
              <Calendar className='h-4 w-4 text-gray-400' />
              <span className='text-sm'>Heure de départ: {product.leaving}h</span>
            </div>
          </div>

          <div className='flex flex-wrap gap-4'>
            <div className='flex items-center space-x-2'>
              <Users className='h-4 w-4 text-gray-400' />
              <span className='text-sm'>{product.guest} invité(s)</span>
            </div>
            <div className='flex items-center space-x-2'>
              <Bed className='h-4 w-4 text-gray-400' />
              <span className='text-sm'>{product.bedroom} chambre(s)</span>
            </div>
            <div className='flex items-center space-x-2'>
              <Bed className='h-4 w-4 text-gray-400' />
              <span className='text-sm'>{product.bed} lit(s)</span>
            </div>
            <div className='flex items-center space-x-2'>
              <Bath className='h-4 w-4 text-gray-400' />
              <span className='text-sm'>{product.bathroom} salle(s) de bain</span>
            </div>
          </div>

          <div>
            <h4 className='font-medium mb-2'>Description</h4>
            <p className='text-sm text-gray-600 leading-relaxed'>{product.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Équipements */}
      {product.equipments && product.equipments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Équipements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
              {product.equipments.map((equipment, index) => (
                <div key={index} className='flex items-center space-x-2'>
                  <span className='text-lg'>{equipment.icon}</span>
                  <span className='text-sm'>{equipment.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Services et repas */}
      {((product.mealsList && product.mealsList.length > 0) ||
        (product.servicesList && product.servicesList.length > 0)) && (
        <Card>
          <CardHeader>
            <CardTitle>Services et repas</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {product.mealsList && product.mealsList.length > 0 && (
              <div>
                <h4 className='font-medium mb-2 flex items-center'>
                  <Utensils className='h-4 w-4 mr-2' />
                  Repas disponibles
                </h4>
                <div className='flex flex-wrap gap-2'>
                  {product.mealsList.map((meal, index) => (
                    <Badge key={index} variant='outline'>
                      {meal.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {product.servicesList && product.servicesList.length > 0 && (
              <div>
                <h4 className='font-medium mb-2 flex items-center'>
                  <CheckSquare className='h-4 w-4 mr-2' />
                  Services disponibles
                </h4>
                <div className='flex flex-wrap gap-2'>
                  {product.servicesList.map((service, index) => (
                    <Badge key={index} variant='outline'>
                      {service.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sécurité */}
      {product.securities && product.securities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center'>
              <Shield className='h-4 w-4 mr-2' />
              Sécurité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex flex-wrap gap-2'>
              {product.securities.map((security, index) => (
                <Badge key={index} variant='outline' className='bg-green-50'>
                  {security.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Règles de la maison */}
      {product.rules && Object.keys(product.rules).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Règles de la maison</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='flex items-center justify-between'>
                <span className='text-sm'>Fumeur autorisé</span>
                <span className='text-sm font-medium'>
                  {product.rules.smokingAllowed ? 'Oui' : 'Non'}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm'>Animaux autorisés</span>
                <span className='text-sm font-medium'>
                  {product.rules.petsAllowed ? 'Oui' : 'Non'}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm'>Événements autorisés</span>
                <span className='text-sm font-medium'>
                  {product.rules.eventsAllowed ? 'Oui' : 'Non'}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm'>Arrivée autonome</span>
                <span className='text-sm font-medium'>
                  {product.rules.selfCheckIn ? 'Oui' : 'Non'}
                </span>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4 pt-3 border-t'>
              <div>
                <span className='text-sm font-medium'>Heure d&apos;arrivée :</span>
                <p className='text-sm text-gray-600'>{product.rules.checkInTime}</p>
              </div>
              <div>
                <span className='text-sm font-medium'>Heure de départ :</span>
                <p className='text-sm text-gray-600'>{product.rules.checkOutTime}</p>
              </div>
            </div>

            {product.rules.selfCheckIn && product.rules.selfCheckInType && (
              <div className='pt-3 border-t'>
                <span className='font-medium text-sm'>Type d&apos;arrivée autonome :</span>
                <p className='text-sm text-gray-600 mt-1'>{product.rules.selfCheckInType}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Informations sur la propriété */}
      {product.propertyInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Informations sur la propriété</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='flex items-center justify-between'>
                <span className='text-sm'>Escaliers</span>
                <span className='text-sm font-medium'>
                  {product.propertyInfo.hasStairs ? 'Oui' : 'Non'}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm'>Ascenseur</span>
                <span className='text-sm font-medium'>
                  {product.propertyInfo.hasElevator ? 'Oui' : 'Non'}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm'>Accès handicapé</span>
                <span className='text-sm font-medium'>
                  {product.propertyInfo.hasHandicapAccess ? 'Oui' : 'Non'}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm'>Animaux sur la propriété</span>
                <span className='text-sm font-medium'>
                  {product.propertyInfo.hasPetsOnProperty ? 'Oui' : 'Non'}
                </span>
              </div>
            </div>

            {product.propertyInfo.additionalNotes && (
              <div className='pt-3 border-t'>
                <span className='font-medium text-sm'>Notes supplémentaires :</span>
                <p className='text-sm text-gray-600 mt-1'>{product.propertyInfo.additionalNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Section Certification */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Award className='h-5 w-5' />
            Certification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium'>Statut de certification</span>
              <Badge variant={product.isCertificated ? 'default' : 'secondary'} className={product.isCertificated ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : ''}>
                {product.isCertificated ? (
                  <div className='flex items-center gap-1'>
                    <Award className='h-3 w-3' />
                    Certifiée
                  </div>
                ) : (
                  'Non certifiée'
                )}
              </Badge>
            </div>

            {product.isCertificated && (
              <>
                {product.certificationDate && (
                  <div className='flex items-center justify-between'>
                    <span className='text-sm'>Date de certification</span>
                    <span className='text-sm font-medium text-gray-900'>
                      {new Date(product.certificationDate).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}

                {product.certificatedRelation && (
                  <div className='flex items-center justify-between'>
                    <span className='text-sm'>Certifiée par</span>
                    <div className='flex items-center gap-2'>
                      <User className='h-4 w-4 text-gray-500' />
                      <span className='text-sm font-medium text-gray-900'>
                        {product.certificatedRelation.name && product.certificatedRelation.lastname
                          ? `${product.certificatedRelation.name} ${product.certificatedRelation.lastname}`
                          : product.certificatedRelation.email}
                      </span>
                    </div>
                  </div>
                )}

                <div className='mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
                  <div className='flex items-start gap-2'>
                    <Award className='h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0' />
                    <div>
                      <p className='text-sm font-medium text-yellow-800'>Annonce certifiée</p>
                      <p className='text-xs text-yellow-700 mt-1'>
                        Cette annonce bénéficie d'un badge de certification et est mise en avant dans les résultats de recherche.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {!product.isCertificated && (
              <div className='mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg'>
                <div className='flex items-start gap-2'>
                  <X className='h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0' />
                  <div>
                    <p className='text-sm font-medium text-gray-700'>Annonce non certifiée</p>
                    <p className='text-xs text-gray-600 mt-1'>
                      Cette annonce n'est pas encore certifiée par l'équipe d'administration.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}