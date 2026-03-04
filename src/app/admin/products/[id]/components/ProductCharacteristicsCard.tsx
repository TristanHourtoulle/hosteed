'use client'

import { motion, Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { Badge } from '@/components/ui/shadcnui/badge'
import { Settings, Check, X } from 'lucide-react'
import type { AdminProductWithRelations } from '../types'

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

interface ProductCharacteristicsCardProps {
  product: AdminProductWithRelations
}

/** Product characteristics: type, rooms, capacity, times, flags. */
export function ProductCharacteristicsCard({ product }: ProductCharacteristicsCardProps) {
  const booleanField = (label: string, value: boolean) => (
    <div className='flex items-center gap-2'>
      {value ? (
        <Check className='h-4 w-4 text-green-600' />
      ) : (
        <X className='h-4 w-4 text-gray-300' />
      )}
      <span className='text-sm text-gray-700'>{label}</span>
    </div>
  )

  return (
    <motion.div initial='hidden' animate='visible' variants={fadeIn}>
      <Card className='border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl py-0 gap-0'>
        <div className='px-6 py-4 border-b border-gray-100'>
          <h2 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
            <Settings className='h-5 w-5 text-blue-600' />
            Caractéristiques
          </h2>
        </div>
        <CardContent className='p-6 space-y-5'>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div>
              <p className='text-xs text-gray-500 uppercase tracking-wide'>Type</p>
              <p className='font-medium text-gray-800'>{product.type?.name || 'N/A'}</p>
            </div>
            <div>
              <p className='text-xs text-gray-500 uppercase tracking-wide'>Chambres</p>
              <p className='font-medium text-gray-800'>{product.room ? Number(product.room) : 'N/A'}</p>
            </div>
            <div>
              <p className='text-xs text-gray-500 uppercase tracking-wide'>Salles de bain</p>
              <p className='font-medium text-gray-800'>{product.bathroom ? Number(product.bathroom) : 'N/A'}</p>
            </div>
            <div>
              <p className='text-xs text-gray-500 uppercase tracking-wide'>Surface</p>
              <p className='font-medium text-gray-800'>
                {product.surface ? `${Number(product.surface)} m²` : 'N/A'}
              </p>
            </div>
          </div>

          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div>
              <p className='text-xs text-gray-500 uppercase tracking-wide'>Check-in</p>
              <p className='font-medium text-gray-800'>{product.arriving}h</p>
            </div>
            <div>
              <p className='text-xs text-gray-500 uppercase tracking-wide'>Check-out</p>
              <p className='font-medium text-gray-800'>{product.leaving}h</p>
            </div>
            <div>
              <p className='text-xs text-gray-500 uppercase tracking-wide'>Min. personnes</p>
              <p className='font-medium text-gray-800'>
                {product.minPeople ? Number(product.minPeople) : 'N/A'}
              </p>
            </div>
            <div>
              <p className='text-xs text-gray-500 uppercase tracking-wide'>Max. personnes</p>
              <p className='font-medium text-gray-800'>
                {product.maxPeople ? Number(product.maxPeople) : 'N/A'}
              </p>
            </div>
          </div>

          <div className='border-t border-gray-100 pt-4 grid grid-cols-2 md:grid-cols-3 gap-3'>
            {booleanField('Acceptation auto', product.autoAccept)}
            {booleanField('Accessible PMR', product.accessibility)}
            {booleanField('Animaux acceptés', product.petFriendly)}
            {booleanField('Certifié', product.certified)}
            {booleanField('Contrat', product.contract)}
          </div>

          {/* Hotel-specific fields */}
          {product.hotel && product.hotel.length > 0 && (
            <div className='border-t border-gray-100 pt-4'>
              <Badge variant='secondary' className='mb-3'>Hôtel</Badge>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-xs text-gray-500 uppercase tracking-wide'>Nom de l&apos;hôtel</p>
                  <p className='font-medium text-gray-800'>{product.hotel[0].name}</p>
                </div>
                {product.availableRooms && (
                  <div>
                    <p className='text-xs text-gray-500 uppercase tracking-wide'>Chambres disponibles</p>
                    <p className='font-medium text-gray-800'>{product.availableRooms}</p>
                  </div>
                )}
                {product.sizeRoom && (
                  <div>
                    <p className='text-xs text-gray-500 uppercase tracking-wide'>Taille chambre</p>
                    <p className='font-medium text-gray-800'>{product.sizeRoom} m²</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
