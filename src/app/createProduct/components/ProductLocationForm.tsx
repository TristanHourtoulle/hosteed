'use client'

import { motion, Variants } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { MapPin, X } from 'lucide-react'
import AddressAutocomplete from '@/components/ui/AddressAutocomplete'
import PhoneInput from '@/components/ui/PhoneInput'
import ProximityLandmarksField from '@/components/ui/ProximityLandmarksField'
import { LocationComponents } from '@/lib/services/location.service'

interface FormData {
  address: string
  // Nouveaux champs de localisation structurés
  neighborhood: string | null
  city: string | null
  region: string | null
  country: string
  googlePlaceId: string | null
  latitude: number
  longitude: number
  phoneNumber: string
  proximityLandmarks: string[]
  nearbyPlaces: Array<{
    name: string
    distance: string
    unit: 'mètres' | 'kilomètres' | 'minutes à pied'
  }>
}

interface ProductLocationFormProps {
  formData: FormData
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
  newPlace: {
    name: string
    distance: string
    unit: 'mètres' | 'kilomètres' | 'minutes à pied'
  }
  setNewPlace: React.Dispatch<
    React.SetStateAction<{
      name: string
      distance: string
      unit: 'mètres' | 'kilomètres' | 'minutes à pied'
    }>
  >
  addNearbyPlace: () => void
  removeNearbyPlace: (index: number) => void
  itemVariants: Variants
}

export default function ProductLocationForm({
  formData,
  onInputChange,
  setFormData,
  newPlace,
  setNewPlace,
  addNearbyPlace,
  removeNearbyPlace,
  itemVariants,
}: ProductLocationFormProps) {
  return (
    <motion.div variants={itemVariants}>
      <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm relative z-50'>
        <CardHeader className='space-y-2'>
          <div className='flex items-center gap-2'>
            <div className='p-2 bg-green-50 rounded-lg'>
              <MapPin className='h-5 w-5 text-green-600' />
            </div>
            <div>
              <CardTitle className='text-xl'>Localisation et Contact</CardTitle>
              <p className='text-slate-600 text-sm mt-1'>
                Où se trouve votre hébergement et comment vous contacter
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='space-y-2'>
            <label htmlFor='address' className='text-sm font-medium text-slate-700'>
              Adresse complète *
            </label>
            <AddressAutocomplete
              placeholder='Commencez à taper votre adresse...'
              value={formData.address}
              onChange={value => {
                const event = {
                  target: {
                    name: 'address',
                    value: value,
                  },
                } as React.ChangeEvent<HTMLInputElement>
                onInputChange(event)
              }}
              onLocationSelect={(components: LocationComponents) => {
                // Mettre à jour tous les champs de localisation en une fois
                setFormData(prev => ({
                  ...prev,
                  address: components.formattedAddress,
                  neighborhood: components.neighborhood,
                  city: components.city,
                  region: components.region,
                  country: components.country,
                  googlePlaceId: components.googlePlaceId,
                  latitude: components.coordinates?.latitude || prev.latitude,
                  longitude: components.coordinates?.longitude || prev.longitude,
                }))
              }}
              allowFreeInput={true}
              className='border-slate-200 focus:border-green-300 focus:ring-green-200'
            />
            {(formData.latitude !== 0 && formData.longitude !== 0) && (
              <p className='text-xs text-green-600 mt-1'>
                ✓ Coordonnées GPS: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
              </p>
            )}
            {/* Affichage des composants de localisation extraits */}
            {(formData.neighborhood || formData.city) && (
              <div className='text-xs text-slate-500 mt-1 space-y-0.5'>
                {formData.neighborhood && <p>Quartier: {formData.neighborhood}</p>}
                {formData.city && <p>Ville: {formData.city}</p>}
                {formData.country && <p>Pays: {formData.country}</p>}
              </div>
            )}
          </div>

          <ProximityLandmarksField
            landmarks={formData.proximityLandmarks}
            onChange={landmarks =>
              setFormData(prev => ({ ...prev, proximityLandmarks: landmarks }))
            }
          />

          <div className='space-y-2'>
            <label htmlFor='phoneNumber' className='text-sm font-medium text-slate-700'>
              Numéro de téléphone
            </label>
            <PhoneInput
              value={formData.phoneNumber}
              onChange={value => {
                const event = {
                  target: {
                    name: 'phoneNumber',
                    value: value || '',
                  },
                } as React.ChangeEvent<HTMLInputElement>
                onInputChange(event)
              }}
              placeholder='Votre numéro de téléphone'
              className='border-slate-200 focus:border-green-300 focus:ring-green-200'
            />
          </div>

          <div className='space-y-4'>
            <label className='text-sm font-medium text-slate-700'>Lieux à proximité</label>

            {/* Form to add new place */}
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
                    unit: e.target.value as 'mètres' | 'kilomètres' | 'minutes à pied',
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

            {/* List of added places */}
            {formData.nearbyPlaces.length > 0 && (
              <div className='space-y-2'>
                {formData.nearbyPlaces.map((place, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200'
                  >
                    <span className='text-sm'>
                      <strong>{place.name}</strong> - {place.distance} {place.unit}
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
