import { CheckCircle } from 'lucide-react'

export default function PropertySafety() {
  return (
    <div className='border-b border-gray-200 pb-8'>
      <h3 className='text-lg font-semibold text-gray-900 mb-4'>Sécurité et propriété</h3>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div>
          <h4 className='font-medium text-gray-900 mb-3'>Équipements de sécurité</h4>
          <ul className='space-y-2'>
            <li className='flex items-center gap-2 text-sm'>
              <CheckCircle className='h-4 w-4 text-green-600' />
              <span>Détecteur de fumée</span>
            </li>
            <li className='flex items-center gap-2 text-sm'>
              <CheckCircle className='h-4 w-4 text-green-600' />
              <span>Trousse de premiers secours</span>
            </li>
            <li className='flex items-center gap-2 text-sm'>
              <CheckCircle className='h-4 w-4 text-green-600' />
              <span>Extincteur</span>
            </li>
          </ul>
        </div>
        <div>
          <h4 className='font-medium text-gray-900 mb-3'>Informations sur la propriété</h4>
          <ul className='space-y-1 text-sm text-gray-600'>
            <li>• Escaliers nécessaires pour accéder</li>
            <li>• Pas d&apos;accès handicapé</li>
            <li>• Animaux de compagnie sur la propriété</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
