import { ArrowUpDown, ArrowUp, Heart, PawPrint } from 'lucide-react'

interface PropertyInfoData {
  hasStairs: boolean
  hasElevator: boolean
  hasHandicapAccess: boolean
  hasPetsOnProperty: boolean
  additionalNotes?: string
}

interface PropertyInfoProps {
  propertyInfo?: PropertyInfoData
}

export default function PropertyInfo({ propertyInfo }: PropertyInfoProps) {
  if (!propertyInfo) return null

  const features = [
    {
      icon: ArrowUpDown,
      label: 'Escaliers',
      value: propertyInfo.hasStairs,
    },
    {
      icon: ArrowUp,
      label: 'Ascenseur',
      value: propertyInfo.hasElevator,
    },
    {
      icon: Heart,
      label: 'Accès handicapé',
      value: propertyInfo.hasHandicapAccess,
    },
    {
      icon: PawPrint,
      label: 'Animaux sur la propriété',
      value: propertyInfo.hasPetsOnProperty,
    },
  ]

  const activeFeatures = features.filter(feature => feature.value)

  if (activeFeatures.length === 0 && !propertyInfo.additionalNotes) return null

  return (
    <div className='border-b border-gray-200 pb-8'>
      <h3 className='text-lg font-semibold text-gray-900 mb-4'>Caractéristiques de la propriété</h3>
      <div className='space-y-4'>
        {activeFeatures.length > 0 && (
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            {activeFeatures.map((feature, index) => (
              <div key={index} className='flex items-center gap-3'>
                <feature.icon className='h-5 w-5 text-gray-400' />
                <span className='text-gray-900'>{feature.label}</span>
              </div>
            ))}
          </div>
        )}

        {propertyInfo.additionalNotes && (
          <div className='text-gray-600 text-sm'>
            <p>{propertyInfo.additionalNotes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
