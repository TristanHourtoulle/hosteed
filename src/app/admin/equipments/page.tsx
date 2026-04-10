'use client'

import { Sofa, Shield } from 'lucide-react'
import {
  createEquipment,
  deleteEquipement,
  findAllEquipments,
  updateEquipment,
} from '@/lib/services/equipments.service'
import { EquipmentInterface } from '@/lib/interface/equipmentInterface'
import { TaxonomyManager, type TaxonomyAdapter } from '@/components/admin/ui/TaxonomyManager'
import type { DataTableColumn } from '@/components/admin/ui/DataTable'

interface EquipmentFormData {
  name: string
  icon: string
}

const adapter: TaxonomyAdapter<EquipmentInterface, EquipmentFormData> = {
  fetchAll: async () => {
    const result = await findAllEquipments()
    return result ?? []
  },
  create: async data => {
    const created = await createEquipment(data.name, data.icon)
    return created ?? null
  },
  update: async (id, data) => {
    const updated = await updateEquipment(id, data.name, data.icon)
    return updated ?? null
  },
  delete: async id => {
    const success = await deleteEquipement(id)
    return Boolean(success)
  },
}

const extraColumns: Array<DataTableColumn<EquipmentInterface>> = [
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

export default function EquipmentsPage() {
  return (
    <TaxonomyManager<EquipmentInterface, EquipmentFormData>
      eyebrow='Espace administrateur'
      eyebrowIcon={Shield}
      title='Équipements'
      subtitle='Gérez les équipements disponibles dans les hébergements (lave-linge, wifi, etc.).'
      backHref='/admin'
      backLabel='Retour au panel admin'
      icon={Sofa}
      kpiTone='blue'
      itemLabelSingular='équipement'
      itemLabelPlural='équipements'
      searchPlaceholder='Rechercher un équipement…'
      getItemId={item => item.id}
      getItemName={item => item.name ?? ''}
      searchMatches={(item, q) =>
        (item.name ?? '').toLowerCase().includes(q) ||
        (item.icon ?? '').toLowerCase().includes(q)
      }
      extraColumns={extraColumns}
      fields={[
        {
          name: 'name',
          label: 'Nom',
          type: 'text',
          required: true,
          placeholder: 'Ex: Lave-linge, Wifi, Climatisation',
        },
        {
          name: 'icon',
          label: 'Icône',
          type: 'text',
          placeholder: "Nom de l'icône Lucide (optionnel)",
          help: 'Laisser vide pour utiliser l’icône par défaut.',
        },
      ]}
      emptyFormData={{ name: '', icon: '' }}
      toFormData={item => ({ name: item.name ?? '', icon: item.icon ?? '' })}
      adapter={adapter}
    />
  )
}
