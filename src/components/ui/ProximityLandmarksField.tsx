'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, X, MapPin } from 'lucide-react'

interface ProximityLandmarksFieldProps {
  landmarks: string[]
  onChange: (landmarks: string[]) => void
  disabled?: boolean
}

export function ProximityLandmarksField({
  landmarks,
  onChange,
  disabled = false,
}: ProximityLandmarksFieldProps) {
  const handleAddLandmark = () => {
    onChange([...landmarks, ''])
  }

  const handleRemoveLandmark = (index: number) => {
    const newLandmarks = landmarks.filter((_, i) => i !== index)
    onChange(newLandmarks)
  }

  const handleUpdateLandmark = (index: number, value: string) => {
    const newLandmarks = [...landmarks]
    newLandmarks[index] = value
    onChange(newLandmarks)
  }

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <div className='space-y-1'>
          <label className='text-sm font-medium text-slate-700'>Points de repère</label>
          <p className='text-xs text-slate-500'>
            Ajoutez des points de repère pour aider à localiser votre logement (ex: "À proximité de
            la plage", "Face au marché central")
          </p>
        </div>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={handleAddLandmark}
          disabled={disabled}
          className='flex items-center gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200'
        >
          <Plus className='h-4 w-4' />
          Ajouter
        </Button>
      </div>

      {landmarks.length === 0 ? (
        <div className='text-center py-8 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50'>
          <MapPin className='h-8 w-8 text-slate-400 mx-auto mb-2' />
          <p className='text-sm text-slate-500'>Aucun point de repère ajouté</p>
          <p className='text-xs text-slate-400 mt-1'>Cliquez sur "Ajouter" pour commencer</p>
        </div>
      ) : (
        <div className='space-y-2'>
          {landmarks.map((landmark, index) => (
            <div key={index} className='flex items-center gap-2'>
              <div className='flex-1 relative'>
                <MapPin className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400' />
                <Input
                  type='text'
                  value={landmark}
                  onChange={e => handleUpdateLandmark(index, e.target.value)}
                  placeholder={`Point de repère ${index + 1} (ex: "Près de la grande mosquée")`}
                  disabled={disabled}
                  className='pl-10 pr-10 border-slate-200 focus:border-green-300 focus:ring-green-200'
                />
              </div>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => handleRemoveLandmark(index)}
                disabled={disabled}
                className='text-red-500 hover:text-red-700 hover:bg-red-50'
              >
                <X className='h-4 w-4' />
              </Button>
            </div>
          ))}
        </div>
      )}

      {landmarks.length > 0 && (
        <div className='flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md'>
          <div className='flex-shrink-0 mt-0.5'>
            <svg className='h-4 w-4 text-blue-600' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                clipRule='evenodd'
              />
            </svg>
          </div>
          <div className='flex-1'>
            <p className='text-xs text-blue-800 font-medium'>Information importante</p>
            <p className='text-xs text-blue-700 mt-1'>
              Ces points de repère seront visibles uniquement par les clients ayant effectué une
              réservation et les administrateurs. Ils ne seront pas affichés sur la page publique de
              l'annonce.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProximityLandmarksField
