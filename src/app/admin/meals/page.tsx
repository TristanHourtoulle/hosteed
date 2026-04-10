'use client'

import { Soup, Shield } from 'lucide-react'
import {
  createMeal,
  deleteMeal,
  findAllMeals,
  updateMeal,
} from '@/lib/services/meals.service'
import { MealsInterface } from '@/lib/interface/mealsInterface'
import { TaxonomyManager, type TaxonomyAdapter } from '@/components/admin/ui/TaxonomyManager'

interface MealFormData {
  name: string
}

const adapter: TaxonomyAdapter<MealsInterface, MealFormData> = {
  fetchAll: async () => {
    const result = await findAllMeals()
    return result ?? []
  },
  create: async data => {
    const created = await createMeal(data.name)
    return created ?? null
  },
  update: async (id, data) => {
    const updated = await updateMeal(id, data.name)
    return updated ?? null
  },
  delete: async id => {
    const success = await deleteMeal(id)
    return Boolean(success)
  },
}

export default function MealsPage() {
  return (
    <TaxonomyManager<MealsInterface, MealFormData>
      eyebrow='Espace administrateur'
      eyebrowIcon={Shield}
      title='Options de repas'
      subtitle='Gérez les formules de repas disponibles dans le catalogue (petit-déjeuner, demi-pension, etc.).'
      backHref='/admin'
      backLabel='Retour au panel admin'
      icon={Soup}
      kpiTone='amber'
      itemLabelSingular='option de repas'
      itemLabelPlural='options de repas'
      searchPlaceholder='Rechercher une option de repas…'
      getItemId={item => item.id}
      getItemName={item => item.name ?? ''}
      searchMatches={(item, q) => (item.name ?? '').toLowerCase().includes(q)}
      fields={[
        {
          name: 'name',
          label: 'Nom',
          type: 'text',
          required: true,
          placeholder: 'Ex: Petit-déjeuner, Demi-pension, Pension complète',
        },
      ]}
      emptyFormData={{ name: '' }}
      toFormData={item => ({ name: item.name ?? '' })}
      adapter={adapter}
    />
  )
}
