'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { BedDouble, Euro, Plus, Trash2 } from 'lucide-react'
import { DayEnum } from '@prisma/client'
import { FieldLabel } from '../FieldLabel'
import { ServiceSelectionSection } from '../../index'
import CreateSpecialPriceModal from '@/components/ui/CreateSpecialPriceModal'
import { ROOM_TYPE_NAMES, type RoomTypeFormData, type RoomTypeName } from '../../../types/roomType'
import type { SpecialPrice } from '@/types/product-form'
import { BedCounterGroup } from './BedCounterGroup'
import { CopyFromTypeSelect } from './CopyFromTypeSelect'

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

interface RoomTypeCardProps {
  index: number
  value: RoomTypeFormData
  otherTypes: RoomTypeFormData[]
  meals: { id: string; name: string }[]
  includedServices: { id: string; name: string; description: string | null }[]
  extras: { id: string; name: string; priceEUR: number; priceMGA: number }[]
  canRemove: boolean
  errors?: Record<string, string>
  onChange: (next: RoomTypeFormData) => void
  onRemove: () => void
  onCopyFrom: (sourceId: string) => void
}

export function RoomTypeCard({
  index,
  value,
  otherTypes,
  meals,
  includedServices,
  extras,
  canRemove,
  errors,
  onChange,
  onRemove,
  onCopyFrom,
}: RoomTypeCardProps) {
  const [specialPriceModalOpen, setSpecialPriceModalOpen] = useState(false)

  const patch = (p: Partial<RoomTypeFormData>) => onChange({ ...value, ...p })

  const toggleId = (field: 'mealIds' | 'includedServiceIds' | 'extraIds', id: string) => {
    const current = value[field]
    patch({
      [field]: current.includes(id) ? current.filter(x => x !== id) : [...current, id],
    })
  }

  const handleSpecialPriceCreated = (newSpecialPrice: Omit<SpecialPrice, 'id'>) => {
    const withId: SpecialPrice = {
      ...newSpecialPrice,
      id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    }
    patch({ specialPrices: [...value.specialPrices, withId] })
  }

  const removeSpecialPrice = (id: string) => {
    patch({ specialPrices: value.specialPrices.filter(sp => sp.id !== id) })
  }

  const sources = otherTypes.filter(t => t.name)
  const dayNames: Record<DayEnum, string> = {
    Monday: 'Lun',
    Tuesday: 'Mar',
    Wednesday: 'Mer',
    Thursday: 'Jeu',
    Friday: 'Ven',
    Saturday: 'Sam',
    Sunday: 'Dim',
  }

  return (
    <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl">
      <CardHeader className="px-6 py-4 border-b border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <BedDouble className="h-5 w-5 text-indigo-600" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">
              Type de chambre #{index + 1}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <CopyFromTypeSelect sources={sources} onCopy={onCopyFrom} />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              aria-label="Supprimer ce type de chambre"
              onClick={onRemove}
              disabled={!canRemove}
              className="text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Identity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <FieldLabel htmlFor={`name-${index}`} required error={errors?.name}>
              Type de chambre
            </FieldLabel>
            <select
              id={`name-${index}`}
              value={value.name}
              onChange={e => patch({ name: e.target.value as RoomTypeName })}
              className="w-full px-3 py-2 border border-slate-200 rounded-md focus:border-blue-300 focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Sélectionnez un type</option>
              {ROOM_TYPE_NAMES.map(name => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor={`quantity-${index}`} required error={errors?.quantity}>
              Nombre de chambres de ce type
            </FieldLabel>
            <Input
              id={`quantity-${index}`}
              type="number"
              min="1"
              value={value.quantity}
              onChange={e => patch({ quantity: e.target.value })}
              placeholder="Ex: 5"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <FieldLabel htmlFor={`capacity-${index}`} required error={errors?.capacity}>
              Capacité (voyageurs)
            </FieldLabel>
            <Input
              id={`capacity-${index}`}
              type="number"
              min="1"
              value={value.capacity}
              onChange={e => patch({ capacity: e.target.value })}
              placeholder="Ex: 2"
            />
          </div>
          <div className="space-y-2">
            <FieldLabel htmlFor={`surface-${index}`}>Surface (m²)</FieldLabel>
            <Input
              id={`surface-${index}`}
              type="number"
              min="0"
              value={value.surface}
              onChange={e => patch({ surface: e.target.value })}
              placeholder="Ex: 20"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={value.smoking}
                onChange={e => patch({ smoking: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300"
              />
              Chambre fumeur
            </label>
          </div>
        </div>

        {/* Beds */}
        <div className="space-y-2">
          <FieldLabel htmlFor={`beds-${index}`} required error={errors?.beds}>
            Configuration des lits
          </FieldLabel>
          <BedCounterGroup beds={value.beds} onChange={beds => patch({ beds })} />
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <FieldLabel htmlFor={`basePrice-${index}`} required error={errors?.basePrice}>
              Prix par nuit (EUR)
            </FieldLabel>
            <Input
              id={`basePrice-${index}`}
              type="number"
              min="0"
              value={value.basePrice}
              onChange={e => patch({ basePrice: e.target.value })}
              placeholder="Ex: 80"
            />
          </div>
          <div className="space-y-2">
            <FieldLabel htmlFor={`priceMGA-${index}`} required error={errors?.priceMGA}>
              Prix par nuit (MGA)
            </FieldLabel>
            <Input
              id={`priceMGA-${index}`}
              type="number"
              min="0"
              value={value.priceMGA}
              onChange={e => patch({ priceMGA: e.target.value })}
              placeholder="Ex: 400000"
            />
          </div>
        </div>

        {/* Per-type special prices */}
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Euro className="h-4 w-4" />
              Prix spéciaux
            </h4>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setSpecialPriceModalOpen(true)}
              className="text-xs"
            >
              <Plus className="mr-1 h-3 w-3" />
              Ajouter
            </Button>
          </div>
          <div className="space-y-2">
            {value.specialPrices.map(sp => (
              <div
                key={sp.id}
                className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-2"
              >
                <span className="text-sm text-slate-700">
                  {sp.pricesEuro}€ / {sp.pricesMga}Ar
                  {sp.day.length > 0 && (
                    <span className="ml-2 text-xs text-slate-500">
                      {sp.day.map(d => dayNames[d]).join(', ')}
                    </span>
                  )}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label="Retirer ce prix spécial"
                  onClick={() => removeSpecialPrice(sp.id)}
                  className="text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {value.specialPrices.length === 0 && (
              <p className="py-2 text-center text-xs text-slate-400">Aucun prix spécial défini</p>
            )}
          </div>
        </div>

        {/* Per-type meals / included services / extras */}
        <ServiceSelectionSection
          title="Restauration (ce type)"
          description="Repas inclus pour ce type de chambre"
          icon={Plus}
          iconColor="text-orange-600"
          bgColor="bg-orange-50"
          borderColor="border-orange-500"
          services={meals}
          selectedServiceIds={value.mealIds}
          onServiceToggle={id => toggleId('mealIds', id)}
          itemVariants={itemVariants}
        />
        <ServiceSelectionSection
          title="Services inclus (ce type)"
          description="Services inclus dans le prix de ce type"
          icon={Plus}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
          borderColor="border-blue-500"
          services={includedServices.map(s => ({ id: s.id, name: s.name }))}
          selectedServiceIds={value.includedServiceIds}
          onServiceToggle={id => toggleId('includedServiceIds', id)}
          itemVariants={itemVariants}
        />
        <ServiceSelectionSection
          title="Options payantes (ce type)"
          description="Extras facturés en plus pour ce type"
          icon={Plus}
          iconColor="text-green-600"
          bgColor="bg-green-50"
          borderColor="border-green-500"
          services={extras.map(e => ({ id: e.id, name: e.name }))}
          selectedServiceIds={value.extraIds}
          onServiceToggle={id => toggleId('extraIds', id)}
          itemVariants={itemVariants}
        />
      </CardContent>

      <CreateSpecialPriceModal
        isOpen={specialPriceModalOpen}
        onClose={() => setSpecialPriceModalOpen(false)}
        onSpecialPriceCreated={handleSpecialPriceCreated}
      />
    </Card>
  )
}
