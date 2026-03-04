'use client'

import { useState, useCallback } from 'react'
import { motion, Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { Button } from '@/components/ui/shadcnui/button'
import { Badge } from '@/components/ui/shadcnui/badge'
import { Tag, Power, PowerOff, Pencil, Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import CreateSpecialPriceModal from '@/components/ui/CreateSpecialPriceModal'
import {
  findSpecialsPricesByProduct,
  createSpecialPrices,
  updateSpecialPrices,
  toggleSpecialPriceStatus,
  deleteSpecialsPricesByProduct,
} from '@/lib/services/specialPrices.service'
import type { SpecialPrice, SpecialPriceData } from '../types'

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

interface ProductSpecialPricesCardProps {
  productId: string
  initialSpecialPrices: SpecialPrice[]
  onCountChange?: (count: number) => void
}

/** Self-contained CRUD for special prices. Manages own state. */
export function ProductSpecialPricesCard({
  productId,
  initialSpecialPrices,
  onCountChange,
}: ProductSpecialPricesCardProps) {
  const [specialPrices, setSpecialPrices] = useState<SpecialPrice[]>(initialSpecialPrices)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPrice, setEditingPrice] = useState<SpecialPrice | null>(null)

  const refreshPrices = useCallback(async () => {
    const data = await findSpecialsPricesByProduct(productId)
    if (Array.isArray(data)) {
      const prices = data as unknown as SpecialPrice[]
      setSpecialPrices(prices)
      onCountChange?.(prices.length)
    }
  }, [productId, onCountChange])

  const handleCreateOrUpdate = async (data: SpecialPriceData) => {
    try {
      const result = editingPrice
        ? await updateSpecialPrices(
            editingPrice.id,
            data.pricesMga,
            data.pricesEuro,
            data.day,
            data.startDate,
            data.endDate,
            data.activate
          )
        : await createSpecialPrices(
            data.pricesMga,
            data.pricesEuro,
            data.day,
            data.startDate,
            data.endDate,
            data.activate,
            productId
          )

      if (result) {
        await refreshPrices()
        setModalOpen(false)
        setEditingPrice(null)
        toast.success(editingPrice ? 'Prix spécial modifié' : 'Prix spécial créé')
      } else {
        toast.error("Erreur lors de l'opération")
      }
    } catch {
      toast.error("Erreur lors de l'opération")
    }
  }

  const handleToggle = async (priceId: string, currentStatus: boolean) => {
    try {
      const result = await toggleSpecialPriceStatus(priceId, !currentStatus)
      if (result) {
        await refreshPrices()
        toast.success(!currentStatus ? 'Prix spécial activé' : 'Prix spécial désactivé')
      } else {
        toast.error('Erreur lors de la mise à jour')
      }
    } catch {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const handleDelete = async (priceId: string) => {
    try {
      const result = await deleteSpecialsPricesByProduct(priceId)
      if (result) {
        await refreshPrices()
        toast.success('Prix spécial supprimé')
      } else {
        toast.error('Erreur lors de la suppression')
      }
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  return (
    <motion.div initial='hidden' animate='visible' variants={fadeIn}>
      <Card className='border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl py-0 gap-0'>
        <div className='px-6 py-4 border-b border-gray-100 flex items-center justify-between'>
          <h2 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
            <Tag className='h-5 w-5 text-blue-600' />
            Prix spéciaux ({specialPrices.length})
          </h2>
          <Button
            size='sm'
            onClick={() => {
              setEditingPrice(null)
              setModalOpen(true)
            }}
          >
            <Plus className='h-4 w-4 mr-1' />
            Ajouter
          </Button>
        </div>
        <CardContent className='p-6'>
          {specialPrices.length === 0 ? (
            <div className='text-center py-6'>
              <Tag className='h-10 w-10 text-gray-300 mx-auto mb-3' />
              <p className='text-gray-500 text-sm'>Aucun prix spécial configuré</p>
            </div>
          ) : (
            <div className='space-y-3'>
              {specialPrices.map(price => (
                <div key={price.id} className='p-4 rounded-lg bg-gray-50 space-y-3'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium text-gray-800'>{price.pricesEuro}€ / nuit</p>
                      <p className='text-xs text-gray-500'>{price.pricesMga} MGA</p>
                    </div>
                    <Badge
                      className={
                        price.activate
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-200 text-gray-600'
                      }
                    >
                      {price.activate ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>

                  <div className='flex flex-wrap gap-1'>
                    {price.day.map(day => (
                      <Badge key={day} variant='outline' className='text-xs'>
                        {day}
                      </Badge>
                    ))}
                  </div>

                  <p className='text-xs text-gray-500'>
                    {price.startDate && price.endDate ? (
                      <>
                        {new Date(price.startDate).toLocaleDateString('fr-FR')} —{' '}
                        {new Date(price.endDate).toLocaleDateString('fr-FR')}
                      </>
                    ) : price.startDate ? (
                      `À partir du ${new Date(price.startDate).toLocaleDateString('fr-FR')}`
                    ) : price.endDate ? (
                      `Jusqu'au ${new Date(price.endDate).toLocaleDateString('fr-FR')}`
                    ) : (
                      "Toute l'année"
                    )}
                  </p>

                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => {
                        setEditingPrice(price)
                        setModalOpen(true)
                      }}
                    >
                      <Pencil className='h-3 w-3 mr-1' />
                      Modifier
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      className={
                        price.activate
                          ? 'border-orange-200 text-orange-600 hover:bg-orange-50'
                          : 'border-green-200 text-green-600 hover:bg-green-50'
                      }
                      onClick={() => handleToggle(price.id, price.activate)}
                    >
                      {price.activate ? (
                        <>
                          <PowerOff className='h-3 w-3 mr-1' />
                          Désactiver
                        </>
                      ) : (
                        <>
                          <Power className='h-3 w-3 mr-1' />
                          Activer
                        </>
                      )}
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      className='border-red-200 text-red-600 hover:bg-red-50'
                      onClick={() => handleDelete(price.id)}
                    >
                      <Trash2 className='h-3 w-3 mr-1' />
                      Supprimer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateSpecialPriceModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingPrice(null)
        }}
        onSpecialPriceCreated={handleCreateOrUpdate}
        editingSpecialPrice={editingPrice}
      />
    </motion.div>
  )
}
