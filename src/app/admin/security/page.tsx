'use client'

import { ShieldCheck, Shield } from 'lucide-react'
import {
  createSecurity,
  deleteSecurity,
  findAllSecurity,
  updateSecurity,
} from '@/lib/services/security.services'
import { SecurityInterface } from '@/lib/interface/securityInterface'
import { TaxonomyManager, type TaxonomyAdapter } from '@/components/admin/ui/TaxonomyManager'

interface SecurityFormData {
  name: string
}

const adapter: TaxonomyAdapter<SecurityInterface, SecurityFormData> = {
  fetchAll: async () => {
    const result = await findAllSecurity()
    return result ?? []
  },
  create: async data => {
    const created = await createSecurity(data.name)
    return created ?? null
  },
  update: async (id, data) => {
    const updated = await updateSecurity(id, data.name)
    return updated ?? null
  },
  delete: async id => {
    const success = await deleteSecurity(id)
    return Boolean(success)
  },
}

export default function SecurityPage() {
  return (
    <TaxonomyManager<SecurityInterface, SecurityFormData>
      eyebrow='Espace administrateur'
      eyebrowIcon={Shield}
      title='Équipements de sécurité'
      subtitle='Gérez les équipements de sécurité proposés par les hébergements (détecteur, extincteur, etc.).'
      backHref='/admin'
      backLabel='Retour au panel admin'
      icon={ShieldCheck}
      kpiTone='red'
      itemLabelSingular='équipement de sécurité'
      itemLabelPlural='équipements de sécurité'
      searchPlaceholder='Rechercher un équipement de sécurité…'
      getItemId={item => item.id}
      getItemName={item => item.name ?? ''}
      searchMatches={(item, q) => (item.name ?? '').toLowerCase().includes(q)}
      fields={[
        {
          name: 'name',
          label: 'Nom',
          type: 'text',
          required: true,
          placeholder: 'Ex: Détecteur de fumée, Extincteur',
        },
      ]}
      emptyFormData={{ name: '' }}
      toFormData={item => ({ name: item.name ?? '' })}
      adapter={adapter}
    />
  )
}
