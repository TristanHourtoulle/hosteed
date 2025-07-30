'use client'

import { useState } from 'react'

interface RejectModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string, message: string) => Promise<void>
  isLoading: boolean
}

export default function RejectReservationModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: RejectModalProps) {
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async () => {
    if (!reason.trim() || !message.trim()) return

    try {
      await onConfirm(reason, message)
      setReason('')
      setMessage('')
    } catch (error) {
      console.error('Erreur lors du refus:', error)
    }
  }

  const handleClose = () => {
    setReason('')
    setMessage('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 w-full max-w-md'>
        <h2 className='text-xl font-bold mb-4 text-red-600'>Refuser la réservation</h2>
        <p className='text-gray-600 mb-4'>
          Veuillez indiquer la raison du refus. Les administrateurs seront automatiquement notifiés.
        </p>
        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Raison du refus *
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className='w-full p-2 border border-gray-300 rounded-md'
              required
            >
              <option value=''>Sélectionnez une raison</option>
              <option value='dates_indisponibles'>Dates non disponibles</option>
              <option value='maintenance'>Maintenance en cours</option>
              <option value='reservation_existante'>Réservation existante</option>
              <option value='probleme_technique'>Problème technique</option>
              <option value='non_conforme'>Demande non conforme</option>
              <option value='autre'>Autre</option>
            </select>
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Message détaillé *
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              className='w-full p-2 border border-gray-300 rounded-md'
              placeholder='Expliquez en détail pourquoi vous refusez cette réservation...'
              required
            />
            <p className='text-xs text-gray-500 mt-1'>
              Ce message sera envoyé aux administrateurs pour review.
            </p>
          </div>
        </div>
        <div className='flex justify-end gap-2 mt-6'>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className='px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50'
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !reason.trim() || !message.trim()}
            className='px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50'
          >
            {isLoading ? 'Refus en cours...' : 'Confirmer le refus'}
          </button>
        </div>
      </div>
    </div>
  )
}
