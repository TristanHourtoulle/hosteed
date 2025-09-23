import { DynamicIcon } from '@/lib/utils/iconMapping'
import { CheckCircle } from 'lucide-react'

interface IncludedService {
  id: string
  name: string
  description?: string
  icon?: string
}

interface PropertyIncludedServicesProps {
  services: IncludedService[]
}

export default function PropertyIncludedServices({ services }: PropertyIncludedServicesProps) {
  if (!services || services.length === 0) return null

  return (
    <div className='border-b border-gray-200 pb-8'>
      <h3 className='text-lg font-semibold text-gray-900 mb-6'>Services inclus</h3>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        {services.map((service) => (
          <div key={service.id} className='flex items-start gap-3'>
            <DynamicIcon 
              name={service.icon || 'CheckCircle'} 
              fallback={CheckCircle}
              className='h-5 w-5 text-green-600 mt-0.5 flex-shrink-0' 
            />
            <div>
              <span className='text-gray-900 font-medium'>{service.name}</span>
              {service.description && (
                <p className='text-sm text-gray-600 mt-1'>{service.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}