'use client'

import { motion, Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { Badge } from '@/components/ui/shadcnui/badge'
import { MapPin, Check, X, Navigation } from 'lucide-react'
import type { AdminProductWithRelations } from '../types'

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

interface ProductLocationCardProps {
  product: AdminProductWithRelations
}

/** Location details: coordinates, landmarks, nearby places, transport, property info. */
export function ProductLocationCard({ product }: ProductLocationCardProps) {
  const hasNearby = product.nearbyPlaces.length > 0
  const hasTransport = product.transportOptions.length > 0
  const hasLandmarks = product.proximityLandmarks.length > 0
  const hasPropertyInfo = product.propertyInfo !== null

  if (!hasNearby && !hasTransport && !hasLandmarks && !hasPropertyInfo) return null

  return (
    <motion.div initial='hidden' animate='visible' variants={fadeIn}>
      <Card className='border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl py-0 gap-0'>
        <div className='px-6 py-4 border-b border-gray-100'>
          <h2 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
            <MapPin className='h-5 w-5 text-blue-600' />
            Localisation et accès
          </h2>
        </div>
        <CardContent className='p-6 space-y-5'>
          {/* Coordinates */}
          <div className='flex gap-4 text-sm'>
            <div>
              <p className='text-xs text-gray-500'>Latitude</p>
              <p className='font-mono text-gray-800'>{product.latitude}</p>
            </div>
            <div>
              <p className='text-xs text-gray-500'>Longitude</p>
              <p className='font-mono text-gray-800'>{product.longitude}</p>
            </div>
          </div>

          {/* Proximity Landmarks */}
          {hasLandmarks && (
            <div>
              <p className='text-xs text-gray-500 uppercase tracking-wide mb-2'>
                Points de repère ({product.proximityLandmarks.length})
              </p>
              <div className='flex flex-wrap gap-2'>
                {product.proximityLandmarks.map((landmark, i) => (
                  <Badge key={i} variant='outline'>
                    {landmark}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Nearby Places */}
          {hasNearby && (
            <div>
              <p className='text-xs text-gray-500 uppercase tracking-wide mb-2'>
                Lieux à proximité ({product.nearbyPlaces.length})
              </p>
              <div className='space-y-2'>
                {product.nearbyPlaces.map(place => (
                  <div
                    key={place.id}
                    className='flex items-center justify-between p-2 rounded-lg bg-gray-50 text-sm'
                  >
                    <span className='font-medium text-gray-800'>{place.name}</span>
                    <div className='flex items-center gap-3 text-gray-500'>
                      <span>{place.distance}m</span>
                      <span>{place.duration} min</span>
                      <Badge variant='secondary' className='text-xs'>
                        {place.transport}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transport Options */}
          {hasTransport && (
            <div>
              <p className='text-xs text-gray-500 uppercase tracking-wide mb-2'>
                <Navigation className='h-3.5 w-3.5 inline mr-1' />
                Options de transport ({product.transportOptions.length})
              </p>
              <div className='space-y-1'>
                {product.transportOptions.map(option => (
                  <div key={option.id} className='text-sm'>
                    <span className='font-medium text-gray-800'>{option.name}</span>
                    {option.description && (
                      <span className='text-gray-500'> — {option.description}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Property Info */}
          {hasPropertyInfo && product.propertyInfo && (
            <div className='border-t border-gray-100 pt-4'>
              <p className='text-xs text-gray-500 uppercase tracking-wide mb-2'>
                Informations sur la propriété
              </p>
              <div className='grid grid-cols-2 gap-2'>
                {[
                  { label: 'Escaliers', value: product.propertyInfo.hasStairs },
                  { label: 'Ascenseur', value: product.propertyInfo.hasElevator },
                  { label: 'Accès handicapé', value: product.propertyInfo.hasHandicapAccess },
                  { label: 'Animaux sur place', value: product.propertyInfo.hasPetsOnProperty },
                ].map(item => (
                  <div key={item.label} className='flex items-center gap-2 text-sm'>
                    {item.value ? (
                      <Check className='h-4 w-4 text-green-600' />
                    ) : (
                      <X className='h-4 w-4 text-gray-300' />
                    )}
                    <span className='text-gray-700'>{item.label}</span>
                  </div>
                ))}
              </div>
              {product.propertyInfo.additionalNotes && (
                <p className='text-sm text-gray-600 mt-2'>
                  {product.propertyInfo.additionalNotes}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
