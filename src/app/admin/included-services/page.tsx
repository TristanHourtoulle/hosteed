'use client'

import { Package, Shield } from 'lucide-react'
import { TaxonomyManager, type TaxonomyAdapter } from '@/components/admin/ui/TaxonomyManager'
import type { DataTableColumn } from '@/components/admin/ui/DataTable'

interface IncludedService {
  id: string
  name: string
  description: string | null
  icon: string | null
  createdAt: string
  updatedAt: string
  _count: {
    products: number
  }
}

interface ServiceFormData {
  name: string
  description: string
  icon: string
}

const adapter: TaxonomyAdapter<IncludedService, ServiceFormData> = {
  fetchAll: async () => {
    const response = await fetch('/api/admin/included-services', {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    })
    if (!response.ok) {
      throw new Error('Erreur lors du chargement des services inclus')
    }
    return response.json()
  },
  create: async data => {
    const response = await fetch('/api/admin/included-services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || 'Erreur lors de la création')
    }
    return response.json()
  },
  update: async (id, data) => {
    const response = await fetch(`/api/admin/included-services/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || 'Erreur lors de la mise à jour')
    }
    return response.json()
  },
  delete: async id => {
    const response = await fetch(`/api/admin/included-services/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || 'Erreur lors de la suppression')
    }
    return true
  },
}

const extraColumns: Array<DataTableColumn<IncludedService>> = [
  {
    key: 'description',
    header: 'Description',
    render: item => (
      <p className='line-clamp-2 max-w-md text-sm text-slate-600'>
        {item.description ?? '—'}
      </p>
    ),
  },
  {
    key: 'icon',
    header: 'Icône',
    render: item =>
      item.icon ? (
        <span className='inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600'>
          {item.icon}
        </span>
      ) : (
        <span className='text-xs text-slate-400'>—</span>
      ),
    cellClassName: 'whitespace-nowrap',
  },
]

export default function IncludedServicesPage() {
  return (
    <TaxonomyManager<IncludedService, ServiceFormData>
      eyebrow='Espace administrateur'
      eyebrowIcon={Shield}
      title='Services inclus'
      subtitle='Gérez les services gratuits inclus dans les hébergements (wifi, parking, etc.).'
      backHref='/admin'
      backLabel='Retour au panel admin'
      icon={Package}
      kpiTone='emerald'
      itemLabelSingular='service inclus'
      itemLabelPlural='services inclus'
      searchPlaceholder='Rechercher un service…'
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
          placeholder: 'Ex: Wifi gratuit, Parking, Climatisation',
        },
        {
          name: 'description',
          label: 'Description',
          type: 'textarea',
          placeholder: 'Description du service (optionnel)',
        },
        {
          name: 'icon',
          label: 'Icône',
          type: 'text',
          placeholder: "Nom de l'icône Lucide (optionnel)",
          help: 'Laisser vide pour utiliser l’icône par défaut.',
        },
      ]}
      emptyFormData={{ name: '', description: '', icon: '' }}
      toFormData={item => ({
        name: item.name,
        description: item.description ?? '',
        icon: item.icon ?? '',
      })}
      adapter={adapter}
    />
  )
}
