import { Wifi, Car, Utensils, Tv, Wind, Bath, CheckCircle } from 'lucide-react'
import { Equipment } from '@prisma/client'

const equipmentIcons: { [key: string]: React.ComponentType<{ className?: string }> } = {
  'Wi-Fi': Wifi,
  Parking: Car,
  Cuisine: Utensils,
  Télévision: Tv,
  Climatisation: Wind,
  'Salle de bain': Bath,
}

interface PropertyAmenitiesProps {
  equipments: Equipment[]
}

export default function PropertyAmenities({ equipments }: PropertyAmenitiesProps) {
  return (
    <div className='border-b border-gray-200 pb-8'>
      <h3 className='text-lg font-semibold text-gray-900 mb-6'>Équipements</h3>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        {equipments?.map((equipment: Equipment) => {
          const IconComponent = equipmentIcons[equipment.name] || CheckCircle
          return (
            <div key={equipment.id} className='flex items-center gap-3'>
              <IconComponent className='h-5 w-5 text-gray-600' />
              <span className='text-gray-700'>{equipment.name}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
