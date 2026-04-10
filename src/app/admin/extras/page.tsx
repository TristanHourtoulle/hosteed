'use client'

import { PlusCircle, Shield } from 'lucide-react'
import { ExtraPriceType } from '@prisma/client'
import { TaxonomyManager, type TaxonomyAdapter } from '@/components/admin/ui/TaxonomyManager'
import type { DataTableColumn } from '@/components/admin/ui/DataTable'
import { formatCurrency } from '@/lib/utils/formatNumber'

interface ProductExtra {
  id: string
  name: string
  description: string | null
  priceEUR: number
  priceMGA: number
  type: ExtraPriceType
  createdAt: string
  updatedAt: string
  _count: {
    products: number
  }
}

interface ExtraFormData {
  name: string
  description: string
  priceEUR: string
  priceMGA: string
  type: ExtraPriceType | ''
}

const PRICE_TYPE_LABELS: Record<ExtraPriceType, string> = {
  PER_DAY: 'Par jour',
  PER_PERSON: 'Par personne',
  PER_DAY_PERSON: 'Par jour et par personne',
  PER_BOOKING: 'Par réservation',
}

const adapter: TaxonomyAdapter<ProductExtra, ExtraFormData> = {
  fetchAll: async () => {
    const response = await fetch('/api/admin/extras', {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    })
    if (!response.ok) throw new Error('Erreur lors du chargement des extras')
    return response.json()
  },
  create: async data => {
    const response = await fetch('/api/admin/extras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        priceEUR: parseFloat(data.priceEUR),
        priceMGA: parseFloat(data.priceMGA),
      }),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || 'Erreur lors de la création')
    }
    return response.json()
  },
  update: async (id, data) => {
    const response = await fetch(`/api/admin/extras/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        priceEUR: parseFloat(data.priceEUR),
        priceMGA: parseFloat(data.priceMGA),
      }),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || 'Erreur lors de la mise à jour')
    }
    return response.json()
  },
  delete: async id => {
    const response = await fetch(`/api/admin/extras/${id}`, { method: 'DELETE' })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || 'Erreur lors de la suppression')
    }
    return true
  },
}

const extraColumns: Array<DataTableColumn<ProductExtra>> = [
  {
    key: 'price',
    header: 'Prix',
    sortable: true,
    sortAccessor: item => item.priceEUR,
    align: 'right',
    render: item => (
      <div className='space-y-0.5 text-right'>
        <p className='text-sm font-semibold tabular-nums text-slate-900'>
          {formatCurrency(item.priceEUR)}
        </p>
        <p className='text-xs tabular-nums text-slate-500'>
          {item.priceMGA.toLocaleString('fr-FR')} Ar
        </p>
      </div>
    ),
    cellClassName: 'whitespace-nowrap',
  },
  {
    key: 'type',
    header: 'Tarification',
    sortable: true,
    sortAccessor: item => item.type,
    render: item => (
      <span className='inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200'>
        {PRICE_TYPE_LABELS[item.type]}
      </span>
    ),
    cellClassName: 'whitespace-nowrap',
  },
]

export default function ExtrasPage() {
  return (
    <TaxonomyManager<ProductExtra, ExtraFormData>
      eyebrow='Espace administrateur'
      eyebrowIcon={Shield}
      title='Extras payants'
      subtitle='Gérez les options payantes proposées en supplément sur les hébergements (petit déjeuner, ménage, etc.).'
      backHref='/admin'
      backLabel='Retour au panel admin'
      icon={PlusCircle}
      kpiTone='orange'
      itemLabelSingular='extra'
      itemLabelPlural='extras'
      searchPlaceholder='Rechercher un extra…'
      getItemId={item => item.id}
      getItemName={item => item.name}
      getItemCount={item => item._count?.products ?? 0}
      searchMatches={(item, q) =>
        item.name.toLowerCase().includes(q) ||
        (item.description?.toLowerCase().includes(q) ?? false)
      }
      extraColumns={extraColumns}
      fields={[
        {
          name: 'name',
          label: 'Nom',
          type: 'text',
          required: true,
          placeholder: 'Ex: Petit déjeuner, Ménage',
        },
        {
          name: 'description',
          label: 'Description',
          type: 'textarea',
          placeholder: "Description de l'extra (optionnel)",
        },
        {
          name: 'priceEUR',
          label: 'Prix EUR',
          type: 'number',
          required: true,
          step: '0.01',
          min: '0',
          placeholder: '0.00',
        },
        {
          name: 'priceMGA',
          label: 'Prix MGA',
          type: 'number',
          required: true,
          step: '1',
          min: '0',
          placeholder: '0',
        },
        {
          name: 'type',
          label: 'Tarification',
          type: 'select',
          required: true,
          placeholder: 'Sélectionner un type',
          options: Object.entries(PRICE_TYPE_LABELS).map(([value, label]) => ({
            value,
            label,
          })),
        },
      ]}
      emptyFormData={{
        name: '',
        description: '',
        priceEUR: '',
        priceMGA: '',
        type: '',
      }}
      toFormData={item => ({
        name: item.name,
        description: item.description ?? '',
        priceEUR: item.priceEUR.toString(),
        priceMGA: item.priceMGA.toString(),
        type: item.type,
      })}
      validate={data => {
        if (!data.name.trim()) return 'Le nom est requis'
        if (!data.type) return 'La tarification est requise'
        const priceEUR = parseFloat(data.priceEUR)
        const priceMGA = parseFloat(data.priceMGA)
        if (isNaN(priceEUR) || priceEUR < 0) {
          return 'Le prix EUR doit être un nombre positif'
        }
        if (isNaN(priceMGA) || priceMGA < 0) {
          return 'Le prix MGA doit être un nombre positif'
        }
        return null
      }}
      adapter={adapter}
    />
  )
}
