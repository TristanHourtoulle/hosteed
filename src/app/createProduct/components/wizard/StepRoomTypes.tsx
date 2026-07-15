'use client'

import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RoomTypeCard } from './roomTypes/RoomTypeCard'
import { PhotoBudgetBanner } from '@/components/ui/PhotoBudgetBanner'
import { computePhotoBudget } from '@/lib/photos/photoBudget'
import { createEmptyRoomType, copyRoomType } from '../../utils/roomTypeHelpers'
import type { RoomTypeFormData } from '../../types/roomType'

const stepVariants = {
  enter: { opacity: 0, x: 30 },
  center: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -30, transition: { duration: 0.2 } },
}

interface StepRoomTypesProps {
  roomTypes: RoomTypeFormData[]
  setRoomTypes: (next: RoomTypeFormData[]) => void
  meals: { id: string; name: string }[]
  includedServices: { id: string; name: string; description: string | null }[]
  extras: { id: string; name: string; priceEUR: number; priceMGA: number }[]
  /**
   * Photos already attached to the establishment itself. Room-type photos draw
   * from the same 20-photo budget, and this step runs *before* the photo step,
   * so the tally has to account for both sides to be truthful.
   */
  establishmentPhotoCount?: number
  /** Field errors keyed by path (e.g. "roomTypes.0.basePrice"). */
  getFieldError?: (field: string) => string | undefined
}

export function StepRoomTypes({
  roomTypes,
  setRoomTypes,
  meals,
  includedServices,
  extras,
  establishmentPhotoCount = 0,
  getFieldError,
}: StepRoomTypesProps) {
  const budget = computePhotoBudget({
    establishmentCount: establishmentPhotoCount,
    roomTypeCounts: roomTypes.map(rt => rt.images.length),
  })
  const updateAt = (i: number, next: RoomTypeFormData) =>
    setRoomTypes(roomTypes.map((rt, idx) => (idx === i ? next : rt)))

  const addType = () => setRoomTypes([...roomTypes, createEmptyRoomType()])

  const removeAt = (i: number) => setRoomTypes(roomTypes.filter((_, idx) => idx !== i))

  const copyInto = (i: number, sourceId: string) => {
    const src = roomTypes.find(rt => rt.id === sourceId)
    if (src) updateAt(i, copyRoomType(src, roomTypes[i].id))
  }

  const errorsFor = (index: number): Record<string, string> | undefined => {
    if (!getFieldError) return undefined
    const fields = ['name', 'quantity', 'capacity', 'basePrice', 'priceMGA', 'beds']
    const collected: Record<string, string> = {}
    for (const field of fields) {
      const message = getFieldError(`roomTypes.${index}.${field}`)
      if (message) collected[field] = message
    }
    return Object.keys(collected).length > 0 ? collected : undefined
  }

  return (
    <motion.div
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="space-y-6"
    >
      <PhotoBudgetBanner used={budget.used} remaining={budget.remaining} max={budget.max} />

      <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
        <p className="text-sm text-indigo-800">
          Définissez chaque type de chambre de votre établissement. Chaque type regroupe plusieurs
          chambres identiques (via la quantité) et possède ses propres lits, capacité, prix et
          services.
        </p>
      </div>

      {roomTypes.map((rt, i) => (
        <RoomTypeCard
          key={rt.id}
          index={i}
          value={rt}
          otherTypes={roomTypes.filter((_, idx) => idx !== i)}
          meals={meals}
          includedServices={includedServices}
          extras={extras}
          canRemove={roomTypes.length > 1}
          photosRemaining={budget.remaining}
          errors={errorsFor(i)}
          onChange={next => updateAt(i, next)}
          onRemove={() => removeAt(i)}
          onCopyFrom={sourceId => copyInto(i, sourceId)}
        />
      ))}

      <Button type="button" variant="outline" onClick={addType} className="w-full gap-2">
        <Plus className="h-4 w-4" />
        Ajouter un autre type de chambre
      </Button>
    </motion.div>
  )
}
