import { Shield } from 'lucide-react'

interface Security {
  id: string
  name: string
}

interface PropertySecuritiesProps {
  securities: Security[]
}

export default function PropertySecurities({ securities }: PropertySecuritiesProps) {
  if (!securities || securities.length === 0) return null

  return (
    <div className='border-b border-gray-200 pb-8'>
      <h3 className='text-lg font-semibold text-gray-900 mb-6'>Équipements de sécurité</h3>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        {securities.map(security => (
          <div key={security.id} className='flex items-center gap-3'>
            <Shield className='h-5 w-5 text-green-600' />
            <span className='text-gray-700'>{security.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
