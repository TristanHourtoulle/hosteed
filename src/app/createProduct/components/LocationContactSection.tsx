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
                Adresse complète
              </label>
              <AddressAutocomplete
                value={formData.address}
                onChange={value => setFormData(prev => ({ ...prev, address: value }))}
                placeholder='Numéro, rue, code postal, ville'
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
                Téléphone de contact
              </label>
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
