import { Utensils } from 'lucide-react'
import { Meals } from '@prisma/client'

interface PropertyMealsProps {
  meals: Meals[]
}

export default function PropertyMeals({ meals }: PropertyMealsProps) {
  if (!meals || meals.length === 0) return null

  return (
    <div className='border-b border-gray-200 pb-8'>
      <h3 className='text-lg font-semibold text-gray-900 mb-6'>Repas disponibles</h3>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        {meals.map((meal: Meals) => (
          <div key={meal.id} className='flex items-center gap-3'>
            <Utensils className='h-5 w-5 text-gray-600' />
            <span className='text-gray-700'>{meal.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
