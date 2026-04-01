'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { MapPin, X } from 'lucide-react'
import CityAutocomplete from '@/components/ui/CityAutocomplete'
import PhoneInput from '@/components/ui/PhoneInput'
import ProximityLandmarksField from '@/components/ui/ProximityLandmarksField'
import type { FormData, NearbyPlace } from '../types'

interface LocationContactSectionProps {
  formData: FormData
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
  itemVariants: {
    hidden: { opacity: number; y: number }
    visible: { opacity: number; y: number; transition: { duration: number } }
  }
  hasFieldError?: (field: string) => boolean
  getFieldError?: (field: string) => string | undefined
}

const EMPTY_NEW_PLACE: NearbyPlace = { name: '', distance: '', unit: 'mètres' }

export default function LocationContactSection({
  formData,
  setFormData,
  itemVariants,
  hasFieldError,
  getFieldError,
}: LocationContactSectionProps) {
  const [newPlace, setNewPlace] = useState<NearbyPlace>(EMPTY_NEW_PLACE)

  const addNearbyPlace = () => {
    if (!newPlace.name || !newPlace.distance) return
    setFormData(prev => ({
      ...prev,
      nearbyPlaces: [...prev.nearbyPlaces, newPlace],
    }))
    setNewPlace(EMPTY_NEW_PLACE)
  }

  const removeNearbyPlace = (index: number) => {
    setFormData(prev => ({
      ...prev,
      nearbyPlaces: prev.nearbyPlaces.filter((_, i) => i !== index),
    }))
  }

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
              <label htmlFor='address' className={`text-sm font-medium ${hasFieldError?.('address') ? 'text-red-600' : 'text-slate-700'}`}>
                Localisation <span className='text-red-500'>*</span>
              </label>
              <p className='text-xs text-slate-500 mb-1'>
                Localisation visible sur l&apos;annonce (Google Maps)
              </p>
              <div className={`relative w-full px-3 py-2 border rounded-lg focus-within:outline-none focus-within:ring-2 bg-white ${hasFieldError?.('address') ? 'border-red-300 focus-within:ring-red-200 focus-within:border-red-400' : 'border-slate-200 focus-within:ring-green-200 focus-within:border-green-300'}`}>
                <CityAutocomplete
                  defaultValue={formData.address}
                  onCitySelect={(city, coordinates) => {
                    setFormData(prev => ({
                      ...prev,
                      address: city.description,
                      placeId: city.place_id,
                      latitude: coordinates?.lat || 0,
                      longitude: coordinates?.lng || 0,
                    }))
                  }}
                  onInputChange={value => {
                    setFormData(prev => ({
                      ...prev,
                      address: value,
                      // Réinitialiser les coords si l'utilisateur tape manuellement
                      latitude: 0,
                      longitude: 0,
                      placeId: '',
                    }))
                  }}
                  placeholder='Ex: Antananarivo, Madagascar'
                  countryFilter='MG'
                  allowFreeInput={true}
                  types={['geocode']}
                  className=''
                />
              </div>
              {getFieldError?.('address') && (
                <p className='text-xs text-red-500'>{getFieldError('address')}</p>
              )}
              {formData.latitude !== 0 && formData.longitude !== 0 && (
                <p className='text-xs text-green-600 mt-1 flex items-center gap-1'>
                  <svg
                    className='w-3 h-3'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                      clipRule='evenodd'
                    />
                  </svg>
                  Coordonnées GPS: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <label htmlFor='phone' className={`text-sm font-medium ${hasFieldError?.('phone') ? 'text-red-600' : 'text-slate-700'}`}>
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
                className={hasFieldError?.('phone') ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-slate-200 focus:border-green-300 focus:ring-green-200'}
              />
              {getFieldError?.('phone') && (
                <p className='text-xs text-red-500'>{getFieldError('phone')}</p>
              )}
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

          <div className='space-y-4'>
            <label className='text-sm font-medium text-slate-700'>Lieux à proximité</label>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-lg'>
              <Input
                placeholder='Nom du lieu'
                value={newPlace.name}
                onChange={e => setNewPlace(prev => ({ ...prev, name: e.target.value }))}
                className='border-slate-200'
              />
              <Input
                placeholder='Distance'
                value={newPlace.distance}
                onChange={e => setNewPlace(prev => ({ ...prev, distance: e.target.value }))}
                className='border-slate-200'
              />
              <select
                value={newPlace.unit}
                onChange={e =>
                  setNewPlace(prev => ({
                    ...prev,
                    unit: e.target.value as NearbyPlace['unit'],
                  }))
                }
                className='border border-slate-200 rounded-md px-3 py-2 text-sm'
              >
                <option value='mètres'>mètres</option>
                <option value='kilomètres'>kilomètres</option>
                <option value='minutes à pied'>minutes à pied</option>
              </select>
              <button
                type='button'
                onClick={addNearbyPlace}
                className='px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm'
              >
                Ajouter
              </button>
            </div>

            {formData.nearbyPlaces.length > 0 && (
              <div className='space-y-2'>
                {formData.nearbyPlaces.map((place, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200'
                  >
                    <span className='text-sm'>
                      <strong>{place.name}</strong> — {place.distance} {place.unit}
                    </span>
                    <button
                      type='button'
                      onClick={() => removeNearbyPlace(index)}
                      className='text-red-500 hover:text-red-700 p-1'
                    >
                      <X className='h-4 w-4' />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
