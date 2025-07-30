import { Shield } from 'lucide-react'
import { Services } from '@prisma/client'

interface PropertyServicesProps {
  services: Services[]
}

export default function PropertyServices({ services }: PropertyServicesProps) {
  return (
    <div className='border-b border-gray-200 pb-8'>
      <h3 className='text-lg font-semibold text-gray-900 mb-6'>Services</h3>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        {services.map((service: Services) => (
          <div key={service.id} className='flex items-center gap-3'>
            <Shield className='h-5 w-5 text-gray-600' />
            <span className='text-gray-700'>{service.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
