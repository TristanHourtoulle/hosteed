'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Star, Plus, Edit, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  createPromotedProduct,
  getPromotedProductByProductId,
  updatePromotedProduct,
  deletePromotedProduct,
} from '@/lib/services/promotedProduct.service'
import { useEffect } from 'react'

interface AdminPromoteButtonProps {
  productId: string
  productName: string
}

interface PromotedProduct {
  id: string
  active: boolean
  start: Date
  end: Date
  productId: string
}

export default function AdminPromoteButton({ productId, productName }: AdminPromoteButtonProps) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [existingPromotion, setExistingPromotion] = useState<PromotedProduct | null>(null)
  const [showPromoteForm, setShowPromoteForm] = useState(false)
  const [formData, setFormData] = useState({
    start: '',
    end: '',
    active: true,
  })

  // Check if user is admin
  const isAdmin = session?.user?.roles === 'ADMIN'

  // Check if product is already promoted
  useEffect(() => {
    const checkPromotionStatus = async () => {
      try {
        const promotion = await getPromotedProductByProductId(productId)
        setExistingPromotion(promotion)
        if (promotion) {
          setFormData({
            start: new Date(promotion.start).toISOString().slice(0, 16),
            end: new Date(promotion.end).toISOString().slice(0, 16),
            active: promotion.active,
          })
        }
      } catch (error) {
        console.error('Error checking promotion status:', error)
      }
    }

    if (isAdmin) {
      checkPromotionStatus()
    }
  }, [productId, isAdmin])

  if (!isAdmin) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (existingPromotion) {
        // Update existing promotion
        await updatePromotedProduct(
          existingPromotion.id,
          formData.active,
          new Date(formData.start),
          new Date(formData.end)
        )

        // Update local state
        setExistingPromotion({
          ...existingPromotion,
          active: formData.active,
          start: new Date(formData.start),
          end: new Date(formData.end),
        })

        alert('Promotion mise à jour avec succès !')
      } else {
        // Create new promotion
        const newPromotion = await createPromotedProduct(
          formData.active,
          new Date(formData.start),
          new Date(formData.end),
          productId
        )

        if (newPromotion) {
          setExistingPromotion(newPromotion)
        }

        alert('Produit promu avec succès !')
      }

      setShowPromoteForm(false)
    } catch (error) {
      console.error('Error with promotion:', error)
      alert('Erreur lors de la gestion de la promotion')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!existingPromotion) return

    if (!confirm('Êtes-vous sûr de vouloir supprimer cette promotion ?')) return

    setIsLoading(true)

    try {
      await deletePromotedProduct(existingPromotion.id)
      setExistingPromotion(null)
      setFormData({ start: '', end: '', active: true })
      setShowPromoteForm(false)
      alert('Promotion supprimée avec succès !')
    } catch (error) {
      console.error('Error deleting promotion:', error)
      alert('Erreur lors de la suppression de la promotion')
    } finally {
      setIsLoading(false)
    }
  }

  const isCurrentlyActive =
    existingPromotion &&
    existingPromotion.active &&
    new Date() >= new Date(existingPromotion.start) &&
    new Date() <= new Date(existingPromotion.end)

  return (
    <div className='fixed bottom-6 right-6 z-50'>
      <AnimatePresence>
        {showPromoteForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className='mb-4 bg-white rounded-lg shadow-lg border p-4 min-w-[300px]'
          >
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='font-semibold text-gray-900'>
                  {existingPromotion ? 'Modifier' : 'Promouvoir'} &quot;{productName}&quot;
                </h3>
                {existingPromotion && (
                  <button
                    type='button'
                    onClick={handleDelete}
                    className='text-red-600 hover:text-red-700 p-1'
                    title='Supprimer la promotion'
                  >
                    <Trash2 className='w-4 h-4' />
                  </button>
                )}
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Date de début
                </label>
                <input
                  type='datetime-local'
                  value={formData.start}
                  onChange={e => setFormData(prev => ({ ...prev, start: e.target.value }))}
                  className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Date de fin</label>
                <input
                  type='datetime-local'
                  value={formData.end}
                  onChange={e => setFormData(prev => ({ ...prev, end: e.target.value }))}
                  className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  required
                />
              </div>

              <div className='flex items-center'>
                <input
                  type='checkbox'
                  id='active'
                  checked={formData.active}
                  onChange={e => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                  className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                />
                <label htmlFor='active' className='ml-2 block text-sm text-gray-700'>
                  Activer immédiatement
                </label>
              </div>

              <div className='flex gap-2'>
                <button
                  type='submit'
                  disabled={isLoading}
                  className='flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                >
                  {isLoading ? 'En cours...' : existingPromotion ? 'Modifier' : 'Promouvoir'}
                </button>
                <button
                  type='button'
                  onClick={() => setShowPromoteForm(false)}
                  className='px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors'
                >
                  Annuler
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowPromoteForm(!showPromoteForm)}
        className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-lg text-white font-medium transition-all ${
          isCurrentlyActive
            ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700'
            : existingPromotion
              ? 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700'
              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
        }`}
      >
        {isCurrentlyActive ? (
          <>
            <Star className='w-5 h-5 fill-current' />
            <span>Sponsorisé</span>
            <Edit className='w-4 h-4' />
          </>
        ) : existingPromotion ? (
          <>
            <Edit className='w-5 h-5' />
            <span>Modifier</span>
          </>
        ) : (
          <>
            <Plus className='w-5 h-5' />
            <span>Promouvoir</span>
          </>
        )}
      </motion.button>
    </div>
  )
}
