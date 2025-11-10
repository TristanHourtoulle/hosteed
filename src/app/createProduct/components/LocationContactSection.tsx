'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin } from 'lucide-react'
import AddressAutocomplete from '@/components/ui/AddressAutocomplete'
import PhoneInput from '@/components/ui/PhoneInput'
import ProximityLandmarksField from '@/components/ui/ProximityLandmarksField'
import type { FormData } from '../types'

interface LocationContactSectionProps {
  formData: FormData
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
  itemVariants: {
    hidden: { opacity: number; y: number }
    visible: { opacity: number; y: number; transition: { duration: number } }
  }
}

export default function LocationContactSection({
  formData,
  setFormData,
  itemVariants,
}: LocationContactSectionProps) {
  return (
    <motion.div variants={itemVariants} className='relative z-50'>
      <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm relative z-50'>
        <CardHeader className='space-y-2'>
          <div className='flex items-center gap-2'>
            <div className='p-2 bg-green-50 rounded-lg'>
              <MapPin className='h-5 w-5 text-green-600' />
            </div>
            <div>
              <CardTitle className='text-xl'>Localisation et Contact</CardTitle>
              <p className='text-slate-600 text-sm mt-1'>
                Où se trouve votre hébergement et comment vous joindre
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-2'>
              <label htmlFor='address' className='text-sm font-medium text-slate-700'>
                Localisation <span className='text-red-500'>*</span>
              </label>
              <p className='text-xs text-slate-500 mb-1'>
                Localisation visible sur l&apos;annonce (Google Maps)
              </p>
              <AddressAutocomplete
                value={formData.address}
                onChange={value => setFormData(prev => ({ ...prev, address: value }))}
                placeholder='Ex: Antananarivo, Madagascar'
                className='border-slate-200 focus:border-green-300 focus:ring-green-200'
                countryFilter='MG'
                onAddressSelect={(address, placeId) => {
                  setFormData(prev => ({
                    ...prev,
                    address: address,
                    placeId: placeId || '',
                  }))
                }}
              />
            </div>

            <div className='space-y-2'>
              <label htmlFor='phone' className='text-sm font-medium text-slate-700'>
                Téléphone de contact <span className='text-red-500'>*</span>
              </label>
              <p className='text-xs text-slate-500 mb-1'>
                Visible uniquement dans le mail de confirmation
              </p>
              <PhoneInput
                value={formData.phone}
                defaultCountry={formData.phoneCountry}
                onChange={(phoneNumber, countryCode) => {
                  setFormData(prev => ({
                    ...prev,
                    phone: phoneNumber,
                    phoneCountry: countryCode,
                  }))
                }}
                placeholder='XX XX XX XX'
                required
                className='border-slate-200 focus:border-green-300 focus:ring-green-200'
              />
            </div>
          </div>

          <div className='space-y-2'>
            <label htmlFor='completeAddress' className='text-sm font-medium text-slate-700'>
              Adresse complète ou lien Google Maps
            </label>
            <p className='text-xs text-slate-500 mb-1'>
              Adresse détaillée visible uniquement dans le mail de confirmation. Permet aux clients
              de localiser précisément votre établissement.
            </p>
            <textarea
              id='completeAddress'
              name='completeAddress'
              value={formData.completeAddress}
              onChange={e => setFormData(prev => ({ ...prev, completeAddress: e.target.value }))}
              placeholder='Ex : Lot AEN 2Ter Bis Analamahitsy, Antananarivo 101 - Près de la Station Total, à côté de la Pharmacie Soa'
              className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-300 min-h-[80px] resize-y'
              rows={3}
            />
          </div>

          <ProximityLandmarksField
            landmarks={formData.proximityLandmarks}
            onChange={landmarks =>
              setFormData(prev => ({ ...prev, proximityLandmarks: landmarks }))
            }
          />
        </CardContent>
      </Card>
    </motion.div>
  )
}
